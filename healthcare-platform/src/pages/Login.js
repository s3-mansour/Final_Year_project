import React from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';

const Login = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard'); // Navigate to the dashboard
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo Section */}
        <div className="logo-section">
          <img
            src="https://via.placeholder.com/80"
            alt="Healthcare Logo"
            className="logo"
          />
          <h1 className="welcome-text">Welcome Back!</h1>
          <p className="subtext">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form className="form-section" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email Address"
            className="input-field"
          />
          <input
            type="password"
            placeholder="Password"
            className="input-field"
          />
          <button type="submit" className="login-button">
            Login
          </button>
        </form>

        {/* Additional Links */}
        <div className="links-section">
          <a href="#" className="link">
            Forgot Password?
          </a>
        </div>

        {/* Footer */}
        <div className="footer-section">
          <p>
            Don't have an account?{' '}
            <a href="#" className="link">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
