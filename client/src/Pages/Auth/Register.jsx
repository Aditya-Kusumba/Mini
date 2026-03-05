import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    role: 'CANDIDATE'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ✅ Generate OTP
  const handleGenerateOtp = async () => {
    if (!formData.email) {
      setOtpMessage('Please enter email first');
      return;
    }

    try {
      setOtpLoading(true);
      setOtpMessage('');
      setOtpVerified(false);

      const response = await fetch('/api/users/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpMessage('OTP sent to your email');
      } else {
        setOtpMessage(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      setOtpMessage('Error sending OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // ✅ Verify OTP
  const handleVerifyOtp = async () => {
    if (!formData.otp) {
      setOtpMessage('Enter OTP first');
      return;
    }

    try {
      setOtpLoading(true);
      setOtpMessage('');

      const response = await fetch('/api/users/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp
        })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpVerified(true);
        setOtpMessage('OTP verified successfully');
      } else {
        setOtpVerified(false);
        setOtpMessage(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setOtpMessage('OTP verification failed');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!otpVerified) {
      setError('Please verify OTP before registering');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData); // ✅ otp included here

      if (result.success) {
        navigate('/login', {
          state: { message: 'Registration successful! Please login to continue.' }
        });
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join thousands of developers on TierHire</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {/* Username */}
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {/* Email + Generate OTP */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleGenerateOtp}
                disabled={otpLoading}
              >
                {otpLoading ? 'Sending...' : 'Generate OTP'}
              </button>
            </div>
          </div>

          {/* OTP Field + Verify */}
          <div className="form-group">
            <label className="form-label">Enter OTP</label>
            <div className="input-group">
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter OTP"
                required
              />
              <button
                type="button"
                className="btn btn-success"
                onClick={handleVerifyOtp}
                disabled={otpLoading}
              >
                Verify OTP
              </button>
            </div>
            {otpMessage && (
              <div
                style={{
                  marginTop: '5px',
                  color: otpVerified ? 'green' : 'red'
                }}
              >
                {otpMessage}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="input-group">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-btn"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;