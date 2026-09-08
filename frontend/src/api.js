import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
});

let isRefreshing = false;
let pendingRequests = [];

function getAccessToken() {
  return localStorage.getItem('access_token') || '';
}

function getRefreshToken() {
  return localStorage.getItem('refresh_token') || '';
}

function setAccessToken(token) {
  localStorage.setItem('access_token', token);
}

function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

function notifySessionExpired() {
  window.dispatchEvent(new Event('session-expired'));
}

function processQueue(error, token = null) {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingRequests = [];
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes('/token/')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refresh = getRefreshToken();
    if (!refresh) {
      isRefreshing = false;
      clearTokens();
      notifySessionExpired();
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${API_URL}/token/refresh/`, {
        refresh,
      });
      const newAccess = data.access;
      setAccessToken(newAccess);
      processQueue(null, newAccess);
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      notifySessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export function getMe() {
  return api.get('/me/');
}

export function changePassword(data) {
  return api.post('/me/change-password/', data);
}

export function getTasks() {
  return api.get('/tasks/');
}

export function createTask(data) {
  return api.post('/tasks/', data);
}

export function updateTask(id, data) {
  return api.patch(`/tasks/${id}/`, data);
}

export function deleteTask(id) {
  return api.delete(`/tasks/${id}/`);
}

export function getTaskComments(taskId) {
  return api.get(`/tasks/${taskId}/comments/`);
}

export function createTaskComment(taskId, text) {
  return api.post(`/tasks/${taskId}/comments/`, { text });
}

export function getUsers() {
  return api.get('/users/');
}

export function createUser(data) {
  return api.post('/users/', data);
}

export function updateUser(id, data) {
  return api.patch(`/users/${id}/`, data);
}

export function deleteUser(id) {
  return api.delete(`/users/${id}/`);
}

export function getDepartments() {
  return api.get('/departments/');
}

export function createDepartment(data) {
  return api.post('/departments/', data);
}

export function updateDepartment(id, data) {
  return api.patch(`/departments/${id}/`, data);
}

export function deleteDepartment(id) {
  return api.delete(`/departments/${id}/`);
}

export function getPositions() {
  return api.get('/positions/');
}

export function createPosition(data) {
  return api.post('/positions/', data);
}

export function updatePosition(id, data) {
  return api.patch(`/positions/${id}/`, data);
}

export function deletePosition(id) {
  return api.delete(`/positions/${id}/`);
}

export function login(username, password) {
  return axios.post(`${API_URL}/token/`, { username, password });
}

export function register(data) {
  return axios.post(`${API_URL}/register/`, data);
}

export function getPublicDepartments() {
  return axios.get(`${API_URL}/public/departments/`);
}

export function getPublicPositions() {
  return axios.get(`${API_URL}/public/positions/`);
}

export function getColleagues() {
  return api.get('/colleagues/');
}

export function getMessages() {
  return api.get('/messages/');
}

export function createMessage(data) {
  return api.post('/messages/', data);
}

export function markMessageRead(id) {
  return api.post(`/messages/${id}/read/`, {});
}
