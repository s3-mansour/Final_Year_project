// src/pages/PatientProfile.js
import React, { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "./styles/Profile.css"; // Create a CSS file for styling

const PatientProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // For success/error messages

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setMessage("Failed to load profile.");
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const updatedProfile = await updateUserProfile(profile);
      setProfile(updatedProfile);
      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>My Profile</h1>
        {message && <p className="profile-message">{message}</p>}
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={profile.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={profile.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="location">Location</label>
            <select
              id="location"
              name="location"
              value={profile.location}
              onChange={handleChange}
              required
            >
              <option value="">Select your city</option>
              <option value="London">London</option>
              <option value="Manchester">Manchester</option>
              <option value="Birmingham">Birmingham</option>
              <option value="Leeds">Leeds</option>
              <option value="Glasgow">Glasgow</option>
              {/* Add other cities as needed */}
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Profile"}
          </button>
        </form>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default PatientProfile;
