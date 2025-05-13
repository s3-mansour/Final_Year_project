// src/pages/ResetPassword.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom"; // Import useLocation
import { resetPassword } from "../services/authService"; // Import the service function
import "./styles/ForgotPassword.css"; // Reuse ForgotPassword CSS or create ResetPassword.css


const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook to access state passed during navigation

  // Get verification token from navigation state
  const verificationToken = location.state?.verificationToken;
  const userEmail = location.state?.userEmail; // Optional: Display user email


  const [formData, setFormData] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // For success/error messages
  const [isError, setIsError] = useState(false);


  // --- Effect to check for token on mount ---
  // If no token is present, redirect back to the request page.
  useEffect(() => {
    if (!verificationToken) {
        console.warn("No verification token found for password reset. Redirecting.");
        // Redirect back to the forgot password request page
        navigate('/forgot-password-request', { replace: true });
    }
    // Optional: Add a timeout to the token validity check client-side if desired,
    // but backend verification is primary.
  }, [verificationToken, navigate]); // Depend on token and navigate


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setIsError(false);

    // Basic validation for required fields
    if (!formData.newPassword || !formData.confirmNewPassword) {
        setMessage("Please enter and confirm your new password.");
        setIsError(true);
        return;
    }
    // Check if passwords match
    if (formData.newPassword !== formData.confirmNewPassword) {
      setMessage("New passwords do not match!");
      setIsError(true);
      return;
    }

    // Optional: Client-side password complexity validation (Mirror signup page)
    const newPassword = formData.newPassword;
    const minLength = 8; // Minimum length requirement
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (newPassword.length < minLength) {
        setMessage(`New password must be at least ${minLength} characters long.`);
        setIsError(true);
        return;
    }
    if (!hasUppercase) {
        setMessage("New password must contain at least one uppercase letter.");
        setIsError(true);
        return;
    }
    if (!hasSpecialChar) {
        setMessage("New password must contain at least one special character (e.g., !@#$%^&*).");
        setIsError(true);
        return;
    }
    // --- End Client-side Validation ---


    // If all client-side validation passes AND token is present, proceed
    if (!verificationToken) { // Double-check token presence
         setMessage("Verification token missing. Please request a new reset.");
         setIsError(true);
         // Optional: Redirect back to request page
         return;
    }


    setLoading(true); // Start loading indicator
    try {
      // Call the backend reset password service, passing the token and new passwords
      // The service function adds the token to the Authorization header
      const response = await resetPassword(verificationToken, formData.newPassword, formData.confirmNewPassword);

      console.log("Password reset successful:", response);

      // On success, display success message
      setMessage(response.message || "Password reset successfully!");
      setIsError(false);

      // Redirect to login page after a short delay on successful reset
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000); // Navigate after 2 seconds


    } catch (error) {
      console.error("Password reset failed:", error); // Log error details
      // Display error message from the backend service
      const errorMsg = error.message || "Password reset failed. Please try again.";
      setMessage(errorMsg);
      setIsError(true);
      // Optional: If the error is due to token expiry/invalidity, redirect back to request page
      if (error.message.includes("expired") || error.message.includes("invalid reset token")) {
           setTimeout(() => {
              navigate('/forgot-password-request', { replace: true });
           }, 3000); // Redirect after 3 seconds
      }
    } finally {
      setLoading(false); // Finish loading
    }
  };

  return (
    // Reuse ForgotPassword CSS classes for layout and styling
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h1 className="forgot-password-title">Reset Password</h1>
         {userEmail && <p className="forgot-password-subtext">for {userEmail}</p>} {/* Show user email if available */}

        {/* Display Message (Success or Error) */}
        {message && (
            <p className={`forgot-password-message ${isError ? 'error' : 'success'}`}>
                {message}
            </p>
        )}

        {/* Only show the form if a verification token is present */}
        {verificationToken ? (
            <div className="forgot-password-card"> {/* Reuse card class */}
              <form className="forgot-password-form" onSubmit={handleSubmit}> {/* Reuse form class */}

                {/* New Password Input */}
                <div className="input-group"> {/* Reuse input-group class */}
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password" id="newPassword" name="newPassword"
                    placeholder="Enter new password" required
                    onChange={handleChange} value={formData.newPassword}
                  />
                </div>

                {/* Confirm New Password Input */}
                <div className="input-group"> {/* Reuse input-group class */}
                  <label htmlFor="confirmNewPassword">Confirm New Password</label>
                  <input
                    type="password" id="confirmNewPassword" name="confirmNewPassword"
                    placeholder="Confirm new password" required
                    onChange={handleChange} value={formData.confirmNewPassword}
                  />
                </div>

                {/* Submit Button */}
                <button type="submit" className="forgot-password-button" disabled={loading}> {/* Reuse button class */}
                  {loading ? "Resetting..." : "Reset Password"} {/* Button text changes based on loading state */}
                </button>
              </form>
            </div>
        ) : (
            // Message displayed if no token is found
            <div className="forgot-password-card">
                 <p>No valid reset token found. Please request a new password reset.</p>
            </div>
        )}

        {/* Link back to Login */}
        <p className="back-to-login"> {/* Reuse class */}
          Remember your password? <Link to="/login">Log in</Link> {/* Link to login route */}
        </p>
      </div> {/* End forgot-password-container */}
    </div> // End forgot-password-page
  );
};

export default ResetPassword;