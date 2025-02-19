import React, { useState } from "react";
import { FaBars, FaTimes, FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import "./Dashboard.css";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        {sidebarOpen && (
          <button className="close-btn" onClick={toggleSidebar}>
            <FaTimes />
          </button>
        )}
        <div className="sidebar-header">
          <FaUser className="user-icon" />
          <h3>John Doe</h3>
          <p>Role: Patient</p>
        </div>
        <ul className="sidebar-menu">
          <li>
            <FaCog /> Account Settings
          </li>
          <li className="logout">
            <FaSignOutAlt /> Sign Out
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className={`main-content ${sidebarOpen ? "shifted" : ""}`}>
        {/* Top Bar */}
        <div className="topbar">
          <button className="menu-btn" onClick={toggleSidebar}>
            <FaBars />
          </button>
        </div>

        {/* Dashboard Header with Background Image */}
        <div className="dashboard-header">
          <h2>Healthcare Management Dashboard</h2>
        </div>

        {/* Dashboard Features - Arranged in Two Columns */}
        <div className="dashboard-grid">
          {[
            { title: "Medication Tracking", desc: "Track your medication schedule and set reminders.", btn: "View Schedule" },
            { title: "Appointment Scheduling", desc: "Book, modify, or cancel appointments.", btn: "Manage Appointments" },
            { title: "Data Sharing", desc: "Securely share health records.", btn: "Share Data" },
            { title: "Consultant-Patient Chat", desc: "Communicate with your healthcare provider in real-time.", btn: "Start Chat" },
            { title: "Health Tips", desc: "Get personalized tips to improve your health.", btn: "View Tips" },
            { title: "Reports and Analytics", desc: "View detailed analytics of your health progress.", btn: "View Reports" }
          ].map((feature, index) => (
            <div key={index} className="dashboard-card">
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
              <button>{feature.btn}</button>
            </div>
          ))}
        </div>

        {/* Emergency Section */}
        <div className="emergency-section">
          <h3>Emergency Contact Support</h3>
          <p>Quickly connect with emergency providers in critical situations.</p>
          <button className="emergency-btn">Access Emergency Support</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
