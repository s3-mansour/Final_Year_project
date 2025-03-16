// src/services/appointmentService.js
import API from "./api";

/**
 * Fetch all appointments for the logged-in user.
 * - If the user is a patient, returns their appointments.
 * - If the user is a doctor, returns appointments for that doctor.
 * Endpoint: GET /api/appointments
 */
export const getAppointments = async () => {
  const response = await API.get("/api/appointments");
  return response.data;
};

/**
 * Fetch a single appointment by ID.
 * Endpoint: GET /api/appointments/:id
 * @param {string} appointmentId 
 */
export const getAppointmentById = async (appointmentId) => {
  const response = await API.get(`/api/appointments/${appointmentId}`);
  return response.data;
};

/**
 * Create a new appointment.
 * Endpoint: POST /api/appointments
 * @param {Object} appointmentData - { doctorId, date, time, message/notes, etc. }
 */
export const createAppointment = async (appointmentData) => {
  const response = await API.post("/api/appointments", appointmentData);
  return response.data;
};

/**
 * Update an existing appointment.
 * Endpoint: PUT /api/appointments/:id
 * @param {string} appointmentId 
 * @param {Object} updatedData - fields to update (e.g., date, time, status, etc.)
 */
export const updateAppointment = async (appointmentId, updatedData) => {
  const response = await API.put(`/api/appointments/${appointmentId}`, updatedData);
  return response.data;
};

/**
 * Delete an appointment by ID.
 * Endpoint: DELETE /api/appointments/:id
 * @param {string} appointmentId 
 */
export const deleteAppointment = async (appointmentId) => {
  const response = await API.delete(`/api/appointments/${appointmentId}`);
  return response.data;
};
