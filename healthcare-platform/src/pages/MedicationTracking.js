import React, { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import * as medicationService from "../services/medicationService";
import * as medicationLogService from '../services/medicationLogService';
import "./styles/MedicationTracking.css";

const MedicationTracking = () => {
  // State for medication list (prescriptions)
  const [medications, setMedications] = useState([]); // Initialize as empty array
  const [isLoadingMeds, setIsLoadingMeds] = useState(false);
  const [errorMeds, setErrorMeds] = useState("");

  // State for calendar and daily schedule
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailySchedule, setDailySchedule] = useState([]); // Initialize as empty array
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [errorSchedule, setErrorSchedule] = useState("");

  // State to track which specific dose logging is in progress
  const [loggingItemId, setLoggingItemId] = useState(null);


  // --- Data Fetching (Prescriptions) ---
  const fetchMedications = useCallback(async () => {
    setIsLoadingMeds(true);
    setErrorMeds("");
    try {
      const data = await medicationService.getMedications();
      // Ensure data is an array before setting state
      setMedications(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMeds("Failed to load prescribed medications.");
      console.error("Fetch Meds Error:", err);
      setMedications([]); // Set to empty array on error
    } finally {
      setIsLoadingMeds(false);
    }
  }, []);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  // --- Schedule Calculation & Fetching Log Status ---
  const updateDailySchedule = useCallback(async (date, meds) => {
    // Ensure meds is an array before proceeding
    if (!Array.isArray(meds)) {
        console.error("updateDailySchedule called with non-array meds:", meds);
        setIsLoadingSchedule(false); // Stop loading if input is bad
        setErrorSchedule("Error preparing schedule data."); // Set an error
        return; // Prevent further execution
    }

    setIsLoadingSchedule(true);
    setErrorSchedule("");
    setDailySchedule([]);

    let loggedItems = new Set();

    // Get start of the selected day (local time) for comparisons
    const selectedDayStart = new Date(date);
    selectedDayStart.setHours(0, 0, 0, 0);

    try {
      // Fetch logs for the selected date
      const dateString = selectedDayStart.toISOString().split('T')[0]; // YYYY-MM-DD
      const logsForDate = await medicationLogService.getLogsForDate(dateString);
      // Ensure logsForDate is an array before iterating
      if (Array.isArray(logsForDate)) {
          logsForDate.forEach(log => loggedItems.add(log.scheduleItemId));
      } else {
          console.warn("Received non-array data for logs:", logsForDate);
      }


      // Calculate schedule based on prescriptions
      const schedule = [];
      meds.forEach((med) => { // Safe to call forEach now

        let isActiveOnSelectedDate = false;
        try {
            if (!med.startDate) { throw new Error("Missing start date"); }
            const medStartDate = new Date(med.startDate);
            medStartDate.setHours(0, 0, 0, 0);
            if (isNaN(medStartDate.getTime())) { throw new Error("Invalid start date"); }

            const medEndDate = med.endDate ? new Date(med.endDate) : null;
            if (medEndDate) {
                 if (isNaN(medEndDate.getTime())) { throw new Error("Invalid end date"); }
                medEndDate.setHours(23, 59, 59, 999);
            }

            if (selectedDayStart >= medStartDate && (!medEndDate || selectedDayStart <= medEndDate)) {
                isActiveOnSelectedDate = true;
            }
        } catch (dateError) {
            console.error(`Error processing dates for medication ${med.name || med._id}:`, dateError);
            isActiveOnSelectedDate = false;
        }

        if (isActiveOnSelectedDate && med.isActive !== false) {
          let isDueToday = false;
          if (med.frequency?.toLowerCase().includes("daily")) { isDueToday = true; }
          // TODO: Add more complex frequency logic

          if (isDueToday && med.times && Array.isArray(med.times) && med.times.length > 0) { // Check med.times is array
            med.times.forEach(time => {
              if (time) {
                const scheduleItemId = `${med._id}-${dateString}-${time}`;
                schedule.push({
                  id: scheduleItemId, time: time, name: med.name, dosage: med.dosage, medId: med._id,
                  taken: loggedItems.has(scheduleItemId),
                });
              }
            });
          } else if (isDueToday && med.frequency) {
              const scheduleItemId = `${med._id}-${dateString}-anytime`;
              schedule.push({
                  id: scheduleItemId, time: "Any time", name: med.name, dosage: med.dosage, medId: med._id,
                  taken: loggedItems.has(scheduleItemId),
              });
          }
        }
      });

      schedule.sort((a, b) => {
          if (a.time === "Any time") return 1;
          if (b.time === "Any time") return -1;
          return a.time.localeCompare(b.time);
      });

      setDailySchedule(schedule);

    } catch (err) {
      console.error("Error fetching logs or calculating schedule:", err);
      setErrorSchedule("Failed to load schedule or log status.");
      setDailySchedule([]); // Ensure empty array on error
    } finally {
      setIsLoadingSchedule(false);
    }
  }, []); // Keep dependency array empty

  // Re-calculate schedule when date or medications list changes
  useEffect(() => {
    // Only run if medications have been loaded AND medications is confirmed to be an array
    if (!isLoadingMeds && Array.isArray(medications)) {
        updateDailySchedule(selectedDate, medications);
    }
    // If meds load but aren't an array, updateDailySchedule won't run, preventing map errors
  }, [selectedDate, medications, isLoadingMeds, updateDailySchedule]);


  // --- Event Handlers ---
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleMarkAsTaken = async (scheduleItem) => {
    if (scheduleItem.taken || loggingItemId) return;
    setLoggingItemId(scheduleItem.id);
    setErrorSchedule("");
    try {
      await medicationLogService.logDose({
         scheduleItemId: scheduleItem.id,
         medicationId: scheduleItem.medId,
         scheduledDate: selectedDate.toISOString().split('T')[0],
         scheduledTime: scheduleItem.time,
      });
      setDailySchedule(prevSchedule =>
        Array.isArray(prevSchedule) ? // Extra safety check
          prevSchedule.map(item =>
            item.id === scheduleItem.id ? { ...item, taken: true } : item
          ) : [] // Default to empty if prevSchedule was somehow not an array
      );
    } catch (err) {
      console.error("Failed to log dose:", err);
      setErrorSchedule(err.message || "Could not mark medication as taken. Please try again.");
    } finally {
      setLoggingItemId(null);
    }
  };


  // --- Rendering ---
  return (
    <div className="medication-page">
      <header className="top-bar">
        <h1>Medication Tracking</h1>
      </header>

      <div className="medication-content-wrapper">
        {/* --- Left Column: Calendar & Daily Schedule --- */}
        <div className="calendar-schedule-column">
           <div className="calendar-container">
             <p>Select a date to view your schedule and log doses:</p>
             <Calendar
               onChange={handleDateChange}
               value={selectedDate}
               className="styled-calendar"
             />
           </div>
           <div className="daily-schedule-section">
             <h2>Schedule for {selectedDate.toLocaleDateString()}</h2>
             {errorSchedule && <p className="error-message">{errorSchedule}</p>}
             {isLoadingSchedule ? ( <p>Loading schedule...</p> )
               : /* *** ADDED Array.isArray() CHECK *** */
                 Array.isArray(dailySchedule) && dailySchedule.length > 0 ? (
                  <ul className="schedule-list">
                    {dailySchedule.map((item) => { // Safe to map now
                      const isCurrentlyLogging = loggingItemId === item.id;
                      return (
                        <li key={item.id} className={`schedule-item ${item.taken ? 'taken' : ''}`}>
                          <div className="schedule-details">
                            <span className="schedule-time">{item.time}</span>
                            <span className="schedule-name">{item.name} ({item.dosage})</span>
                          </div>
                          <button
                            className={`mark-taken-button ${item.taken ? 'button-taken' : ''}`}
                            onClick={() => handleMarkAsTaken(item)}
                            disabled={item.taken || !!loggingItemId}
                            aria-label={`Mark ${item.name} at ${item.time} as taken`}
                          >
                            {item.taken ? 'Taken ✔' : isCurrentlyLogging ? 'Logging...' : 'Mark as Taken'}
                          </button>
                        </li>
                      );
                     })}
                  </ul>
               ) : ( !errorSchedule && <p>No medications scheduled for this date.</p> )
             }
           </div>
         </div>


        {/* --- Right Column: Prescribed Medication List (with optional status/dates) --- */}
        <div className="medication-list-column">
          <div className="medication-list-section">
            <div className="med-list-header">
              <h2>Your Prescribed Medications</h2>
            </div>
            {isLoadingMeds && <p>Loading medications...</p>}
            {errorMeds && <p className="error-message">{errorMeds}</p>}
            {/* *** ADDED Array.isArray() CHECK *** */ }
            {!isLoadingMeds && Array.isArray(medications) && medications.length > 0 ? (
              <ul className="medication-list">
                {medications.map((med) => { // Safe to map now
                     const today = new Date(); today.setHours(0,0,0,0);
                     let medStart, medEnd = null;
                     let statusText = "";
                     let statusClass = "";
                     let datesValid = true;

                     try {
                         if (!med.startDate) throw new Error("Missing start date");
                         medStart = new Date(med.startDate); medStart.setHours(0,0,0,0);
                         if (isNaN(medStart.getTime())) throw new Error("Invalid start date");

                         if (med.endDate) {
                           medEnd = new Date(med.endDate);
                           if (isNaN(medEnd.getTime())) throw new Error("Invalid end date");
                           medEnd.setHours(23,59,59,999);
                         }

                         if (medStart > today) { statusText = " (Upcoming)"; statusClass="med-upcoming"; }
                         else if (medEnd && medEnd < today) { statusText = " (Finished)"; statusClass="med-finished"; }
                         else if (med.isActive === false) { statusText = " (Inactive)"; statusClass="med-inactive"; }
                         else { statusText = " (Active)"; statusClass="med-active"; }

                     } catch (e) {
                         console.error(`Error processing dates for list item ${med.name}:`, e);
                         statusText = " (Date Error)"; statusClass = "med-error";
                         datesValid = false;
                     }

                    return (
                      <li key={med._id} className={`medication-item ${statusClass}`}>
                        <div className="med-info">
                          <strong>{med.name}</strong>{statusText} ({med.dosage},{" "} {med.frequency})
                           {datesValid ? (
                              <p className="med-dates">
                                Starts: {medStart.toLocaleDateString()}
                                {medEnd ? ` - Ends: ${new Date(med.endDate).toLocaleDateString()}` : ' (Ongoing)'}
                              </p>
                           ) : (
                              <p className="med-dates error-message">Invalid date information</p>
                           )}
                          {med.notes && <p className="med-notes">Notes: {med.notes}</p>}
                        </div>
                      </li>
                    );
                })}
              </ul>
            ) : (
              !isLoadingMeds && !errorMeds && <p>No medications have been prescribed yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationTracking;