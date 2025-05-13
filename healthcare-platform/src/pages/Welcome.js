// src/pages/Welcome.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

import './styles/Welcome.css'; // Ensure this path is correct and the CSS is updated

const Welcome = () => {
  const navigate = useNavigate();

  // Handlers for navigation buttons
  const handleLoginClick = () => {
    navigate('/login'); // Navigate to login page
  };

  const handleSignupClick = () => {
      navigate('/signup'); // Navigate to signup page
  };

  return (
    // Main container for the entire welcome page
    <div className="welcome-page">

        {/* --- Hero Section --- */}
        {/* This is the main introductory section, often with a background image */}
        <section className="hero-section">
            <div className="hero-content">
                <h1 className="hero-title">Your Health, Integrated.</h1> {/* Catchy Title */}
                <p className="hero-subtitle">
                    Seamless Medication Tracking, Appointment Management, and Direct Doctor Communication.
                </p>
                {/* Call to Action Buttons */}
                <div className="hero-cta-buttons">
                    {/* Optional: Add a "Learn More" button */}
                    {/* <button className="btn btn-secondary">Learn More</button> */}
                    <button className="btn btn-primary" onClick={handleSignupClick}>
                        Get Started {/* Primary CTA for new users */}
                    </button>
                    <button className="btn btn-outline" onClick={handleLoginClick}>
                        Existing User? Log In {/* Secondary CTA for returning users */}
                    </button>
                </div>
            </div>
        </section>

        {/* --- Features Section (Optional) --- */}
        {/* Describe key benefits/features */}
        <section className="features-section">
            <div className="container"> {/* Optional: Use a container class for width limiting */}
                <h2 className="section-title">Why Choose Healthcare Platform?</h2>
                <div className="features-grid"> {/* Grid layout for features */}
                    <div className="feature-item">
                        {/* <div className="feature-icon"><FaPills /></div> */} {/* Icon */}
                        <h3>Effortless Medication Tracking</h3>
                        <p>Never miss a dose. Easily manage your medication schedule and track adherence.</p>
                    </div>
                     <div className="feature-item">
                        {/* <div className="feature-icon"><FaCalendarCheck /></div> */} {/* Icon */}
                        <h3>Simplified Appointments</h3>
                        <p>Book, manage, and view your appointments with healthcare providers seamlessly.</p>
                    </div>
                     <div className="feature-item">
                        {/* <div className="feature-icon"><FaComments /></div> */} {/* Icon */}
                        <h3>Secure Communication</h3>
                        <p>Chat directly and securely with your doctor for quick questions and support.</p>
                    </div>
                    {/* Add more features */}
                </div>
            </div>
        </section>


    </div> // End welcome-page
  );
};

export default Welcome;