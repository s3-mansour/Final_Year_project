// src/pages/Appointment.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAppointment } from "../services/appointmentService";
import "./styles/Appointment.css";

const Appointment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // For inline error display
  const [formData, setFormData] = useState({
    date: "",
    time: "08:00 AM",
    message: "",
  });

  const timeSlots = [
    "08:00 AM",
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
  ];

  // Handle form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit the appointment form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear any previous error

    // Basic validation
    if (!formData.date || !formData.time) {
      setErrorMessage("Please select a date and time.");
      return;
    }

    setLoading(true);
    try {
      await createAppointment({
        date: formData.date,
        time: formData.time,
        message: formData.message,
      });
      // On success, navigate to dashboard or wherever you want
      navigate("/dashboard");
    } catch (error) {
      console.error("Error scheduling appointment:", error);

      // Attempt to read the server’s custom error message
      const serverMsg = error.response?.data?.message;
      const fallbackMsg = error.message || "Something went wrong. Please try again.";
      setErrorMessage(serverMsg || fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointment-page">
      <div className="appointment-container">
        <h1 className="appointment-title">Schedule Your Appointment</h1>
        <p className="appointment-subtext">Choose a convenient date and time</p>
        
        <form className="appointment-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="date">Preferred Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              required
              onChange={handleChange}
            />
          </div>
          <div className="input-group">
            <label htmlFor="time">Preferred Time Slot</label>
            <select
              id="time"
              name="time"
              value={formData.time}
              required
              onChange={handleChange}
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="message">Additional Notes (Optional)</label>
            <textarea
              id="message"
              name="message"
              placeholder="Any specific requests?"
              rows="3"
              value={formData.message}
              onChange={handleChange}
            />
          </div>
          
          {/* Display error message inline */}
          {errorMessage && (
            <p className="error-message">{errorMessage}</p>
          )}

          <button type="submit" className="appointment-button" disabled={loading}>
            {loading ? "Scheduling..." : "📅 Book Appointment"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Appointment;
