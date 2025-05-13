// src/pages/ConsultantAppointments.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Import service functions for appointments
import { getAppointments, updateAppointment } from "../services/appointmentService"; // get and update
// Import the custom Modal component
import Modal from '../components/Modal'; // Adjust path if needed

import "./styles/ConsultantAppointments.css"; // Styles for the page


const ConsultantAppointments = () => {
  const navigate = useNavigate();
  // State for appointments list
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state for fetching list
  const [error, setError] = useState(""); // Error state for fetching list

  // State to track which appointment is being processed for actions (Accept, Deny, Cancel, Dismiss)
  const [processingId, setProcessingId] = useState(null);

  // --- State for Confirmation Modal ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalAppointmentId, setModalAppointmentId] = useState(null); // Stores the ID of the appointment for the action
  const [modalActionType, setModalActionType] = useState(null); // Stores the type of action ('cancel' or 'dismiss')


  // --- Effect to fetch appointments on component mount ---
  useEffect(() => {
    fetchAppointments(); // Fetch initial list
  }, []);

  // --- Function to fetch appointments for the logged-in doctor ---
  const fetchAppointments = async () => {
    setLoading(true); setError("");
    try {
      const data = await getAppointments(); // Fetch appointments for the doctor (filtered by dismissal on backend)
      const sortedData = Array.isArray(data) ? data.sort((a, b) => {
           const dateComparison = new Date(a.date) - new Date(b.date);
           if (dateComparison !== 0) return dateComparison;
           return a.time.localeCompare(b.time);
      }) : [];
      setAppointments(sortedData);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Failed to load appointments.");
      setAppointments([]);
    } finally { setLoading(false); }
  };

  // --- Handlers for Direct Actions (Accept, Deny) ---
  // These actions update the appointment status directly without a modal

  // Handle accepting a pending appointment request (Updates status to Confirmed).
  const handleAccept = async (appointmentId) => {
    if (processingId) return;
    setProcessingId(appointmentId); setError("");
    try {
      await updateAppointment(appointmentId, { status: 'Confirmed' }); // Update status
      console.log(`Appointment ${appointmentId} accepted.`);
      fetchAppointments(); // Refresh list
    } catch (err) {
      console.error(`Error accepting appointment ${appointmentId}:`, err);
      const serverMsg = err.response?.data?.message || "Failed to accept appointment.";
      setError(serverMsg);
    } finally { setProcessingId(null); }
  };

  // Handle denying a pending appointment request (Updates status to Denied).
  const handleDeny = async (appointmentId) => {
    if (processingId) return;
    setProcessingId(appointmentId); setError("");
    try {
      await updateAppointment(appointmentId, { status: 'Denied' }); // Update status
      console.log(`Appointment ${appointmentId} denied.`);
      fetchAppointments(); // Refresh list
    } catch (err) {
      console.error(`Error denying appointment ${appointmentId}:`, err);
      const serverMsg = err.response?.data?.message || "Failed to deny appointment.";
      setError(serverMsg);
    } finally { setProcessingId(null); }
  };


  // --- Handlers for Actions Requiring Modal Confirmation (Cancel, Dismiss) ---
  // These handlers populate modal state and show the modal

  // Handle cancelling a confirmed appointment (Shows modal for status update to Cancelled).
  const handleShowCancelModal = (appointmentId) => {
       setModalTitle('Confirm Cancellation');
       setModalMessage('Are you sure you want to cancel this appointment?');
       setModalAppointmentId(appointmentId);
       setModalActionType('cancel'); // Set action type for modal
       setShowConfirmModal(true); // Show modal
  };

   // Handle dismissing/removing an appointment from view (Shows modal for setting dismissed flag).
   const handleShowDismissModal = (appointmentId, status) => {
        setModalTitle('Confirm Removal'); // Title for dismissal
        setModalMessage(`Mark this ${status.toLowerCase()} appointment as reviewed and remove from your list?`);
        setModalAppointmentId(appointmentId);
        setModalActionType('dismiss'); // Set action type for modal
        setShowConfirmModal(true); // Show modal
   };


  // --- Handlers for Modal Button Clicks ---

  // Handles the actual backend call after clicking OK in the confirmation modal
  const handleConfirmAction = async () => {
       // Ensure necessary state is available
       if (!modalAppointmentId || !modalActionType) return;

       setShowConfirmModal(false); // Close the modal
       setProcessingId(modalAppointmentId); // Start processing indicator for the list item

       setError(""); // Clear general error message

       try {
           let successMessage = "Action performed successfully.";
           let payload = {}; // Payload for updateAppointment

           if (modalActionType === 'cancel') {
               // Action is cancelling a Confirmed appointment (status update to Cancelled)
               payload = { status: 'Cancelled' };
               successMessage = "Appointment cancelled successfully.";
           } else if (modalActionType === 'dismiss') {
               // Action is dismissing a Denied/Cancelled/Completed appointment (set dismissed flag)
               payload = { doctorDismissed: true }; // Set the doctorDismissed flag
               successMessage = "Appointment dismissed successfully.";
           } else {
               // Fallback for unexpected action type
               console.warn(`ConsultantAppointments: Unknown modal action type: ${modalActionType}`);
               setError("Unknown action type.");
               return;
           }

           // Call the updateAppointment service with the determined payload
           await updateAppointment(modalAppointmentId, payload);
           console.log(`${successMessage} (ID: ${modalAppointmentId})`);

           fetchAppointments(); // Refresh the list after successful action (will filter dismissed items)

       } catch (err) {
           console.error(`Error performing ${modalActionType} action on appointment ${modalAppointmentId}:`, err);
           const serverMsg = err.response?.data?.message || `Failed to ${modalActionType} appointment.`;
           setError(serverMsg); // Display error message
       } finally {
           setProcessingId(null); // Clear processing state
           // Clear modal-specific state
           setModalAppointmentId(null);
           setModalActionType(null);
       }
  };

  // Handle clicking Cancel in the confirmation modal
  const handleCancelAction = () => {
       console.log(`${modalActionType} action aborted by doctor.`);
       // Clear modal-specific state and close modal
       setShowConfirmModal(false);
       setModalTitle('');
       setModalMessage('');
       setModalAppointmentId(null);
       setModalActionType(null);
  };

  // --- Helper to format date display ---
  const formatDateDisplay = (dateString) => {
      if (!dateString) return 'N/A';
      try { return new Date(dateString).toLocaleDateString(); } catch (e) { return 'Invalid Date'; }
  };


  // --- JSX Rendering ---
  return (
    <div className="consultant-appointments-page">
      <h1>Your Appointments</h1>

      {loading && <p>Loading appointments...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && appointments.length === 0 && !error ? (
        <p>No appointments found.</p>
      ) : (
        <ul className="appointments-list">
          {Array.isArray(appointments) && appointments.map((appt) => (
            <li key={appt._id} className={`appointment-item status-${appt.status.toLowerCase()}`}>
              <div className="appointment-details">
                <p><strong>Date:</strong> {formatDateDisplay(appt.date)}</p>
                <p><strong>Time:</strong> {appt.time}</p>
                <p>
                  <strong>Patient:</strong>{" "}
                  {appt.patient?.firstName} {appt.patient?.lastName || 'Unknown Patient'}
                </p>
                <p>
                  <strong>Notes:</strong> {appt.notes || "None"}
                </p>
                 <p><strong>Status:</strong> {appt.status}</p>
              </div>

              <div className="appointment-actions">
                {/* Accept and Deny buttons for Pending status */}
                {appt.status === 'Pending' && (
                  <>
                    <button
                      className="action-button accept-button"
                      onClick={() => handleAccept(appt._id)} // Direct call
                      disabled={processingId === appt._id}
                    >
                      {processingId === appt._id ? 'Processing...' : 'Accept'}
                    </button>
                    <button
                      className="action-button deny-button"
                      onClick={() => handleDeny(appt._id)} // Direct call
                      disabled={processingId === appt._id}
                    >
                      {processingId === appt._id ? 'Processing...' : 'Deny'}
                    </button>
                  </>
                )}

                {/* Cancel button for Confirmed status (shows modal) */}
                {appt.status === 'Confirmed' && (
                  <button
                    className="action-button cancel-button"
                    onClick={() => handleShowCancelModal(appt._id)} // *** Call handler to show modal ***
                    disabled={processingId === appt._id}
                  >
                     {processingId === appt._id ? 'Processing...' : 'Cancel'}
                  </button>
                )}

                 {/* Dismiss button for Denied, Cancelled, Completed statuses (shows modal) */}
                 {['Denied', 'Cancelled', 'Completed'].includes(appt.status) && (
                     <button
                         className="action-button dismiss-button"
                         onClick={() => handleShowDismissModal(appt._id, appt.status)} // *** Call handler to show modal ***
                         disabled={processingId === appt._id}
                     >
                        {processingId === appt._id ? 'Dismissing...' : 'Dismiss'}
                     </button>
                 )}

              </div>
            </li>
          ))}
        </ul>
      )}
       {/* Back button to navigate back to the doctor dashboard. */}
       {!loading && <button onClick={() => navigate('/consultant/dashboard')} className="back-button">Back to Dashboard</button>}

       {/* *** Custom Confirmation Modal Component *** */}
       {/* Render the Modal component conditionally based on state */}
       <Modal
             isOpen={showConfirmModal} // Controls modal visibility
             onClose={handleCancelAction} // Close modal handler (called on overlay click or modal close button)
             title={modalTitle} // Title displayed in the modal header
         >
             {/* Content rendered inside the modal body */}
             <p>{modalMessage}</p> {/* Message text */}
             {/* Div containing the action buttons for the modal */}
             <div className="modal-buttons-manage"> {/* Assuming this class is styled in your Modal.css */}
                 {/* OK button - confirms the action */}
                 <button className="my-confirm-button" onClick={handleConfirmAction}>OK</button> {/* Assuming my-confirm-button class exists */}
                 {/* Cancel button - cancels the action */}
                 <button className="my-cancel-button" onClick={handleCancelAction}>Cancel</button> {/* Assuming my-cancel-button class exists */}
             </div>
         </Modal>

    </div>
  );
};

export default ConsultantAppointments;