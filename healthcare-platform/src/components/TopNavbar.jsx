import React from 'react';
import { FaBars } from 'react-icons/fa';
import './styles/TopNavbar.css'; 

const TopNavbar = ({ onToggleSidebar }) => {
  return (
    <header className="top-navbar">
      <div className="navbar-content">
        <button
          className="navbar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <FaBars />
        </button>

      </div>
    </header>
  );
};

export default TopNavbar;