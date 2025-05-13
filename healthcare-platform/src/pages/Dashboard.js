import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Import necessary icons
import {
   FaTimes, FaUser, FaCog, FaSignOutAlt, FaCalendarAlt,
  FaPills,  FaComments, FaFilePrescription, FaAppleAlt
} from "react-icons/fa";
import { getUserProfile, logoutUser } from "../services/authService";
import TopNavbar from "../components/TopNavbar";
import "./styles/Dashboard.css"; 

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({ firstName: "Loading...", lastName: "", role: "Patient" });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserProfile();
        setUser(userData);
      } catch (error) {
        console.error("Auth Error in Dashboard:", error);
        logoutUser();
        navigate("/login", { replace: true });
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

  const handleAccountSettings = () => {
    navigate("/profile");
  };


  // --- Define Features with Accent Colors ---
  const features = [
    { title: "Medication Tracking", desc: "Track your medication schedule.", icon: <FaPills />, btn: "View Schedule", link: "/MedicationTracking", accent: "#20c997" }, // Teal
    { title: "Appointment Scheduling", desc: "Book, modify, or cancel appointments.", icon: <FaCalendarAlt />, btn: "Manage Appointments", link: "/patient-appointments", accent: "#fd7e14" }, // Orange
    { title: "Prescription Management", desc: "View your prescriptions.", icon: <FaFilePrescription />, btn: "View Prescriptions", link: "/patientprescription", accent: "#6f42c1" }, // Purple
    { title: "Consultant-Patient Chat", desc: "Communicate with your provider.", icon: <FaComments />, btn: "Start Chat", link: "/chat", accent: "#0dcaf0" }, // Cyan
  ];


  return (
    // Main container using dashboard-container class
    <div className="dashboard-container">

      {/* --- Top Navbar (Fixed) --- */}
      <TopNavbar onToggleSidebar={toggleSidebar} />

      {/* --- Sidebar (Fixed Position) --- */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={toggleSidebar} aria-label="Close sidebar"><FaTimes /></button>
        <div className="sidebar-header">
          <FaUser className="user-icon" />
          <h3>{user.firstName} {user.lastName}</h3>
          <p>Role: {user.role}</p>
        </div>
        <ul className="sidebar-menu">
           {/* Add relevant patient menu items */}
           <li onClick={() => navigate('/patient-appointments')} style={{cursor: 'pointer'}}><FaCalendarAlt /> Appointments</li>
           
           <li onClick={() => navigate('/patientprescription')} style={{cursor: 'pointer'}}><FaCalendarAlt /> Prescriptions</li>

           <li onClick={() => navigate('/MedicationTracking"')} style={{cursor: 'pointer'}}><FaPills /> Medication</li>
           <li onClick={() => navigate('/chat')} style={{cursor: 'pointer'}}><FaComments/> Chat</li>
           <hr className="sidebar-divider"/>
           <li onClick={handleAccountSettings} style={{cursor: 'pointer'}}><FaCog /> Settings</li>
           <li className="logout" onClick={handleLogout} style={{cursor: 'pointer'}}><FaSignOutAlt /> Sign Out</li>
        </ul>
      </div>

      {/* --- Main Content Area (Shifts with Margin) --- */}
      <div className={`main-content ${sidebarOpen ? "shifted" : ""}`}>

        {/* Dashboard Header Section */}
        <div className="dashboard-header">
           <h1>Healthcare Management Dashboard</h1>
           <p>Welcome, {user.firstName}! Access your health tools below.</p>
        </div>

        {/* Feature Cards */}
        <div className="dashboard-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="dashboard-card"
              // Apply accent color to the top border
              style={{ borderTop: `5px solid ${feature.accent}` }}
            >
              {/* Icon wrapped for background styling */}
              <div className="card-icon-wrapper" style={{ backgroundColor: `${feature.accent}25`}}> {/* Slightly stronger bg */}
                 {feature.icon}
              </div>
              <h3>{feature.title}</h3> {/* Icon removed from here */}
              <p>{feature.desc}</p>
              <button
                className="card-button"
                onClick={() => feature.link && navigate(feature.link)}
                disabled={!feature.link}
                // Apply accent color to button background
                style={{ backgroundColor: feature.accent }}
              >
                  {feature.btn}
              </button>
            </div>
          ))}
        </div>


      </div> {/* End Main Content */}
    </div> // End dashboard-container
  );
};

export default Dashboard;