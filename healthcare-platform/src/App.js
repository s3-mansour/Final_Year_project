// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard"; // Patient dashboard
import Signup from "./pages/signup";
import ConsultantDashboard from "./pages/ConsultantDashboard"; // Doctor dashboard
import { getUserProfile } from "./services/authService";
import Appointment from "./pages/Appointment";
import PatientAppointments from "./pages/PatientAppointments";
import MedicationTracking from "./pages/MedicationTracking";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import ConsultantPatients from "./pages/ConsultantPatients";
import ConsultantAppointments from "./pages/ConsultantAppointments";
import Availability from "./pages/Availability"
import ManagePatientMedications from './pages/ManagePatientMedications';
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // Full user data including role
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      try {
        const userData = await getUserProfile();
        console.log("Fetched user data:", userData);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const isDoctor = user && user.role === "doctor";
  console.log("Computed isDoctor:", isDoctor, "User role:", user ? user.role : "none");

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/availability" element={<Availability />} />
        {/* Patient Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              isDoctor ? (
                <Navigate to="/consultant/dashboard" replace />
              ) : (
                <Dashboard />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Consultant (Doctor) Dashboard Route */}
        <Route
          path="/consultant/dashboard"
          element={
            isAuthenticated ? (
              isDoctor ? (
                <ConsultantDashboard />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Other Routes */}
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/patient-appointments" element={<PatientAppointments />} />
        <Route path="/consultant/patients" element={<ConsultantPatients />} />
        <Route path="/consultant/appointments" element={<ConsultantAppointments />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/medicationtracking" element={<MedicationTracking />} />
        <Route path="/chat" element={<Chat />} />
        <Route
    path="/consultant/manage-medications" // Or your preferred path
    element={
        /* Use your ProtectedRoute logic here */
        isAuthenticated && isDoctor ? (
            <ManagePatientMedications />
        ) : (
            <Navigate to="/login" replace /> /* Or appropriate redirect */
        )
    }
/>
      </Routes>
    </Router>
  );
}

export default App;
