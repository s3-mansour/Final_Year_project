import React from "react";
import { logoutUser } from "../services/authService";
import "./styles/consultantDashboard.css";

const ConsultantDashboard = () => {
  const handleLogout = () => {
    logoutUser();
    window.location.href = "/login"; // Force reload
  };

  return (
    <div className="cd-wrapper">
      {/* Top Bar (Logout) */}
      <div className="cd-topbar">
        <button className="cd-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Header with Inline SVG Wave */}
      <header className="cd-header">
        <h1>Consultant Dashboard</h1>
        <p>Welcome, Doctor!</p>
        {/* Wave SVG at the bottom */}
        <svg
          className="cd-wave"
          viewBox="0 0 1440 80"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#f7f7f7"
            d="M0,0 C360,80 1080,0 1440,80 L1440,0 L0,0 Z"
          />
        </svg>
      </header>

      {/* Main Content */}
      <div className="cd-content">
        {/* Two-Column Cards */}
        <div className="cd-cards">
          <div className="cd-card">
            <h3>Patients</h3>
            <p>Manage your patients here.</p>
            <button>View Patients</button>
          </div>
          <div className="cd-card">
            <h3>Appointments</h3>
            <p>Schedule or modify appointments.</p>
            <button>View Appointments</button>
          </div>
        </div>

        {/* Emergency Section */}
        <div className="cd-emergency">
          <h3>Emergency Contact Support</h3>
          <p>Quickly connect with emergency providers in critical situations.</p>
          <button className="cd-emergency-btn">Access Emergency Support</button>
        </div>
      </div>
    </div>
  );
};

export default ConsultantDashboard;
