import React, { useState, useEffect, useCallback } from 'react';
import {
  login,
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
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './api';

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

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState(localStorage.getItem('access_token') || '');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingDeptId, setEditingDeptId] = useState(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isManager = currentUser?.role === 'manager';
  const canManage = isSuperAdmin || isManager;

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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await login(username, password);
      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setToken(access);
      setMessage('');
      setUsername('');
      setPassword('');
    } catch {
      setMessage('Login failed. Check your username or password.');
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
    if (form.assigned_to.value) {
      data.assigned_to = Number(form.assigned_to.value);
    }
    try {
      await createTask(token, data);
      form.reset();
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
      form.reset();
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
      e.target.reset();
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

  if (token && currentUser) {
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

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {['tasks', ...(canManage ? ['users'] : []), ...(canManage ? ['departments'] : [])].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={btn(activeTab === tab ? '#007BFF' : '#6c757d')}
            >
              {tab === 'tasks' ? 'Tasks' : tab === 'users' ? 'Users' : 'Departments'}
            </button>
          ))}
        </div>

        {loading && <p>Loading...</p>}

        {!loading && activeTab === 'tasks' && (
          <>
            <div style={{ background: '#f1f3f5', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
              <h4>Create task</h4>
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
                <button type="submit" style={btn('#28a745')}>Add</button>
              </form>
            </div>

            <h3>Tasks ({tasks.length})</h3>
            {tasks.length === 0 ? <p>No tasks</p> : tasks.map((task) => (
              <div key={task.id} style={{ background: '#f8f9fa', padding: '12px', marginBottom: '10px', borderRadius: '5px', borderLeft: '4px solid #007BFF' }}>
                {editingTaskId === task.id ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleUpdateTask(task.id, e.target); }} style={{ display: 'grid', gap: '8px' }}>
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
                  <>
                    <strong>{task.title}</strong>
                    <span style={{ color: '#666', marginLeft: '8px' }}>
                      {TASK_STATUS_LABELS[task.status]} · {PRIORITY_LABELS[task.priority]}
                    </span>
                    {task.department_name && <span style={{ marginLeft: '8px', color: '#888' }}>[{task.department_name}]</span>}
                    {task.assigned_to_username && <span style={{ marginLeft: '8px' }}>→ {task.assigned_to_username}</span>}
                    <p style={{ margin: '6px 0', fontSize: '14px' }}>{task.description}</p>
                    {canManage && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setEditingTaskId(task.id)} style={btn('#007BFF')}>Edit</button>
                        <button onClick={() => deleteTask(token, task.id).then(loadAll)} style={btn('#dc3545')}>Delete</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {!loading && activeTab === 'users' && canManage && (
          <>
            <div style={{ background: '#f1f3f5', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
              <h4>Add user</h4>
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
                <button type="submit" style={btn('#28a745')}>Create</button>
              </form>
            </div>

            <h3>Users ({users.length})</h3>
            {users.map((user) => (
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
        )}

        {!loading && activeTab === 'departments' && canManage && (
          <>
            {isSuperAdmin && (
              <div style={{ background: '#f1f3f5', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
                <h4>Create department</h4>
                <form onSubmit={handleCreateDepartment} style={{ display: 'flex', gap: '10px' }}>
                  <input name="name" placeholder="Department name" style={{ ...inputStyle, flex: 1 }} required />
                  <button type="submit" style={btn('#28a745')}>Add</button>
                </form>
              </div>
            )}

            <h3>Departments ({departments.length})</h3>
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
        )}
      </div>
    );
  }

  if (token && !currentUser) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Sign in to Task CRM</h2>
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
      {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
    </div>
  );
}

export default App;
