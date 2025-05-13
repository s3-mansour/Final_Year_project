// src/pages/ConsultantPatients.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPatientsList } from "../services/consultantService";
// Import chatService to start/find conversations
import * as chatService from "../services/chatService"; // Assuming chatService is available
// Import icons for buttons
// Replace FaEye (Details icon) with FaFileMedical (Medications icon) if needed
import { FaCommentDots, FaFileMedical } from 'react-icons/fa'; // Icons for chat and medications

import "./styles/ConsultantPatients.css"; // Assuming you have styles


const ConsultantPatients = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // State to track which patient is being processed for an action (e.g., starting chat)
  const [processingPatientId, setProcessingPatientId] = useState(null);


  // --- Effect to fetch patients on component mount ---
  useEffect(() => { fetchPatients(); }, []);

  // --- Function to fetch patients for the logged-in doctor's city ---
  const fetchPatients = async () => {
    setLoading(true); setError("");
    try {
      // getPatientsList likely fetches patients filtered by the doctor's location on the backend
      const data = await getPatientsList();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Failed to load patients.");
      setPatients([]);
    } finally { setLoading(false); }
  };

  // --- Handlers for Patient Item Actions ---

  // REMOVED: handleViewDetails handler as it's replaced
  /*
  const handleViewDetails = (patientId) => {
      // Assuming you have a route like /consultant/patients/:patientId/details
      navigate(`/consultant/patients/${patientId}/details`);
  };
  */

  // *** NEW Handler for Check Medications button ***
  const handleCheckMedications = (patientId) => {
      // Navigate to the Manage Patient Medications page, passing the patientId as a query parameter
      navigate(`/consultant/manage-medications?patientId=${patientId}`);
      // Ensure the Manage Patient Medications page (src/pages/ManagePatientMedications.js)
      // reads this query parameter on load to select the patient.
  };


  // Handle clicking "Start Chat" button
  const handleStartChat = async (patient) => { // Pass the full patient object
      if (!patient?._id || processingPatientId) return;

      setProcessingPatientId(patient._id); // Set processing state for this patient
      setError(""); // Clear previous error

      try {
          // Call chatService to find or create a conversation with this patient
          const conversation = await chatService.findOrCreateConversation(patient._id);
          console.log(`Conversation found/created with patient ${patient._id}: ${conversation?._id}`);

          // Navigate to the chat page.
          // Pass the conversation ID to the chat page so it automatically selects the conversation.
          // Example: Use state (requires Chat.js to read state)
          // navigate('/chat', { state: { conversationId: conversation._id } });
          // Example: Use URL param (requires chat route to accept :conversationId)
          navigate(`/chat/`);


      } catch (err) {
          console.error(`Error starting chat with patient ${patient?._id}:`, err);
          const serverMsg = err.response?.data?.message || "Failed to start chat.";
          setError(serverMsg); // Display error message
      } finally {
          setProcessingPatientId(null); // Clear processing state
      }
  };


  // --- Handler for Back to Dashboard button ---
  const handleBackToDashboard = () => {
    navigate('/consultant/dashboard'); // Navigate to the doctor's dashboard
  };


  // --- JSX Rendering ---
  return (
    <div className="consultant-patients-page"> {/* Page container. */}
      <h1>Patients in Your City</h1> {/* Page title. */}

      {/* Display general loading, error, or empty state */}
      {loading && <p>Loading patients...</p>}
      {error && <p className="error-message">{error}</p>}

      {patients.length === 0 && !loading && !error ? ( // Show empty message only if not loading and no error
        <p>No patients found in your city.</p>
      ) : (
        // --- List of patients ---
        <ul className="patients-list">
          {Array.isArray(patients) && patients.map((patient) => (
            // Ensure patient object has _id for key
            <li key={patient._id} className="patient-item">
              <div className="patient-info"> {/* Container for patient details */}
                <h3>{patient.firstName} {patient.lastName}</h3>
                <p>Email: {patient.email}</p>
                <p>Location: {patient.location}</p>
              </div>
               {/* --- Action Buttons for Each Patient --- */}
               <div className="patient-actions"> {/* Container for buttons */}
                  {/* *** REPLACED: Check Medications Button (was View Details) *** */}
                  <button
                      className="action-button check-medications-button" // Apply CSS class
                      onClick={() => handleCheckMedications(patient._id)} // Call handler with patient ID
                  >
                      <FaFileMedical /> Meds
                  </button>
                  {/* Start Chat Button */}
                  <button
                      className="action-button start-chat-button" // Apply CSS class
                      onClick={() => handleStartChat(patient)} // Call handler, pass patient object
                      disabled={processingPatientId === patient._id} // Disable if this patient's chat is processing
                  >
                      {processingPatientId === patient._id ? 'Starting Chat...' : <><FaCommentDots /> Chat</>} {/* Button text and icon */}
                  </button>
               </div>
            </li>
          ))}
        </ul>
      )}

      {/* Back to Dashboard Button */}
      {!loading && (
          <button
              onClick={handleBackToDashboard} // Call the navigation handler
              className="back-to-dashboard-btn" // Apply CSS class
          >
              Back to Dashboard
          </button>
      )}

    </div>
  );
};

export default ConsultantPatients;