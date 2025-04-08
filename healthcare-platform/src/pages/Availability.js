// src/pages/Availability.js
import React, { useState, useEffect } from "react";
import "./styles/Availability.css";

// Services for CRUD operations
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} from "../services/availabilityService";

// A small inline ConfirmModal component with updated class names
function ConfirmModal({ visible, title, message, onConfirm, onCancel }) {
  if (!visible) return null;

  return (
    <div className="my-modal-overlay">
      <div className="my-modal-container">
        <h3 className="my-modal-title">{title}</h3>
        <p className="my-modal-message">{message}</p>
        <div className="my-modal-buttons">
          <button className="my-confirm-button" onClick={onConfirm}>
            OK
          </button>
          <button className="my-cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const Availability = () => {
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Editing states
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  // Confirmation modal states
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    fetchSlots();
  }, []);

  // Fetch all availability slots from backend
  const fetchSlots = async () => {
    try {
      const data = await getAvailability();
      setSlots(data);
    } catch (err) {
      console.error("Failed to fetch availability:", err);
      setErrorMessage("Failed to load availability slots.");
    }
  };

  // Helper to parse "YYYY-MM-DD" into a Date object
  const parseDate = (dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  // Validate front-end constraints
  const validateForm = (d, sT, eT) => {
    setErrorMessage("");
    if (!d || !sT || !eT) {
      setErrorMessage("Please fill all fields.");
      return false;
    }

    const selectedDate = parseDate(d);
    const now = new Date();

    // 1) Date must be today or in future
    if (selectedDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      setErrorMessage("Date cannot be in the past.");
      return false;
    }

    // 2) Exclude weekends (Sat=6, Sun=0)
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      setErrorMessage("Weekends are not allowed (no Saturdays or Sundays).");
      return false;
    }

    // 3) Time must be between 07:00 and 17:00
    const [startH, startM] = sT.split(":");
    const [endH, endM] = eT.split(":");
    const startHour = parseInt(startH, 10);
    const endHour = parseInt(endH, 10);

    if (startHour < 7 || startHour > 17) {
      setErrorMessage("Start time must be between 07:00 and 17:00.");
      return false;
    }
    if (endHour < 7 || endHour > 17) {
      setErrorMessage("End time must be between 07:00 and 17:00.");
      return false;
    }

    // 4) startTime < endTime
    if (sT >= eT) {
      setErrorMessage("End time must be after start time.");
      return false;
    }

    return true;
  };

  // Add new slot
  const handleAddAvailability = async (e) => {
    e.preventDefault();
    if (!validateForm(date, startTime, endTime)) return;

    try {
      await createAvailability({ date, startTime, endTime });
      setDate("");
      setStartTime("");
      setEndTime("");
      fetchSlots();
    } catch (err) {
      console.error("Error adding availability:", err);
      const serverMsg = err.response?.data?.message || "Failed to add availability.";
      setErrorMessage(serverMsg);
    }
  };

  // Enter edit mode
  const handleEditClick = (slot) => {
    setEditingId(slot._id);
    // Convert "2025-03-23T00:00:00.000Z" -> "2025-03-23"
    setEditDate(slot.date.split("T")[0]);
    setEditStartTime(slot.startTime);
    setEditEndTime(slot.endTime);
  };

  // Cancel edit mode
  const handleEditCancel = () => {
    setEditingId(null);
    setErrorMessage("");
  };

  // Save edit
  const handleEditSubmit = async (id) => {
    if (!validateForm(editDate, editStartTime, editEndTime)) return;

    try {
      await updateAvailability(id, {
        date: editDate,
        startTime: editStartTime,
        endTime: editEndTime,
      });
      setEditingId(null);
      fetchSlots();
    } catch (err) {
      console.error("Error updating availability:", err);
      const serverMsg = err.response?.data?.message || "Failed to update availability.";
      setErrorMessage(serverMsg);
    }
  };

  // Show custom modal
  const handleDeleteClick = (id) => {
    setDeleteTargetId(id);
    setConfirmVisible(true);
  };

  // If user confirms delete
  const handleConfirmDelete = async () => {
    try {
      await deleteAvailability(deleteTargetId);
      fetchSlots();
    } catch (err) {
      console.error("Error deleting availability:", err);
      const serverMsg = err.response?.data?.message || "Failed to delete availability.";
      setErrorMessage(serverMsg);
    } finally {
      setDeleteTargetId(null);
      setConfirmVisible(false);
    }
  };

  // If user cancels delete
  const handleCancelDelete = () => {
    setDeleteTargetId(null);
    setConfirmVisible(false);
  };

  return (
    <div className="availability-page">
      <h1>Your Availability</h1>

      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      <ul className="availability-list">
        {slots.map((slot) => {
          if (editingId === slot._id) {
            // Inline editing
            return (
              <li key={slot._id} className="availability-item">
                <div className="availability-info">
                  <label>Date:</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                  <label>From:</label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                  />
                  <label>To:</label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                  />
                </div>
                <div className="availability-actions">
                  <button onClick={() => handleEditSubmit(slot._id)}>Save</button>
                  <button onClick={handleEditCancel}>Cancel</button>
                </div>
              </li>
            );
          } else {
            // Normal display
            return (
              <li key={slot._id} className="availability-item">
                <div className="availability-info">
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(slot.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Time:</strong> {slot.startTime} to {slot.endTime}
                  </p>
                </div>
                <div className="availability-actions">
                  <button onClick={() => handleEditClick(slot)}>Edit</button>
                  <button onClick={() => handleDeleteClick(slot._id)}>Delete</button>
                </div>
              </li>
            );
          }
        })}
      </ul>

      {/* Form to add a new availability */}
      <form className="availability-form" onSubmit={handleAddAvailability}>
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]} // block past days in HTML
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Start Time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>End Time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <button type="submit" className="submit-btn">
          Add Availability
        </button>
      </form>

      {/* Custom confirm modal with updated classes */}
      {confirmVisible && (
        <div className="my-modal-overlay">
          <div className="my-modal-container">
            <h3 className="my-modal-title">Confirm Deletion</h3>
            <p className="my-modal-message">
              Are you sure you want to delete this availability?
            </p>
            <div className="my-modal-buttons">
              <button className="my-confirm-button" onClick={handleConfirmDelete}>
                OK
              </button>
              <button className="my-cancel-button" onClick={handleCancelDelete}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Availability;
