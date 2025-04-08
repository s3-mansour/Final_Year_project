// src/services/consultantService.js
import API from "./api"; // your configured axios instance

/**
 * Fetches a list of all patients.
 * Endpoint: GET /api/consultant/patients
 * @returns {Promise<Array>} A promise that resolves to an array of patient objects.
 */
export const getPatientsList = async () => {
  try {
    // Ensure the endpoint matches your backend route exactly
    const response = await API.get("/api/consultant/patients");
    return response.data; // array of patient objects
  } catch (error) {
      console.error("Error fetching patients list:", error.response?.data || error.message);
      throw error.response?.data || new Error("Failed to fetch patients");
  }
};

// Keep getConsultantAppointments if needed elsewhere, otherwise it can be removed if not used
export const getConsultantAppointments = async () => {
  try {
      const response = await API.get("/api/consultant/appointments");
      return response.data; // array of appointment objects
  } catch (error) {
      console.error("Error fetching consultant appointments:", error.response?.data || error.message);
      throw error.response?.data || new Error("Failed to fetch appointments");
  }
};