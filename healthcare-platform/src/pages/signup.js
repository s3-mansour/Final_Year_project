// src/pages/signup.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authService";
import "./styles/signup.css";

// Define a list of UK cities (or import if defined elsewhere)
const UK_CITIES = [
    "Aberdeen", "Belfast", "Birmingham", "Bradford", "Brighton", "Bristol",
    "Cambridge", "Cardiff", "Coventry", "Derby", "Dundee", "Edinburgh",
    "Exeter", "Glasgow", "Kingston upon Hull", "Leeds", "Leicester", "Liverpool",
    "London", "Manchester", "Newcastle upon Tyne", "Norwich", "Nottingham", "Oxford",
    "Plymouth", "Portsmouth", "Reading", "Sheffield", "Southampton", "Stoke-on-Trent",
    "Sunderland", "Swansea", "Swindon", "Wakefield", "Westminster", "York"
];

// Define a list of Security Questions (Must match backend options if enum is used)
const SECURITY_QUESTIONS = [
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your favorite book?"
];


const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient", // Default role
    location: "", // Default empty location
    // NEW FIELDS in state
    dob: "", // DOB state (YYYY-MM-DD)
    securityQuestion: "", // Security question state (selected string)
    securityAnswer: "", // Security answer state (input value)
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // State for displaying error messages

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear previous error message

    // Basic Validation (Required Fields) - Add new fields here if mandatory
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword || !formData.location /* || !formData.dob || !formData.securityQuestion || !formData.securityAnswer */) {
        setErrorMessage("Please fill in all required fields.");
        return;
    }

     // Basic Validation (Passwords Match)
     if (formData.password !== formData.confirmPassword) {
       setErrorMessage("Passwords do not match!");
       return;
     }

    // Password Complexity Validation (Client-side)
    const password = formData.password;
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < minLength) { setErrorMessage(`Password must be at least ${minLength} characters long.`); return; }
    if (!hasUppercase) { setErrorMessage("Password must contain at least one uppercase letter."); return; }
    if (!hasSpecialChar) { setErrorMessage("Password must contain at least one special character (e.g., !@#$%^&*)."); return; }

    // Optional: Validation for other fields if required
    // if (formData.dob && isNaN(new Date(formData.dob).getTime())) { setErrorMessage("Please enter a valid date of birth."); return; }
    // if (!formData.securityQuestion || !formData.securityAnswer) { setErrorMessage("Please select a security question and provide an answer."); return; }


    setLoading(true);
    try {
      const userData = {
        firstName: formData.firstName, lastName: formData.lastName, email: formData.email, password: formData.password, role: formData.role, location: formData.location,
        // Include NEW FIELDS in payload
        dob: formData.dob || null,
        securityQuestion: formData.securityQuestion || '',
        securityAnswer: formData.securityAnswer || '',
      };

      const response = await registerUser(userData); // Call registration service

      console.log("Registration successful:", response);

      if (response && response.token) {
         if (response.role === 'doctor') { navigate("/consultant/dashboard", { replace: true }); }
         else { navigate("/dashboard", { replace: true }); }
      } else { setErrorMessage("Registration successful, but login failed. Please try logging in."); }

    } catch (error) {
      console.error("Registration failed:", error);
      const serverMsg = error.message || "Registration failed. Please try again.";
      setErrorMessage(serverMsg);
    } finally { setLoading(false); }
  };


  return (
    <div className="signup-page">
      <div className="signup-container">
        <h1 className="signup-title">Sign Up</h1>
        <div className="signup-card">
          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="input-group"><label htmlFor="firstName">First Name</label><input id="firstName" name="firstName" type="text" placeholder="Enter your first name" required onChange={handleChange} value={formData.firstName} /></div>
            <div className="input-group"><label htmlFor="lastName">Last Name</label><input id="lastName" name="lastName" type="text" placeholder="Enter your last name" required onChange={handleChange} value={formData.lastName} /></div>
            <div className="input-group"><label htmlFor="email">Email Address</label><input id="email" name="email" type="email" placeholder="Enter your email" required onChange={handleChange} value={formData.email} /></div>
            <div className="input-group"><label htmlFor="password">Password</label><input id="password" name="password" type="password" placeholder="Create a password" required onChange={handleChange} value={formData.password} /></div>
            <div className="input-group"><label htmlFor="confirmPassword">Confirm Password</label><input id="confirmPassword" name="confirmPassword" type="password" placeholder="Re-enter your password" required onChange={handleChange} value={formData.confirmPassword} /></div>

              {/* Location Dropdown */}
              <div className="input-group">
                <label htmlFor="location">Location (City)</label>
                <select id="location" name="location" value={formData.location} onChange={handleChange} required>
                  <option value="">Select your city</option>
                  {UK_CITIES.map(city => (<option key={city} value={city}>{city}</option>))}
                </select>
              </div>

             {/* NEW Input Group for Date of Birth */}
             <div className="input-group">
                 <label htmlFor="dob">Date of Birth</label>
                 <input type="date" id="dob" name="dob" onChange={handleChange} value={formData.dob} /* required={false} */ />
             </div>

             {/* NEW Input Group for Security Question and Answer */}
             {/* Security Question Dropdown */}
             <div className="input-group">
                 <label htmlFor="securityQuestion">Security Question</label>
                 <select id="securityQuestion" name="securityQuestion" value={formData.securityQuestion} onChange={handleChange} /* required={false} */ >
                     <option value="">Select a security question</option>
                     {SECURITY_QUESTIONS.map(question => (<option key={question} value={question}>{question}</option>))}
                 </select>
             </div>
             {/* Security Answer Input */}
             <div className="input-group">
                 <label htmlFor="securityAnswer">Security Answer</label>
                 <input type="text" id="securityAnswer" name="securityAnswer" placeholder="Enter your answer" onChange={handleChange} value={formData.securityAnswer} /* required={false} */ />
             </div>


            {/* Role Selection */}
            <div className="input-group role-group">
              <label>Register as</label>
              <div className="role-selection">
                <label><input type="radio" name="role" value="patient" checked={formData.role === "patient"} onChange={handleChange} /><span>Patient</span></label>
                <label><input type="radio" name="role" value="doctor" checked={formData.role === "doctor"} onChange={handleChange} /><span>Doctor</span></label>
              </div>
            </div>

            <button type="submit" className="signup-button" disabled={loading}>
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </form>
        </div>

        {/* Footer section */}
        <div className="footer">
          <p>Already have an account?</p>
          <Link to="/login" className="login-link">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;