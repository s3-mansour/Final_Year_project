import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Appointment.css"; // Ensure styles are properly linked

const Appointment = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    date: "",
    time: "08:00 AM",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.time) {
      alert("Please select a date and time.");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate async request
      alert("Appointment Scheduled Successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="appointment-container">
      <div className="appointment-card">
        <h1 className="appointment-title">Schedule Your Appointment</h1>
        <p className="appointment-subtext">Choose a convenient date and time</p>

        <form className="appointment-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Preferred Date</label>
            <input 
              type="date" 
              name="date" 
              value={formData.date}
              required 
              onChange={handleChange} 
            />
          </div>

          <div className="input-group">
            <label>Preferred Time Slot</label>
            <select 
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
            <label>Additional Notes (Optional)</label>
            <textarea 
              name="message" 
              placeholder="Any specific requests?" 
              rows="3" 
              value={formData.message}
              onChange={handleChange}
            ></textarea>
          </div>

          <button type="submit" className="appointment-button" disabled={loading}>
            {loading ? "Scheduling..." : "📅 Book Appointment"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Appointment;
