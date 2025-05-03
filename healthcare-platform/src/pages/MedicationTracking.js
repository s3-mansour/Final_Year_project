import React, { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import * as medicationService from "../services/medicationService";
import * as medicationLogService from '../services/medicationLogService';
import "./styles/MedicationTracking.css";
import { useNavigate } from "react-router-dom"; 

// Define days of the week consistently - used for calculation
const DAYS_OF_WEEK_ORDERED = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MedicationTracking = () => {
  // --- State ---
  const [medications, setMedications] = useState([]); // Initialize as empty array
  const [isLoadingMeds, setIsLoadingMeds] = useState(false);
  const [errorMeds, setErrorMeds] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailySchedule, setDailySchedule] = useState([]); // Initialize as empty array
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [errorSchedule, setErrorSchedule] = useState("");
  const [loggingItemId, setLoggingItemId] = useState(null);
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/dashboard"); // Navigate to the dashboard
  };

  // --- Data Fetching (Prescriptions) ---
  const fetchMedications = useCallback(async () => {
    setIsLoadingMeds(true); setErrorMeds("");
    try {
      const data = await medicationService.getMedications();
      setMedications(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMeds("Failed to load prescribed medications."); console.error("Fetch Meds Error:", err); setMedications([]);
    } finally { setIsLoadingMeds(false); }
  }, []);

  useEffect(() => { fetchMedications(); }, [fetchMedications]);

  // --- Helper function to get day difference ---
   const getDayDifference = (startDate, endDate) => {
        const date1 = new Date(startDate); const date2 = new Date(endDate);
        date1.setHours(12, 0, 0, 0); date2.setHours(12, 0, 0, 0);
        const msPerDay = 1000 * 60 * 60 * 24; const diffInMs = date2.getTime() - date1.getTime();
        // Rounding helps account for minor DST shifts if not using UTC fully
        return Math.round(diffInMs / msPerDay);
    };

  // --- Schedule Calculation & Fetching Log Status (with complex frequency logic) ---
  const updateDailySchedule = useCallback(async (date, meds) => {
    if (!Array.isArray(meds)) { console.error("Invalid meds array passed", meds); return; }
    setIsLoadingSchedule(true); setErrorSchedule(""); setDailySchedule([]);
    let loggedItems = new Set();

    const selectedDayStart = new Date(date); selectedDayStart.setHours(0, 0, 0, 0);
    const selectedDateString = selectedDayStart.toISOString().split('T')[0];
    const selectedDayName = DAYS_OF_WEEK_ORDERED[selectedDayStart.getDay()];
    console.log(`Updating schedule for: ${selectedDateString} (Day: ${selectedDayName})`);

    try {
      // Fetch logs
      const logsForDate = await medicationLogService.getLogsForDate(selectedDateString);
      if (Array.isArray(logsForDate)) { logsForDate.forEach(log => loggedItems.add(log.scheduleItemId)); }
      else { console.warn("Received non-array data for logs:", logsForDate); }

      // Calculate schedule
      const schedule = [];
      meds.forEach((med) => {
        console.log(`Processing med: ${med.name}, Type: ${med.frequencyType}, Value: ${med.frequencyValue}, Days: ${med.daysOfWeek}`);
        if (med.isActive === false) { console.log(`  -> Skipped: Inactive`); return; }

        // 1. Date Range Check
        let isInDateRange = false; let medStartDate;
        try {
            if (!med.startDate) throw new Error("Missing start date");
            medStartDate = new Date(med.startDate); medStartDate.setHours(0, 0, 0, 0);
            if (isNaN(medStartDate.getTime())) throw new Error("Invalid start date");
            const medEndDate = med.endDate ? new Date(med.endDate) : null;
            if (medEndDate) { if (isNaN(medEndDate.getTime())) throw new Error("Invalid end date"); medEndDate.setHours(23, 59, 59, 999); }
            if (selectedDayStart >= medStartDate && (!medEndDate || selectedDayStart <= medEndDate)) { isInDateRange = true; }
        } catch (dateError) { console.error(`  -> Date error for med ${med.name || med._id}:`, dateError); return; }
        if (!isInDateRange) { console.log(`  -> Skipped: Not in date range`); return; }

        // 2. Frequency Check
        let isDueToday = false;
        switch (med.frequencyType) {
            case 'daily':
                const interval = med.frequencyValue > 0 ? med.frequencyValue : 1;
                const dayDifference = getDayDifference(medStartDate, selectedDayStart);
                console.log(`  -> Daily check: Start=${medStartDate.toLocaleDateString()}, Selected=${selectedDayStart.toLocaleDateString()}, Diff=${dayDifference}, Interval=${interval}`);
                if (dayDifference >= 0 && dayDifference % interval === 0) { isDueToday = true; }
                break;
            case 'weekly':
            case 'specific_days':
                const daysArray = Array.isArray(med.daysOfWeek) ? med.daysOfWeek : [];
                console.log(`  -> Weekly check: Selected Day=${selectedDayName}, Prescribed Days=[${daysArray.join(', ')}]`);
                if (daysArray.includes(selectedDayName)) { isDueToday = true; }
                break;
            case 'interval_hours':
                if (med.frequencyValue > 0) { isDueToday = true; console.log(`  -> Interval check: Potentially due today`); }
                break;
            case 'as_needed':
                console.log(`  -> Skipped: As needed`); isDueToday = false; break;
            default:
                console.warn(`  -> Skipped: Unknown frequencyType: ${med.frequencyType}`); isDueToday = false;
        }

        // 3. Push to Schedule if Due Today
        if (isDueToday) {
            console.log(`  -> DUE TODAY! Calculating times...`);
            const validTimes = Array.isArray(med.times) ? med.times.filter(t => t && typeof t === 'string' && t.trim() !== '') : [];
            if (validTimes.length > 0) {
                validTimes.forEach(time => {
                    const scheduleItemId = `${med._id}-${selectedDateString}-${time}`;
                    console.log(`    - Adding schedule item: ${time}, ID: ${scheduleItemId}`);
                    schedule.push({ id: scheduleItemId, time: time, name: med.name, dosage: med.dosage, medId: med._id, taken: loggedItems.has(scheduleItemId) });
                });
            } else {
                const scheduleItemId = `${med._id}-${selectedDateString}-anytime`;
                 console.log(`    - Adding schedule item: Any time, ID: ${scheduleItemId}`);
                schedule.push({ id: scheduleItemId, time: "Any time", name: med.name, dosage: med.dosage, medId: med._id, taken: loggedItems.has(scheduleItemId) });
            }
        } else {
            console.log(`  -> Not due today based on frequency.`);
        }
      }); // End meds.forEach

      // Sort schedule
      schedule.sort((a, b) => { if (a.time === "Any time") return 1; if (b.time === "Any time") return -1; return a.time.localeCompare(b.time); });
      setDailySchedule(schedule);

    } catch (err) { console.error("Error processing schedule:", err); setErrorSchedule("Failed to load schedule."); setDailySchedule([]); }
    finally { setIsLoadingSchedule(false); }
  }, []);

  // useEffect to recalculate schedule
  useEffect(() => { if (!isLoadingMeds && Array.isArray(medications)) { updateDailySchedule(selectedDate, medications); } }, [selectedDate, medications, isLoadingMeds, updateDailySchedule]);

  // --- Event Handlers ---
  const handleDateChange = (date) => { setSelectedDate(date); };

  // handleMarkAsTaken with debugging logs
  const handleMarkAsTaken = async (scheduleItem) => {
    console.log("handleMarkAsTaken called for item:", scheduleItem); // Log 1
    if (scheduleItem.taken || loggingItemId) { console.log("Skipping log: Already taken or another log in progress."); return; } // Log 2
    setLoggingItemId(scheduleItem.id); setErrorSchedule("");
    console.log(`Set loggingItemId to: ${scheduleItem.id}`); // Log 3
    const logPayload = {
         scheduleItemId: scheduleItem.id, medicationId: scheduleItem.medId,
         scheduledDate: selectedDate.toISOString().split('T')[0], scheduledTime: scheduleItem.time,
      };
    console.log("Attempting to log dose with payload:", logPayload); // Log 4
    try {
      const response = await medicationLogService.logDose(logPayload);
      console.log("logDose API call successful, response:", response); // Log 5
      setDailySchedule(prevSchedule => {
          const newState = Array.isArray(prevSchedule) ? prevSchedule.map(item => item.id === scheduleItem.id ? { ...item, taken: true } : item) : [];
          console.log("Updating dailySchedule state:", newState); // Log 6
          return newState;
      });
    } catch (err) {
      console.error("Failed to log dose API error:", err); // Log 7
      const errorMsg = err?.response?.data?.message || err.message || "Could not mark medication as taken.";
      setErrorSchedule(errorMsg); console.log("Set errorSchedule state:", errorMsg); // Log 8
    } finally {
      console.log(`Resetting loggingItemId from ${loggingItemId} to null.`); // Log 9
      setLoggingItemId(null);
    }
  };

  // --- Display Frequency Helper ---
  const displayFrequency = (med) => {
      switch(med.frequencyType) {
          case 'daily': return `Daily${med.frequencyValue > 1 ? ` (every ${med.frequencyValue} days)` : ''}`;
          case 'weekly': return `Weekly (${(Array.isArray(med.daysOfWeek) ? med.daysOfWeek.join(', ') : '') || 'No days'})`;
          case 'interval_hours': return `Every ${med.frequencyValue || '?'} hours`;
          case 'as_needed': return 'As Needed';
          case 'specific_days': return `Specific Days (${(Array.isArray(med.daysOfWeek) ? med.daysOfWeek.join(', ') : '') || 'No days'})`;
          default: return med.frequencyType || 'Unknown';
      }
  };

  // --- Rendering ---
  return (
    <div className="medication-page">
      <header className="top-bar"><h1>Medication Tracking</h1></header>
      <div className="medication-content-wrapper">
        {/* --- Left Column --- */}
        <div className="calendar-schedule-column">
           <div className="calendar-container">
             <p>Select a date to view your schedule and log doses:</p>
             <Calendar onChange={handleDateChange} value={selectedDate} className="styled-calendar" />
           </div>
           <div className="daily-schedule-section">
             <h2>Schedule for {selectedDate.toLocaleDateString()}</h2>
             {errorSchedule && <p className="error-message">{errorSchedule}</p>}
             {isLoadingSchedule ? ( <p>Loading schedule...</p> )
               : Array.isArray(dailySchedule) && dailySchedule.length > 0 ? (
                  <ul className="schedule-list">
                    {dailySchedule.map((item) => {
                      const isCurrentlyLogging = loggingItemId === item.id;
                      return (
                        <li key={item.id} className={`schedule-item ${item.taken ? 'taken' : ''}`}>
                          <div className="schedule-details">
                            <span className="schedule-time">{item.time}</span>
                            <span className="schedule-name">{item.name} ({item.dosage})</span>
                          </div>
                          <button
                            className={`mark-taken-button ${item.taken ? 'button-taken' : ''}`}
                            onClick={() => handleMarkAsTaken(item)} // Ensure item is passed
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
        {/* --- Right Column --- */}
        <div className="medication-list-column">
          <div className="medication-list-section">
            <div className="med-list-header"><h2>Your Prescribed Medications</h2></div>
            {isLoadingMeds && <p>Loading medications...</p>}
            {errorMeds && <p className="error-message">{errorMeds}</p>}
            {!isLoadingMeds && Array.isArray(medications) && medications.length > 0 ? (
              <ul className="medication-list">
                {medications.map((med) => {
                     const today = new Date(); today.setHours(0,0,0,0); let medStart, medEnd = null; let statusText = ""; let statusClass = ""; let datesValid = true;
                     try {
                         if (!med.startDate) throw new Error("Missing start date");
                         medStart = new Date(med.startDate); medStart.setHours(0,0,0,0);
                         if (isNaN(medStart.getTime())) throw new Error("Invalid start date");
                         if (med.endDate) { medEnd = new Date(med.endDate); if (isNaN(medEnd.getTime())) throw new Error("Invalid end date"); medEnd.setHours(23,59,59,999); }
                         if (medStart > today) { statusText = " (Upcoming)"; statusClass="med-upcoming"; }
                         else if (medEnd && medEnd < today) { statusText = " (Finished)"; statusClass="med-finished"; }
                         else if (med.isActive === false) { statusText = " (Inactive)"; statusClass="med-inactive"; }
                         else { statusText = " (Active)"; statusClass="med-active"; }
                     } catch (e) { console.error(`List Date Error ${med.name}:`, e); statusText = " (Date Error)"; statusClass = "med-error"; datesValid = false; }
                    return (
                      <li key={med._id} className={`medication-item ${statusClass}`}>
                        <div className="med-info">
                          <strong>{med.name}</strong>{statusText} ({med.dosage}, {displayFrequency(med)})
                           {datesValid ? (
                              <p className="med-dates">
                                Starts: {medStart.toLocaleDateString()}
                                {med.endDate ? ` - Ends: ${new Date(med.endDate).toLocaleDateString()}` : ' (Ongoing)'}
                              </p>
                           ) : ( <p className="med-dates error-message">Invalid date information</p> )}
                          {med.notes && <p className="med-notes">Notes: {med.notes}</p>}
                        </div>
                      </li>
                    );
                })}
              </ul>
            ) : ( !isLoadingMeds && !errorMeds && <p>No medications have been prescribed yet.</p> )}
          </div>
        </div>
      </div>
      <button onClick={handleBackToDashboard} className="back-to-dashboard-btn">
        Back to Dashboard
      </button>
    </div>
  );
};

export default MedicationTracking;