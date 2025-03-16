import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Welcome.css';

const Welcome = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/login'); // Redirect to login page
  };

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <h1 className="welcome-title">Welcome to Healthcare Platform</h1>
        <p className="welcome-subtitle">
          Manage your health seamlessly with our integrated platform.
        </p>
        <button className="get-started-button" onClick={handleClick}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default Welcome;
