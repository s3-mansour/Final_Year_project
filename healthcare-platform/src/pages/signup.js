import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");

  const handleSignup = (e) => {
    e.preventDefault();
    console.log("User signed up as:", role);
    navigate("/dashboard");
  };

  return (
    <div className="signup-container">
      <h1 className="signup-title">Sign Up</h1>
      <p className="signup-subtext">Join us and unlock amazing opportunities.</p>

      <div className="signup-card">
        <form className="signup-form" onSubmit={handleSignup}>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input id="name" type="text" placeholder="Enter your name" required />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" type="email" placeholder="Enter your email" required />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Create a password" required />
          </div>

          <div className="input-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input id="confirm-password" type="password" placeholder="Re-enter your password" required />
          </div>

          <div className="input-group role-group">
            <label>Register as</label>
            <div className="role-selection">
              <label>
                <input type="radio" name="role" value="patient" checked={role === "patient"} onChange={() => setRole("patient")} />
                <span>Patient</span>
              </label>
              <label>
                <input type="radio" name="role" value="doctor" checked={role === "doctor"} onChange={() => setRole("doctor")} />
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
