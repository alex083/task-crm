import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  login,
  register,
  getMe,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDepartments,
  getPublicDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './api';
import Modal from './components/Modal';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  employee: 'Employee',
};

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const TASK_STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const btn = (bg) => ({
  padding: '6px 12px',
  background: bg,
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
});

const inputStyle = { padding: '8px', boxSizing: 'border-box', width: '100%' };

const navLinkStyle = ({ isActive }) => ({
  ...btn(isActive ? '#007BFF' : '#6c757d'),
  textDecoration: 'none',
  display: 'inline-block',
});

function App() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState(localStorage.getItem('access_token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingDeptId, setEditingDeptId] = useState(null);

  const [createModal, setCreateModal] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [publicDepartments, setPublicDepartments] = useState([]);
  const [signupSuccess, setSignupSuccess] = useState('');

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isManager = currentUser?.role === 'manager';
  const canManage = isSuperAdmin || isManager;
  const isApproved = isSuperAdmin || currentUser?.status === 'approved';

  const showError = (err, fallback) => {
    const detail = err.response?.data;
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object') {
      return Object.entries(detail)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join('; ');
    }
    return fallback;
  };

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const meRes = await getMe(token);
      setCurrentUser(meRes.data);

      const approved = meRes.data.role === 'super_admin' || meRes.data.status === 'approved';
      if (!approved) return;

      const [tasksRes, deptsRes] = await Promise.all([
        getTasks(token),
        getDepartments(token),
      ]);
      setTasks(tasksRes.data);
      setDepartments(deptsRes.data);

      if (meRes.data.role === 'super_admin' || meRes.data.role === 'manager') {
        const usersRes = await getUsers(token);
        setUsers(usersRes.data);
      }
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
      else setMessage(showError(err, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadAll();
  }, [token, loadAll]);

  useEffect(() => {
    if (token) return undefined;
    let cancelled = false;
    getPublicDepartments()
      .then((res) => {
        if (!cancelled) setPublicDepartments(res.data);
      })
      .catch(() => {
        if (!cancelled) setPublicDepartments([]);
      });
    return () => { cancelled = true; };
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await login(username, password);
      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setToken(access);
      setMessage('');
      setSignupSuccess('');
      setUsername('');
      setPassword('');
      navigate('/tasks');
    } catch {
      setMessage('Login failed. Check your username or password.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      username: form.username.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value,
      first_name: form.first_name.value.trim(),
      last_name: form.last_name.value.trim(),
      department: Number(form.department.value),
    };
    try {
      await register(data);
      form.reset();
      setMessage('');
      setSignupSuccess('Registration successful. Wait for manager approval, then sign in.');
      navigate('/');
    } catch (err) {
      setMessage(showError(err, 'Registration failed'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken('');
    setCurrentUser(null);
    setTasks([]);
    setUsers([]);
    setDepartments([]);
    setCreateModal(null);
    setSelectedTask(null);
    navigate('/');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      description: form.description.value,
      priority: form.priority.value,
      status: form.status.value,
    };
    if (isSuperAdmin && form.department.value) {
      data.department = Number(form.department.value);
    }
    if (form.assigned_to?.value) {
      data.assigned_to = Number(form.assigned_to.value);
    }
    try {
      await createTask(token, data);
      setCreateModal(null);
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to create task'));
    }
  };

  const handleUpdateTask = async (taskId, form) => {
    const data = {
      title: form.title.value,
      description: form.description.value,
      priority: form.priority.value,
      status: form.status.value,
    };
    if (isSuperAdmin && form.department.value) {
      data.department = Number(form.department.value);
    }
    data.assigned_to = form.assigned_to.value ? Number(form.assigned_to.value) : null;
    try {
      await updateTask(token, taskId, data);
      setEditingTaskId(null);
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to update task'));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      username: form.username.value,
      email: form.email.value,
      password: form.password.value,
      role: form.role.value,
      status: form.status.value,
      first_name: form.first_name.value,
      last_name: form.last_name.value,
    };
    if (isSuperAdmin && form.department.value) {
      data.department = Number(form.department.value);
    }
    try {
      await createUser(token, data);
      setCreateModal(null);
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to create user'));
    }
  };

  const handleUpdateUser = async (userId, form) => {
    const data = {
      email: form.email.value,
      role: form.role.value,
      status: form.status.value,
      first_name: form.first_name.value,
      last_name: form.last_name.value,
    };
    if (isSuperAdmin && form.department.value) {
      data.department = Number(form.department.value);
    }
    if (form.password.value) {
      data.password = form.password.value;
    }
    try {
      await updateUser(token, userId, data);
      setEditingUserId(null);
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to update user'));
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    try {
      await createDepartment(token, { name });
      setCreateModal(null);
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to create department'));
    }
  };

  const handleUpdateDepartment = async (deptId, name) => {
    try {
      await updateDepartment(token, deptId, { name });
      setEditingDeptId(null);
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to update department'));
    }
  };

  const assignableUsers = isSuperAdmin
    ? users.filter((u) => u.status === 'approved')
    : users.filter((u) => u.status === 'approved' && u.role !== 'super_admin');

  const roleOptions = isSuperAdmin
    ? ['employee', 'manager', 'super_admin']
    : ['employee', 'manager'];

  const pageHeader = (title, count, createLabel, createKey, showCreate = true) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
      <h3 style={{ margin: 0 }}>{title} ({count})</h3>
      {showCreate && (
        <button type="button" onClick={() => setCreateModal(createKey)} style={btn('#28a745')}>
          {createLabel}
        </button>
      )}
    </div>
  );

  if (token && currentUser) {
    if (!isApproved) {
      return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: '480px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0 }}>Account pending</h2>
          <p style={{ color: '#666', lineHeight: 1.5 }}>
            Hello, <strong>{currentUser.username}</strong>. Your status is{' '}
            <strong>{STATUS_LABELS[currentUser.status] || currentUser.status}</strong>.
            You can sign in after a manager or super admin approves your account.
          </p>
          <button onClick={handleLogout} style={btn('#dc3545')}>Log out</button>
        </div>
      );
    }

    return (
      <div style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '30px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Task CRM</h2>
            <small style={{ color: '#666' }}>
              {currentUser.username} — {ROLE_LABELS[currentUser.role]}
              {currentUser.department_name ? ` (${currentUser.department_name})` : ''}
            </small>
          </div>
          <button onClick={handleLogout} style={btn('#dc3545')}>Log out</button>
        </div>

        {message && (
          <p style={{ color: '#c0392b', background: '#fdecea', padding: '10px', borderRadius: '4px' }}>
            {message}
            <button onClick={() => setMessage('')} style={{ float: 'right', ...btn('#999') }}>×</button>
          </p>
        )}

        <nav style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <NavLink to="/tasks" style={navLinkStyle}>Tasks</NavLink>
          {canManage && <NavLink to="/employees" style={navLinkStyle}>Employees</NavLink>}
          {canManage && <NavLink to="/departments" style={navLinkStyle}>Departments</NavLink>}
        </nav>

        {loading && <p>Loading...</p>}

        {!loading && (
          <Routes>
            <Route
              path="/tasks"
              element={(
                <>
                  {pageHeader('Tasks', tasks.length, 'Create task', 'task')}
                  {tasks.length === 0 ? <p>No tasks</p> : tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        if (editingTaskId !== task.id) setSelectedTask(task);
                      }}
                      style={{
                        background: '#f8f9fa',
                        padding: '12px',
                        marginBottom: '10px',
                        borderRadius: '5px',
                        borderLeft: '4px solid #007BFF',
                        cursor: editingTaskId === task.id ? 'default' : 'pointer',
                      }}
                    >
                      {editingTaskId === task.id ? (
                        <form
                          onClick={(e) => e.stopPropagation()}
                          onSubmit={(e) => { e.preventDefault(); handleUpdateTask(task.id, e.target); }}
                          style={{ display: 'grid', gap: '8px' }}
                        >
                          <input name="title" defaultValue={task.title} style={inputStyle} required />
                          <textarea name="description" defaultValue={task.description} style={inputStyle} />
                          <select name="priority" defaultValue={task.priority} style={inputStyle}>
                            {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                          <select name="status" defaultValue={task.status} style={inputStyle}>
                            {Object.entries(TASK_STATUS_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                          {isSuperAdmin && (
                            <select name="department" defaultValue={task.department || ''} style={inputStyle}>
                              <option value="">— Department —</option>
                              {departments.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          )}
                          {canManage && (
                            <select name="assigned_to" defaultValue={task.assigned_to || ''} style={inputStyle}>
                              <option value="">— Assignee —</option>
                              {assignableUsers.map((u) => (
                                <option key={u.id} value={u.id}>{u.username}</option>
                              ))}
                            </select>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" style={btn('#007BFF')}>Save</button>
                            <button type="button" onClick={() => setEditingTaskId(null)} style={btn('#6c757d')}>Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <div style={{ minWidth: 0 }}>
                            <strong>{task.title}</strong>
                            <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                              {TASK_STATUS_LABELS[task.status]} · {PRIORITY_LABELS[task.priority]}
                              {task.department_name ? ` · ${task.department_name}` : ''}
                              {task.assigned_to_username ? ` · → ${task.assigned_to_username}` : ''}
                            </div>
                          </div>
                          {canManage && (
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setEditingTaskId(task.id)} style={btn('#007BFF')}>Edit</button>
                              <button onClick={() => deleteTask(token, task.id).then(loadAll)} style={btn('#dc3545')}>Delete</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            />

            <Route
              path="/employees"
              element={canManage ? (
                <>
                  {pageHeader('Employees', users.length, 'Create employee', 'user')}
                  {users.length === 0 ? <p>No employees</p> : users.map((user) => (
                    <div key={user.id} style={{ background: '#f8f9fa', padding: '12px', marginBottom: '10px', borderRadius: '5px' }}>
                      {editingUserId === user.id ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(user.id, e.target); }} style={{ display: 'grid', gap: '8px' }}>
                          <input name="email" defaultValue={user.email} style={inputStyle} />
                          <input name="first_name" defaultValue={user.first_name} style={inputStyle} />
                          <input name="last_name" defaultValue={user.last_name} style={inputStyle} />
                          <input name="password" type="password" placeholder="New password (optional)" style={inputStyle} />
                          <select name="role" defaultValue={user.role} style={inputStyle}>
                            {roleOptions.map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                          <select name="status" defaultValue={user.status} style={inputStyle}>
                            {Object.entries(STATUS_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                          {isSuperAdmin && (
                            <select name="department" defaultValue={user.department || ''} style={inputStyle}>
                              <option value="">— No department —</option>
                              {departments.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" style={btn('#007BFF')}>Save</button>
                            <button type="button" onClick={() => setEditingUserId(null)} style={btn('#6c757d')}>Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <strong>{user.username}</strong>
                          <span style={{ marginLeft: '8px', color: '#666' }}>
                            {ROLE_LABELS[user.role]} · {STATUS_LABELS[user.status]}
                          </span>
                          {user.department_name && <span style={{ marginLeft: '8px' }}>[{user.department_name}]</span>}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <button onClick={() => setEditingUserId(user.id)} style={btn('#007BFF')}>Edit</button>
                            {user.id !== currentUser.id && (
                              <button onClick={() => deleteUser(token, user.id).then(loadAll)} style={btn('#dc3545')}>Delete</button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </>
              ) : <Navigate to="/tasks" replace />}
            />

            <Route
              path="/departments"
              element={canManage ? (
                <>
                  {pageHeader('Departments', departments.length, 'Create department', 'department', isSuperAdmin)}
                  {departments.map((dept) => (
                    <div key={dept.id} style={{ background: '#f8f9fa', padding: '12px', marginBottom: '10px', borderRadius: '5px' }}>
                      {editingDeptId === dept.id && isSuperAdmin ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleUpdateDepartment(dept.id, e.target.name.value);
                          }}
                          style={{ display: 'flex', gap: '8px' }}
                        >
                          <input name="name" defaultValue={dept.name} style={{ ...inputStyle, flex: 1 }} required />
                          <button type="submit" style={btn('#007BFF')}>Save</button>
                          <button type="button" onClick={() => setEditingDeptId(null)} style={btn('#6c757d')}>Cancel</button>
                        </form>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{dept.name}</strong>
                          {isSuperAdmin && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => setEditingDeptId(dept.id)} style={btn('#007BFF')}>Edit</button>
                              <button onClick={() => deleteDepartment(token, dept.id).then(loadAll)} style={btn('#dc3545')}>Delete</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {isManager && !isSuperAdmin && (
                    <p style={{ color: '#666', fontSize: '14px' }}>
                      As a manager, you can only see your own department. Creating and editing departments is available to super admin.
                    </p>
                  )}
                </>
              ) : <Navigate to="/tasks" replace />}
            />

            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        )}

        <Modal
          open={Boolean(selectedTask)}
          title={selectedTask?.title || 'Task details'}
          onClose={() => setSelectedTask(null)}
        >
          {selectedTask && (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                <div><strong>Status:</strong> {TASK_STATUS_LABELS[selectedTask.status]}</div>
                <div><strong>Priority:</strong> {PRIORITY_LABELS[selectedTask.priority]}</div>
                <div><strong>Department:</strong> {selectedTask.department_name || '—'}</div>
                <div><strong>Assignee:</strong> {selectedTask.assigned_to_username || '—'}</div>
                <div><strong>Created by:</strong> {selectedTask.created_by_username || '—'}</div>
                <div>
                  <strong>Created at:</strong>{' '}
                  {selectedTask.created_at
                    ? new Date(selectedTask.created_at).toLocaleString()
                    : '—'}
                </div>
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '6px' }}>Description</strong>
                <p style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  background: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '6px',
                  lineHeight: 1.5,
                  minHeight: '60px',
                }}>
                  {selectedTask.description?.trim() ? selectedTask.description : 'No description'}
                </p>
              </div>
              {canManage && (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTaskId(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    style={btn('#007BFF')}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteTask(token, selectedTask.id).then(() => {
                        setSelectedTask(null);
                        loadAll();
                      });
                    }}
                    style={btn('#dc3545')}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>

        <Modal open={createModal === 'task'} title="Create task" onClose={() => setCreateModal(null)}>
          <form onSubmit={handleCreateTask} style={{ display: 'grid', gap: '10px' }}>
            <input name="title" placeholder="Title" style={inputStyle} required />
            <textarea name="description" placeholder="Description" style={inputStyle} />
            <select name="priority" defaultValue="medium" style={inputStyle}>
              {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select name="status" defaultValue="todo" style={inputStyle}>
              {Object.entries(TASK_STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {isSuperAdmin && (
              <select name="department" style={inputStyle}>
                <option value="">— Department —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
            {canManage && (
              <select name="assigned_to" style={inputStyle}>
                <option value="">— Assignee —</option>
                {assignableUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreateModal(null)} style={btn('#6c757d')}>Cancel</button>
              <button type="submit" style={btn('#28a745')}>Create</button>
            </div>
          </form>
        </Modal>

        <Modal open={createModal === 'user'} title="Create employee" onClose={() => setCreateModal(null)}>
          <form onSubmit={handleCreateUser} style={{ display: 'grid', gap: '10px' }}>
            <input name="username" placeholder="Username" style={inputStyle} required />
            <input name="email" type="email" placeholder="Email" style={inputStyle} />
            <input name="password" type="password" placeholder="Password" style={inputStyle} required />
            <input name="first_name" placeholder="First name" style={inputStyle} />
            <input name="last_name" placeholder="Last name" style={inputStyle} />
            <select name="role" defaultValue="employee" style={inputStyle}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <select name="status" defaultValue="approved" style={inputStyle}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {isSuperAdmin && (
              <select name="department" style={inputStyle}>
                <option value="">— Department —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreateModal(null)} style={btn('#6c757d')}>Cancel</button>
              <button type="submit" style={btn('#28a745')}>Create</button>
            </div>
          </form>
        </Modal>

        <Modal open={createModal === 'department'} title="Create department" onClose={() => setCreateModal(null)}>
          <form onSubmit={handleCreateDepartment} style={{ display: 'grid', gap: '10px' }}>
            <input name="name" placeholder="Department name" style={inputStyle} required />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCreateModal(null)} style={btn('#6c757d')}>Cancel</button>
              <button type="submit" style={btn('#28a745')}>Create</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  if (token && !currentUser) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  const authBox = {
    fontFamily: 'sans-serif',
    maxWidth: '400px',
    margin: '50px auto',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
  };

  return (
    <Routes>
      <Route
        path="/signup"
        element={(
          <div style={authBox}>
            <h2 style={{ marginTop: 0 }}>Sign up</h2>
            <p style={{ color: '#666', fontSize: '14px', marginTop: 0 }}>
              Create an employee account. A manager must approve it before you can work in the CRM.
            </p>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label>Email</label><br />
                <input name="email" type="email" style={inputStyle} required />
              </div>
              <div>
                <label>Login</label><br />
                <input name="username" style={inputStyle} required />
              </div>
              <div>
                <label>Name</label><br />
                <input name="first_name" style={inputStyle} required />
              </div>
              <div>
                <label>Surname</label><br />
                <input name="last_name" style={inputStyle} required />
              </div>
              <div>
                <label>Department</label><br />
                <select name="department" style={inputStyle} required defaultValue="">
                  <option value="" disabled>— Select department —</option>
                  {publicDepartments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Password</label><br />
                <input name="password" type="password" style={inputStyle} required minLength={6} />
              </div>
              <button type="submit" style={btn('#28a745')}>Sign up</button>
            </form>
            <p style={{ marginTop: '16px', textAlign: 'center' }}>
              Already have an account?{' '}
              <Link to="/" onClick={() => setMessage('')}>Sign in</Link>
            </p>
            {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
          </div>
        )}
      />
      <Route
        path="*"
        element={(
          <div style={authBox}>
            <h2 style={{ marginTop: 0 }}>Sign in to Task CRM</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label>Username:</label><br />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required />
              </div>
              <div>
                <label>Password:</label><br />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
              </div>
              <button type="submit" style={btn('#007BFF')}>Sign in</button>
            </form>
            <p style={{ marginTop: '16px', textAlign: 'center' }}>
              No account?{' '}
              <Link to="/signup" onClick={() => { setMessage(''); setSignupSuccess(''); }}>Sign up</Link>
            </p>
            {signupSuccess && <p style={{ color: '#1e7e34', marginTop: '10px' }}>{signupSuccess}</p>}
            {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
          </div>
        )}
      />
    </Routes>
  );
}

export default App;
