import React, { useState, useEffect } from "react";
import api from "./axiosConfig";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState("light");
  const [message, setMessage] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [mouseTransform, setMouseTransform] = useState({ transform: "translate(0px, 0px)" });

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    role: "CANDIDATE",
  });

  const [errors, setErrors] = useState({
    username: "",
    email: "",
  });

  // ✅ Debounced username validation
  useEffect(() => {
    if (!formData.username) {
      setErrors((prev) => ({ ...prev, username: "" }));
      return;
    }

    const identifier = setTimeout(async () => {
      try {
        const res = await api.post("/api/users/checkUsername", { username: formData.username });
        if (res.data.exists) {
          setErrors((prev) => ({ ...prev, username: "Username is already taken." }));
        } else {
          setErrors((prev) => ({ ...prev, username: "" }));
        }
      } catch (err) {
        console.error("Username check failed:", err);
      }
    }, 750);

    return () => clearTimeout(identifier);
  }, [formData.username]);

  // ✅ Debounced email validation
  useEffect(() => {
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors((prev) => ({ ...prev, email: "" }));
      return;
    }

    const identifier = setTimeout(async () => {
      try {
        const res = await api.post("/api/users/checkEmail", { email: formData.email });
        if (res.data.exists) {
          setErrors((prev) => ({ ...prev, email: "This email is already registered." }));
        } else {
          setErrors((prev) => ({ ...prev, email: "" }));
        }
      } catch (err) {
        console.error("Email check failed:", err);
      }
    }, 750);

    return () => clearTimeout(identifier);
  }, [formData.email]);

  // ✅ Theme toggle
  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  // ✅ Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage("");
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (errors.username || errors.email) {
      setMessage("Please fix the errors before submitting.");
      return;
    }

    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      setMessage("Please fill in all account details.");
      return;
    }

    try {
      const res = await api.post("/api/users/register", formData);

      if (res.data.success) {
        navigate("/login");
      } else if (res.data.username) {
        setMessage("Username already taken");
      } else if (res.data.email) {
        setMessage("Email already registered");
      } else {
        setMessage("Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration failed:", err);
      setMessage("Registration failed. Please try again.");
    }
  };

  // ✅ Toggle password visibility
  const togglePasswordVisibility = () => setIsPasswordVisible((prev) => !prev);

  // ✅ Eye animation (follows cursor)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isPasswordVisible) return;
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const offsetX = (clientX / innerWidth - 0.5) * 20;
      const offsetY = (clientY / innerHeight - 0.5) * 16;
      setMouseTransform({ transform: `translate(${offsetX}px, ${offsetY}px)` });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isPasswordVisible]);

  useEffect(() => {
    if (isPasswordVisible) {
      setMouseTransform({ transform: "translate(0px, 0px)" });
    }
  }, [isPasswordVisible]);

  // ✅ Inline CSS (unchanged)
  const styles = `
    .error-message {
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      margin-left: 0.25rem;
      min-height: 1.2rem;
    }
    .form-group { margin-bottom: 0; }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="page-container" data-theme={theme}>
        <div className="register-card">
          {/* Animated left side */}
          <div className="animation-panel">
            <svg viewBox="0 0 360 320" width="360" height="320" aria-label="Animated shapes illustration">
              <g className="shape-group shape-1">
                <g className="float-1">
                  <path d="M40 220 A120 120 0 0 1 320 220 L320 320 L40 320 Z" fill="#FF7A3D" />
                  <g style={mouseTransform}>
                    <circle
                      cx="120"
                      cy="250"
                      r="6"
                      fill="#111827"
                      className={`eye-base ${isPasswordVisible ? "eye-closed" : "blink blink-1"}`}
                    />
                    <circle
                      cx="160"
                      cy="250"
                      r="6"
                      fill="#111827"
                      className={`eye-base ${isPasswordVisible ? "eye-closed" : "blink blink-2"}`}
                    />
                  </g>
                  <path
                    d="M112 265 Q140 285 168 265"
                    stroke="#111827"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              </g>
            </svg>
          </div>

          {/* Form section */}
          <div className="form-panel">
            <div className="theme-switch-wrapper">
              <label className="theme-switch">
                <input type="checkbox" onChange={toggleTheme} checked={theme === "dark"} />
                <span className="slider round"></span>
              </label>
            </div>

            <h1 className="form-title">Join Us!</h1>
            <p className="form-subtitle">Create your account to get started.</p>
            {message && <p className="register-message">{message}</p>}

            <form onSubmit={handleSubmit} className="register-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                  className="form-input"
                />
                <p className="error-message">{errors.username || " "}</p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="form-input"
                />
                <p className="error-message">{errors.email || " "}</p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    required
                    pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                    title="Must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="password-toggle-btn"
                    aria-label="Toggle password visibility"
                  >
                    {isPasswordVisible ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                Register
              </button>
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
