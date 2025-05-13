// src/pages/Availability.js
import React, { useState, useEffect } from "react";
import "./styles/Availability.css"; // Assuming you have this CSS file

// Services for CRUD operations for doctor availability
import {
  getAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
} from "../services/availabilityService"; // Ensure these services are implemented correctly

// A small inline ConfirmModal component with updated class names
// This component is fine as is, using custom CSS classes
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
  // --- State for fetching and listing availability blocks ---
  const [slots, setSlots] = useState([]); // Stores the list of availability blocks for the doctor
  const [errorMessage, setErrorMessage] = useState(""); // State for displaying errors

  // --- State for adding a new availability block ---
  const [date, setDate] = useState(""); // Date for the new block
  const [startTime, setStartTime] = useState(""); // Start time for the new block
  const [endTime, setEndTime] = useState(""); // End time for the new block
  const [slotDuration, setSlotDuration] = useState(30); // *** NEW State: Slot duration for the new block (default to 30 mins) ***


  // --- State for inline editing ---
  const [editingId, setEditingId] = useState(null); // Stores the _id of the slot being edited, or null
  const [editDate, setEditDate] = useState(""); // Date for the edited block
  const [editStartTime, setEditStartTime] = useState(""); // Start time for the edited block
  const [editEndTime, setEditEndTime] = useState(""); // End time for the edited block
  const [editSlotDuration, setEditSlotDuration] = useState(30); // *** NEW State: Slot duration for the edited block ***


  // --- State for the confirmation modal ---
  const [confirmVisible, setConfirmVisible] = useState(false); // Controls modal visibility
  const [deleteTargetId, setDeleteTargetId] = useState(null); // Stores the _id of the slot to delete


  // --- Effect to fetch availability slots on component mount ---
  useEffect(() => {
    fetchSlots(); // Call the function to load initial data
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Function to fetch all availability slots from backend for the logged-in doctor ---
  const fetchSlots = async () => {
    try {
      const data = await getAvailability(); // Call the service to get availability
      setSlots(Array.isArray(data) ? data : []); // Update state, ensure it's an array
      setErrorMessage(""); // Clear any previous error on successful fetch
    } catch (err) {
      console.error("Failed to fetch availability:", err); // Log the error details
      setErrorMessage("Failed to load availability slots."); // Set user-friendly error message
      setSlots([]); // Clear slots on error
    }
  };

  // --- Helper function to parse "YYYY-MM-DD" into a Date object ---
  // Used for client-side date validation
  const parseDate = (dateStr) => {
      if (!dateStr) return new Date('Invalid Date');
    const [year, month, day] = dateStr.split("-");
    // Month is 0-indexed in JavaScript Date object
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
     // Check if parsing was successful (avoids creating a Date object for invalid strings)
    return isNaN(dateObj.getTime()) ? new Date('Invalid Date') : dateObj;
  };

   // --- Helper function to convert HH:MM string to minutes past midnight ---
   // Used for client-side time validation (overlap check)
   // *** IMPORTANT: Ensure this matches the time format from input type="time" (HH:MM 24hr) ***
   const timeToMinutes = (timeStr) => {
       if (!timeStr) return NaN;
       const [hours, minutes] = timeStr.split(':').map(Number);
       if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
           return NaN;
       }
       return hours * 60 + minutes;
   };


  // --- Client-side form validation ---
  // Validates date format, future dates, weekends, time range, startTime < endTime, and slotDuration
  const validateForm = (d, sT, eT, sD) => {
    setErrorMessage(""); // Clear previous error

    // 1) Check required fields
    if (!d || !sT || !eT || sD === undefined || sD === null || typeof sD !== 'number' || sD <= 0) {
      setErrorMessage("Please fill all required fields (Date, Start Time, End Time, and Slot Duration > 0).");
      return false;
    }

    const selectedDate = parseDate(d);
    // Check if the parsed date is valid
    if (isNaN(selectedDate.getTime())) {
        setErrorMessage("Invalid date format.");
        return false;
    }

    // 2) Date must be today or in future
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Get today's date without time
    if (selectedDate < today) {
      setErrorMessage("Date cannot be in the past.");
      return false;
    }

    // 3) Exclude weekends (Sat=6, Sun=0)
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      setErrorMessage("Weekends are not allowed (no Saturdays or Sundays).");
      return false;
    }

    // 4) Time must be within a reasonable range (e.g., 07:00 to 17:00)
    // *** NOTE: This client-side check mirrors backend validation for consistency ***
    const startMinutes = timeToMinutes(sT);
    const endMinutes = timeToMinutes(eT);

    if (isNaN(startMinutes) || isNaN(endMinutes)) {
        setErrorMessage("Invalid time format. Use HH:MM.");
        return false;
    }

     // Check if time is within the 07:00 - 17:00 (5:00 PM) range (in minutes)
     const minTime = timeToMinutes("07:00"); // 7 * 60 = 420
     const maxTime = timeToMinutes("17:00"); // 17 * 60 = 1020

    if (startMinutes < minTime || startMinutes > maxTime) {
      setErrorMessage("Start time must be between 07:00 and 17:00.");
      return false;
    }
    if (endMinutes < minTime || endMinutes > maxTime) {
      setErrorMessage("End time must be between 07:00 and 17:00.");
      return false;
    }


    // 5) startTime < endTime
    if (startMinutes >= endMinutes) {
      setErrorMessage("End time must be after start time.");
      return false;
    }

     // 6) Slot duration must be positive
     if (sD <= 0) {
         setErrorMessage("Slot duration must be greater than 0.");
         return false;
     }
     // Optional: Add checks like slot duration is a factor of range duration, etc.

    // Client-side overlap check (Optional, backend check is primary)
    // This is more complex as it needs to compare ranges, skipping for this basic validation

    return true; // All client-side checks passed
  };

  // --- Handle adding a new availability block ---
  const handleAddAvailability = async (e) => {
    e.preventDefault();
    // Validate form data including the new slotDuration
    if (!validateForm(date, startTime, endTime, slotDuration)) return;

    try {
      // Call the service to create the new availability block
      await createAvailability({ date, startTime, endTime, slotDurationMinutes: slotDuration });

      // Clear form fields on success
      setDate("");
      setStartTime("");
      setEndTime("");
      setSlotDuration(30); // Reset duration to default

      fetchSlots(); // Refresh the list of slots
      setErrorMessage(""); // Clear error message
    } catch (err) {
      console.error("Error adding availability:", err); // Log error details
      // Display specific backend error message if available, otherwise a generic one
      const serverMsg = err.response?.data?.message || "Failed to add availability.";
      setErrorMessage(serverMsg);
    }
  };

  // --- Enter edit mode for a specific slot ---
  const handleEditClick = (slot) => {
    setEditingId(slot._id); // Set the ID of the slot being edited
    // Convert the date from backend (assuming it's 'YYYY-MM-DD' string) to input type="date" format
    setEditDate(slot.date); // Assuming backend sends 'YYYY-MM-DD' string
    setEditStartTime(slot.startTime);
    setEditEndTime(slot.endTime);
    setEditSlotDuration(slot.slotDurationMinutes); // *** NEW: Set edit state for slot duration ***
    setErrorMessage(""); // Clear error message when entering edit mode
  };

  // --- Cancel edit mode ---
  const handleEditCancel = () => {
    setEditingId(null); // Exit edit mode
    setErrorMessage(""); // Clear error message
  };

  // --- Handle saving an edited availability block ---
  const handleEditSubmit = async (id) => {
    // Validate form data for editing including the new editSlotDuration
    if (!validateForm(editDate, editStartTime, editEndTime, editSlotDuration)) return;

    try {
      // Call the service to update the availability block
      await updateAvailability(id, {
        date: editDate,
        startTime: editStartTime,
        endTime: editEndTime,
        slotDurationMinutes: editSlotDuration, // *** NEW: Include updated slot duration ***
      });

      setEditingId(null); // Exit edit mode on success
      fetchSlots(); // Refresh the list of slots
      setErrorMessage(""); // Clear error message
    } catch (err) {
      console.error("Error updating availability:", err); // Log error details
      // Display specific backend error message if available
      const serverMsg = err.response?.data?.message || "Failed to update availability.";
      setErrorMessage(serverMsg);
    }
  };

  // --- Handle delete button click (shows confirmation modal) ---
  const handleDeleteClick = (id) => {
    setDeleteTargetId(id); // Store the ID of the slot to be deleted
    setConfirmVisible(true); // Show the confirmation modal
  };

  // --- Handle confirmation in the delete modal ---
  const handleConfirmDelete = async () => {
    try {
      // Call the service to delete the availability block
      await deleteAvailability(deleteTargetId);
      fetchSlots(); // Refresh the list of slots after deletion
    } catch (err) {
      console.error("Error deleting availability:", err); // Log error details
      // Display specific backend error message if available
      const serverMsg = err.response?.data?.message || "Failed to delete availability.";
      setErrorMessage(serverMsg);
    } finally {
      // Always close the modal and clear target ID after action
      setDeleteTargetId(null);
      setConfirmVisible(false);
    }
  };

  // --- Handle cancellation in the delete modal ---
  const handleCancelDelete = () => {
    setDeleteTargetId(null); // Clear the target ID
    setConfirmVisible(false); // Hide the modal
  };

  // --- JSX Rendering ---
  return (
    <div className="availability-page"> {/* Page container */}
      <h1>Your Availability</h1> {/* Page title */}

      {/* Display main error message */}
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {/* --- List of existing availability slots --- */}
      <ul className="availability-list"> {/* List container */}
        {Array.isArray(slots) && slots.map((slot) => {
          if (editingId === slot._id) {
            // --- Inline editing form for a slot ---
            return (
              <li key={slot._id} className="availability-item editing"> {/* Item with editing class */}
                <div className="availability-info"> {/* Info section */}
                  <div className="form-group-inline"> {/* Group for date */}
                    <label>Date:</label>
                    <input
                      type="date"
                      value={editDate}
                       min={new Date().toISOString().split("T")[0]} // Prevent past dates in HTML
                      onChange={(e) => setEditDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group-inline"> {/* Group for start time */}
                    <label>From:</label>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group-inline"> {/* Group for end time */}
                    <label>To:</label>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={(e) => setEditEndTime(e.target.value)}
                      required
                    />
                  </div>
                   {/* *** NEW: Slot duration input for editing *** */}
                   <div className="form-group-inline"> {/* Group for slot duration */}
                       <label>Slot Duration (mins):</label>
                       <input
                           type="number"
                           value={editSlotDuration}
                           onChange={(e) => setEditSlotDuration(Number(e.target.value))}
                           min="1" // Minimum duration is 1 minute
                           required
                       />
                   </div>
                </div>
                <div className="availability-actions"> {/* Actions section */}
                  {/* Buttons to save or cancel editing */}
                  <button className="save-button" onClick={() => handleEditSubmit(slot._id)}>Save</button>
                  <button className="cancel-button" onClick={handleEditCancel}>Cancel</button>
                </div>
              </li>
            );
          } else {
            // --- Normal display of a slot ---
            return (
              <li key={slot._id} className="availability-item"> {/* Normal item */}
                <div className="availability-info"> {/* Info section */}
                  {/* Display slot details */}
                  <p><strong>Date:</strong> {new Date(slot.date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {slot.startTime} to {slot.endTime}</p>
                   {/* *** NEW: Display slot duration *** */}
                   <p><strong>Slot Duration:</strong> {slot.slotDurationMinutes} mins</p>
                </div>
                <div className="availability-actions"> {/* Actions section */}
                  {/* Buttons to edit or delete */}
                  <button className="edit-button" onClick={() => handleEditClick(slot)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDeleteClick(slot._id)}>Delete</button>
                </div>
              </li>
            );
          }
        })}
      </ul>

      {/* --- Form to add a new availability block --- */}
      <form className="availability-form" onSubmit={handleAddAvailability}> {/* Form container */}
        <h3>Add New Availability Block</h3> {/* Form title */}
        <div className="form-group"> {/* Group for date */}
          <label htmlFor="add-date">Date</label>
          <input
            type="date"
            id="add-date"
            min={new Date().toISOString().split("T")[0]} // Block past days in HTML
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group"> {/* Group for start time */}
          <label htmlFor="add-startTime">Start Time</label>
          <input
            type="time"
            id="add-startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>

        <div className="form-group"> {/* Group for end time */}
          <label htmlFor="add-endTime">End Time</label>
          <input
            type="time"
            id="add-endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>

         {/* *** NEW: Slot duration input for adding *** */}
         <div className="form-group"> {/* Group for slot duration */}
             <label htmlFor="add-slotDuration">Slot Duration (mins)</label>
             <input
                 type="number"
                 id="add-slotDuration"
                 value={slotDuration}
                 onChange={(e) => setSlotDuration(Number(e.target.value))}
                 min="1" // Minimum duration is 1 minute
                 required
             />
         </div>


        {/* Submit button for the form */}
        <button type="submit" className="submit-btn"> {/* Apply CSS class */}
          Add Availability
        </button>
      </form>

      {/* --- Custom confirmation modal --- */}
      <ConfirmModal
        visible={confirmVisible}
        title="Confirm Deletion"
        message="Are you sure you want to delete this availability?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default Availability;