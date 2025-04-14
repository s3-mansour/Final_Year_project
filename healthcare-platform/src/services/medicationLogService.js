// src/services/medicationLogService.js
import API from "./api"; // Your pre-configured Axios instance

// --- Keep existing logDose and getLogsForDate functions ---

export const logDose = async (logData) => {
  try {
    const response = await API.post("/api/medication-logs", logData);
    return response.data;
  } catch (error) {
    console.error("Error logging dose:", error.response?.data || error.message);
    throw error.response?.data || new Error("Failed to log dose");
  }
};

export const getLogsForDate = async (dateString) => {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        throw new Error("Invalid date format provided to getLogsForDate. Use YYYY-MM-DD.");
    }
    const response = await API.get("/api/medication-logs", {
      params: { date: dateString },
    });
    // Ensure array return
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching logs for date:", error.response?.data || error.message);
    throw error.response?.data || new Error("Failed to fetch medication logs");
  }
};


// *** ADD NEW FUNCTION FOR DOCTOR VIEW ***
/**
 * Fetches medication logs for a specific patient within a date range. (For Doctor)
 * Endpoint: GET /api/medication-logs/patient/:patientId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * @param {string} patientId - The ID of the patient whose logs are requested.
 * @param {string} startDateString - The start date in "YYYY-MM-DD" format.
 * @param {string} endDateString - The end date in "YYYY-MM-DD" format.
 * @returns {Promise<Array>} A promise that resolves to an array of log objects.
 */
export const getPatientLogsByRange = async (patientId, startDateString, endDateString) => {
    try {
        // Basic validation of inputs
        if (!patientId) throw new Error("Patient ID is required.");
        if (!startDateString || !/^\d{4}-\d{2}-\d{2}$/.test(startDateString)) {
            throw new Error("Invalid start date format provided. Use YYYY-MM-DD.");
        }
        if (!endDateString || !/^\d{4}-\d{2}-\d{2}$/.test(endDateString)) {
            throw new Error("Invalid end date format provided. Use YYYY-MM-DD.");
        }

        // Construct the URL with patientId in the path
        const url = `/api/medication-logs/patient/${patientId}`;

        // Make the GET request with startDate and endDate as query parameters
        const response = await API.get(url, {
            params: {
                startDate: startDateString,
                endDate: endDateString,
            },
        });

        // Ensure data returned is an array
        return Array.isArray(response.data) ? response.data : [];

    } catch (error) {
        console.error(`Error fetching logs for patient ${patientId}:`, error.response?.data || error.message);
        throw error.response?.data || new Error("Failed to fetch patient medication logs");
    }
};