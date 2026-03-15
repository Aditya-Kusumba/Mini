import { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMe(); }, []);

  const fetchMe = async () => {
    try {
      const res = await api.get('/api/users/me');
      setUser(res.data?.data || null);
    } catch { setUser(null); }
    finally   { setLoading(false); }
  };

  const login = async (email, password) => {
    const res = await api.post('/api/users/login', { email, password });
    if (res.data?.data?.user) { setUser(res.data.data.user); return { success: true }; }
    return { success: false, message: res.data?.message };
  };

  const register = async (payload) => {
    const res = await api.post('/api/users/register', payload);
    return res.data;
  };

  const logout = async () => {
    try {
      if (user?.role === 'ADMIN') await api.post('/api/admin/logout');
      else                        await api.post('/api/users/logout');
    } catch {}
    setUser(null);
  };

  const generateOTP = async (email) =>
    (await api.post('/api/users/otp/generate', { email })).data;

  const verifyOTP = async (email, otp) =>
    (await api.post('/api/users/otp/verify', { email, otp })).data;

  const adminLogin = async (email, password) => {
    const res = await api.post('/api/admin/login', { email, password });
    if (res.data?.data?.admin) {
      setUser({ ...res.data.data.admin, role: 'ADMIN' });
      return { success: true };
    }
    return { success: false, message: res.data?.message };
  };

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated: !!user,
      login, register, logout, generateOTP, verifyOTP, adminLogin,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};