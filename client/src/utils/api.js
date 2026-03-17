import axios from 'axios';

const api = axios.create({
  baseURL:         'http://localhost:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Never redirect to /login from these pages
const PUBLIC = ['/', '/home', '/login', '/register', '/recruiter/register', '/recruiter/login'];

const isPublic = () =>
  PUBLIC.some(p =>
    window.location.pathname === p ||
    window.location.pathname.startsWith(p === '/' ? '/home' : p)
  );

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !isPublic()) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;