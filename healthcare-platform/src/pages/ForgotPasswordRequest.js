// src/pages/ForgotPasswordRequest.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestPasswordReset } from "../services/authService"; // Import the service function
import "./styles/ForgotPassword.css"; // Create this CSS file


// Define the list of Security Questions
const SECURITY_QUESTIONS = [
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your favorite book?"
];




const ForgotPasswordRequest = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    dob: "", // YYYY-MM-DD format from input
    securityQuestion: "",
    securityAnswer: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // For success/error messages
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setIsError(false);

    // Basic validation for required fields
    if (!formData.email || !formData.dob || !formData.securityQuestion || !formData.securityAnswer) {
        setMessage("Please fill in all required fields.");
        setIsError(true);
        return;
    }
    // Optional: Validate email format or DOB format client-side

    setLoading(true); // Start loading indicator
    try {
      // Call the backend request service with verification data
      const response = await requestPasswordReset(formData); // { email, dob, securityQuestion, securityAnswer }

      console.log("Password reset request successful:", response);

      // If backend verification passes, it returns a verificationToken
      if (response && response.verificationToken) {
        setMessage(response.message || "Verification successful. You can now reset your password.");
        setIsError(false);

        // Navigate to the Reset Password page, passing the verification token and user email in state
        navigate('/reset-password', { state: { verificationToken: response.verificationToken, userEmail: formData.email }, replace: true });

      } else {
          // Handle unexpected successful response without token (should not happen based on controller)
          setMessage(response.message || "Verification failed. Please try again.");
          setIsError(true);
      }

    } catch (error) {
      console.error("Password reset request failed:", error);
      // Display error message from the backend service
      const errorMsg = error.message || "Verification failed. Please try again.";
      setMessage(errorMsg);
      setIsError(true);
    } finally {
      setLoading(false); // Finish loading
    }
  };

  return (
    <div className="forgot-password-page"> {/* Apply CSS class */}
      <div className="forgot-password-container"> {/* Apply CSS class */}
        <h1 className="forgot-password-title">Forgot Password</h1> {/* Apply CSS class */}
        <p className="forgot-password-subtext">Verify your details to reset your password.</p> {/* Apply CSS class */}

        {/* Display Message (Success or Error) */}
        {message && (
            <p className={`forgot-password-message ${isError ? 'error' : 'success'}`}> {/* Apply CSS class */}
                {message}
            </p>
        )}

        <div className="forgot-password-card"> {/* Apply CSS class */}
          <form className="forgot-password-form" onSubmit={handleSubmit}> {/* Apply CSS class */}

            {/* Email Input */}
            <div className="input-group"> {/* Apply CSS class */}
              <label htmlFor="email">Email Address</label>
              <input
                type="email" id="email" name="email"
                placeholder="Enter your email" required
                onChange={handleChange} value={formData.email}
              />
            </div>

            {/* Date of Birth Input */}
            <div className="input-group"> {/* Apply CSS class */}
                <label htmlFor="dob">Date of Birth</label>
                <input
                    type="date" id="dob" name="dob"
                    onChange={handleChange} value={formData.dob} required
                />
            </div>

            {/* Security Question Dropdown */}
            <div className="input-group"> {/* Apply CSS class */}
                <label htmlFor="securityQuestion">Security Question</label>
                <select
                    id="securityQuestion" name="securityQuestion"
                    value={formData.securityQuestion} onChange={handleChange} required
                >
                    <option value="">Select a security question</option>
                    {/* Dynamically render Security Questions options */}
                    {SECURITY_QUESTIONS.map((question) => (
                        <option key={question} value={question}>{question}</option>
                    ))}
                </select>
            </div>

            {/* Security Answer Input */}
            <div className="input-group"> {/* Apply CSS class */}
                <label htmlFor="securityAnswer">Security Answer</label>
                <input
                    type="text" id="securityAnswer" name="securityAnswer"
                    placeholder="Enter your answer" required
                    onChange={handleChange} value={formData.securityAnswer}
                />
            </div>

            {/* Submit Button */}
            <button type="submit" className="forgot-password-button" disabled={loading}> {/* Apply CSS class */}
              {loading ? "Verifying..." : "Verify Details"} {/* Button text changes based on loading state */}
            </button>
          </form>
        </div>

        {/* Link back to Login */}
        <p className="back-to-login"> {/* Apply CSS class */}
          Remember your password? <Link to="/login">Log in</Link> {/* Link to login route */}
        </p>
      </div> {/* End forgot-password-container */}
    </div> // End forgot-password-page
  );
};

export default ForgotPasswordRequest;