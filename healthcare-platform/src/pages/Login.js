import React from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

const Login = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="login-container">
      {/* Outer Static Box */}
      <div className="login-static-box">
        <h1 className="login-title">Welcome Back!</h1>
        <p className="login-subtext">Sign in to your account</p>

        {/* Inner Hoverable Box */}
        <div className="login-card">
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" placeholder="Enter your email" required />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="Enter your password" required />
            </div>

            <button type="submit" className="login-button">Login</button>
          </form>
        </div>

        <p className="forgot-password"><a href="#">Forgot Password?</a></p>
        <p className="signup-link">Don't have an account? <a href="/signup">Sign up</a></p>
      </div>
    </div>
  );
};

export default Login;
