// src/services/userService.js
import API from "./api"; 

/**
 * Fetches a list of users with the role 'doctor'.
 * Endpoint: GET /api/users/doctors (Example endpoint - **NEEDS TO BE CREATED ON BACKEND**)
 * @returns {Promise<Array>} A promise that resolves to an array of doctor user objects.
 */
export const getConsultantsList = async () => {
  try {
    const response = await API.get("/api/consultant/doctors"); // Use the correct backend path
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
      console.error("Error fetching consultants list:", error.response?.data || error.message);
      throw error.response?.data || new Error("Failed to fetch doctors");
  }
};

