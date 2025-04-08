// src/services/medicationService.js
import API from "./api"; // Your pre-configured Axios instance

/**
 * Fetch medications. If patientId is provided, fetches for that specific patient.
 * Otherwise (if patientId is null/undefined), fetches for the logged-in user (patient).
 * Endpoint: GET /api/medications OR GET /api/medications?patientId=<ID>
 * @param {string | null} [patientId=null] - Optional ID of the patient to fetch medications for (used by doctors).
 * @returns {Promise<Array>} A promise that resolves to an array of medication objects.
 */
export const getMedications = async (patientId = null) => {
  try {
    const config = {};
    if (patientId) {
      // If patientId is provided, send it as a query parameter
      config.params = { patientId };
      console.log(`Fetching meds for patient: ${patientId}`); // For debugging
    } else {
      console.log("Fetching meds for logged-in user"); // For debugging
    }
    const response = await API.get("/api/medications", config);
    return Array.isArray(response.data) ? response.data : []; // Ensure array return
  } catch (error) {
    console.error("Error fetching medications:", error.response?.data || error.message, { patientId });
    throw error.response?.data || new Error("Failed to fetch medications");
  }
};

/**
 * Create a new medication entry.
 * Endpoint: POST /api/medications
 * @param {Object} medicationData - Data for the new medication. MUST include patientId if called by a doctor.
 * @returns {Promise<Object>} A promise that resolves to the newly created medication object.
 */
export const createMedication = async (medicationData) => {
  // Note: The caller (doctor's component) MUST ensure medicationData includes 'patientId'
  try {
    const response = await API.post("/api/medications", medicationData);
    return response.data;
  } catch (error) {
    console.error("Error creating medication:", error.response?.data || error.message);
    throw error.response?.data || new Error("Failed to create medication");
  }
};

/**
 * Update an existing medication entry.
 * Endpoint: PUT /api/medications/:id
 * @param {string} id - The ID of the medication to update.
 * @param {Object} updateData - An object containing the fields to update.
 * @returns {Promise<Object>} A promise that resolves to the updated medication object.
 */
export const updateMedication = async (id, updateData) => {
  try {
    const response = await API.put(`/api/medications/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating medication:", error.response?.data || error.message);
    throw error.response?.data || new Error("Failed to update medication");
  }
};

/**
 * Delete a medication entry.
 * Endpoint: DELETE /api/medications/:id
 * @param {string} id - The ID of the medication to delete.
 * @returns {Promise<Object>} A promise that resolves to the response data (usually a success message).
 */
export const deleteMedication = async (id) => {
  try {
    const response = await API.delete(`/api/medications/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting medication:", error.response?.data || error.message);
    throw error.response?.data || new Error("Failed to delete medication");
  }
};