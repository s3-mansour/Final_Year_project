import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaUser, FaCog, FaSignOutAlt, FaCalendarAlt, FaPills, FaChartBar, FaComments, FaBookMedical, FaUserMd } from "react-icons/fa";
import { getUserProfile, logoutUser } from "../services/authService"; // API Calls
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({ name: "Loading...", role: "Patient" });

  // Fetch user data from backend
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
    navigate("/login");
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
          <h3>{user.name}</h3>
          <p>Role: {user.role}</p>
        </div>
        <ul className="sidebar-menu">
          <li>
            <FaCog /> Account Settings
          </li>
          <li className="logout" onClick={handleLogout}>
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

        {/* Dashboard Header */}
        <div className="dashboard-header">
          <h2>Healthcare Management Dashboard</h2>
        </div>

        {/* Dashboard Features - Arranged in Two Columns */}
        <div className="dashboard-grid">
          {[
            { title: "Medication Tracking", desc: "Track your medication schedule and set reminders.", icon: <FaPills />, btn: "View Schedule", link:"/MedicationTracking" },
            { title: "Appointment Scheduling", desc: "Book, modify, or cancel appointments.", icon: <FaCalendarAlt />, btn: "Manage Appointments", link: "/appointment" },
            { title: "Data Sharing", desc: "Securely share health records.", icon: <FaUserMd />, btn: "Share Data" },
            { title: "Consultant-Patient Chat", desc: "Communicate with your healthcare provider in real-time.", icon: <FaComments />, btn: "Start Chat" ,link: "/Chat"},
            { title: "Health Tips", desc: "Get personalized tips to improve your health.", icon: <FaBookMedical />, btn: "View Tips" },
            { title: "Reports and Analytics", desc: "View detailed analytics of your health progress.", icon: <FaChartBar />, btn: "View Reports" }
          ].map((feature, index) => (
            <div key={index} className="dashboard-card">
              <h3>{feature.icon} {feature.title}</h3>
              <p>{feature.desc}</p>
              <button onClick={() => feature.link && navigate(feature.link)}>{feature.btn}</button>
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
