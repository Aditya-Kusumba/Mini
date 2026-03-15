import api from '../axiosConfig';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// For this single-file component, all styles are defined here.
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

    :root {
      --primary-color-light: #6a5af9;
      --primary-color-dark: #7b6ef1;
      --background-color-light: #f0f2f5;
      --background-color-dark: #121212;
      --form-bg-light: #ffffff;
      --form-bg-dark: #1e1e1e;
      --text-color-light: #333;
      --text-color-dark: #e0e0e0;
      --input-bg-light: #f0f0f0;
      --input-bg-dark: #2a2a2a;
      --input-text-light: #555;
      --input-text-dark: #ccc;
      --border-color-light: #ddd;
      --border-color-dark: #444;
      --shadow-light: 0 10px 25px rgba(0, 0, 0, 0.1);
      --shadow-dark: 0 10px 25px rgba(0, 0, 0, 0.3);
      --toggle-bg-light: #ccc;
      --toggle-bg-dark: #444;
      --toggle-slider-light: #fff;
      --toggle-slider-dark: #121212;

      /* Mascot Colors - Formal Palette */
      --mascot-body-light: #A9B4C2; /* Cool Grey */
      --mascot-body-dark: #7F8C9B;
      --mascot-accent-light: #8E9AAF; /* Accent Grey */
      --mascot-accent-dark: #6C7A89;
      --eye-bg: #fff;
      --pupil-color: #2c3e50; /* Deep Blue/Black */
    }

    body {
      margin: 0;
      font-family: 'Poppins', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      transition: background-color 0.4s ease;
      overflow: hidden; /* Prevents scrollbars during animations */
    }

    body.light {
      background-color: var(--background-color-light);
      color: var(--text-color-light);
    }

    body.dark {
      background-color: var(--background-color-dark);
      color: var(--text-color-dark);
    }

    .auth-container {
      position: relative;
      width: 400px;
      padding: 20px 40px 40px 40px;
      border-radius: 20px;
      transition: background-color 0.4s ease, box-shadow 0.4s ease;
      overflow: visible; /* Allow mascot to pop out */
      animation: fadeIn 0.8s ease-out;
      text-align: center;
    }

    .light .auth-container {
      background-color: var(--form-bg-light);
      box-shadow: var(--shadow-light);
    }

    .dark .auth-container {
      background-color: var(--form-bg-dark);
      box-shadow: var(--shadow-dark);
    }
    
    .mascot-container {
        width: 180px;
        height: 100px;
        margin: -80px auto 10px;
        position: relative;
        z-index: 10;
    }

    .mascot {
        width: 100%;
        height: auto;
        transform-origin: bottom center;
        animation: bob 6s ease-in-out infinite;
    }
    
    @keyframes bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
    }

    .pupil {
        transition: transform 0.2s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .auth-form h2 {
      margin-bottom: 25px;
      font-size: 2rem;
      text-align: center;
      font-weight: 600;
      animation: slideDown 0.6s ease-out;
    }

    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-30px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .input-group {
      position: relative;
      margin-bottom: 25px;
    }

    .input-group input {
      width: 100%;
      padding: 12px 15px;
      border: 1px solid var(--border-color-light);
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    .light .input-group input {
        background-color: var(--input-bg-light);
        color: var(--input-text-light);
        border-color: var(--border-color-light);
    }
    
    .dark .input-group input {
        background-color: var(--input-bg-dark);
        color: var(--input-text-dark);
        border-color: var(--border-color-dark);
    }

    .input-group input:focus {
      outline: none;
      border-color: var(--primary-color-light);
      box-shadow: 0 0 0 3px rgba(106, 90, 249, 0.3);
    }

    .dark .input-group input:focus {
        border-color: var(--primary-color-dark);
        box-shadow: 0 0 0 3px rgba(123, 110, 241, 0.3);
    }

    .auth-button {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      background: linear-gradient(45deg, #6a5af9, #d669de);
      background-size: 200% 200%;
      animation: gradientShift 5s ease infinite;
    }

    @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    .auth-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 15px rgba(106, 90, 249, 0.4);
    }

    .toggle-text {
      text-align: center;
      margin-top: 20px;
    }

    .toggle-text a {
      cursor: pointer;
      font-weight: 500;
      text-decoration: none;
    }
    .light .toggle-text a {
        color: var(--primary-color-light);
    }
    .dark .toggle-text a {
        color: var(--primary-color-dark);
    }

    /* Theme Toggle Switch */
    .theme-switch-wrapper { position: absolute; top: 20px; right: 20px; display: flex; align-items: center; }
    .theme-switch { display: inline-block; height: 24px; position: relative; width: 50px; }
    .theme-switch input { display:none; }
    .slider { background-color: var(--toggle-bg-light); bottom: 0; cursor: pointer; left: 0; position: absolute; right: 0; top: 0; transition: .4s; }
    .dark .slider { background-color: var(--toggle-bg-dark); }
    .slider:before { background-color: var(--toggle-slider-light); bottom: 4px; content: ""; height: 16px; left: 4px; position: absolute; transition: .4s; width: 16px; }
    .dark .slider:before { background-color: var(--toggle-slider-dark); }
    input:checked + .slider { background-color: var(--primary-color-light); }
    .dark input:checked + .slider { background-color: var(--primary-color-dark); }
    input:checked + .slider:before { transform: translateX(26px); }
    .slider.round { border-radius: 34px; }
    .slider.round:before { border-radius: 50%; }
  `}</style>
);

const ThemeToggle = ({ theme, toggleTheme }) => (
  <div className="theme-switch-wrapper">
    <label className="theme-switch" htmlFor="checkbox">
      <input type="checkbox" id="checkbox" onChange={toggleTheme} checked={theme === 'dark'} />
      <div className="slider round"></div>
    </label>
  </div>
);

const AnimatedMascot = ({ theme, isPeeking }) => {
    const mascotRef = useRef(null);
    const bodyColor = theme === 'light' ? 'var(--mascot-body-light)' : 'var(--mascot-body-dark)';
    const accentColor = theme === 'light' ? 'var(--mascot-accent-light)' : 'var(--mascot-accent-dark)';

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!mascotRef.current) return;

            const pupils = mascotRef.current.querySelectorAll('.pupil');
            const eyeRadius = 25;
            const pupilRadius = 10;
            const maxPupilMove = eyeRadius - pupilRadius;

            pupils.forEach(pupil => {
                const eye = pupil.closest('g.eye');
                const rekt = eye.getBoundingClientRect();
                const eyeX = rekt.left + rekt.width / 2;
                const eyeY = rekt.top + rekt.height / 2;

                const deltaX = e.clientX - eyeX;
                const deltaY = e.clientY - eyeY;
                const angle = Math.atan2(deltaY, deltaX);

                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const pupilDist = Math.min(distance / 20, maxPupilMove);

                const pupilX = Math.cos(angle) * pupilDist;
                const pupilY = Math.sin(angle) * pupilDist;
                
                pupil.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div className="mascot-container">
            <svg ref={mascotRef} className="mascot" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
                <g>
                    {/* <!-- Body --> */}
                    <path d="M10,110 A90,90 0 0,1 190,110 L160,110 A60,60 0 0,0 40,110 Z" fill={bodyColor} />
                    {/* <!-- Ears --> */}
                    <path d="M40,30 L60,10 L70,30 Z" fill={accentColor} />
                    <path d="M160,30 L140,10 L130,30 Z" fill={accentColor} />
                    {/* <!-- Eyes --> */}
                    <g className="eye" transform="translate(65, 60)">
                        <circle r="30" fill="var(--eye-bg)" />
                        <circle className="pupil" r="12" fill="var(--pupil-color)" />
                    </g>
                    <g className="eye" transform="translate(135, 60)">
                        <circle r="30" fill="var(--eye-bg)" />
                        <circle className="pupil" r="12" fill="var(--pupil-color)" />
                    </g>
                    {/* <!-- Eyelids for peeking --> */}
                    <g style={{ transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)', transform: isPeeking ? 'translateY(0)' : 'translateY(-60px)' }}>
                         <circle cx="65" cy="60" r="30" fill={bodyColor} />
                         <circle cx="135" cy="60" r="30" fill={bodyColor} />
                    </g>
                </g>
            </svg>
        </div>
    );
};

const RecruiterRegister = ({ theme }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name : "",
        username: "",
        email : "",
        companyname : "",
        password : "",
        role : "RECRUITER"
    });

    const handleSubmit = async (e)=>{
        e.preventDefault();
        try{
        const res = await api.post("/api/users/register", formData);
        console.log(res.data);
        if(res.data.success === true)
            navigate('/r/login');
        }catch(e){
            console.log(e, "Error while logging Recruiter");
        }
    }

    const [isPeeking, setIsPeeking] = useState(false);
    return (
    <div className="auth-form" key="register">
      <AnimatedMascot theme={theme} isPeeking={isPeeking}/>
      <h2>Recruiter Sign Up</h2>
       <form onSubmit={handleSubmit}>
    <div className="input-group">
      <input 
        type="text" 
        placeholder="Full Name" 
        value={formData.name} 
        onChange={(e) => setFormData({...formData, name: e.target.value})} 
        required 
      />
    </div>
    <div className="input-group">
      <input 
        type="text" 
        placeholder="Username" 
        value={formData.username} 
        onChange={(e) => setFormData({...formData, username: e.target.value})} 
        required 
      />
    </div>

    <div className="input-group">
      <input 
        type="text" 
        placeholder="Company Name" 
        value={formData.companyname} 
        onChange={(e) => setFormData({...formData, companyname: e.target.value})} 
        required 
      />
    </div>
    <div className="input-group">
      <input 
        type="email" 
        placeholder="Company Email" 
        value={formData.email} 
        onChange={(e) => setFormData({...formData, email: e.target.value})} 
        required 
        pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
      />
    </div>
    <div className="input-group">
      <input 
        type={isPeeking ? "text" : "password"} 
        placeholder="Create Password" 
        required 
        onFocus={() => setIsPeeking(true)} 
        onBlur={() => setIsPeeking(false)} 
        value={formData.password} 
        onChange={(e) => setFormData({...formData, password: e.target.value})} 
      />
    </div>
    <button type="submit" className="auth-button">
      Create Account
    </button>
  </form>
      <p className="toggle-text">
        Already have an account? <a href="#">Login here</a>
      </p>
    </div>
  );
};

export default function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <>
      <Styles />
      <div className={`auth-container ${theme}`}>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <RecruiterRegister theme={theme} />
      </div>
    </>
  );
}