import React, { useState, useEffect, useCallback } from 'react';
import api from "../axiosConfig";
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [message, setMessage] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [mouseTransform, setMouseTransform] = useState({ transform: 'translate(0px, 0px)' });

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role : "CANDIDATE"
  });

  // State to hold validation errors for specific fields
  const [errors, setErrors] = useState({
    username: '',
    email: '',
  });

  // Debounce hook for API calls
  useEffect(() => {
    // If username is empty, don't do anything
    if (!formData.username) {
        setErrors(prev => ({ ...prev, username: '' }));
        return;
    }

    const identifier = setTimeout(async () => {
      try {
        const res = await api.post("/api/users/checkUsername", { username: formData.username });
        if (res.data.user) {
          setErrors(prev => ({ ...prev, username: 'Username is already taken.' }));
        } else {
          setErrors(prev => ({ ...prev, username: '' }));
        }
      } catch (err) {
        console.error("Username check failed:", err);
        // Optionally set an error message for API failure
      }
    }, 750); // wait 750ms after user stops typing

    return () => clearTimeout(identifier); // Cleanup: clear timeout on re-render
  }, [formData.username]);

  useEffect(() => {
    // If email is empty or invalid format, don't hit the API
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
        setErrors(prev => ({ ...prev, email: '' }));
        return;
    }

    const identifier = setTimeout(async () => {
      try {
        const res = await api.post("/api/users/checkEmail", { email: formData.email });
        if (res.data.user) {
          setErrors(prev => ({ ...prev, email: 'This email is already registered.' }));
        } else {
          setErrors(prev => ({ ...prev, email: '' }));
        }
      } catch (err) {
        console.error("Email check failed:", err);
      }
    }, 750);

    return () => clearTimeout(identifier);
  }, [formData.email]);


  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear the main message and specific field error when user starts typing
    setMessage('');
    if (errors[name]) {
        setErrors(prev => ({...prev, [name]: ''}));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for validation errors before submitting
    if (errors.username || errors.email) {
      setMessage('Please fix the errors before submitting.');
      return;
    }
    
    // Basic validation
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      setMessage('Please fill in all account details.');
      return;
    }
    
    var res = null;
    try {
      console.log(" Jo " , formData)
      res = await api.post("/api/users/register", formData);
      if(res.data.success)
        navigate('/login');
      else
        setMessage("Registration failed. Please try again.")
    } catch(err) {
      console.error("Registration failed:", err);
      setMessage('Registration failed. Please try again.');
    }
  };

  const togglePasswordVisibility = () => setIsPasswordVisible(prev => !prev);

  // Eye-tracking animation effects (unchanged)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isPasswordVisible) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const offsetX = (clientX / innerWidth - 0.5) * 20; 
      const offsetY = (clientY / innerHeight - 0.5) * 16;
      setMouseTransform({ transform: `translate(${offsetX}px, ${offsetY}px)` });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPasswordVisible]);

  useEffect(() => {
    if (isPasswordVisible) {
      setMouseTransform({ transform: 'translate(0px, 0px)' });
    }
  }, [isPasswordVisible]);
  
  const styles = `
    /* [All previous styles remain unchanged] */
    .error-message {
        color: #ef4444; /* A reddish error color */
        font-size: 0.8rem;
        margin-top: 0.25rem;
        margin-left: 0.25rem;
        min-height: 1.2rem; /* Reserve space to prevent layout shift */
    }
    .form-group {
        margin-bottom: 0; /* Adjusted to accommodate error message space */
    }
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; transition: background-color 0.3s ease; }
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(-1deg); animation-timing-function: ease-in-out; } 50% { transform: translateY(-12px) rotate(1deg); animation-timing-function: ease-in-out; } }
    @keyframes float-alt { 0%, 100% { transform: translateY(0) rotate(1deg); animation-timing-function: ease-in-out; } 50% { transform: translateY(-10px) rotate(-1deg); animation-timing-function: ease-in-out; } }
    @keyframes bounce { 0%, 100% { transform: translateY(0); animation-timing-function: ease-in-out; } 50% { transform: translateY(-12px); animation-timing-function: ease-in-out; } }
    @keyframes blink { 0%, 90%, 100% { transform: scaleY(1); } 92% { transform: scaleY(0.15); } }
    @keyframes fadeInSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInSlideRight { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
    .page-container { --bg-primary: #f3f4f6; --bg-secondary: #ffffff; --bg-tertiary: #f9fafb; --text-primary: #111827; --text-secondary: #6b7280; --text-tertiary: #374151; --border-primary: #d1d5db; --border-secondary: #e5e7eb; --accent-primary: #7c3aed; --accent-secondary: #8b5cf6; --accent-focus-ring: rgba(167, 139, 250, 0.5); --btn-primary-bg: #000; --btn-primary-text: #fff; --btn-primary-hover-bg: #1f2937; --btn-secondary-bg: #fff; --btn-secondary-text: #374151; --btn-secondary-hover-bg: #f9fafb; --shadow-color: rgba(0, 0, 0, 0.1); --google-logo-filter: invert(0); }
    .page-container[data-theme="dark"] { --bg-primary: #111827; --bg-secondary: #1f2937; --bg-tertiary: #374151; --text-primary: #f9fafb; --text-secondary: #9ca3af; --text-tertiary: #d1d5db; --border-primary: #4b5563; --border-secondary: #4b5563; --accent-primary: #a78bfa; --accent-secondary: #a78bfa; --accent-focus-ring: rgba(167, 139, 250, 0.4); --btn-primary-bg: #a78bfa; --btn-primary-text: #111827; --btn-primary-hover-bg: #8b5cf6; --btn-secondary-bg: #374151; --btn-secondary-text: #f9fafb; --btn-secondary-hover-bg: #4b5563; --shadow-color: rgba(0, 0, 0, 0.4); --google-logo-filter: invert(1); }
    .page-container { min-height: 100vh; background-color: var(--bg-primary); display: flex; align-items: center; justify-content: center; padding: 1.5rem; box-sizing: border-box; transition: background-color 0.3s ease; }
    .register-card { background-color: var(--bg-secondary); border-radius: 1rem; box-shadow: 0 20px 25px -5px var(--shadow-color), 0 8px 10px -6px var(--shadow-color); width: 100%; max-width: 64rem; overflow: hidden; display: flex; flex-direction: column; transition: background-color 0.3s ease, box-shadow 0.3s ease; }
    @media (min-width: 768px) { .register-card { flex-direction: row; } }
    .animation-panel { background-color: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; padding: 2rem; width: 100%; transition: background-color 0.3s ease; }
    .animation-panel svg { max-width: 100%; height: auto; }
    .form-panel { padding: 2.5rem; width: 100%; box-sizing: border-box; animation: fadeInSlideRight 0.6s 0.2s ease-out forwards; opacity: 0; position: relative; }
    @media (min-width: 768px) { .animation-panel, .form-panel { width: 50%; } }
    .shape-group { animation-name: fadeInSlideUp; animation-fill-mode: forwards; animation-timing-function: ease-out; opacity: 0; }
    .shape-1 { animation-duration: 0.6s; } .shape-2 { animation-duration: 0.7s; } .shape-3 { animation-duration: 0.8s; }
    .float-1 { animation: float 2.8s infinite; animation-delay: 0.0s; } .float-2 { animation: float-alt 3.2s infinite; animation-delay: 0.25s; } .float-3 { animation: bounce 2.0s infinite; animation-delay: 0.45s; } .float-4 { animation: float 3.0s infinite; animation-delay: 0.6s; }
    .blink { animation-name: blink; animation-duration: 4s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; transform-origin: center; }
    .blink-1 { animation-delay: 0.2s; } .blink-2 { animation-delay: 0.8s; } .blink-3 { animation-delay: 0.1s; } .blink-4 { animation-delay: 0.6s; } .blink-5 { animation-delay: 0.3s; } .blink-6 { animation-delay: 0.9s; }
    .eye-base { transition: transform 0.3s ease-in-out; transform-origin: center; } .eye-closed { transform: scaleY(0.1); }
    .password-wrapper { position: relative; } .password-wrapper .form-input { padding-right: 3rem; }
    .password-toggle-btn { position: absolute; top: 50%; right: 0.5rem; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; padding: 0.25rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; }
    .password-toggle-btn svg { width: 1.25rem; height: 1.25rem; }
    .form-title { font-size: 1.875rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; }
    .form-subtitle { color: var(--text-secondary); margin-bottom: 1.5rem; margin-top: 0; }
    .register-form { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-label { display: block; font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 0.25rem; }
    .form-input { width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-primary); border-radius: 0.375rem; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s; background-color: var(--bg-secondary); color: var(--text-primary); }
    .form-input::placeholder { color: var(--text-secondary); }
    .form-input:focus { outline: none; border-color: var(--accent-secondary); box-shadow: 0 0 0 2px var(--accent-focus-ring); }
    .btn { width: 100%; padding: 0.75rem; border-radius: 0.375rem; font-weight: 500; border: none; cursor: pointer; transition: background-color 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 1rem; }
    .btn-primary { background-color: var(--btn-primary-bg); color: var(--btn-primary-text); }
    .btn-primary:hover { background-color: var(--btn-primary-hover-bg); }
    .login-link { text-align: center; font-size: 0.875rem; color: var(--text-secondary); margin-top: 1.5rem; }
    .login-link a { color: var(--accent-primary); text-decoration: none; }
    .login-link a:hover { text-decoration: underline; }
    .register-message { text-align: center; margin-bottom: 1rem; color: #ef4444; font-weight: 500; }
    .theme-switch-wrapper { position: absolute; top: 1.5rem; right: 1.5rem; display: flex; align-items: center; z-index: 10;}
    .theme-switch { display: inline-block; height: 26px; position: relative; width: 50px; }
    .theme-switch input { display: none; }
    .slider { background-color: #ccc; bottom: 0; cursor: pointer; left: 0; position: absolute; right: 0; top: 0; transition: .4s; }
    .slider:before { background-color: #fff; bottom: 4px; content: ""; height: 18px; left: 4px; position: absolute; transition: .4s; width: 18px; }
    input:checked + .slider { background-color: #6C46FF; }
    input:checked + .slider:before { transform: translateX(24px); }
    .slider.round { border-radius: 34px; } .slider.round:before { border-radius: 50%; }
    .theme-switch-wrapper svg { margin: 0 8px; color: var(--text-secondary); }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="page-container" data-theme={theme}>
        <div className="register-card">
          <div className="animation-panel">
            {/* SVG Animation remains unchanged */}
            <svg viewBox="0 0 360 320" width="360" height="320" aria-label="Animated shapes illustration">
              <g className="shape-group shape-1"><g className="float-1"><path d="M40 220 A120 120 0 0 1 320 220 L320 320 L40 320 Z" fill="#FF7A3D" /><g style={mouseTransform}><circle cx="120" cy="250" r="6" fill="#111827" className={`eye-base ${isPasswordVisible ? 'eye-closed' : 'blink blink-1'}`} /><circle cx="160" cy="250" r="6" fill="#111827" className={`eye-base ${isPasswordVisible ? 'eye-closed' : 'blink blink-2'}`} /></g><path d="M112 265 Q140 285 168 265" stroke="#111827" strokeWidth="5" strokeLinecap="round" fill="none" /></g></g>
              <g className="shape-group shape-2"><g className="float-2"><rect x="100" y="24" rx="12" ry="12" width="72" height="200" fill="#6C46FF" /><g style={mouseTransform}><circle cx="136" cy="68" r="4.5" fill="#081125" className={`eye-base ${isPasswordVisible ? 'eye-closed' : 'blink blink-3'}`} /><circle cx="156" cy="68" r="4.5" fill="#081125" className={`eye-base ${isPasswordVisible ? 'eye-closed' : 'blink blink-4'}`} /></g><path d="M128 84 Q136 94 154 84" stroke="#081125" strokeWidth="3" strokeLinecap="round" fill="none" /></g></g>
              <rect x="172" y="96" rx="10" ry="10" width="46" height="160" fill="#191827" className="float-3"/>
              <g className="shape-group shape-3"><g className="float-4"><rect x="236" y="140" rx="30" ry="30" width="62" height="140" fill="#FFD23F" /><g style={mouseTransform}><circle cx="259" cy="170" r="4.5" fill="#081125" className={`eye-base ${isPasswordVisible ? 'eye-closed' : 'blink blink-5'}`} /><circle cx="287" cy="170" r="4.5" fill="#081125" className={`eye-base ${isPasswordVisible ? 'eye-closed' : 'blink blink-6'}`} /></g><path d="M260 198 Q274 212 288 198" stroke="#081125" strokeWidth="3" strokeLinecap="round" fill="none" /></g></g>
            </svg>
          </div>

          <div className="form-panel">
            <div className="theme-switch-wrapper">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                <label className="theme-switch"><input type="checkbox" onChange={toggleTheme} checked={theme === 'dark'} /><span className="slider round"></span></label>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </div>

            <h1 className="form-title">Join Us!</h1>
            <p className="form-subtitle">Create your account to get started.</p>
            {message && <p className="register-message">{message}</p>}

            <form onSubmit={handleSubmit} className="register-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required className="form-input"/>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <input id="username" type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Choose a username" required className="form-input"/>
                <p className="error-message">{errors.username || ' '}</p>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required className="form-input"/>
                 <p className="error-message">{errors.email || ' '}</p>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input id="password" type={isPasswordVisible ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" title="Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters" className="form-input"/>
                  <button type="button" onClick={togglePasswordVisibility} className="password-toggle-btn" aria-label="Toggle password visibility">
                    {isPasswordVisible ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Register</button>
            </form>

            <p className="login-link">
              Already have an account? <a href="/login">Login Here</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}