import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
   FaTimes, FaCog, FaSignOutAlt, FaUserInjured,
  FaCalendarCheck, FaComments, FaFileMedical
} from "react-icons/fa";
import { FaUserDoctor } from "react-icons/fa6";
import { getUserProfile, logoutUser } from "../services/authService";
import TopNavbar from "../components/TopNavbar"; // Adjust path if needed
import "./styles/consultantDashboard.css"; // Ensure this path is correct

const ConsultantDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Start closed
  const [user, setUser] = useState({ firstName: "Loading...", lastName: "User", role: "Doctor" });

  // Fetch user data
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

  // Toggle function passed to TopNavbar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => { logoutUser(); window.location.href = "/login"; };
  const handleAccountSettings = () => { navigate("/profile"); };
  const goToPatients = () => navigate('/consultant/patients');
  const goToAppointments = () => navigate('/consultant/appointments');
  const goToChat = () => navigate('/chat');
  const goToManageMedications = () => navigate('/consultant/manage-medications');

  return (
    // Root container - may not need specific class if just for background
    <div className="consultant-dashboard-wrapper"> {/* Optional wrapper if needed */}

      {/* --- Top Navbar (Fixed) --- */}
      <TopNavbar onToggleSidebar={toggleSidebar} />

      {/* --- Sidebar (Fixed Position) --- */}
      <div className={`consultant-sidebar ${sidebarOpen ? "open" : ""}`}>
         <button className="close-btn" onClick={toggleSidebar} aria-label="Close sidebar"><FaTimes /></button>
         <div className="sidebar-header">
            <FaUserDoctor className="user-icon" />
            <h3>Dr. {user.lastName}</h3>
            <p>Role: {user.role}</p>
         </div>
         <ul className="sidebar-menu">
             <li onClick={goToPatients}><FaUserInjured /> View Patients</li>
             <li onClick={goToAppointments}><FaCalendarCheck /> Appointments</li>
             <li onClick={goToManageMedications}><FaFileMedical /> Manage Medications</li>
             <li onClick={goToChat}><FaComments /> Chat</li>
             <hr className="sidebar-divider" />
             <li onClick={handleAccountSettings}><FaCog /> Account Settings</li>
             <li className="logout" onClick={handleLogout}><FaSignOutAlt /> Sign Out</li>
          </ul>
      </div>

      {/* --- Main Content Area (Shifts with Margin) --- */}
      {/* Apply 'shifted' class based on sidebarOpen */}
      <div className={`consultant-main-content ${sidebarOpen ? "shifted" : ""}`}>

        {/* Dashboard Header Section */}
        <div className="consultant-header">
           <h1>Welcome, Dr. {user.lastName}!</h1>
           <p>Manage your patients, appointments, and communications efficiently.</p>
        </div>

        {/* Feature Cards Grid */}
        <div className="consultant-cards">
          {[
             { title: "View Patients", desc: "Access patient records and history.", icon: <FaUserInjured />, action: goToPatients },
             { title: "Appointments", desc: "Manage your appointment schedule.", icon: <FaCalendarCheck />, action:goToAppointments },
             { title: "Manage Medications", desc: "Prescribe and manage patient medications.", icon: <FaFileMedical />, action: goToManageMedications },
             { title: "Consultant-Patient Chat", desc: "Communicate with your patients securely.", icon: <FaComments />, action: goToChat },
          ].map((feature, index) => (
            <div key={index} className="consultant-card" onClick={feature.action}>
              <h2>{feature.icon} {feature.title}</h2>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>


      </div> {/* End Main Content */}
    </div> // End consultant-dashboard-wrapper or consultant-dashboard
  );
};

export default ConsultantDashboard;