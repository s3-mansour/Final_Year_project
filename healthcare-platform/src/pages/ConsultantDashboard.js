import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Keep other fa imports if needed
import {
  FaBars, FaTimes, FaCog, FaSignOutAlt, FaUserInjured,
  FaCalendarCheck, FaComments, FaFileMedical, FaPhoneAlt
} from "react-icons/fa";
// *** ADD THIS SEPARATE IMPORT ***
import { FaUserDoctor } from "react-icons/fa6";
import { getUserProfile, logoutUser } from "../services/authService";
import "./styles/consultantDashboard.css";

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({ firstName: "Loading...", lastName: "User", role: "Doctor" }); // Added lastName default

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserProfile();
        setUser(userData);
      } catch (error) {
        alert("Session expired or invalid. Please log in again.");
        // Consider redirecting more gracefully if possible
        logoutUser(); // Clear token if auth fails
        navigate("/login");
      }
    };
    fetchUserData();
  }, [navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logoutUser();
    window.location.href = "/login"; // Force reload for clean state after logout
  };

  const handleAccountSettings = () => {
    navigate("/profile");
  };

  // Navigation Handlers
  const goToPatients = () => navigate('/consultant/patients');
  const goToAppointments = () => navigate('/consultant/appointments');
  const goToChat = () => navigate('/chat');
  const goToManageMedications = () => navigate('/consultant/manage-medications');
  // Placeholder for emergency action
  const handleEmergency = () => alert("Emergency support feature not yet implemented.");


  return (
    // *** Use classes from ConsultantDashboard.css ***
    <div className="consultant-dashboard">
      {/* Sidebar */}
      <div className={`consultant-sidebar ${sidebarOpen ? "open" : ""}`}>
         <button className="close-btn" onClick={toggleSidebar} aria-label="Close sidebar"><FaTimes /></button>
         <div className="sidebar-header">
           {/* Changed icon class name */}
           <FaUserDoctor className="user-icon" />
           <h3>Dr. {user.lastName}</h3> {/* Display last name */}
           <p>Role: {user.role}</p>
         </div>
         <ul className="sidebar-menu">
           <li onClick={handleAccountSettings} style={{ cursor: "pointer" }}><FaCog /> Account Settings</li>
           <li className="logout" onClick={handleLogout}><FaSignOutAlt /> Sign Out</li>
         </ul>
      </div>

      {/* Main Content */}
      {/* Apply margin-left transition based on sidebar state */}
      <div className={`consultant-main-content ${sidebarOpen ? "shifted" : ""}`}>
        {/* Top Bar */}
        <div className="topbar">
          {/* Only show menu button if sidebar isn't attached to topbar */}
          <button className="menu-btn" onClick={toggleSidebar} aria-label="Open sidebar"><FaBars /></button>
          {/* Add Title or other elements if needed */}
          <span>Consultant Portal</span>
        </div>

        {/* Dashboard Header Section */}
        {/* Using consultant-header class */}
        <div className="consultant-header">
          <h1>Welcome, Dr. {user.lastName}!</h1>
          <p>Manage your patients, appointments, and communications efficiently.</p>
        </div>

        {/* Feature Cards Grid */}
        {/* Using consultant-cards class for the container */}
        <div className="consultant-cards">
          {[
            { title: "View Patients", desc: "Access patient records and history.", icon: <FaUserInjured />, action: goToPatients, btnText: "View Patients" },
            { title: "Appointments", desc: "Manage your appointment schedule.", icon: <FaCalendarCheck />, action:goToAppointments, btnText: "Manage Appointments" },
            { title: "Manage Medications", desc: "Prescribe and manage patient medications.", icon: <FaFileMedical />, action: goToManageMedications, btnText: "Manage Medications" },
            { title: "Consultant-Patient Chat", desc: "Communicate with your patients securely.", icon: <FaComments />, action: goToChat, btnText: "Open Chat" },
          ].map((feature, index) => (
             // Using consultant-card class for each card
            <div key={index} className="consultant-card" onClick={feature.action}> {/* Make whole card clickable */}
              {/* Keep h2 wrapping icon and title */}
              <h2>{feature.icon} {feature.title}</h2>
              <p>{feature.desc}</p>
              {/* Button might be redundant if card is clickable, or style differently */}
              {/* <button onClick={(e) => { e.stopPropagation(); feature.action(); }}>{feature.btnText}</button> */}
            </div>
          ))}
        </div>

        {/* Emergency Section */}
        {/* Using consultant-emergency class */}
        <div className="consultant-emergency">
          <h3><FaPhoneAlt /> Emergency Contact Support</h3>
          <p>Access critical support information quickly.</p>
          <button className="emergency-btn" onClick={handleEmergency}>Access Support</button>
        </div>

      </div>
    </div>
  );
};

export default ConsultantDashboard;