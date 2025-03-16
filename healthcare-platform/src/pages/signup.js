import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authService";
import "./styles/signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    location: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        location: formData.location,
      };

      await registerUser(userData);
      alert("Signup successful!");

      // Navigate directly to the corresponding dashboard based on role
      if (formData.role === "doctor") {
        navigate("/consultant/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      alert("Signup failed. " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h1 className="signup-title">Sign Up</h1>
        <div className="signup-card">
          <form className="signup-form" onSubmit={handleSignup}>
            <div className="input-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Enter your first name"
                required
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Enter your last name"
                required
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                required
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                required
                onChange={handleChange}
              />
            </div>

            {/* Location Dropdown */}
            <div className="input-group">
              <label htmlFor="location">Location</label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              >
                <option value="">Select your city</option>
                <option value="London">London</option>
                <option value="Manchester">Manchester</option>
                <option value="Birmingham">Birmingham</option>
                <option value="Leeds">Leeds</option>
                <option value="Glasgow">Glasgow</option>
                <option value="Liverpool">Liverpool</option>
              </select>
            </div>

            <div className="input-group role-group">
              <label>Register as</label>
              <div className="role-selection">
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="patient"
                    checked={formData.role === "patient"}
                    onChange={handleChange}
                  />
                  <span>Patient</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="doctor"
                    checked={formData.role === "doctor"}
                    onChange={handleChange}
                  />
                  <span>Doctor</span>
                </label>
              </div>
            </div>

            <button type="submit" className="signup-button">
              Sign Up
            </button>
          </form>
        </div>

        <div className="footer">
          <p>Already have an account?</p>
          <Link to="/login" className="login-btn">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
