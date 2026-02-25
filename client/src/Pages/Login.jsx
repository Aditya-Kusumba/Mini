import React, { useState, useEffect } from 'react';
import api from '../axiosConfig';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  // State for managing the current theme ('light' or 'dark')
  const [theme, setTheme] = useState('light');
  // State to manage login messages, replacing the alert()

  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState('');
  // State for password visibility
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // State for eye movement based on mouse position
  const [mouseTransform, setMouseTransform] = useState({ transform: 'translate(0px, 0px)' });

  // Toggles the theme between 'light' and 'dark'
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Effect to handle mouse tracking for eye animation
  useEffect(() => {
    const handleMouseMove = (e) => {
      // When password is shown, eyes are closed and don't move
      if (isPasswordVisible) return;

      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      // Calculate a more pronounced offset for the eyes to follow the cursor
      const offsetX = (clientX / innerWidth - 0.5) * 20; 
      const offsetY = (clientY / innerHeight - 0.5) * 16;
      setMouseTransform({ transform: `translate(${offsetX}px, ${offsetY}px)` });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup listener on component unmount
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPasswordVisible]); // Rerun effect when password visibility changes

  // This effect specifically handles resetting the eye position to center when the password is shown
  useEffect(() => {
    if (isPasswordVisible) {
      setMouseTransform({ transform: 'translate(0px, 0px)' });
    }
  }, [isPasswordVisible]);

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Instead of an alert, we'll show a message on the UI
    const res = await api.post("/api/users/login", {"credential" : credential, "password" : password, role : "CANDIDATE"});
    console.log(res.data.data.user.cvUrl);
    console.log(res.data.data.user);
    if(res.data.success==true){
      if(res.data.data.user.cvUrl!=undefined)
      navigate("/dashboard");
      else
        navigate("/updateDashboard");
      setMessage('Login successful!');
    }
    else{
      setMessage("Error while logging in");
    }

    // You could add actual login logic here
  };

  // Toggles the visibility of the password field
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prevState => !prevState);
  };

  // The CSS is embedded within the component as a template literal.
  const styles = `
    /* General body styling and font import */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      transition: background-color 0.3s ease;
    }

    /* Keyframe animations */
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(-1deg); animation-timing-function: ease-in-out; }
      50% { transform: translateY(-12px) rotate(1deg); animation-timing-function: ease-in-out; }
    }
    @keyframes float-alt {
      0%, 100% { transform: translateY(0) rotate(1deg); animation-timing-function: ease-in-out; }
      50% { transform: translateY(-10px) rotate(-1deg); animation-timing-function: ease-in-out; }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); animation-timing-function: ease-in-out; }
      50% { transform: translateY(-12px); animation-timing-function: ease-in-out; }
    }
    @keyframes blink {
      0%, 90%, 100% { transform: scaleY(1); }
      92% { transform: scaleY(0.15); }
    }
    @keyframes fadeInSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInSlideRight {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }

    /* --- Theme Variables --- */
    .page-container {
      /* Light Theme (Default) */
      --bg-primary: #f3f4f6;
      --bg-secondary: #ffffff;
      --bg-tertiary: #f9fafb;
      --text-primary: #111827;
      --text-secondary: #6b7280;
      --text-tertiary: #374151;
      --border-primary: #d1d5db;
      --border-secondary: #e5e7eb;
      --accent-primary: #7c3aed;
      --accent-secondary: #8b5cf6;
      --accent-focus-ring: rgba(167, 139, 250, 0.5);
      --btn-primary-bg: #000;
      --btn-primary-text: #fff;
      --btn-primary-hover-bg: #1f2937;
      --btn-secondary-bg: #fff;
      --btn-secondary-text: #374151;
      --btn-secondary-hover-bg: #f9fafb;
      --shadow-color: rgba(0, 0, 0, 0.1);
      --google-logo-filter: invert(0);
    }

    .page-container[data-theme="dark"] {
      /* Dark Theme */
      --bg-primary: #111827;
      --bg-secondary: #1f2937;
      --bg-tertiary: #374151;
      --text-primary: #f9fafb;
      --text-secondary: #9ca3af;
      --text-tertiary: #d1d5db;
      --border-primary: #4b5563;
      --border-secondary: #4b5563;
      --accent-primary: #a78bfa;
      --accent-secondary: #a78bfa;
      --accent-focus-ring: rgba(167, 139, 250, 0.4);
      --btn-primary-bg: #a78bfa;
      --btn-primary-text: #111827;
      --btn-primary-hover-bg: #8b5cf6;
      --btn-secondary-bg: #374151;
      --btn-secondary-text: #f9fafb;
      --btn-secondary-hover-bg: #4b5563;
      --shadow-color: rgba(0, 0, 0, 0.4);
      --google-logo-filter: invert(1);
    }
    
    /* Main container for the whole page */
    .page-container {
      min-height: 100vh;
      background-color: var(--bg-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      box-sizing: border-box;
      transition: background-color 0.3s ease;
    }

    /* The white card container */
    .login-card {
      background-color: var(--bg-secondary);
      border-radius: 1rem;
      box-shadow: 0 20px 25px -5px var(--shadow-color), 0 8px 10px -6px var(--shadow-color);
      width: 100%;
      max-width: 64rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: background-color 0.3s ease, box-shadow 0.3s ease;
    }
    @media (min-width: 768px) { .login-card { flex-direction: row; } }

    /* Left panel with animated shapes */
    .animation-panel {
      background-color: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      width: 100%;
      transition: background-color 0.3s ease;
    }
    .animation-panel svg { max-width: 100%; height: auto; }

    /* Right panel with the login form */
    .form-panel {
      padding: 2.5rem;
      width: 100%;
      box-sizing: border-box;
      animation: fadeInSlideRight 0.6s 0.2s ease-out forwards;
      opacity: 0;
      position: relative;
    }

    @media (min-width: 768px) {
      .animation-panel, .form-panel { width: 50%; }
    }
    
    /* Applying animations to SVG elements */
    .shape-group { animation-name: fadeInSlideUp; animation-fill-mode: forwards; animation-timing-function: ease-out; opacity: 0; }
    .shape-1 { animation-duration: 0.6s; }
    .shape-2 { animation-duration: 0.7s; }
    .shape-3 { animation-duration: 0.8s; }
    .float-1 { animation: float 2.8s infinite; animation-delay: 0.0s; }
    .float-2 { animation: float-alt 3.2s infinite; animation-delay: 0.25s; }
    .float-3 { animation: bounce 2.0s infinite; animation-delay: 0.45s; }
    .float-4 { animation: float 3.0s infinite; animation-delay: 0.6s; }

    .blink { animation-name: blink; animation-duration: 4s; animation-iteration-count: infinite; animation-timing-function: ease-in-out; transform-origin: center; }
    .blink-1 { animation-delay: 0.2s; } .blink-2 { animation-delay: 0.8s; } .blink-3 { animation-delay: 0.1s; } .blink-4 { animation-delay: 0.6s; } .blink-5 { animation-delay: 0.3s; } .blink-6 { animation-delay: 0.9s; }
    
    .eye-base { transition: transform 0.3s ease-in-out; transform-origin: center; }
    .eye-closed { transform: scaleY(0.1); }
    .password-wrapper { position: relative; }
    .password-wrapper .form-input { padding-right: 3rem; }

    .password-toggle-btn {
      position: absolute; top: 50%; right: 0.5rem; transform: translateY(-50%);
      background: transparent; border: none; cursor: pointer; padding: 0.25rem;
      color: var(--text-secondary); display: flex; align-items: center; justify-content: center;
    }
    .password-toggle-btn svg { width: 1.25rem; height: 1.25rem; }
    
    /* Form styling */
    .form-title { font-size: 1.875rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; }
    .form-subtitle { color: var(--text-secondary); margin-bottom: 1.5rem; margin-top: 0; }
    .login-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { margin-bottom: 0.5rem; }
    .form-label { display: block; font-size: 0.875rem; color: var(--text-tertiary); margin-bottom: 0.25rem; }

    .form-input {
      width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-primary);
      border-radius: 0.375rem; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;
      background-color: var(--bg-secondary); color: var(--text-primary);
    }
    .form-input::placeholder { color: var(--text-secondary); }
    .form-input:focus {
      outline: none; border-color: var(--accent-secondary);
      box-shadow: 0 0 0 2px var(--accent-focus-ring);
    }
    
    .form-options { display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; }
    .remember-me { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--text-tertiary); }
    .remember-me input[type="checkbox"] { accent-color: var(--accent-secondary); }
    .forgot-password { color: var(--accent-primary); text-decoration: none; }
    .forgot-password:hover { text-decoration: underline; }
    
    .btn {
      width: 100%; padding: 0.75rem; border-radius: 0.375rem; font-weight: 500;
      border: none; cursor: pointer; transition: background-color 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 0.75rem;
    }
    
    .btn-primary { background-color: var(--btn-primary-bg); color: var(--btn-primary-text); }
    .btn-primary:hover { background-color: var(--btn-primary-hover-bg); }

    .btn-secondary { background-color: var(--btn-secondary-bg); color: var(--btn-secondary-text); border: 1px solid var(--border-secondary); }
    .btn-secondary:hover { background-color: var(--btn-secondary-hover-bg); }
    .btn-secondary img { width: 1.25rem; height: 1.25rem; filter: var(--google-logo-filter); }
    
    .signup-link { text-align: center; font-size: 0.875rem; color: var(--text-secondary); }
    .signup-link a { color: var(--accent-primary); text-decoration: none; }
    .signup-link a:hover { text-decoration: underline; }
    .login-message { text-align: center; margin-bottom: 1rem; color: var(--accent-primary); font-weight: 500; transition: opacity 0.3s; }
    
    /* --- Theme Toggle Switch --- */
    .theme-switch-wrapper { position: absolute; top: 1.5rem; right: 1.5rem; display: flex; align-items: center; }
    .theme-switch { display: inline-block; height: 26px; position: relative; width: 50px; }
    .theme-switch input { display: none; }
    .slider {
      background-color: #ccc; bottom: 0; cursor: pointer; left: 0; position: absolute;
      right: 0; top: 0; transition: .4s;
    }
    .slider:before {
      background-color: #fff; bottom: 4px; content: ""; height: 18px; left: 4px;
      position: absolute; transition: .4s; width: 18px;
    }
    input:checked + .slider { background-color: #6C46FF; }
    input:checked + .slider:before { transform: translateX(24px); }
    .slider.round { border-radius: 34px; }
    .slider.round:before { border-radius: 50%; }
    .theme-switch-wrapper svg { margin: 0 8px; color: var(--text-secondary); }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="page-container" data-theme={theme}>
        <div className="login-card">
          {/* LEFT - Animated Shapes */}
          <div className="animation-panel">
            <svg viewBox="0 0 360 320" width="360" height="320" aria-label="Animated shapes illustration">
              {/* Orange semicircle */}
              <g className="shape-group shape-1">
                <g className="float-1">
                  <path d="M40 220 A120 120 0 0 1 320 220 L320 320 L40 320 Z" fill="#FF7A3D" />
                  <g style={mouseTransform}>
                    <circle cx="120" cy="250" r="6" fill="#111827" className={`eye-base ${isPasswordVisible ? 'eye-closed' : 'blink blink-1'}`} />
                    <circle cx="160" cy="250" r="6" fill="#111827" className={`eye-base ${isPasswordVisible ? 'eye-closed' : 'blink blink-2'}`} />
                  </g>
                  <path d="M112 265 Q140 285 168 265" stroke="#111827" strokeWidth="5" strokeLinecap="round" fill="none" />
                </g>
              </g>

              {/* Purple tall rectangle */}
              <g className="shape-group shape-2">
                <g className="float-2">
                  <rect x="100" y="24" rx="12" ry="12" width="72" height="200" fill="#6C46FF" />
                  <g style={mouseTransform}>
                    <circle cx="136" cy="68" r="4.5" fill="#081125" className={`eye-base ${isPasswordVisible ? 'eye-closed' : 'blink blink-3'}`} />
                    <circle cx="156" cy="68" r="4.5" fill="#081125" className={`eye-base ${isPasswordVisible ? 'eye-closed' : 'blink blink-4'}`} />
                  </g>
                  <path d="M128 84 Q136 94 154 84" stroke="#081125" strokeWidth="3" strokeLinecap="round" fill="none" />
                </g>
              </g>

              {/* Black middle bar */}
              <rect x="172" y="96" rx="10" ry="10" width="46" height="160" fill="#191827" className="float-3"/>

              {/* Yellow pill */}
              <g className="shape-group shape-3">
                <g className="float-4">
                  <rect x="236" y="140" rx="30" ry="30" width="62" height="140" fill="#FFD23F" />
                  <g style={mouseTransform}>
                    <circle cx="259" cy="170" r="4.5" fill="#081125" className={`eye-base ${isPasswordVisible ? 'eye-closed' : 'blink blink-5'}`} />
                    <circle cx="287" cy="170" r="4.5" fill="#081125" className={`eye-base ${isPasswordVisible ? 'eye-closed' : 'blink blink-6'}`} />
                  </g>
                  <path d="M260 198 Q274 212 288 198" stroke="#081125" strokeWidth="3" strokeLinecap="round" fill="none" />
                </g>
              </g>
            </svg>
          </div>

          {/* RIGHT - Login Form */}
          <div className="form-panel">
            <div className="theme-switch-wrapper">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                <label className="theme-switch">
                  <input type="checkbox" onChange={toggleTheme} checked={theme === 'dark'} />
                  <span className="slider round"></span>
                </label>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </div>

            <h1 className="form-title">Welcome back!</h1>
            <p className="form-subtitle">Please enter your details</p>

            {message && <p className="login-message">{message}</p>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input id="email" type="string" placeholder="Enter your email" required className="form-input" value={credential} onChange={(e)=>setCredential(e.target.value)}/>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    className="form-input"
                     value={password} onChange={(e)=>setPassword(e.target.value)}
                  />
                  <button type="button" onClick={togglePasswordVisibility} className="password-toggle-btn" aria-label="Toggle password visibility">
                    {isPasswordVisible ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Remember for 30 days</span>
                </label>
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>

              <button type="submit" className="btn btn-primary">Log In</button>
              <button type="button" className="btn btn-secondary">
                <img src="https://www.svgrepo.com/show/355037/google.svg" alt="Google" />
                <span>Log in with Google</span>
              </button>

              <p className="signup-link">
                Don't have an account?{" "}
                <a href="#">Sign Up</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}