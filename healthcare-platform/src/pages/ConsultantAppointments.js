// src/pages/ConsultantAppointments.js
import React, { useEffect, useState } from "react";
import { getConsultantAppointments } from "../services/consultantService";
import "./styles/ConsultantAppointments.css";

const ConsultantAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getConsultantAppointments();
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="consultant-appointments-page">
      <h1>Your Appointments</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      {appointments.length === 0 && !loading ? (
        <p>No appointments found.</p>
      ) : (
        <ul className="appointments-list">
          {appointments.map((appt) => (
            <li key={appt._id} className="appointment-item">
              <p>
                <strong>Date:</strong> {new Date(appt.date).toLocaleDateString()}
              </p>
              <p>
                <strong>Time:</strong> {appt.time}
              </p>
              <p>
                <strong>Patient:</strong>{" "}
                {appt.patient?.firstName} {appt.patient?.lastName}
              </p>
              <p>
                <strong>Notes:</strong> {appt.notes || "None"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ConsultantAppointments;
