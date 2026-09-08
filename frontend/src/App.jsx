import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  login,
  register,
  getMe,
  changePassword,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskComments,
  createTaskComment,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDepartments,
  getPublicDepartments,
  getPublicPositions,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
  getColleagues,
  getMessages,
  createMessage,
  markMessageRead,
} from './api';
import Modal from './components/Modal';
import KanbanBoard from './components/KanbanBoard';

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

const RECIPIENT_TYPE_LABELS = {
  user: 'Colleague',
  department: 'Department',
  position: 'Job title',
  all: 'Everyone',
};

function toDateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function isTaskOverdue(task) {
  const due = toDateInputValue(task?.due_date);
  if (!due || task.status === 'done') return false;
  return due < new Date().toISOString().slice(0, 10);
}

const fieldClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
const btnPrimary =
  'rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700';
const btnSuccess =
  'rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700';
const btnDanger =
  'rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700';
const btnMuted =
  'rounded-md bg-slate-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600';
const cardClass = 'rounded-lg border border-slate-200 bg-white p-4 shadow-sm';

const navClass = ({ isActive }) =>
  `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white no-underline ${
    isActive ? 'bg-sky-600' : 'bg-slate-500 hover:bg-slate-600'
  }`;

function NavIcon({ children }) {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function BoardIcon() {
  return (
    <NavIcon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </NavIcon>
  );
}

function MessagesIcon() {
  return (
    <NavIcon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </NavIcon>
  );
}

function EmployeesIcon() {
  return (
    <NavIcon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </NavIcon>
  );
}

function DepartmentsIcon() {
  return (
    <NavIcon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </NavIcon>
  );
}

function JobTitlesIcon() {
  return (
    <NavIcon>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.931m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </NavIcon>
  );
}

function userIsSuperAdmin(user) {
  return Boolean(
    user &&
    (user.role === 'super_admin' || user.is_staff || user.is_superuser)
  );
}

function messageRecipientLabel(msg) {
  if (msg.recipient_type === 'all') return 'Everyone';
  if (msg.recipient_type === 'department') return msg.recipient_department_name || 'Department';
  if (msg.recipient_type === 'position') return msg.recipient_position_name || 'Job title';
  return msg.recipient_user_username || 'Colleague';
}

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
  const [positions, setPositions] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [messages, setMessages] = useState([]);

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editingPositionId, setEditingPositionId] = useState(null);

  const [createModal, setCreateModal] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageRecipientType, setMessageRecipientType] = useState('user');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [publicDepartments, setPublicDepartments] = useState([]);
  const [publicPositions, setPublicPositions] = useState([]);
  const [signupSuccess, setSignupSuccess] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const isSuperAdmin = userIsSuperAdmin(currentUser);
  const isManager = currentUser?.role === 'manager';
  const canManage = isSuperAdmin || isManager;
  const isApproved = isSuperAdmin || currentUser?.status === 'approved';

  const editingTask = tasks.find((t) => t.id === editingTaskId) || null;

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
      const meRes = await getMe();
      setCurrentUser(meRes.data);

      const approved = userIsSuperAdmin(meRes.data) || meRes.data.status === 'approved';
      if (!approved) return;

      const [tasksRes, deptsRes, positionsRes, messagesRes, colleaguesRes] = await Promise.all([
        getTasks(),
        getDepartments(),
        getPositions(),
        getMessages(),
        getColleagues(),
      ]);
      setTasks(tasksRes.data);
      setDepartments(deptsRes.data);
      setPositions(positionsRes.data);
      setMessages(messagesRes.data);
      setColleagues(colleaguesRes.data);

      if (userIsSuperAdmin(meRes.data) || meRes.data.role === 'manager') {
        const usersRes = await getUsers();
        setUsers(usersRes.data);
      }
    } catch (err) {
      if (err.response?.status === 401 || !localStorage.getItem('access_token')) {
        handleLogout();
      } else {
        setMessage(showError(err, 'Failed to load data'));
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadAll();
  }, [token, loadAll]);

  useEffect(() => {
    if (!token || !selectedTask?.id) {
      setComments([]);
      setCommentText('');
      return undefined;
    }
    let cancelled = false;
    setCommentsLoading(true);
    getTaskComments(selectedTask.id)
      .then((res) => {
        if (!cancelled) setComments(res.data);
      })
      .catch((err) => {
        if (!cancelled) setMessage(showError(err, 'Failed to load comments'));
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => { cancelled = true; };
  }, [token, selectedTask?.id]);

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
    getPublicPositions()
      .then((res) => {
        if (!cancelled) setPublicPositions(res.data);
      })
      .catch(() => {
        if (!cancelled) setPublicPositions([]);
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
      position: form.position.value ? Number(form.position.value) : null,
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
    setPositions([]);
    setColleagues([]);
    setMessages([]);
    setCreateModal(null);
    setSelectedTask(null);
    setSelectedMessage(null);
    setComments([]);
    setCommentText('');
    setEditingTaskId(null);
    setPasswordModalOpen(false);
    setSuccessMessage('');
    navigate('/');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await changePassword({
        current_password: form.current_password.value,
        new_password: form.new_password.value,
        confirm_password: form.confirm_password.value,
      });
      form.reset();
      setPasswordModalOpen(false);
      setMessage('');
      setSuccessMessage('Password changed successfully.');
    } catch (err) {
      setSuccessMessage('');
      setMessage(showError(err, 'Failed to change password'));
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      description: form.description.value,
      priority: form.priority.value,
      status: form.status.value,
      due_date: form.due_date.value || null,
    };
    if (isSuperAdmin && form.department.value) {
      data.department = Number(form.department.value);
    }
    if (form.assigned_to?.value) {
      data.assigned_to = Number(form.assigned_to.value);
    }
    try {
      await createTask(data);
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
      due_date: form.due_date.value || null,
    };
    if (isSuperAdmin && form.department.value) {
      data.department = Number(form.department.value);
    }
    if (canManage) {
      data.assigned_to = form.assigned_to.value ? Number(form.assigned_to.value) : null;
    }
    try {
      await updateTask(taskId, data);
      setEditingTaskId(null);
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to update task'));
    }
  };

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;
    try {
      const res = await createTaskComment(selectedTask.id, commentText.trim());
      setComments((prev) => [...prev, res.data]);
      setCommentText('');
    } catch (err) {
      setMessage(showError(err, 'Failed to add comment'));
    }
  };

  const handleTaskStatusChange = async (task, status) => {
    if (task.status === status) return;
    try {
      await updateTask(task.id, { status });
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to update task status'));
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
    if (form.position?.value) {
      data.position = Number(form.position.value);
    } else {
      data.position = null;
    }
    try {
      await createUser(data);
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
    data.position = form.position?.value ? Number(form.position.value) : null;
    if (form.password.value) {
      data.password = form.password.value;
    }
    try {
      await updateUser(userId, data);
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
      await createDepartment({ name });
      setCreateModal(null);
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to create department'));
    }
  };

  const handleUpdateDepartment = async (deptId, name) => {
    try {
      await updateDepartment(deptId, { name });
      setEditingDeptId(null);
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to update department'));
    }
  };

  const handleCreatePosition = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    try {
      await createPosition({ name });
      setCreateModal(null);
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to create job title'));
    }
  };

  const handleUpdatePosition = async (positionId, name) => {
    try {
      await updatePosition(positionId, { name });
      setEditingPositionId(null);
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to update job title'));
    }
  };

  const handleCreateMessage = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      recipient_type: messageRecipientType,
      title: form.title.value.trim(),
      text: form.text.value.trim(),
    };
    if (messageRecipientType === 'user' && form.recipient_user.value) {
      data.recipient_user = Number(form.recipient_user.value);
    }
    if (messageRecipientType === 'department' && form.recipient_department.value) {
      data.recipient_department = Number(form.recipient_department.value);
    }
    if (messageRecipientType === 'position' && form.recipient_position.value) {
      data.recipient_position = Number(form.recipient_position.value);
    }
    try {
      await createMessage(data);
      setCreateModal(null);
      setMessageRecipientType('user');
      loadAll();
    } catch (err) {
      setMessage(showError(err, 'Failed to send message'));
    }
  };

  const handleOpenMessage = async (msg) => {
    setSelectedMessage(msg);
    const isInbox = msg.sender !== currentUser.id;
    if (!isInbox || msg.is_read) return;
    try {
      const res = await markMessageRead(msg.id);
      setMessages((prev) => prev.map((item) => (item.id === msg.id ? res.data : item)));
      setSelectedMessage(res.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setMessage(showError(err, 'Failed to mark message as read'));
      }
    }
  };

  const assignableUsers = isSuperAdmin
    ? users.filter((u) => u.status === 'approved')
    : users.filter((u) => u.status === 'approved' && u.role !== 'super_admin');

  const roleOptions = isSuperAdmin
    ? ['employee', 'manager', 'super_admin']
    : ['employee', 'manager'];

  const messageRecipientTypes = isSuperAdmin
    ? ['user', 'department', 'position', 'all']
    : isManager
      ? ['user', 'department']
      : ['user'];

  const unreadCount = messages.filter(
    (msg) => msg.sender !== currentUser?.id && !msg.is_read,
  ).length;

  const pageHeader = (title, count, createLabel, createKey, showCreate = true) => (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-slate-800">
        {title} <span className="text-slate-400">({count})</span>
      </h3>
      {showCreate && (
        <button type="button" onClick={() => setCreateModal(createKey)} className={btnSuccess}>
          {createLabel}
        </button>
      )}
    </div>
  );

  const taskFormFields = (task = null) => (
    <>
      <input
        name="title"
        placeholder="Title"
        defaultValue={task?.title || ''}
        className={fieldClass}
        required
      />
      <textarea
        name="description"
        placeholder="Description"
        defaultValue={task?.description || ''}
        className={`${fieldClass} min-h-[90px]`}
      />
      <select name="priority" defaultValue={task?.priority || 'medium'} className={fieldClass}>
        {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <select name="status" defaultValue={task?.status || 'todo'} className={fieldClass}>
        {Object.entries(TASK_STATUS_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>

      <label className={labelClass}>Due date</label>
      <input
        name="due_date"
        type="date"
        defaultValue={toDateInputValue(task?.due_date)}
        className={fieldClass}
      />
      
      {isSuperAdmin && (
        <select name="department" defaultValue={task?.department || ''} className={fieldClass}>
          <option value="">— Department —</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      )}
      {canManage && (
        <select name="assigned_to" defaultValue={task?.assigned_to || ''} className={fieldClass}>
          <option value="">— Assignee —</option>
          {assignableUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>
      )}
    </>
  );

  if (token && currentUser) {
    if (!isApproved) {
      return (
        <div className="mx-auto mt-16 max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-semibold">Account pending</h2>
          <p className="mb-4 text-sm leading-relaxed text-slate-600">
            Hello, <strong>{currentUser.username}</strong>. Your status is{' '}
            <strong>{STATUS_LABELS[currentUser.status] || currentUser.status}</strong>.
            You can sign in after a manager or super admin approves your account.
          </p>
          <button onClick={handleLogout} className={btnDanger}>Log out</button>
        </div>
      );
    }

    return (
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Task CRM</h1>
              <p className="text-sm text-slate-500">
                {currentUser.username} — {ROLE_LABELS[currentUser.role]}
                {currentUser.position_name ? ` · ${currentUser.position_name}` : ''}
                {currentUser.department_name ? ` (${currentUser.department_name})` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setPasswordModalOpen(true)} className={btnMuted}>
                Change password
              </button>
              <button onClick={handleLogout} className={btnDanger}>Log out</button>
            </div>
          </div>

          {successMessage && (
            <div className="mb-3 flex items-start justify-between rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <span>{successMessage}</span>
              <button type="button" onClick={() => setSuccessMessage('')} className={btnMuted}>×</button>
            </div>
          )}

          {message && (
            <div className="mb-3 flex items-start justify-between rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
              <span>{message}</span>
              <button type="button" onClick={() => setMessage('')} className={btnMuted}>×</button>
            </div>
          )}

          <nav className="flex flex-wrap gap-2">
            <NavLink to="/tasks" className={navClass}>
              <BoardIcon />
              Board
            </NavLink>
            <NavLink to="/messages" className={navClass}>
              <MessagesIcon />
              Messages{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </NavLink>
            {canManage && (
              <NavLink to="/employees" className={navClass}>
                <EmployeesIcon />
                Employees
              </NavLink>
            )}
            {canManage && (
              <NavLink to="/departments" className={navClass}>
                <DepartmentsIcon />
                Departments
              </NavLink>
            )}
            {canManage && (
              <NavLink to="/positions" className={navClass}>
                <JobTitlesIcon />
                Job titles
              </NavLink>
            )}
          </nav>
        </div>

        {loading && <p className="text-slate-500">Loading...</p>}

        {!loading && (
          <Routes>
            <Route
              path="/tasks"
              element={(
                <div>
                  {pageHeader('Task board', tasks.length, 'Create task', 'task')}
                  <KanbanBoard
                    tasks={tasks}
                    priorityLabels={PRIORITY_LABELS}
                    canManage={canManage}
                    onOpenTask={setSelectedTask}
                    onEditTask={(id) => {
                      setSelectedTask(null);
                      setEditingTaskId(id);
                    }}
                    onDeleteTask={(id) => deleteTask(id).then(loadAll)}
                    onStatusChange={handleTaskStatusChange}
                  />
                </div>
              )}
            />

            <Route
              path="/messages"
              element={(
                <div>
                  {pageHeader('Messages', messages.length, 'Write message', 'message')}
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-slate-500">No messages</p>
                    ) : messages.map((msg) => {
                      const isSent = msg.sender === currentUser.id;
                      const unread = !isSent && !msg.is_read;
                      return (
                        <button
                          key={msg.id}
                          type="button"
                          onClick={() => handleOpenMessage(msg)}
                          className={`${cardClass} w-full text-left transition hover:border-sky-300 ${
                            unread ? 'border-sky-300 bg-sky-50' : ''
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                {unread && (
                                  <span className="inline-block h-2 w-2 rounded-full bg-sky-600" />
                                )}
                                <strong className={unread ? 'text-slate-900' : 'text-slate-800'}>
                                  {msg.title}
                                </strong>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                  {isSent ? 'Sent' : 'Inbox'}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-slate-500">
                                {isSent
                                  ? `To: ${messageRecipientLabel(msg)}`
                                  : `From: ${msg.sender_username || 'Unknown'}`}
                                {' · '}
                                {RECIPIENT_TYPE_LABELS[msg.recipient_type] || msg.recipient_type}
                              </p>
                            </div>
                            <span className="text-xs text-slate-400">
                              {msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                            {msg.text}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            />

            <Route
              path="/employees"
              element={canManage ? (
                <div>
                  {pageHeader('Employees', users.length, 'Create employee', 'user')}
                  <div className="space-y-3">
                    {users.length === 0 ? (
                      <p className="text-slate-500">No employees</p>
                    ) : users.map((user) => (
                      <div key={user.id} className={cardClass}>
                        {editingUserId === user.id ? (
                          <form
                            onSubmit={(e) => { e.preventDefault(); handleUpdateUser(user.id, e.target); }}
                            className="grid gap-2"
                          >
                            <input name="email" defaultValue={user.email} className={fieldClass} />
                            <input name="first_name" defaultValue={user.first_name} className={fieldClass} />
                            <input name="last_name" defaultValue={user.last_name} className={fieldClass} />
                            <input name="password" type="password" placeholder="New password (optional)" className={fieldClass} />
                            <select name="role" defaultValue={user.role} className={fieldClass}>
                              {roleOptions.map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                              ))}
                            </select>
                            <select name="status" defaultValue={user.status} className={fieldClass}>
                              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                              ))}
                            </select>
                            {isSuperAdmin && (
                              <select name="department" defaultValue={user.department || ''} className={fieldClass}>
                                <option value="">— No department —</option>
                                {departments.map((d) => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                            )}
                            <select name="position" defaultValue={user.position || ''} className={fieldClass}>
                              <option value="">— No job title —</option>
                              {positions.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button type="submit" className={btnPrimary}>Save</button>
                              <button type="button" onClick={() => setEditingUserId(null)} className={btnMuted}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-baseline gap-2">
                              <strong className="text-slate-800">{user.username}</strong>
                              <span className="text-sm text-slate-500">
                                {ROLE_LABELS[user.role]} · {STATUS_LABELS[user.status]}
                              </span>
                              {user.department_name && (
                                <span className="text-sm text-slate-500">[{user.department_name}]</span>
                              )}
                              {user.position_name && (
                                <span className="text-sm text-slate-500">{user.position_name}</span>
                              )}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button onClick={() => setEditingUserId(user.id)} className={btnPrimary}>Edit</button>
                              {user.id !== currentUser.id && (
                                <button
                                  onClick={() => deleteUser(user.id).then(loadAll)}
                                  className={btnDanger}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : <Navigate to="/tasks" replace />}
            />

            <Route
              path="/departments"
              element={canManage ? (
                <div>
                  {pageHeader('Departments', departments.length, 'Create department', 'department', isSuperAdmin)}
                  <div className="space-y-3">
                    {departments.map((dept) => (
                      <div key={dept.id} className={cardClass}>
                        {editingDeptId === dept.id && isSuperAdmin ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleUpdateDepartment(dept.id, e.target.name.value);
                            }}
                            className="flex flex-wrap gap-2"
                          >
                            <input name="name" defaultValue={dept.name} className={`${fieldClass} flex-1`} required />
                            <button type="submit" className={btnPrimary}>Save</button>
                            <button type="button" onClick={() => setEditingDeptId(null)} className={btnMuted}>Cancel</button>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <strong>{dept.name}</strong>
                            {isSuperAdmin && (
                              <div className="flex gap-2">
                                <button onClick={() => setEditingDeptId(dept.id)} className={btnPrimary}>Edit</button>
                                <button
                                  onClick={() => deleteDepartment(dept.id).then(loadAll)}
                                  className={btnDanger}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {isManager && !isSuperAdmin && (
                    <p className="mt-3 text-sm text-slate-500">
                      As a manager, you can only see your own department. Creating and editing departments is available to super admin.
                    </p>
                  )}
                </div>
              ) : <Navigate to="/tasks" replace />}
            />

            <Route
              path="/positions"
              element={canManage ? (
                <div>
                  {pageHeader('Job titles', positions.length, 'Create job title', 'position', isSuperAdmin)}
                  <div className="space-y-3">
                    {positions.length === 0 ? (
                      <p className="text-slate-500">No job titles</p>
                    ) : positions.map((position) => (
                      <div key={position.id} className={cardClass}>
                        {editingPositionId === position.id && isSuperAdmin ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleUpdatePosition(position.id, e.target.name.value);
                            }}
                            className="flex flex-wrap gap-2"
                          >
                            <input name="name" defaultValue={position.name} className={`${fieldClass} flex-1`} required />
                            <button type="submit" className={btnPrimary}>Save</button>
                            <button type="button" onClick={() => setEditingPositionId(null)} className={btnMuted}>Cancel</button>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <strong>{position.name}</strong>
                            {isSuperAdmin && (
                              <div className="flex gap-2">
                                <button onClick={() => setEditingPositionId(position.id)} className={btnPrimary}>Edit</button>
                                <button
                                  onClick={() => deletePosition(position.id).then(loadAll)}
                                  className={btnDanger}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {isManager && !isSuperAdmin && (
                    <p className="mt-3 text-sm text-slate-500">
                      Creating and editing job titles is available to super admin. You can assign them to employees.
                    </p>
                  )}
                </div>
              ) : <Navigate to="/tasks" replace />}
            />

            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        )}

        <Modal
          open={Boolean(selectedTask)}
          title={selectedTask?.title || 'Task details'}
          onClose={() => setSelectedTask(null)}
          wide
        >
          {selectedTask && (
            <div className="grid gap-4">
              <div className="grid gap-2 text-sm text-slate-700">
                <div><span className="font-semibold">Status:</span> {TASK_STATUS_LABELS[selectedTask.status]}</div>
                <div><span className="font-semibold">Priority:</span> {PRIORITY_LABELS[selectedTask.priority]}</div>
                <div><span className="font-semibold">Department:</span> {selectedTask.department_name || '—'}</div>
                <div><span className="font-semibold">Assignee:</span> {selectedTask.assigned_to_username || '—'}</div>
                <div><span className="font-semibold">Created by:</span> {selectedTask.created_by_username || '—'}</div>
                <div>
                  <span className="font-semibold">Created at:</span>{' '}
                  {selectedTask.created_at
                    ? new Date(selectedTask.created_at).toLocaleString()
                    : '—'}
                </div>
                <div>
                  <span className="font-semibold">Due date:</span>{' '}
                  {toDateInputValue(selectedTask.due_date) || '—'}
                  {isTaskOverdue(selectedTask) && (
                    <span className="ml-2 font-semibold text-rose-600">Overdue</span>
                  )}
                </div>
              </div>
              <div>
                <strong className="mb-2 block text-sm">Description</strong>
                <p className="min-h-[60px] whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                  {selectedTask.description?.trim() ? selectedTask.description : 'No description'}
                </p>
              </div>
              <div>
                <strong className="mb-2 block text-sm">
                  Comments <span className="font-normal text-slate-400">({comments.length})</span>
                </strong>
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                  {commentsLoading && (
                    <p className="text-sm text-slate-500">Loading comments...</p>
                  )}
                  {!commentsLoading && comments.length === 0 && (
                    <p className="text-sm text-slate-400">No comments yet</p>
                  )}
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-md bg-white p-2 shadow-sm">
                      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">
                          {comment.author_username || 'Unknown'}
                        </span>
                        <span>
                          {comment.created_at
                            ? new Date(comment.created_at).toLocaleString()
                            : ''}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-slate-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleCreateComment} className="mt-2 grid gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment"
                    className={`${fieldClass} min-h-[72px]`}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className={btnPrimary}
                      disabled={!commentText.trim()}
                    >
                      Add comment
                    </button>
                  </div>
                </form>
              </div>
              {canManage && (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTaskId(selectedTask.id);
                      setSelectedTask(null);
                    }}
                    className={btnPrimary}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteTask(selectedTask.id).then(() => {
                        setSelectedTask(null);
                        loadAll();
                      });
                    }}
                    className={btnDanger}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>

        <Modal
          open={Boolean(editingTask)}
          title="Edit task"
          onClose={() => setEditingTaskId(null)}
          wide
        >
          {editingTask && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateTask(editingTask.id, e.target);
              }}
              className="grid gap-3"
            >
              {taskFormFields(editingTask)}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingTaskId(null)} className={btnMuted}>Cancel</button>
                <button type="submit" className={btnPrimary}>Save</button>
              </div>
            </form>
          )}
        </Modal>

        <Modal open={passwordModalOpen} title="Change password" onClose={() => setPasswordModalOpen(false)}>
          <form onSubmit={handleChangePassword} className="grid gap-3">
            <input name="current_password" type="password" placeholder="Current password" className={fieldClass} required />
            <input name="new_password" type="password" placeholder="New password" className={fieldClass} required minLength={6} />
            <input name="confirm_password" type="password" placeholder="Confirm new password" className={fieldClass} required minLength={6} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPasswordModalOpen(false)} className={btnMuted}>Cancel</button>
              <button type="submit" className={btnPrimary}>Save</button>
            </div>
          </form>
        </Modal>

        <Modal
          open={Boolean(selectedMessage)}
          title={selectedMessage?.title || 'Message'}
          onClose={() => setSelectedMessage(null)}
          wide
        >
          {selectedMessage && (
            <div className="grid gap-3 text-sm text-slate-700">
              <div>
                <span className="font-semibold">From:</span>{' '}
                {selectedMessage.sender_username || 'Unknown'}
              </div>
              <div>
                <span className="font-semibold">To:</span>{' '}
                {messageRecipientLabel(selectedMessage)}
                {' '}
                ({RECIPIENT_TYPE_LABELS[selectedMessage.recipient_type] || selectedMessage.recipient_type})
              </div>
              <div>
                <span className="font-semibold">Date:</span>{' '}
                {selectedMessage.created_at
                  ? new Date(selectedMessage.created_at).toLocaleString()
                  : '—'}
              </div>
              <div>
                <strong className="mb-2 block">Message</strong>
                <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 leading-relaxed">
                  {selectedMessage.text}
                </p>
              </div>
            </div>
          )}
        </Modal>

        <Modal
          open={createModal === 'message'}
          title="Write message"
          onClose={() => {
            setCreateModal(null);
            setMessageRecipientType('user');
          }}
        >
          <form onSubmit={handleCreateMessage} className="grid gap-3">
            <label className={labelClass}>Recipient</label>
            <select
              name="recipient_type"
              value={messageRecipientType}
              onChange={(e) => setMessageRecipientType(e.target.value)}
              className={fieldClass}
            >
              {messageRecipientTypes.map((type) => (
                <option key={type} value={type}>{RECIPIENT_TYPE_LABELS[type]}</option>
              ))}
            </select>
            {messageRecipientType === 'user' && (
              <select name="recipient_user" className={fieldClass} required defaultValue="">
                <option value="" disabled>— Select colleague —</option>
                {colleagues.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                    {user.department_name ? ` (${user.department_name})` : ''}
                  </option>
                ))}
              </select>
            )}
            {messageRecipientType === 'department' && (
              <select name="recipient_department" className={fieldClass} required defaultValue={departments[0]?.id || ''}>
                <option value="" disabled>— Select department —</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            )}
            {messageRecipientType === 'position' && (
              <select name="recipient_position" className={fieldClass} required defaultValue="">
                <option value="" disabled>— Select job title —</option>
                {positions.map((position) => (
                  <option key={position.id} value={position.id}>{position.name}</option>
                ))}
              </select>
            )}
            <input name="title" placeholder="Subject" className={fieldClass} required />
            <textarea
              name="text"
              placeholder="Write a message"
              className={`${fieldClass} min-h-[120px]`}
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreateModal(null);
                  setMessageRecipientType('user');
                }}
                className={btnMuted}
              >
                Cancel
              </button>
              <button type="submit" className={btnSuccess}>Send</button>
            </div>
          </form>
        </Modal>

        <Modal open={createModal === 'task'} title="Create task" onClose={() => setCreateModal(null)} wide>
          <form onSubmit={handleCreateTask} className="grid gap-3">
            {taskFormFields()}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreateModal(null)} className={btnMuted}>Cancel</button>
              <button type="submit" className={btnSuccess}>Create</button>
            </div>
          </form>
        </Modal>

        <Modal open={createModal === 'user'} title="Create employee" onClose={() => setCreateModal(null)}>
          <form onSubmit={handleCreateUser} className="grid gap-3">
            <input name="username" placeholder="Username" className={fieldClass} required />
            <input name="email" type="email" placeholder="Email" className={fieldClass} />
            <input name="password" type="password" placeholder="Password" className={fieldClass} required />
            <input name="first_name" placeholder="First name" className={fieldClass} />
            <input name="last_name" placeholder="Last name" className={fieldClass} />
            <select name="role" defaultValue="employee" className={fieldClass}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <select name="status" defaultValue="approved" className={fieldClass}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {isSuperAdmin && (
              <select name="department" className={fieldClass}>
                <option value="">— Department —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
            <select name="position" className={fieldClass} defaultValue="">
              <option value="">— Job title —</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreateModal(null)} className={btnMuted}>Cancel</button>
              <button type="submit" className={btnSuccess}>Create</button>
            </div>
          </form>
        </Modal>

        <Modal open={createModal === 'department'} title="Create department" onClose={() => setCreateModal(null)}>
          <form onSubmit={handleCreateDepartment} className="grid gap-3">
            <input name="name" placeholder="Department name" className={fieldClass} required />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreateModal(null)} className={btnMuted}>Cancel</button>
              <button type="submit" className={btnSuccess}>Create</button>
            </div>
          </form>
        </Modal>

        <Modal open={createModal === 'position'} title="Create job title" onClose={() => setCreateModal(null)}>
          <form onSubmit={handleCreatePosition} className="grid gap-3">
            <input name="name" placeholder="Job title" className={fieldClass} required />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreateModal(null)} className={btnMuted}>Cancel</button>
              <button type="submit" className={btnSuccess}>Create</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  if (token && !currentUser) {
    return <div className="mt-16 text-center text-slate-500">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/signup"
        element={(
          <div className="mx-auto mt-12 max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-xl font-semibold">Sign up</h2>
            <p className="mb-4 text-sm text-slate-500">
              Create an employee account. A manager must approve it before you can work in the CRM.
            </p>
            <form onSubmit={handleRegister} className="grid gap-3">
              <div>
                <label className={labelClass}>Email</label>
                <input name="email" type="email" className={fieldClass} required />
              </div>
              <div>
                <label className={labelClass}>Login</label>
                <input name="username" className={fieldClass} required />
              </div>
              <div>
                <label className={labelClass}>Name</label>
                <input name="first_name" className={fieldClass} required />
              </div>
              <div>
                <label className={labelClass}>Surname</label>
                <input name="last_name" className={fieldClass} required />
              </div>
              <div>
                <label className={labelClass}>Department</label>
                <select name="department" className={fieldClass} required defaultValue="">
                  <option value="" disabled>— Select department —</option>
                  {publicDepartments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Job title</label>
                <select name="position" className={fieldClass} defaultValue="">
                  <option value="">— Select job title —</option>
                  {publicPositions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input name="password" type="password" className={fieldClass} required minLength={6} />
              </div>
              <button type="submit" className={btnSuccess}>Sign up</button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link className="text-sky-600 hover:underline" to="/" onClick={() => setMessage('')}>Sign in</Link>
            </p>
            {message && <p className="mt-3 text-sm text-rose-600">{message}</p>}
          </div>
        )}
      />
      <Route
        path="*"
        element={(
          <div className="mx-auto mt-12 max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Sign in to Task CRM</h2>
            <form onSubmit={handleLogin} className="grid gap-3">
              <div>
                <label className={labelClass}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldClass}
                  required
                />
              </div>
              <button type="submit" className={btnPrimary}>Sign in</button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-600">
              No account?{' '}
              <Link
                className="text-sky-600 hover:underline"
                to="/signup"
                onClick={() => { setMessage(''); setSignupSuccess(''); }}
              >
                Sign up
              </Link>
            </p>
            {signupSuccess && <p className="mt-3 text-sm text-emerald-700">{signupSuccess}</p>}
            {message && <p className="mt-3 text-sm text-rose-600">{message}</p>}
          </div>
        )}
      />
    </Routes>
  );
}

export default App;
