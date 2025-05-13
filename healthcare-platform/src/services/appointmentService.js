// src/services/appointmentService.js
import API from "./api"; // Import the configured Axios instance.

/**
 * Fetches all appointments for the logged-in user (patient or doctor).
 * Endpoint: GET /api/appointments
 * @returns {Promise<array>} - Promise resolving to an array of appointment objects.
 */
export const getAppointments = async () => { // Exported here
  try {
    const response = await API.get("/api/appointments");
    // Return the data, ensuring it's an array even if backend sends null/undefined.
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching appointments:", error.response?.data?.message || error.message);
     // Re-throw the error for the calling component to handle (e.g., show message).
    throw new Error(error.response?.data?.message || "Failed to fetch appointments.");
  }
};

/**
 * Fetches a single appointment by its ID.
 * Endpoint: GET /api/appointments/:id
 * @param {string} appointmentId - The ID of the appointment.
 * @returns {Promise<object>} - Promise resolving to a single appointment object.
 */
export const getAppointmentById = async (appointmentId) => { // Exported here
   try {
     const response = await API.get(`/api/appointments/${appointmentId}`);
     return response.data; // Return the single appointment object.
   } catch (error) {
      console.error(`Error fetching appointment ${appointmentId}:`, error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || "Failed to fetch appointment details.");
   }
};

/**
 * Creates a new appointment request.
 * Endpoint: POST /api/appointments
 * @param {Object} appointmentData - Object containing appointment details: { doctorId, date, time, message/notes }.
 * @returns {Promise<object>} - Promise resolving to the newly created appointment object.
 */
export const createAppointment = async (appointmentData) => { // Exported here
  try {
    const response = await API.post("/api/appointments", appointmentData);
    return response.data; // Return the created appointment object (likely populated by backend).
  } catch (error) {
    console.error("Error creating appointment:", error.response?.data?.message || error.message);
     // Re-throw the specific error message from the backend (e.g., "Slot not available").
    throw new Error(error.response?.data?.message || "Failed to create appointment.");
  }
};

/**
 * Updates an existing appointment by ID. This is now used for status changes AND dismissal flags.
 * Endpoint: PUT /api/appointments/:id
 * @param {string} appointmentId - The ID of the appointment to update.
 * @param {Object} updatedData - Object containing fields to update (e.g., { status: 'Confirmed' }, { notes: '...' }, { patientDismissed: true }, { doctorDismissed: true }).
 * @returns {Promise<object>} - Promise resolving to the updated appointment object.
 */
export const updateAppointment = async (appointmentId, updatedData) => { // Exported here
   try {
      const response = await API.put(`/api/appointments/${appointmentId}`, updatedData);
      return response.data; // Return the updated appointment object (likely populated).
   } catch (error) {
      console.error(`Error updating appointment ${appointmentId}:`, error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || "Failed to update appointment.");
   }
};

