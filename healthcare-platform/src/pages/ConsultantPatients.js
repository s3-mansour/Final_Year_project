// src/pages/ConsultantPatients.js
import React, { useEffect, useState } from "react";
import { getConsultantPatients } from "../services/consultantService";
import "./styles/ConsultantPatients.css";

const ConsultantPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getConsultantPatients();
      setPatients(data);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Failed to load patients.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="consultant-patients-page">
      <h1>Patients in Your City</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      {patients.length === 0 && !loading ? (
        <p>No patients found in your city.</p>
      ) : (
        <ul className="patients-list">
          {patients.map((patient) => (
            <li key={patient._id} className="patient-item">
              <h3>
                {patient.firstName} {patient.lastName}
              </h3>
              <p>Email: {patient.email}</p>
              <p>Location: {patient.location}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ConsultantPatients;
