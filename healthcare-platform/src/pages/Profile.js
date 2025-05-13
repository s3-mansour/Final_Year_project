// src/pages/PatientProfile.js
import React, { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "./styles/Profile.css";

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

// Helper to format Date object to YYYY-MM-DD string for input type="date"
const formatDateForInput = (date) => {
    if (!date) return '';
    const dateObj = (date instanceof Date && !isNaN(date)) ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().split('T')[0];
};


const PatientProfile = () => {
  const navigate = useNavigate();
  // State for user profile data
  const [profile, setProfile] = useState({
    firstName: "", lastName: "", email: "", location: "",
    // NEW FIELDS in state
    dob: "", // Initially YYYY-MM-DD string for input
    securityQuestion: "",
    securityAnswer: "", // Input value, NOT the hash
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Effect to fetch profile on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Fetch user profile data (should include location, dob, securityQuestion)
        const data = await getUserProfile();
        setProfile({
            ...data,
            // Format DOB for the input field if it exists
            dob: data.dob ? formatDateForInput(data.dob) : "",
            // Security answer field should remain empty on load for security
            securityAnswer: "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        setMessage("Failed to load profile.");
      }
    };
    fetchProfile();
  }, []);

  // Handler for form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for form submission (Update Profile)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage("");

    // Basic validation
    if (!profile.firstName || !profile.lastName || !profile.email || !profile.location) {
         setMessage("Please fill in all required fields."); setLoading(false); return;
    }

    // Prepare data for update (only include fields that were potentially changed or provided)
    const updateData = {
        firstName: profile.firstName, lastName: profile.lastName, email: profile.email, location: profile.location,
        // Include new fields
        dob: profile.dob || null, // Send DOB (null if empty string)
        securityQuestion: profile.securityQuestion || '', // Send question (empty string if empty)
        // ONLY include securityAnswer in payload if the user typed something.
        // Backend should ignore/keep existing hash if securityAnswer is NOT sent or is empty string.
        // The backend controller already handles this check implicitly if req.body.securityAnswer is undefined or empty.
        // So just send the value from the input:
        securityAnswer: profile.securityAnswer, // Send the input value
        // password: profile.password // Include if you add password change field
    };

    try {
      const updatedProfile = await updateUserProfile(updateData); // Call update service
      setProfile({
          ...updatedProfile,
          // Format DOB from response for the input field if it exists
          dob: updatedProfile.dob ? formatDateForInput(updatedProfile.dob) : "",
          // Security answer field should remain empty after update for security
          securityAnswer: "",
      });
      setMessage("Profile updated successfully!");
      console.log("Profile updated:", updatedProfile);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage(error.message);
    } finally { setLoading(false); }
  };

  // Handler for Back to Dashboard button
  const handleBackToDashboard = () => { navigate("/dashboard"); };


  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>My Profile</h1>
        {message && <p className="profile-message">{message}</p>}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="input-group"><label htmlFor="firstName">First Name</label><input type="text" id="firstName" name="firstName" value={profile.firstName} onChange={handleChange} required /></div>
          <div className="input-group"><label htmlFor="lastName">Last Name</label><input type="text" id="lastName" name="lastName" value={profile.lastName} onChange={handleChange} required /></div>
          <div className="input-group"><label htmlFor="email">Email Address</label><input type="email" id="email" name="email" value={profile.email} onChange={handleChange} required /></div>

          {/* Location Dropdown */}
          <div className="input-group">
            <label htmlFor="location">Location (City)</label>
            <select id="location" name="location" value={profile.location} onChange={handleChange} required>
              <option value="">Select your city</option>
              {UK_CITIES.map(city => (<option key={city} value={city}>{city}</option>))}
            </select>
          </div>

          {/* NEW Input Group for Date of Birth */}
          <div className="input-group">
              <label htmlFor="dob">Date of Birth</label>
              <input type="date" id="dob" name="dob" onChange={handleChange} value={profile.dob} />
          </div>

          {/* NEW Input Group for Security Question and Answer */}
          {/* Security Question Dropdown */}
          <div className="input-group">
              <label htmlFor="securityQuestion">Security Question</label>
              <select id="securityQuestion" name="securityQuestion" value={profile.securityQuestion} onChange={handleChange}>
                  <option value="">Select a security question</option>
                  {SECURITY_QUESTIONS.map(question => (<option key={question} value={question}>{question}</option>))}
              </select>
          </div>
          {/* Security Answer Input */}
          <div className="input-group">
              <label htmlFor="securityAnswer">Security Answer</label>
              <input type="text" id="securityAnswer" name="securityAnswer" placeholder="Enter your answer to update" onChange={handleChange} value={profile.securityAnswer} />
               <p className="input-hint">Leave blank to keep existing answer.</p> {/* Hint text */}
          </div>

          {/* Optional: Password Change Fields */}

          <button type="submit" className="update-button" disabled={loading}>
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>

        <button className="back-button" onClick={handleBackToDashboard}>Back to Dashboard</button>
      </div>
    </div>
  );
};

export default PatientProfile;