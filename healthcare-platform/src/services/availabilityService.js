// src/services/availabilityService.js
import API from "./api"; // Import the configured Axios instance

/**
 * Fetches all availability blocks for the logged-in doctor.
 * Endpoint: GET /api/availability
 * @returns {Promise<array>} - Promise resolving to an array of availability block objects.
 */
export const getAvailability = async () => {
    try {
        const response = await API.get("/api/availability");
        // Return the data, ensuring it's an array
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error("Error fetching doctor availability:", error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Failed to fetch availability.");
    }
};

/**
 * Creates a new availability block for the logged-in doctor.
 * Endpoint: POST /api/availability
 * @param {Object} availabilityData - { date, startTime, endTime, slotDurationMinutes }
 * @returns {Promise<object>} - Promise resolving to the created availability block object.
 */
export const createAvailability = async (availabilityData) => {
    try {
        const response = await API.post("/api/availability", availabilityData);
        return response.data; // Return the created block
    } catch (error) {
        console.error("Error creating availability:", error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Failed to create availability.");
    }
};

/**
 * Updates an existing availability block for the logged-in doctor.
 * Endpoint: PUT /api/availability/:id
 * @param {string} id - The ID of the availability block.
 * @param {Object} updateData - Fields to update: { date, startTime, endTime, slotDurationMinutes }
 * @returns {Promise<object>} - Promise resolving to the updated availability block object.
 */
export const updateAvailability = async (id, updateData) => {
    try {
        const response = await API.put(`/api/availability/${id}`, updateData);
        return response.data; // Return the updated block
    } catch (error) {
        console.error(`Error updating availability ${id}:`, error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Failed to update availability.");
    }
};

/**
 * Deletes an availability block for the logged-in doctor.
 * Endpoint: DELETE /api/availability/:id
 * @param {string} id - The ID of the availability block.
 * @returns {Promise<object>} - Promise resolving to a success message.
 */
export const deleteAvailability = async (id) => {
    try {
        const response = await API.delete(`/api/availability/${id}`);
        return response.data; // Return success message
    } catch (error) {
        console.error(`Error deleting availability ${id}:`, error.response?.data?.message || error.message);
        throw new Error(error.response?.data?.message || "Failed to delete availability.");
    }
};


/**
 * Get a list of doctors by city. Used by patients to select a doctor for booking.
 * Endpoint: GET /api/availability/doctors?city=:city
 * @param {string} city - The city to fetch doctors from.
 * @returns {Promise<array>} - Promise resolving to a list of doctor user objects (basic fields).
 */
export const getDoctorsByCity = async (city) => {
  // Return empty array immediately if city is missing or not a string
  if (!city || typeof city !== 'string') {
      console.warn("getDoctorsByCity called with missing or invalid city:", city);
      return [];
  }
  try {
    // Call the backend route to get doctors filtered by city, using query parameters
    const response = await API.get(`/api/availability/doctors`, {
        params: { city: city } // Send city as a query parameter
    });
    // Ensure the response data is treated as an array
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(`Error fetching doctors for city ${city}:`, error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Failed to fetch doctors.");
  }
};


/**
 * Get available time slots for a specific doctor on a specific date. Used by patients for booking.
 * Endpoint: GET /api/availability/doctor/:doctorId/slots?date=YYYY-MM-DD
 * @param {string} doctorId - The ID of the doctor.
 * @param {string} dateString - The selected date in YYYY-MM-DD format.
 * @returns {Promise<string[]>} - Promise resolving to an array of available time slot strings (e.g., ["08:00", "08:30"]).
 */
export const getDoctorAvailableSlots = async (doctorId, dateString) => {
    // Basic input validation before calling API
    if (!doctorId || !dateString) {
        console.warn("getDoctorAvailableSlots called with missing doctorId or dateString");
        return []; // Return empty array immediately if inputs are missing
    }
     if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
         console.warn("getDoctorAvailableSlots called with invalid date format:", dateString);
         return []; // Return empty array for invalid date format
     }

    try {
        // Call the backend route to get available slots for the doctor and date
        // Doctor ID is in the URL path, date is a query parameter
        const response = await API.get(`/api/availability/doctor/${doctorId}/slots`, {
            params: { date: dateString }
        });
        // Backend is expected to return an array of time strings (e.g., ["08:00", "08:30"])
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error(`Error fetching available slots for doctor ${doctorId} on ${dateString}:`, error.response?.data?.message || error.message);
         // If backend returns 404 (or other specific status) meaning no availability defined, treat as empty slots
         // Adjust status check based on your backend's specific error response for 'no availability defined'
         if (error.response?.status === 404 || (error.response?.status >= 400 && error.response?.status < 500)) { // Check for client errors
            console.log(`Backend returned ${error.response.status} for available slots, treating as no slots available or client error.`);
            return [];
         }
         // For other errors (e.g., 500 server error), re-throw
        throw new Error(error.response?.data?.message || "Failed to fetch available time slots.");
    }
};