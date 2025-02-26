import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Signup from './pages/signup';
import { getUserProfile } from './services/authService'; // Import API calls
import Appointment from './pages/Appointment';
import MedicationTracking from "./pages/MedicationTracking";
import Chat from "./pages/Chat";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getUserProfile();
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Prevents flickering on load
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/appointment" element={<Appointment />}/>
        <Route path="/MedicationTracking" element={<MedicationTracking />}/>
        <Route path="/Chat" element={<Chat />}/>
      </Routes>
    </Router>
  );
}

export default App;
