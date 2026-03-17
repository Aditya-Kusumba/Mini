import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Briefcase, Building2, AlertCircle, UserCircle, ShieldCheck } from 'lucide-react';
import api from '../../utils/api';
import './Auth.css';

export default function RecruiterRegister() {
  const navigate  = useNavigate();
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form,    setForm]    = useState({
    fullName: '', username: '', email: '', company: '', password: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/api/users/register', {
        name:        form.fullName,
        username:    form.username,
        email:       form.email,
        password:    form.password,
        role:        'RECRUITER',
        companyname: form.company,
      });
      if (res.data?.success !== false) {
        navigate('/login');
      } else {
        setError(res.data?.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const TABS = [
    { key: 'candidate', label: 'Candidate', icon: UserCircle,  to: '/register' },
    { key: 'admin',     label: 'Admin',     icon: ShieldCheck,  to: '/login' },
    { key: 'recruiter', label: 'Recruiter', icon: Briefcase,    to: null },
  ];

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
          {TABS.map(({ key, label, icon: Icon, to }) => (
            <button
              key={key}
              className={`auth-role-tab${key === 'recruiter' ? ' active' : ''}`}
              onClick={() => to && navigate(to)}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        <h1 className="auth-heading">Create recruiter account</h1>
        <p className="auth-desc">
          Already have one? <Link to="/login">Sign in →</Link>
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Full name */}
          <div className="field">
            <label className="field-label">Full name</label>
            <div className="field-input-wrap">
              <span className="field-ico"><User size={14} /></span>
              <input className="field-input" placeholder="Jane Smith"
                value={form.fullName} onChange={e => set('fullName', e.target.value)}
                autoComplete="name" required />
            </div>
          </div>

          {/* Username */}
          <div className="field">
            <label className="field-label">Username</label>
            <div className="field-input-wrap">
              <span className="field-ico"><User size={14} /></span>
              <input className="field-input" placeholder="jane_smith"
                value={form.username}
                onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                autoComplete="username" required />
            </div>
          </div>

          {/* Company */}
          <div className="field">
            <label className="field-label">Company name</label>
            <div className="field-input-wrap">
              <span className="field-ico"><Building2 size={14} /></span>
              <input className="field-input" placeholder="Acme Corp"
                value={form.company} onChange={e => set('company', e.target.value)}
                required />
            </div>
          </div>

          {/* Email */}
          <div className="field">
            <label className="field-label">Work email</label>
            <div className="field-input-wrap">
              <span className="field-ico"><Mail size={14} /></span>
              <input className="field-input" type="email" placeholder="jane@acme.com"
                value={form.email} onChange={e => set('email', e.target.value)}
                autoComplete="email" required />
            </div>
          </div>

          {/* Password */}
          <div className="field">
            <label className="field-label">Password</label>
            <div className="field-input-wrap">
              <span className="field-ico"><Lock size={14} /></span>
              <input className="field-input" type={showPw ? 'text' : 'password'}
                placeholder="Min 8 characters"
                value={form.password} onChange={e => set('password', e.target.value)}
                autoComplete="new-password" required minLength={8} />
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
            {loading ? <span className="btn-spinner" /> : 'Create recruiter account'}
          </button>
        </form>
      </div>
    </div>
  );
}