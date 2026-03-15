import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [form,    setForm]    = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await adminLogin(form.email, form.password);
      if (res?.success) navigate('/admin/dashboard');
      else setError(res?.message || 'Invalid credentials');
    } catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-root">
      <div className="auth-brand" style={{ background: '#0f0f0d' }}>
        <div className="auth-ring" style={{ borderColor: 'rgba(255,255,255,.05)' }} />
        <div className="auth-brand-logo" style={{ color: 'var(--accent)' }}>Commit2Code</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <ShieldCheck size={26} color="var(--accent)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: '#555', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
            Admin Portal
          </span>
        </div>

        <h1 className="auth-brand-headline" style={{ color: '#f0efe8' }}>Manage your<br />college panel.</h1>
        <p className="auth-brand-sub">View analytics, assign domains, compute placement scores, and track student readiness.</p>
      </div>

      <div className="auth-panel">
        <div className="auth-wrap">
          <h2 className="auth-title">Admin sign in</h2>
          <p className="auth-sub"><Link to="/login">← Back to candidate login</Link></p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Admin email</label>
              <div className="input-wrap">
                <Mail className="ico" size={15} />
                <input className="input" type="email" placeholder="admin@college.ac.in"
                  value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <div className="input-wrap">
                <Lock className="ico" size={15} />
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="Your password"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" className="input-eye" onClick={() => setShowPw(s => !s)}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="btn btn-primary btn-full auth-btn" disabled={loading}>
              {loading ? <span className="loading-spinner" /> : 'Sign in to admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}