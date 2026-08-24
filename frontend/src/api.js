import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export function getMe(token) {
  return axios.get(`${API_URL}/me/`, { headers: authHeaders(token) });
}

export function changePassword(token, data) {
  return axios.post(`${API_URL}/me/change-password/`, data, {
    headers: authHeaders(token),
  });
}

export function getTasks(token) {
  return axios.get(`${API_URL}/tasks/`, { headers: authHeaders(token) });
}

export function createTask(token, data) {
  return axios.post(`${API_URL}/tasks/`, data, { headers: authHeaders(token) });
}

export function updateTask(token, id, data) {
  return axios.patch(`${API_URL}/tasks/${id}/`, data, { headers: authHeaders(token) });
}

export function deleteTask(token, id) {
  return axios.delete(`${API_URL}/tasks/${id}/`, { headers: authHeaders(token) });
}

export function getUsers(token) {
  return axios.get(`${API_URL}/users/`, { headers: authHeaders(token) });
}

export function createUser(token, data) {
  return axios.post(`${API_URL}/users/`, data, { headers: authHeaders(token) });
}

export function updateUser(token, id, data) {
  return axios.patch(`${API_URL}/users/${id}/`, data, { headers: authHeaders(token) });
}

export function deleteUser(token, id) {
  return axios.delete(`${API_URL}/users/${id}/`, { headers: authHeaders(token) });
}

export function getDepartments(token) {
  return axios.get(`${API_URL}/departments/`, { headers: authHeaders(token) });
}

export function createDepartment(token, data) {
  return axios.post(`${API_URL}/departments/`, data, { headers: authHeaders(token) });
}

export function updateDepartment(token, id, data) {
  return axios.patch(`${API_URL}/departments/${id}/`, data, { headers: authHeaders(token) });
}

export function deleteDepartment(token, id) {
  return axios.delete(`${API_URL}/departments/${id}/`, { headers: authHeaders(token) });
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
