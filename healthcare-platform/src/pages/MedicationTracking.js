import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import MedicationForm from "./MedicationForm";
import "./MedicationTracking.css";

const MedicationTracking = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowForm(true);
  };

  return (
    <div className="medication-page">
      <header className="top-bar">
        <h1>Medication Tracking</h1>
      </header>

      <div className="calendar-container">
        <p>Click on a date to add medication details</p>
        <Calendar onClickDay={handleDateClick} className="styled-calendar" />
      </div>

      {showForm && (
        <MedicationForm selectedDate={selectedDate} closeForm={() => setShowForm(false)} />
      )}
    </div>
  );
};

export default MedicationTracking;
