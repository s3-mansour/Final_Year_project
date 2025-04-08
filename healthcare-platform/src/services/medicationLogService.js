// src/services/medicationLogService.js
import API from "./api"; // Your pre-configured Axios instance

/**
 * Log a dose as taken.
 * Endpoint: POST /api/medication-logs
 * @param {Object} logData - Data for the log (scheduleItemId, medicationId, scheduledDate, scheduledTime)
 * @returns {Promise<Object>} A promise that resolves to the server response (success message and log).
 */
export const logDose = async (logData) => {
  try {
    const response = await API.post("/api/medication-logs", logData);
    return response.data;
  } catch (error) {
    console.error("Error logging dose:", error.response?.data || error.message);
    // Re-throw a more specific error if available, otherwise a generic one
    throw error.response?.data || new Error("Failed to log dose");
  }
};

/**
 * Get logs for a specific date for the logged-in user.
 * Endpoint: GET /api/medication-logs?date=YYYY-MM-DD
 * @param {string} dateString - The date in "YYYY-MM-DD" format.
 * @returns {Promise<Array>} A promise that resolves to an array of log objects (containing at least scheduleItemId).
 */
export const getLogsForDate = async (dateString) => {
  try {
    // Ensure dateString is in the correct format before sending
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        throw new Error("Invalid date format provided to getLogsForDate. Use YYYY-MM-DD.");
    }
    const response = await API.get("/api/medication-logs", {
      params: { date: dateString }, // Send date as a query parameter
    });
    return response.data; // Backend should return an array of logs for that date
  } catch (error) {
    console.error("Error fetching logs for date:", error.response?.data || error.message);
    throw error.response?.data || new Error("Failed to fetch medication logs");
  }
};