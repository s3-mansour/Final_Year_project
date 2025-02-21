import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService"; // Import API function
import "./signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
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
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      await registerUser(userData); // Call API to register user
      alert("Signup successful! You can now log in.");
      navigate("/login"); // Redirect to login page
    } catch (error) {
      alert("Signup failed. " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="signup-container">
      <h1 className="signup-title">Sign Up</h1>
      <p className="signup-subtext">Join us and unlock amazing opportunities.</p>

      <div className="signup-card">
        <form className="signup-form" onSubmit={handleSignup}>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input id="name" name="name" type="text" placeholder="Enter your name" required onChange={handleChange} />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email" placeholder="Enter your email" required onChange={handleChange} />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Create a password" required onChange={handleChange} />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Re-enter your password" required onChange={handleChange} />
          </div>

          <div className="input-group role-group">
            <label>Register as</label>
            <div className="role-selection">
              <label>
                <input type="radio" name="role" value="patient" checked={formData.role === "patient"} onChange={handleChange} />
                <span>Patient</span>
              </label>
              <label>
                <input type="radio" name="role" value="doctor" checked={formData.role === "doctor"} onChange={handleChange} />
                <span>Doctor</span>
              </label>
            </div>
          </div>

          <button type="submit" className="signup-button">Sign Up</button>
        </form>

        <div className="footer">
          <p>Already have an account?</p>
          <a href="/login" className="login-btn">Log in</a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
