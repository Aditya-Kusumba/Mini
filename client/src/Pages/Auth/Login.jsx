import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, ShieldCheck, Briefcase, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const ROLES = [
  { key: 'candidate', label: 'Candidate', icon: User },
  { key: 'admin',     label: 'Admin',     icon: ShieldCheck },
  { key: 'recruiter', label: 'College Admin', icon: Briefcase },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, adminLogin } = useAuth();
  const [role,    setRole]    = useState('candidate');
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form,    setForm]    = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (role === 'candidate') {
        const res = await login(form.email, form.password);
        if (res?.success) navigate('/dashboard');
        else setError(res?.message || 'Invalid credentials');

      } else if (role === 'admin') {
        const res = await adminLogin(form.email, form.password);
        if (res?.success) navigate('/admin/dashboard');
        else setError(res?.message || 'Invalid admin credentials');

      } else if (role === 'recruiter') {
        // recruiter uses same login endpoint, role stored in token
        const res = await login(form.email, form.password);
        if (res?.success) navigate('/recruiter/dashboard');
        else setError(res?.message || 'Invalid recruiter credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const headings = {
    candidate: { title: 'Sign in',       desc: 'Continue your learning journey.' },
    admin:     { title: 'Admin sign in',  desc: 'Access your panel.' },
    recruiter: { title: 'College Admin', desc: 'Find top candidates.' },
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <Link to="/" className="auth-logo">
          <div className="auth-logo-mark">
            <svg viewBox="0 0 18 18" fill="none">
              <path d="M2 14L9 4l7 10H2z" fill="white" opacity=".9"/>
              <circle cx="9" cy="12" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="auth-logo-name">Commit2Code</span>
        </Link>

        {/* Role tabs */}
        <div className="auth-role-tabs">
          {ROLES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`auth-role-tab${role === key ? ' active' : ''}`}
              onClick={() => { setRole(key); setError(''); }}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <h1 className="auth-heading">{headings[role].title}</h1>
        <p className="auth-desc">
          {headings[role].desc}{' '}
          {/* {role === 'candidate' && <><Link to="/register">Create account →</Link></>}
          {role === 'recruiter' && <><Link to="/recruiter/register">Register →</Link></>} */}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label">Email address</label>
            <div className="field-input-wrap">
              <span className="field-ico"><Mail size={14} /></span>
              <input className="field-input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email" required />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <div className="field-input-wrap">
              <span className="field-ico"><Lock size={14} /></span>
              <input className="field-input" type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                autoComplete="current-password" required />
              <button type="button" className="field-eye" onClick={() => setShowPw(s => !s)}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-banner error">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : `Sign in as ${ROLES.find(r => r.key === role)?.label}`}
          </button>
        </form>

        {role === 'candidate' && (
          <div className="auth-footer">
            <Link to="/register" className="auth-footer-link">
              <User size={13} /> Create account
            </Link>
          </div>
        )}
        {role === 'recruiter' && (
          <div className="auth-footer">
            <Link to="/recruiter/register" className="auth-footer-link">
              <Briefcase size={13} /> Register as College Admin
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}