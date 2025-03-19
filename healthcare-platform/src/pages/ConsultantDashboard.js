// src/pages/ConsultantDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaUserFriends,
  FaCalendarAlt,
  FaCog
} from "react-icons/fa";
import { getUserProfile, logoutUser } from "../services/authService";
import "./styles/consultantDashboard.css";

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({ firstName: "Loading...", role: "doctor" });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserProfile();
        setUser(userData);
      } catch (error) {
        alert("Session expired. Please log in again.");
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
    window.location.href = "/login";
  };

  // Navigation handlers
  const handleViewPatients = () => {
    navigate("/consultant/patients");
  };
  const handleViewAppointments = () => {
    navigate("/consultant/appointments");
  };
  const handleViewProfile = () => {
    // Navigate to the same profile page used by patients/doctors
    navigate("/profile");
  };

  return (
    <div className="consultant-dashboard">
      {/* Sidebar */}
      <aside className={`consultant-sidebar ${sidebarOpen ? "open" : ""}`}>
        {sidebarOpen && (
          <button
            className="close-btn"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        )}
        <div className="sidebar-header">
          <FaUser className="user-icon" />
          <h3>{user.firstName}</h3>
          <p>Role: {user.role}</p>
        </div>
        <ul className="sidebar-menu">
          <li onClick={handleViewPatients}>
            <FaUserFriends /> View Patients
          </li>
          <li onClick={handleViewAppointments}>
            <FaCalendarAlt /> View Appointments
          </li>
          {/* NEW: Account Details / Profile */}
          <li onClick={handleViewProfile}>
            <FaCog /> Account Details
          </li>
          <li className="logout" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className={`consultant-main-content ${sidebarOpen ? "shifted" : ""}`}>
        {/* Top Bar */}
        <div className="topbar">
          <button className="menu-btn" onClick={toggleSidebar} aria-label="Open sidebar">
            <FaBars />
          </button>
        </div>

        {/* Dashboard Header */}
        <header className="consultant-header">
          <h1>Consultant Dashboard</h1>
          <p>Welcome, Doctor!</p>
        </header>

        {/* Quick Links or Cards */}
        <div className="consultant-cards">
          <div className="consultant-card" onClick={handleViewPatients}>
            <FaUserFriends size={40} />
            <h2>Patients</h2>
            <p>Manage your patients here.</p>
            <button>View Patients</button>
          </div>
          <div className="consultant-card" onClick={handleViewAppointments}>
            <FaCalendarAlt size={40} />
            <h2>Appointments</h2>
            <p>Schedule or modify appointments.</p>
            <button>View Appointments</button>
          </div>
        </div>

        <section className="consultant-emergency">
          <h3>Emergency Contact Support</h3>
          <p>Quickly connect with emergency providers in critical situations.</p>
          <button className="emergency-btn">Access Emergency Support</button>
        </section>
      </main>
    </div>
  );
};

export default ConsultantDashboard;
