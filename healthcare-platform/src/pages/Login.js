import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import "./styles/login.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(formData);
      if (!response || !response.token) {
        throw new Error("No token received.");
      }
      alert("Login successful!");

      // Option 1: Hard reload
      if (response.role === "doctor") {
        window.location.href = "/consultant/dashboard";
      } else {
        window.location.href = "/dashboard";
      }

      // Option 2: Or use navigate:
      // if (response.role === "doctor") {
      //   navigate("/consultant/dashboard");
      // } else {
      //   navigate("/dashboard");
      // }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Login failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-static-box">
          <h1 className="login-title">Welcome Back!</h1>
          <p className="login-subtext">Sign in to your account</p>

          <div className="login-card">
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  required
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>

          <p className="forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>
          <p className="signup-link">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
