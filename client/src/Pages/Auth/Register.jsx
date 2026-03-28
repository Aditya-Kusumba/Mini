import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, Check, AtSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

function scorePassword(pw) {
  let s = 0;
  if (pw.length >= 8)         s++;
  if (pw.length >= 12)        s++;
  if (/[A-Z]/.test(pw))       s++;
  if (/[0-9]/.test(pw))       s++;
  if (/[^A-Za-z0-9]/.test(pw))s++;
  return s;
}
const STRENGTH = [
  { label: '',          color: 'transparent', w: '0%'   },
  { label: 'Too weak',  color: '#ef4444',     w: '20%'  },
  { label: 'Weak',      color: '#f97316',     w: '40%'  },
  { label: 'Fair',      color: '#eab308',     w: '60%'  },
  { label: 'Good',      color: '#22c55e',     w: '80%'  },
  { label: 'Strong',    color: '#16a34a',     w: '100%' },
];

export default function Register() {
  const navigate = useNavigate();
  const { register, generateOTP, verifyOTP, login } = useAuth();

  const [step,      setStep]     = useState(1);
  const [showPw,    setShowPw]   = useState(false);
  const [loading,   setLoading]  = useState(false);
  const [error,     setError]    = useState('');
  const [resendCd,  setResendCd] = useState(0);
  const [form,      setForm]     = useState({ fullName: '', username: '', email: '', password: '' });
  const [otp,       setOtp]      = useState(Array(6).fill(''));
  const inputRefs = useRef([]);
  const cdRef     = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const pwScore  = scorePassword(form.password);
  const strength = STRENGTH[Math.min(pwScore, 5)];

  /* ── Step 1: register ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await register({
        name: form.fullName, username: form.username,
        email: form.email,   password: form.password, role: 'CANDIDATE',
      });
      if (res?.success === false) { setError(res?.message || 'Registration failed'); return; }
      await sendOTP();
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  /* ── OTP helpers ── */
  const sendOTP = async () => {
    await generateOTP(form.email);
    startCd();
  };
  const startCd = () => {
    setResendCd(60);
    clearInterval(cdRef.current);
    cdRef.current = setInterval(() => {
      setResendCd(c => { if (c <= 1) { clearInterval(cdRef.current); return 0; } return c - 1; });
    }, 1000);
  };

  const handleOtpChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp]; next[i] = v; setOtp(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
    if (v && i === 5) verifyCode([...next].join(''));
  };
  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft'  && i > 0) inputRefs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) inputRefs.current[i + 1]?.focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) verifyCode(pasted);
  };

  /* ── Step 2: verify OTP then auto-login → profile ── */
  const verifyCode = async (code) => {
    if (loading || code.length < 6) return;
    setError(''); setLoading(true);
    try {
      const res = await verifyOTP(form.email, code);
      if (res?.success) {
        // Auto-login after verify
        try {
          await login(form.email, form.password);
        } catch { /* if auto-login fails, let them log in manually */ }
        // Redirect to profile setup
        navigate('/profile/setup');
      } else {
        setError(res?.message || 'Invalid code');
        setOtp(Array(6).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleVerifyClick = () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter all 6 digits'); return; }
    verifyCode(code);
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

        {/* Step indicator pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {['Account details', 'Verify email'].map((label, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 500,
              color: step === i + 1 ? 'var(--text)' : step > i + 1 ? 'var(--green)' : 'var(--text-3)',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700,
                background: step === i + 1 ? 'var(--accent)' : step > i + 1 ? 'var(--green-bg)' : 'var(--bg-2)',
                border: `1.5px solid ${step === i + 1 ? 'var(--accent)' : step > i + 1 ? 'var(--green)' : 'var(--border)'}`,
                color: step === i + 1 ? '#fff' : step > i + 1 ? 'var(--green)' : 'var(--text-3)',
              }}>
                {step > i + 1 ? <Check size={10}/> : i + 1}
              </div>
              {label}
              {i < 1 && <span style={{ color: 'var(--border-2)', margin: '0 2px' }}>→</span>}
            </div>
          ))}
        </div>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <h1 className="auth-heading">Create your account</h1>
            <p className="auth-desc">Already have one? <Link to="/login">Sign in →</Link></p>

            <form className="auth-form" onSubmit={handleRegister}>
              <div className="field">
                <label className="field-label">Full name</label>
                <div className="field-input-wrap">
                  <span className="field-ico"><User size={14} /></span>
                  <input className="field-input" placeholder="Manas Kumar"
                    value={form.fullName} onChange={e => set('fullName', e.target.value)}
                    autoComplete="name" required />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Username</label>
                <div className="field-input-wrap">
                  <span className="field-ico"><AtSign size={14} /></span>
                  <input className="field-input" placeholder="john doe"
                    value={form.username}
                    onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                    autoComplete="username" required />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Email address</label>
                <div className="field-input-wrap">
                  <span className="field-ico"><Mail size={14} /></span>
                  <input className="field-input" type="email" placeholder="john@example.com"
                    value={form.email} onChange={e => set('email', e.target.value)}
                    autoComplete="email" required />
                </div>
              </div>

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
                {form.password && (
                  <div className="pw-strength">
                    <div className="pw-bar">
                      <div className="pw-fill" style={{ width: strength.w, background: strength.color }} />
                    </div>
                    <span className="pw-label" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>

              {error && <div className="auth-banner error"><AlertCircle size={14} /> {error}</div>}

              <button type="submit" className="auth-submit" disabled={loading || pwScore < 2}>
                {loading ? <span className="btn-spinner" /> : 'Continue →'}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 2 && (
          <>
            <h1 className="auth-heading">Check your inbox</h1>
            <p className="auth-desc" style={{ marginBottom: 20 }}>
              Enter the 6-digit code we sent to
            </p>

            <div className="otp-wrap">
              <div className="otp-email-badge">
                <Mail size={13} /> {form.email}
              </div>

              <div className="otp-boxes" onPaste={handlePaste}>
                {otp.map((d, i) => (
                  <input key={i}
                    ref={el => inputRefs.current[i] = el}
                    className={`otp-box${d ? ' filled' : ''}`}
                    value={d} maxLength={1} inputMode="numeric"
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    autoFocus={i === 0}
                    disabled={loading}
                  />
                ))}
              </div>

              {error && <div className="auth-banner error" style={{ marginBottom: 14 }}><AlertCircle size={14} /> {error}</div>}

              <button className="auth-submit" onClick={handleVerifyClick}
                disabled={loading || otp.join('').length < 6}>
                {loading
                  ? <><span className="btn-spinner" /> Verifying…</>
                  : 'Verify email'
                }
              </button>

              <p className="otp-resend">
                Didn't receive it?{' '}
                <button onClick={sendOTP} disabled={resendCd > 0}>
                  {resendCd > 0 ? `Resend in ${resendCd}s` : 'Resend code'}
                </button>
              </p>

              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 12, cursor: 'pointer', marginTop: 14, fontFamily: 'inherit', display: 'block', margin: '14px auto 0' }}
                onClick={() => { setStep(1); setError(''); setOtp(Array(6).fill('')); }}
              >
                ← Change email address
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}