// src/pages/PatientPrescriptions.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// Service to fetch the patient's medications list
import * as medicationService from "../services/medicationService";
// Icons (Optional, but good for UI)
import { FaPills, FaCalendarAlt } from 'react-icons/fa'; // Icons for meds list item and schedule button
// Styles
import "./styles/PatientPrescriptions.css"; // Create this CSS file


const PatientPrescriptions = () => {
  const navigate = useNavigate(); // Initialize useNavigate hook

  // --- State Declarations ---
  // State for prescribed medications list
  const [medications, setMedications] = useState([]); // Stores the patient's prescribed medications
  const [loading, setLoading] = useState(false); // Loading state for fetching the list
  const [error, setError] = useState(""); // Error state for fetching the list

  // --- Effects ---

  // Fetch prescribed medications list on component mount
  useEffect(() => {
    fetchMedications(); // Fetch the list
  }, []);

  // --- Function to fetch prescribed medications list ---
  const fetchMedications = async () => {
    setLoading(true); setError(""); // Start loading, clear error
    try {
      // Call medicationService to get medications for the logged-in patient
      const data = await medicationService.getMedications();
      setMedications(Array.isArray(data) ? data : []); // Update state, ensure array
    } catch (err) {
      console.error("Failed to fetch prescriptions:", err);
      setError("Failed to load your prescriptions."); // Set error message
      setMedications([]); // Clear list on error
    } finally { setLoading(false); } // Finish loading
  };


  // --- Helper functions ---

  // Helper to display Frequency Details string (Can reuse from MedicationTracking)
  const displayFrequency = (med) => {
      switch(med?.frequencyType) {
          case 'daily': return `Daily${med.frequencyValue > 1 ? ` (every ${med.frequencyValue} days)` : ''}`;
          case 'weekly': return `Weekly (${(Array.isArray(med.daysOfWeek) ? med.daysOfWeek.join(', ') : '') || 'No days'})`;
          case 'interval_hours': return `Every ${med.frequencyValue || '?'} hours`;
          case 'as_needed': return 'As Needed';
          case 'specific_days': return `Specific Days (${(Array.isArray(med.daysOfWeek) ? med.daysOfWeek.join(', ') : '') || 'No days'})`;
          default: return med?.frequencyType || 'Unknown';
      }
  };

  // Helper to format date display (Can reuse from MedicationTracking)
   const formatDateDisplay = (dateString) => {
       if (!dateString) return 'N/A';
       try { return new Date(dateString).toLocaleDateString(); } catch (e) { return 'Invalid Date'; }
   };

  // --- Handlers ---

  // Handle navigation to the Medication Tracking page
  const handleGoToMedicationTracking = () => {
    navigate("/medicationtracking"); // Navigate to the Medication Tracking page route
  };

  // Handle navigation back to the dashboard
  const handleBackToDashboard = () => {
    navigate("/dashboard"); // Navigate to the patient dashboard
  };


  // --- JSX Rendering ---
  return (
    <div className="patient-prescriptions-page"> {/* Apply CSS class for page styling */}
        {/* Back to Dashboard Button */}
       <button onClick={handleBackToDashboard} className="back-button">Back to Dashboard</button> {/* Apply CSS class */}

      <h1>My Prescriptions</h1> {/* Page Title */}

      {/* Button to navigate to Medication Tracking */}
       <div className="prescriptions-actions"> {/* Container for action buttons */}
           <button
               className="action-button go-to-tracking-button" // Apply CSS class
               onClick={handleGoToMedicationTracking} // Call handler
           >
               <FaCalendarAlt /> View Schedule & Log Doses {/* Button text with icon */}
           </button>
       </div>


      {/* Display loading, error, or empty state for the medication list */}
      {loading && <p>Loading prescriptions...</p>}
      {error && <p className="error-message">{error}</p>} {/* Apply CSS class */}

      {!loading && Array.isArray(medications) && medications.length === 0 && !error ? (
          <p>No prescriptions found.</p> // Message for empty list
      ) : (
          // --- Prescribed Medications List ---
          <ul className="prescriptions-list"> {/* Use ul for list */}
            {Array.isArray(medications) && medications.map((med) => {
                 // Determine status text for display
                 let statusText = "";
                 // Basic date validation for display purposes
                 let datesValid = true; let medStartDate = null; let medEndDate = null;
                 try {
                     if (!med.startDate) throw new Error("Missing start date");
                     medStartDate = new Date(med.startDate); if (isNaN(medStartDate.getTime())) throw new Error("Invalid start date");
                     if (med.endDate) { medEndDate = new Date(med.endDate); if (isNaN(medEndDate.getTime())) throw new Error("Invalid end date"); }
                     const today = new Date(); today.setHours(0,0,0,0); // Use today's date without time
                     if (medStartDate > today) { statusText = " (Upcoming)"; }
                     else if (medEndDate && medEndDate < today) { statusText = " (Finished)"; }
                     else if (med.isActive === false) { statusText = " (Inactive)"; }
                     else { statusText = " (Active)"; }
                 } catch (e) { console.error(`List Date Error ${med.name}:`, e); statusText = " (Date Error)"; datesValid = false; }

                return (
                  <li key={med._id} className="prescription-item"> {/* Apply CSS class */}
                    <div className="prescription-info"> {/* Container for medication details */}
                      <h3>
                         <FaPills className="med-icon"/> {/* Icon for medication */}
                         {med.name}
                         <span className="med-status-text">{statusText}</span> {/* Status text */}
                      </h3>
                      <p><strong>Dosage:</strong> {med.dosage}</p>
                      <p><strong>Frequency:</strong> {displayFrequency(med)}</p>
                       {datesValid ? ( // Display date range only if dates are valid
                          <p className="med-dates">
                            <strong>Dates:</strong> {formatDateDisplay(med.startDate)}
                            {med.endDate ? ` - ${formatDateDisplay(med.endDate)}` : ' (Ongoing)'}
                          </p>
                       ) : ( <p className="med-dates error-message">Invalid date information</p> )}
                      {med.notes && <p className="med-notes"><strong>Notes:</strong> {med.notes}</p>} {/* Optional notes */}
                    </div>
                    {/* No action buttons needed here for simplicity */}
                   {/* <div className="prescription-actions">{/* ... buttons like "View Schedule", "View Log" ... }</div> */}
                  </li>
                );
            })}
          </ul>
      )}

       {/* Back to Dashboard Button (Already at the top) */}


    </div>
  );
};

export default PatientPrescriptions;