// src/pages/Appointment.js
import React, { useState, useEffect } from "react"; // REMOVED: useCallback import as it's not used
import { useNavigate } from "react-router-dom";
import { createAppointment } from "../services/appointmentService";
// Import the service functions to fetch doctors and available slots
import { getDoctorsByCity, getDoctorAvailableSlots } from "../services/availabilityService";
// Import getUserProfile to get the patient's city
import { getUserProfile } from '../services/authService';
import "./styles/Appointment.css"; // Import the provided CSS file

const Appointment = () => {
  const navigate = useNavigate();

  // --- State ---
  const [loading, setLoading] = useState(false); // State for overall form submission loading
  const [errorMessage, setErrorMessage] = useState(""); // State for displaying form errors

  // State for the list of doctors in the user's city
  const [doctors, setDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true); // Loading state for doctors list
  const [errorLoadingDoctors, setErrorLoadingDoctors] = useState(''); // Error state for fetching doctors

  // State for available time slots fetched based on date and doctor selection
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false); // Loading state for time slots dropdown
  const [errorLoadingTimeSlots, setErrorLoadingTimeSlots] = useState(''); // Error state for fetching time slots

  // State to store the current user's city, needed to fetch local doctors
  const [userCity, setUserCity] = useState(null);

  // --- Form Data State ---
  const [formData, setFormData] = useState({
    date: "", // Stores the selected date (YYYY-MM-DD from input[type="date"])
    time: "", // Stores the selected time slot string (e.g., "08:00 AM")
    doctor: "", // Stores the selected doctor's _id
    message: "", // Stores optional notes/message for the appointment
  });

   // --- Effect to fetch the current user's city on component mount ---
    useEffect(() => {
        const fetchUserCity = async () => {
            try {
                const profile = await getUserProfile();
                if (profile && profile.location) {
                    setUserCity(profile.location);
                } else {
                    // Handle case where profile or location is missing
                     console.warn("User profile or location not found.");
                     setErrorLoadingDoctors("Could not determine your location to fetch doctors."); // Inform user
                     setIsLoadingDoctors(false); // Stop doctor loading indicator
                }
            } catch (error) {
                console.error("Error fetching user profile for city:", error);
                setErrorLoadingDoctors("Could not load your profile to find doctors."); // Inform user
                setIsLoadingDoctors(false); // Stop doctor loading indicator
            }
        };
        fetchUserCity();
    }, []); // Run only once on component mount

  // --- Effect to fetch doctors when the user's city is determined ---
  useEffect(() => {
    const fetchDoctors = async (city) => {
      setIsLoadingDoctors(true); setErrorLoadingDoctors(''); // Start loading doctors, clear previous errors
      try {
        // Call the availability service to get doctors in the determined city
        const fetchedDoctors = await getDoctorsByCity(city);
        setDoctors(Array.isArray(fetchedDoctors) ? fetchedDoctors : []); // Update doctors state, ensure it's an array
      } catch (error) {
        setErrorLoadingDoctors("Failed to fetch doctors."); // Set error message
        console.error("Fetch Doctors Error:", error); // Log error details
        setDoctors([]); // Clear doctors list on error
      } finally {
        setIsLoadingDoctors(false); // Finish loading doctors
      }
    };

    // Only fetch doctors if userCity is known (not null or undefined)
    if (userCity) {
         fetchDoctors(userCity);
    }

  }, [userCity]); // This effect runs whenever the userCity state changes


  // --- Effect to fetch available time slots when date OR doctor selection changes ---
  // This effect clears and fetches new slots whenever the selected date or doctor changes.
  useEffect(() => {
    const fetchAvailableSlots = async () => {
        // Only attempt to fetch slots if both a date AND a doctor have been selected
        if (!formData.date || !formData.doctor) {
            setAvailableTimeSlots([]); // Clear slots if date or doctor is not selected
            setFormData(prev => ({ ...prev, time: "" })); // Reset selected time slot in form data
            return; // Do nothing if date or doctor is missing
        }

        setIsLoadingTimeSlots(true); setErrorLoadingTimeSlots(''); setAvailableTimeSlots([]); // Start loading slots, clear previous slots/errors
        setFormData(prev => ({ ...prev, time: "" })); // Reset time selection when fetching new slots (clears old selection)

        try {
            // Call the availability service to get available time slots for the selected doctor and date
            // This returns an array of time strings (e.g., ["08:00", "08:30"])
            const slots = await getDoctorAvailableSlots(formData.doctor, formData.date);

            setAvailableTimeSlots(Array.isArray(slots) ? slots : []); // Update state with fetched slots

             // Optional: Automatically select the first slot if only one is available
            if (Array.isArray(slots) && slots.length === 1) {
                 setFormData(prev => ({ ...prev, time: slots[0] }));
            } // If multiple slots, leave time="" so user must select

        } catch (error) {
            // Handle errors during fetching slots
            setErrorLoadingTimeSlots(error.message || "Failed to load available time slots.");
            console.error("Fetch Slots Error:", error);
            setAvailableTimeSlots([]); // Clear slots on error
        } finally {
            setIsLoadingTimeSlots(false); // Finish loading slots
        }
    };

    // Call the async function to fetch slots
    fetchAvailableSlots();

    // This effect runs automatically whenever formData.date or formData.doctor state changes
  }, [formData.date, formData.doctor]);


  // --- Handle form input changes ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Note: Resetting time slot is handled by the useEffect when date/doctor changes
  };

  // --- Render options for the doctor select dropdown ---
  const renderDoctorOptions = () => {
     // Only render options if doctors array is available and not empty
     if (!Array.isArray(doctors) || doctors.length === 0) return null;
    return doctors.map((doctor) => (
      <option key={doctor._id} value={doctor._id}>
        Dr. {doctor.firstName} {doctor.lastName} ({doctor.location}) {/* Show location too */}
      </option>
    ));
  };

   // --- Render options for the time slot select dropdown from availableTimeSlots state ---
   const renderTimeSlotOptions = () => {
        // Only render options if availableTimeSlots array is available and not empty
        if (!Array.isArray(availableTimeSlots) || availableTimeSlots.length === 0) return null;
        return availableTimeSlots.map((slot) => (
            <option key={slot} value={slot}>
                {slot} {/* The slot string itself is the value and display text */}
            </option>
        ));
    };


  // --- Handle form submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // Clear any previous error message

    // Basic client-side validation
    if (!formData.date || !formData.time || !formData.doctor) {
      setErrorMessage("Please select a date, doctor, and time.");
      return;
    }

     // --- Client-side validation: Ensure the selected time is actually in the list of fetched available slots ---
     // This prevents submitting a time that was briefly available or manually entered (if input type wasn't select)
    if (!availableTimeSlots.includes(formData.time)) {
         setErrorMessage("Selected time slot is not available. Please select from the list.");
         // Optional: Reset the time slot dropdown here if needed
         // setFormData(prev => ({ ...prev, time: "" }));
         return;
    }


    setLoading(true); // Start loading indicator for submission
    try {
        // Prepare the data payload to send to the backend service (createAppointment)
        // The structure must match what the backend createAppointment controller expects ({ date, time, doctorId, message })
      const appointmentPayload = {
        date: formData.date, // Already in YYYY-MM-DD format from the input
        time: formData.time, // Time string from the select dropdown (ensure format consistency)
        doctorId: formData.doctor, // The ObjectId of the selected doctor
        message: formData.message, // Optional notes
      };
      console.log("Submitting appointment with payload:", appointmentPayload); // Log payload


      // Call the appointment service to create the appointment
      await createAppointment(appointmentPayload);

      // On successful creation, navigate the patient to their appointments list
      navigate("/patient-appointments"); // Assuming this is the correct route

    } catch (error) {
      console.error("Error scheduling appointment:", error); // Log error details

      // Extract and display the error message from the backend response
      const serverMsg = error.response?.data?.message;
      const fallbackMsg = error.message || "Something went wrong. Please try again.";
      setErrorMessage(serverMsg || fallbackMsg); // Display backend error if available
    } finally {
      setLoading(false); // Finish loading indicator
    }
  };

  // --- Helper to determine if the time slot dropdown should be disabled ---
  // It should be disabled until a date and doctor are selected and slots have been loaded (even if empty)
  const isTimeSlotSelectDisabled = !formData.date || !formData.doctor || isLoadingTimeSlots || !Array.isArray(availableTimeSlots);


  // --- JSX Rendering ---
  return (
    <div className="appointment-page"> {/* Apply CSS class from Appointment.css */}
      <div className="appointment-container"> {/* Apply CSS class from Appointment.css */}
        <h1 className="appointment-title">Schedule Your Appointment</h1> {/* Apply CSS class from Appointment.css */}
        <p className="appointment-subtext">Choose a convenient date and time</p> {/* Apply CSS class from Appointment.css */}

        <form className="appointment-form" onSubmit={handleSubmit}> {/* Apply CSS class from Appointment.css */}
          {/* --- Preferred Date Input --- */}
          <div className="input-group"> {/* Apply CSS class from Appointment.css */}
            <label htmlFor="date">Preferred Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              required
              onChange={handleChange}
               min={new Date().toISOString().split('T')[0]} // Restrict past dates
            />
          </div>

          {/* --- Select Doctor Dropdown --- */}
          <div className="input-group"> {/* Apply CSS class from Appointment.css */}
            {/* Show the user's city to give context for the doctor list */}
            <label htmlFor="doctor">Select Doctor ({userCity || 'Loading City...'})</label>
            <select
              id="doctor"
              name="doctor"
              value={formData.doctor}
              required
              onChange={handleChange}
              disabled={isLoadingDoctors || !userCity} // Disable if loading doctors or user city is unknown
            >
               <option value="">
                 {/* Placeholder text changes based on loading/city state */}
                 {isLoadingDoctors ? "Loading Doctors..." // Display while fetching doctors
                 : !userCity ? "-- Could not load your city --" // Display if user city couldn't be determined
                 : "-- Select a doctor --" // Default prompt when doctors are loaded
                 }
                </option>
              {renderDoctorOptions()} {/* Render the fetched list of doctors */}
            </select>
             {/* Display inline loading or error messages for the doctor list */}
             {isLoadingDoctors && <p className="inline-loading">Loading doctors...</p>} {/* inline-loading needs CSS */}
             {errorLoadingDoctors && <p className="inline-error">{errorLoadingDoctors}</p>} {/* inline-error needs CSS */}
          </div>

          {/* --- Preferred Time Slot Dropdown --- */}
          <div className="input-group"> {/* Apply CSS class from Appointment.css */}
            <label htmlFor="time">Preferred Time Slot</label>
            <select
              id="time"
              name="time"
              value={formData.time}
              required
              onChange={handleChange}
              disabled={isTimeSlotSelectDisabled} // Disable based on conditions (date/doctor selected, not loading, slots found)
            >
              <option value="">
                {/* Placeholder text changes based on state */}
                {isLoadingTimeSlots ? "Loading Slots..." // Show when fetching slots
                 : !formData.date || !formData.doctor ? "-- Select Date & Doctor --" // Prompt user to select date/doctor first
                 : availableTimeSlots.length === 0 ? "No Slots Available" // Indicate no slots found for the selection
                 : "-- Select a time slot --" // Default prompt when slots are available
                }
                </option>
              {/* Render the dynamically fetched available time slots */}
              {renderTimeSlotOptions()}
            </select>
             {/* Display inline loading or error messages for time slots */}
             {isLoadingTimeSlots && <p className="inline-loading">Loading time slots...</p>} {/* inline-loading needs CSS */}
             {errorLoadingTimeSlots && <p className="inline-error">{errorLoadingTimeSlots}</p>} {/* inline-error needs CSS */}
          </div>

          {/* --- Additional Notes Textarea --- */}
          <div className="input-group"> {/* Apply CSS class from Appointment.css */}
            <label htmlFor="message">Additional Notes (Optional)</label>
            <textarea
              id="message" // Unique ID
              name="message" // Name matches form data state key
              placeholder="Any specific requests?"
              rows="3"
              value={formData.message} // Controlled component: value from state
              onChange={handleChange} // Update state on change
            />
          </div>

          {/* Display the main form error message */}
          {errorMessage && <p className="error-message">{errorMessage}</p>} {/* Apply CSS class from Appointment.css */}

          {/* --- Submit Button --- */}
          <button
            type="submit"
            className="appointment-button" // Apply CSS class from Appointment.css
            disabled={loading || isTimeSlotSelectDisabled || !formData.time} // Disable if submitting, slots are disabled, or no time is selected
          >
            {/* Button text changes based on submission loading state */}
            {loading ? "Scheduling..." : "📅 Book Appointment"}
          </button>
        </form>

        {/* Add a Back button for navigation */}
        <button onClick={() => navigate('/dashboard')} className="back-button">Back to Dashboard</button> {/* Apply CSS class (assuming 'back-button' is in Appointment.css) */}
      </div>
    </div>
  );
};

export default Appointment;