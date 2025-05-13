// src/pages/ConsultantDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
   FaTimes, FaCog, FaSignOutAlt, FaUserInjured,
  FaCalendarCheck, FaComments, FaFileMedical
} from "react-icons/fa";
// Import additional icons
import { FaUserDoctor, FaCalendarDays } from "react-icons/fa6"; // Importing FaCalendarDays for Availability
import { getUserProfile, logoutUser } from "../services/authService";
import TopNavbar from "../components/TopNavbar"; // Adjust path if needed
import "./styles/consultantDashboard.css"; // Ensure this path is correct

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // State to control sidebar visibility
  const [user, setUser] = useState({ firstName: "Loading...", lastName: "User", role: "Doctor" }); // State to store user profile data

  // --- Effect to fetch user data on component mount ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch the logged-in user's profile
        const userData = await getUserProfile();
        setUser(userData); // Update user state
      } catch (error) {
        console.error("Auth Error in Dashboard:", error); // Log error
        logoutUser(); // Log out user if fetching profile fails (e.g., invalid token)
        navigate("/login", { replace: true }); // Redirect to login page
      }
    };
    fetchUserData(); // Call the async function
  }, [navigate]); // Dependency array includes navigate to avoid lint warnings, though it's stable

  // --- Sidebar Toggle Function ---
  // This function is passed to the TopNavbar component to control the sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen); // Toggle the sidebarOpen state
  };

  // --- Navigation Functions ---
  // Functions to navigate to different pages using react-router-dom
  const handleLogout = () => { logoutUser(); /* logoutUser already redirects */ }; // Calls the service, which redirects
  const handleAccountSettings = () => { navigate("/profile"); }; // Navigate to profile page
  const goToPatients = () => navigate('/consultant/patients'); // Navigate to view patients page
  const goToAppointments = () => navigate('/consultant/appointments'); // Navigate to view appointments page
  const goToChat = () => navigate('/chat'); // Navigate to chat page
  const goToManageMedications = () => navigate('/consultant/manage-medications'); // Navigate to manage medications page
  const goToAvailability = () => navigate('/availability'); // Navigation function for Availability page


  // --- JSX Rendering ---
  return (
    // Main wrapper for the dashboard layout
    <div className="consultant-dashboard-wrapper">

      {/* --- Top Navbar --- */}
      {/* TopNavbar component, receives the toggle function */}
      <TopNavbar onToggleSidebar={toggleSidebar} />

      {/* --- Sidebar --- */}
      {/* Sidebar component, its 'open' class controls visibility via CSS */}
      <div className={`consultant-sidebar ${sidebarOpen ? "open" : ""}`}>
         {/* Button to close the sidebar */}
         <button className="close-btn" onClick={toggleSidebar} aria-label="Close sidebar"><FaTimes /></button>
         {/* Sidebar header displaying doctor info */}
         <div className="sidebar-header">
            <FaUserDoctor className="user-icon" /> {/* Icon for doctor */}
            <h3>Dr. {user.lastName}</h3> {/* Display doctor's last name */}
            <p>Role: {user.role}</p> {/* Display user role */}
         </div>
         {/* Sidebar menu with navigation links */}
         <ul className="sidebar-menu">
             {/* Menu items with icons and click handlers */}
             <li onClick={goToPatients}><FaUserInjured /> View Patients</li>
             <li onClick={goToAppointments}><FaCalendarCheck /> Appointments</li>
             <li onClick={goToAvailability}><FaCalendarDays /> Availability</li> {/* Sidebar link for Availability */}
             <li onClick={goToManageMedications}><FaFileMedical /> Manage Medications</li>
             <li onClick={goToChat}><FaComments /> Chat</li>
             <hr className="sidebar-divider" /> {/* Divider line */}
             <li onClick={handleAccountSettings}><FaCog /> Account Settings</li>
             <li className="logout" onClick={handleLogout}><FaSignOutAlt /> Sign Out</li> {/* Logout link */}
          </ul>
      </div>

      {/* --- Main Content Area --- */}
      {/* Content area, applies 'shifted' class when sidebar is open for margin */}
      <div className={`consultant-main-content ${sidebarOpen ? "shifted" : ""}`}>

        {/* Dashboard Header Section */}
        <div className="consultant-header">
           <h1>Welcome, Dr. {user.lastName}!</h1> {/* Welcome message */}
           <p>Manage your patients, appointments, and communications efficiently.</p> {/* Subtitle */}
        </div>

        {/* Feature Cards Grid */}
        <div className="consultant-cards">
          {/* Array of feature objects mapped to render cards */}
          {[
             { title: "View Patients", desc: "Access patient records and history.", icon: <FaUserInjured />, action: goToPatients },
             { title: "Appointments", desc: "Manage your appointment schedule.", icon: <FaCalendarCheck />, action:goToAppointments },
             { title: "Availability", desc: "Manage your available time slots.", icon: <FaCalendarDays />, action: goToAvailability }, // Added comma here
             { title: "Manage Medications", desc: "Prescribe and manage patient medications.", icon: <FaFileMedical />, action: goToManageMedications },
             { title: "Consultant-Patient Chat", desc: "Communicate with your patients securely.", icon: <FaComments />, action: goToChat },
          ].map((feature, index) => (
            <div key={index} className="consultant-card" onClick={feature.action}> {/* Card div with click handler */}
              <h2>{feature.icon} {feature.title}</h2> {/* Card title with icon */}
              <p>{feature.desc}</p> {/* Card description */}
            </div>
          ))}
        </div>


      </div> {/* End Main Content */}
    </div> // End consultant-dashboard-wrapper
  );
};

export default ConsultantDashboard;