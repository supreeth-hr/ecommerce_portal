const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function getToken() {
  return localStorage.getItem('shoppy_token');
}

export async function api(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = new Error(res.statusText || 'Request failed');
    err.status = res.status;
    try { err.body = await res.json(); } catch { err.body = null; }
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export function apiForm(endpoint, formData, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(url, { method: 'POST', body: formData, headers, ...options });
}

export default api;
