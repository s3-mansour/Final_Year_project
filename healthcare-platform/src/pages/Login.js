// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import "./styles/login.css"; // Assuming you have login styling


const Login = () => {
  const navigate = useNavigate(); // useNavigate is still needed for the Forgot Password link

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  // State for displaying messages (success or error)
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  // Removed loginSuccess state
  // const [loginSuccess, setLoginSuccess] = useState(null);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setIsError(false);

    if (!formData.email || !formData.password) {
      setMessage("Please enter both email and password.");
      setIsError(true);
      return;
    }

    setLoading(true); // Start loading indicator
    try {
      const response = await loginUser(formData); // Call the login service

      if (!response || !response.token) {
        throw new Error("Login service did not return a token.");
      }

      // *** Handle Successful Login: Display message and redirect using window.location.href ***
      setMessage("Login successful!");
      setIsError(false);
      console.log("Login successful:", response);

      // Clear loading state immediately
      setLoading(false);

      // *** Redirect using window.location.href for maximum reliability ***
      // This forces a full page load and state reset.
      const destinationPath = response.role === "doctor" ? "/consultant/dashboard" : "/dashboard";
      console.log(`Redirecting to ${destinationPath} using window.location.href...`);
      window.location.href = destinationPath;

      // Note: Code below window.location.href may not execute immediately


    } catch (error) {
      console.error("Login Error:", error); // Log error details
      // *** Handle Error: Display message and clear loading state ***
      const errorMsg = error.message || "Login failed. Please try again."; // Get message from error object
      setMessage(errorMsg); // Set message state
      setIsError(true); // Mark as error message

      // Clear password field on error (optional, good practice)
       setFormData(prev => ({ ...prev, password: '' }));

       setLoading(false); // Clear loading state on error so button is clickable


    } finally {
      // This finally block is less critical here as window.location.href causes a page exit
    }
  };


  return (
    <div className="login-page"> {/* Apply CSS class */}
      <div className="login-container"> {/* Apply CSS class */}
        {/* Assuming login-static-box wraps title, subtitle, form, and links */}
        <div className="login-static-box">

          <h1 className="login-title">Welcome Back!</h1> {/* Apply CSS class */}
          <p className="login-subtext">Sign in to your account</p> {/* Apply CSS class */}

          {/* Display Message (Success or Error) Above Form */}
          {message && (
              <p className={`login-message ${isError ? 'error' : 'success'}`}> {/* Apply CSS class, error/success modifier */}
                  {message}
              </p>
          )}

          {/* Apply login-card class to the container around the form */}
          <div className="login-card">
            {/* Apply login-form class to the form element */}
            <form className="login-form" onSubmit={handleSubmit}>

              {/* Input fields - apply input-group class to each container */}
              <div className="input-group"> {/* Apply CSS class */}
                <label htmlFor="email">Email Address</label>
                <input
                  id="email" type="email" name="email"
                  placeholder="Enter your email" required
                  onChange={handleChange} value={formData.email}
                />
              </div>

              <div className="input-group"> {/* Apply CSS class */}
                <label htmlFor="password">Password</label>
                <input
                  id="password" type="password" name="password"
                  placeholder="Enter your password" required
                  onChange={handleChange} value={formData.password}
                />
              </div>

              {/* Apply login-button class to the submit button */}
              <button type="submit" className="login-button" disabled={loading}> {/* Disable button while loading */}
                {loading ? "Logging in..." : "Login"} {/* Button text changes based on loading state */}
              </button>
            </form>
          </div>

          <p className="forgot-password"> {/* Apply CSS class */}
            <Link to="/forgot-password-request">Forgot Password?</Link> {/* Link to forgot password page */}
          </p>
          <p className="signup-link"> {/* Apply CSS class */}
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div> {/* End login-static-box */}
      </div> {/* End login-container */}
    </div> // End login-page
  );
};

export default Login;