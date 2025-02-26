import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import { loginUser } from "../services/authService"; // Import API function
import "./login.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false); // State for loading indication

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true); // Show loading state

    try {
      const response = await loginUser(formData); // Call API to authenticate user

      if (!response || !response.token) {
        throw new Error("No token received.");
      }

      // Store token and role
      localStorage.setItem("token", response.token);
      localStorage.setItem("userRole", response.role || "user");

      console.log("Stored Token:", localStorage.getItem("token"));

      alert("Login successful!");

      // Ensure storage is completed before redirecting
      navigate("/dashboard");

    } catch (error) {
      console.error("Login Error:", error.response?.data || error.message);
      alert("Login failed. " + (error.response?.data?.message || "Invalid credentials"));
    } finally {
      setLoading(false); // Hide loading state
    }
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
              <input 
                type="email" 
                name="email" 
                placeholder="Enter your email" 
                required 
                onChange={handleChange} 
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input 
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

        {/* Updated Links */}
        <p className="forgot-password">
          <a href="/" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
        </p>
        <p className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
