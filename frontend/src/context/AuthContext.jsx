import { createContext, useContext, useState, useEffect } from 'react';
import api, { getToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api('/auth/me')
      .then((data) => setUser(data))
      .catch(() => localStorage.removeItem('shoppy_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const form = new FormData();
    form.append('username', email);
    form.append('password', password);
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/auth/login`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const err = new Error('Login failed');
      err.status = res.status;
      try { err.body = await res.json(); } catch { err.body = null; }
      throw err;
    }
    const { access_token } = await res.json();
    localStorage.setItem('shoppy_token', access_token);
    const me = await api('/auth/me');
    setUser(me);
    return me;
  };

  const register = async (email, fullName, password) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, full_name: fullName || null, password }),
    });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('shoppy_token');
    setUser(null);
  };

  const updateProfile = async (updates) => {
    const data = await api('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setUser(data);
    return data;
  };

  const deleteAccount = async () => {
    await api('/auth/me', { method: 'DELETE' });
    logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
