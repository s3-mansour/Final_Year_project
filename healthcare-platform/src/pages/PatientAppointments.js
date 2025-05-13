// src/pages/PatientAppointments.js
import React, { useEffect, useState } from "react"; // Removed useCallback as it's not used in this final version.
import { useNavigate } from "react-router-dom";
// Import ALL necessary services: get appointments (fetches list filtering by dismissal),
// create appointment (for booking form submission),
// update appointment (for cancelling status change AND dismissing).
import { getAppointments, createAppointment, updateAppointment } from "../services/appointmentService";
// Services needed for the booking form part.
import { getDoctorsByCity, getDoctorAvailableSlots } from "../services/availabilityService";
import { getUserProfile } from '../services/authService'; // Service to get user's city.
// Import the custom Modal component
import Modal from '../components/Modal'; // Adjust path if needed

import "./styles/PatientAppointments.css"; // Import the consolidated CSS file for this page.


const PatientAppointments = () => {
  const navigate = useNavigate();

  // --- State for Appointments List View ---
  const [appointments, setAppointments] = useState([]); // Stores the list of patient's appointments (filtered by dismissal).
  const [loadingList, setLoadingList] = useState(false); // Loading state indicator for fetching the appointment list.
  const [errorList, setErrorList] = useState(""); // State for displaying general errors related to the list.

  // State to track which appointment list item is currently being processed (for button loading states).
  const [processingId, setProcessingId] = useState(null);

  // --- State to control showing the Booking Form View ---
  // Toggles between showing the appointments list and the new appointment booking form.
  const [showBookingForm, setShowBookingForm] = useState(false);

  // --- State for Booking Form Data and Logic (Merged from original Appointment.js) ---
  const [loadingBooking, setLoadingBooking] = useState(false); // Loading state indicator for the booking form submission.
  const [errorBooking, setErrorBooking] = useState(""); // State for displaying errors specific to the booking form.

  // State for the list of doctors in the user's city (fetched for the booking form).
  const [doctors, setDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true); // Loading state for fetching the doctor list.
  const [errorLoadingDoctors, setErrorLoadingDoctors] = useState(''); // Error state for fetching doctors.

  // State for available time slots fetched based on date and doctor selection (for the booking form).
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false); // Loading state for fetching time slots.
  const [errorLoadingTimeSlots, setErrorLoadingTimeSlots] = useState(''); // Error state for fetching time slots.

  // State to store the current user's city, needed to fetch local doctors (for the booking form).
  const [userCity, setUserCity] = useState(null);

  // Form data state for the new appointment booking form.
  const [formData, setFormData] = useState({
    date: "", // Stores the selected date (YYYY-MM-DD from input[type="date"]).
    time: "", // Stores the selected time slot string (e.g., "08:00" or "08:00 AM").
    doctor: "", // Stores the selected doctor's _id.
    message: "", // Stores optional notes/message for the appointment.
  });

  // *** State for Confirmation Modal (for patient actions) ***
  const [showPatientConfirmModal, setShowPatientConfirmModal] = useState(false);
  const [patientModalTitle, setPatientModalTitle] = useState('');
  const [patientModalMessage, setPatientModalMessage] = useState('');
  const [patientModalAppointmentId, setPatientModalAppointmentId] = useState(null); // Store ID of appt for action
  const [patientModalActionType, setPatientModalActionType] = useState(null); // 'cancel' or 'dismiss'


  // --- Function to fetch appointments for the logged-in patient (Refreshes the list) ---
  const fetchAppointments = async () => {
    setLoadingList(true); setErrorList("");
    try {
      const data = await getAppointments();
      const sortedData = Array.isArray(data) ? data.sort((a, b) => {
           const dateComparison = new Date(a.date) - new Date(b.date);
           if (dateComparison !== 0) return dateComparison;
           return a.time.localeCompare(b.time);
      }) : [];
      setAppointments(sortedData);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setErrorList("Failed to load appointments.");
      setAppointments([]);
    } finally { setLoadingList(false); }
  };

  // --- Effect to fetch appointments list on component mount ---
  useEffect(() => { fetchAppointments(); }, []);

   // --- Effect to fetch the current user's city (for booking form) ---
    useEffect(() => {
        const fetchUserCity = async () => {
            try { const profile = await getUserProfile(); if (profile && profile.location) { setUserCity(profile.location); } else { console.warn("User profile or location not found."); setErrorLoadingDoctors("Could not determine your location to fetch doctors."); setIsLoadingDoctors(false); } }
            catch (error) { console.error("Error fetching user profile for city:", error); setErrorLoadingDoctors("Could not load your profile to find doctors."); setIsLoadingDoctors(false); }
        };
        fetchUserCity();
    }, []);

  // --- Effect to fetch doctors when the user's city is determined (for booking form) ---
  useEffect(() => {
    const fetchDoctors = async (city) => {
      setIsLoadingDoctors(true); setErrorLoadingDoctors('');
      try { const fetchedDoctors = await getDoctorsByCity(city); setDoctors(Array.isArray(fetchedDoctors) ? fetchedDoctors : []); }
      catch (error) { console.error("Fetch Doctors Error:", error); setErrorLoadingDoctors("Failed to fetch doctors."); setDoctors([]); }
      finally { setIsLoadingDoctors(false); }
    };
    if (userCity) { fetchDoctors(userCity); }
  }, [userCity]);

  // --- Effect to fetch available time slots when date OR doctor selection changes (for booking form) ---
  useEffect(() => {
    const fetchAvailableSlots = async () => {
        if (!showBookingForm || !formData.date || !formData.doctor) { setAvailableTimeSlots([]); setFormData(prev => ({ ...prev, time: "" })); return; }
        setIsLoadingTimeSlots(true); setErrorLoadingTimeSlots(''); setAvailableTimeSlots([]); setFormData(prev => ({ ...prev, time: "" }));
        try { const slots = await getDoctorAvailableSlots(formData.doctor, formData.date); setAvailableTimeSlots(Array.isArray(slots) ? slots : []); if (Array.isArray(slots) && slots.length === 1) { setFormData(prev => ({ ...prev, time: slots[0] })); } }
        catch (error) { console.error("Fetch Slots Error:", error); setErrorLoadingTimeSlots(error.message || "Failed to load available time slots."); setAvailableTimeSlots([]); }
        finally { setIsLoadingTimeSlots(false); }
    };
    if (showBookingForm) { fetchAvailableSlots(); }
  }, [formData.date, formData.doctor]); // Removed showBookingForm from deps as it's checked inside


  // --- Action Handlers (Called when modal OK/Cancel are clicked) ---

  // Handles the actual backend call after modal confirmation for patient actions
  const handlePatientConfirmAction = async () => {
       if (!patientModalAppointmentId || !patientModalActionType) return;

       setShowPatientConfirmModal(false); // Close the modal
       setProcessingId(patientModalAppointmentId); // Start processing indicator

       setErrorList(""); // Clear general error message

       try {
           let successMessage = "Action performed successfully.";
           let payload = {}; // Payload for updateAppointment

           if (patientModalActionType === 'cancel') {
               // Action is cancelling a Pending/Confirmed appointment (status update)
               payload = { status: 'Cancelled' }; // Set status to Cancelled
               successMessage = "Appointment cancelled successfully.";
           } else if (patientModalActionType === 'dismiss') {
               // Action is dismissing a Denied/Cancelled appointment (soft delete)
               payload = { patientDismissed: true }; // Set patientDismissed flag to true
               successMessage = "Appointment removed successfully.";
           } else {
               console.warn(`PatientAppointments: Unknown modal action type: ${patientModalActionType}`);
               setErrorList("Unknown action type.");
               return; // Stop if action type is invalid
           }

           // Call the updateAppointment service with the determined payload
           await updateAppointment(patientModalAppointmentId, payload);
           console.log(`${successMessage} (ID: ${patientModalAppointmentId})`);

           fetchAppointments(); // Refresh the list after successful action

       } catch (err) {
           console.error(`Error performing ${patientModalActionType} action on appointment ${patientModalAppointmentId}:`, err);
           const serverMsg = err.response?.data?.message || `Failed to ${patientModalActionType} appointment.`;
           setErrorList(serverMsg); // Display error message
       } finally {
           setProcessingId(null); // Clear processing state
           // Clear modal-specific state
           setPatientModalAppointmentId(null);
           setPatientModalActionType(null);
       }
  };

  // Handle cancelling the action from the modal for patient actions
  const handlePatientCancelAction = () => {
       console.log(`${patientModalActionType} action aborted by patient.`);
       // Clear modal-specific state and close modal
       setShowPatientConfirmModal(false);
       setPatientModalTitle('');
       setPatientModalMessage('');
       setPatientModalAppointmentId(null);
       setPatientModalActionType(null);
  };


  // --- Handlers to SHOW the Confirmation Modal ---
  // These are called by the buttons in the appointment list items.

  // Handle cancelling a Pending/Confirmed appointment (Shows modal)
  const handleShowCancelModal = (appointmentId) => {
       setPatientModalTitle('Confirm Cancellation');
       setPatientModalMessage('Are you sure you want to cancel this appointment request?');
       setPatientModalAppointmentId(appointmentId);
       setPatientModalActionType('cancel'); // Set action type
       setShowPatientConfirmModal(true); // Show modal
  };

   // Handle dismissing/removing a Denied/Cancelled appointment (Shows modal)
   const handleShowDismissModal = (appointmentId, status) => {
        setPatientModalTitle('Confirm Removal'); // Title for dismissal
        setPatientModalMessage(`Mark this ${status.toLowerCase()} appointment as reviewed and remove from your list?`);
        setPatientModalAppointmentId(appointmentId);
        setPatientModalActionType('dismiss'); // Set action type
        setShowPatientConfirmModal(true); // Show modal
   };


  // --- Handlers for Booking Form (Called when form elements change or submit) ---

  // Handle form input changes for the booking form.
  const handleFormChange = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };

   // Handle submission of the booking form.
  const handleBookingSubmit = async (e) => {
    e.preventDefault(); setErrorBooking("");
    if (!formData.date || !formData.time || !formData.doctor) { setErrorBooking("Please select a date, doctor, and time."); return; }
    if (!availableTimeSlots.includes(formData.time)) { setErrorBooking("Selected time slot is not available. Please select from the list."); return; }
    setLoadingBooking(true);
    try {
      const appointmentPayload = { date: formData.date, time: formData.time, doctorId: formData.doctor, message: formData.message, }; console.log("Submitting appointment:", appointmentPayload);
      await createAppointment(appointmentPayload); console.log("Appointment created successfully.");
      setFormData({ date: "", time: "", doctor: "", message: "" }); setErrorBooking(""); setShowBookingForm(false); fetchAppointments();
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      const serverMsg = error.response?.data?.message; const fallbackMsg = error.message || "Something went wrong. Please try again."; setErrorBooking(serverMsg || fallbackMsg);
    } finally { setLoadingBooking(false); }
  };

   // Handle cancelling the booking form without submitting.
   const handleCancelBooking = () => { setFormData({ date: "", time: "", doctor: "", message: "" }); setErrorBooking(""); setShowBookingForm(false); };


  // --- Helper functions for rendering ---

  // Helper to format date display
  const formatDateDisplay = (dateString) => { if (!dateString) return 'N/A'; try { return new Date(dateString).toLocaleDateString(); } catch (e) { return 'Invalid Date'; } };

  // Helper to render doctor options for booking form
  const renderDoctorOptions = () => { if (!Array.isArray(doctors) || doctors.length === 0) return null; return doctors.map(doctor => (<option key={doctor._id} value={doctor._id}>Dr. {doctor.firstName} {doctor.lastName} ({doctor.location})</option>)); };

   // Helper to render time slot options for booking form
   const renderTimeSlotOptions = () => { if (!Array.isArray(availableTimeSlots) || availableTimeSlots.length === 0) return null; return availableTimeSlots.map(slot => (<option key={slot} value={slot}>{slot}</option>)); };

  // Helper to determine if the time slot dropdown should be disabled (for booking form)
  const isTimeSlotSelectDisabled = !formData.date || !formData.doctor || isLoadingTimeSlots || !Array.isArray(availableTimeSlots);


  // --- JSX Rendering ---
  return (
    // Apply CSS class from PatientAppointments.css for the overall page container.
    <div className="patient-appointments-page">

        {/* --- Header Container (Buttons and Title) --- */}
        <div className="appointments-header-container">
             {/* Back button - always visible */}
             <button onClick={() => navigate('/dashboard')} className="back-to-dashboard-btn">Back to Dashboard</button>

             {/* Page Title - always visible */}
             <h1>Your Appointments</h1>

             {/* Create New Appointment Button - visible only if the booking form is NOT shown */}
             {!showBookingForm && (
                 <button className="create-appointment-button" onClick={() => setShowBookingForm(true)}>
                     Create New Appointment
                 </button>
             )}
        </div>


        {/* --- Conditional Rendering: Show Booking Form View OR Appointments List View --- */}

        {showBookingForm ? (
            // --- Render the Booking Form View ---
            // This container styles the form itself as a a distinct block (like the white box in the screenshot).
            <div className="appointment-container">
                 {/* Title and subtitle for the booking form */}
                 <h2 className="appointment-title">Schedule New Appointment</h2>
                 <p className="appointment-subtext">Fill in the details below</p>

                 <form className="appointment-form" onSubmit={handleBookingSubmit}>
                     <div className="input-group">
                       <label htmlFor="date">Preferred Date</label>
                       <input type="date" id="date" name="date" value={formData.date} required onChange={handleFormChange} min={new Date().toISOString().split('T')[0]} />
                     </div>

                     <div className="input-group">
                       <label htmlFor="doctor">Select Doctor ({userCity || 'Loading City...'})</label>
                       <select id="doctor" name="doctor" value={formData.doctor} required onChange={handleFormChange} disabled={isLoadingDoctors || !userCity}>
                          <option value="">{isLoadingDoctors ? "Loading Doctors..." : !userCity ? "-- Could not load your city --" : "-- Select a doctor --"}</option>
                         {renderDoctorOptions()}
                       </select>
                        {isLoadingDoctors && <p className="inline-loading">Loading doctors...</p>}
                        {errorLoadingDoctors && <p className="inline-error">{errorLoadingDoctors}</p>}
                     </div>

                     <div className="input-group">
                       <label htmlFor="time">Preferred Time Slot</label>
                       <select id="time" name="time" value={formData.time} required onChange={handleFormChange} disabled={isTimeSlotSelectDisabled}>
                         <option value="">
                           {isLoadingTimeSlots ? "Loading Slots..."
                           : !formData.date || !formData.doctor ? "-- Select Date & Doctor --"
                           : availableTimeSlots.length === 0 ? "No Slots Available"
                           : "-- Select a time slot --"
                           }
                           </option>
                         {renderTimeSlotOptions()}
                       </select>
                        {isLoadingTimeSlots && <p className="inline-loading">Loading time slots...</p>}
                        {errorLoadingTimeSlots && <p className="inline-error">{errorLoadingTimeSlots}</p>}
                     </div>

                     <div className="input-group">
                       <label htmlFor="message">Additional Notes (Optional)</label>
                       <textarea id="message" name="message" placeholder="Any specific requests?" rows="3" value={formData.message} onChange={handleFormChange} />
                     </div>

                     {errorBooking && <p className="error-message">{errorBooking}</p>}

                     <button type="submit" className="appointment-button" disabled={loadingBooking || isTimeSlotSelectDisabled || !formData.time}>
                       {loadingBooking ? "Scheduling..." : "📅 Book Appointment"}
                     </button>

                     <button type="button" className="back-button" onClick={handleCancelBooking}>Cancel</button>

                 </form>
            </div>

        ) : (
            // --- Render the Appointments List View ---
            <> {/* Use a fragment as we have multiple top-level elements */}
                {loadingList && <p>Loading appointments...</p>}
                {errorList && <p className="error-message">{errorList}</p>}

                {!loadingList && appointments.length === 0 && !errorList ? (
                  <p>No appointments found.</p>
                ) : (
                  <ul className="appointments-list">
                    {Array.isArray(appointments) && appointments.map((appt) => (
                      <li key={appt._id} className={`appointment-item status-${appt.status.toLowerCase()}`}>
                        <div className="appointment-details">
                          <p><strong>Date:</strong> {formatDateDisplay(appt.date)}</p>
                          <p><strong>Time:</strong> {appt.time}</p>
                          <p><strong>Doctor:</strong> {appt.doctor?.firstName} {appt.doctor?.lastName || 'Unknown Doctor'}</p>
                          <p><strong>Notes:</strong> {appt.notes || "None"}</p>
                           <p><strong>Status:</strong> {appt.status}</p>
                        </div>

                        <div className="appointment-actions">
                           {/* Show 'Cancel' button if status is Pending or Confirmed */}
                          {['Pending', 'Confirmed'].includes(appt.status) && (
                            <button
                              className="action-button cancel-button"
                              onClick={() => handleShowCancelModal(appt._id)} // *** CALL HANDLER TO SHOW MODAL ***
                              disabled={processingId === appt._id}
                            >
                              {processingId === appt._id ? 'Processing...' : 'Cancel'}
                            </button>
                          )}

                           {/* Show 'Delete' (Dismiss) button if status is Denied or Cancelled. */}
                           {['Denied', 'Cancelled'].includes(appt.status) && (
                                <button
                                    className="action-button delete-button" // Using delete-button class for dismissal.
                                    onClick={() => handleShowDismissModal(appt._id, appt.status)} // *** CALL HANDLER TO SHOW MODAL ***
                                    disabled={processingId === appt._id}
                                >
                                    {processingId === appt._id ? 'Removing...' : 'Remove'}
                                </button>
                           )}
                           {/* No buttons shown for 'Completed' status for patient */}

                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </>
        )} {/* End Conditional Rendering */}

       {/* Header buttons are at the top. */}

       {/* *** Custom Confirmation Modal Component for Patient Actions *** */}
       {/* Render the Modal component, passing state and handlers */}
       {/* Need to import Modal component */}
       <Modal
             isOpen={showPatientConfirmModal} // Controls visibility
             onClose={handlePatientCancelAction} // Close modal on overlay click or close button
             title={patientModalTitle} // Modal title from state
         >
             {/* Modal Body Content: Message and Action Buttons */}
             <p>{patientModalMessage}</p> {/* Modal message from state */}
             <div className="modal-buttons-manage"> {/* Apply CSS class from Modal.css or PatientAppointments.css */}
                 {/* Buttons for confirming or cancelling the action */}
                 {/* Pass handlePatientConfirmAction to the OK button's onClick */}
                 <button className="my-confirm-button" onClick={handlePatientConfirmAction}>OK</button> {/* Apply CSS class (need these styles in CSS) */}
                 {/* Pass handlePatientCancelAction to the Cancel button's onClick */}
                 <button className="my-cancel-button" onClick={handlePatientCancelAction}>Cancel</button> {/* Apply CSS class (need these styles in CSS) */}
             </div>
         </Modal>

    </div>
  );
};

export default PatientAppointments;