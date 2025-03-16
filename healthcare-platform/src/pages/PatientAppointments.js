// src/pages/PatientAppointments.js
import React, { useEffect, useState } from "react";
import {
  getAppointments,
  updateAppointment,
  deleteAppointment,
} from "../services/appointmentService";
import "./styles/PatientAppointments.css";

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Inline editing states
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: "",
    time: "",
    notes: "",
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  // Start editing
  const handleEditClick = (appt) => {
    setEditingId(appt._id);
    setEditFormData({
      date: appt.date ? new Date(appt.date).toISOString().split("T")[0] : "",
      time: appt.time || "",
      notes: appt.notes || "",
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({ date: "", time: "", notes: "" });
  };

  // Handle changes in edit form
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit edit form
  const handleEditSubmit = async (e, id) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateAppointment(id, editFormData);
      alert("Appointment updated successfully!");
      setEditingId(null);
      fetchAppointments();
    } catch (err) {
      console.error("Error updating appointment:", err);

      // Attempt to display server message
      const serverMsg = err.response?.data?.message;
      alert(serverMsg || "Failed to update appointment.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel (delete) an appointment
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    setLoading(true);
    try {
      const response = await deleteAppointment(id);
      alert(response.message || "Appointment cancelled successfully!");
      fetchAppointments();
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      const serverMsg = err.response?.data?.message;
      alert(serverMsg || "Failed to cancel appointment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-appointments-page">
      <h1>Your Appointments</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}

      {appointments.length === 0 && !loading ? (
        <p>No appointments found.</p>
      ) : (
        <ul className="appointments-list">
          {appointments.map((appt) => (
            <li key={appt._id} className="appointment-item">
              <div className="appointment-info">
                <p><strong>Date:</strong> {new Date(appt.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {appt.time}</p>
                <p>
                  <strong>Doctor:</strong> 
                  {appt.doctor?.firstName} {appt.doctor?.lastName} ({appt.doctor?.location})
                </p>
                <p><strong>Notes:</strong> {appt.notes || "None"}</p>
              </div>
              <div className="appointment-actions">
                <button onClick={() => handleEditClick(appt)}>Edit</button>
                <button onClick={() => handleDelete(appt._id)}>Cancel</button>
              </div>

              {/* Inline edit form if this appointment is being edited */}
              {editingId === appt._id && (
                <form className="edit-form" onSubmit={(e) => handleEditSubmit(e, appt._id)}>
                  <div className="input-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={editFormData.date}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Time</label>
                    <input
                      type="text"
                      name="time"
                      value={editFormData.time}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      rows="3"
                      value={editFormData.notes}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="edit-form-actions">
                    <button type="submit">Update</button>
                    <button type="button" onClick={cancelEditing}>Cancel</button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PatientAppointments;
