import API from "./api";
import axios from "axios";
export const getAvailability = async () => {
  const response = await API.get("/api/availability");
  return response.data;
};

export const createAvailability = async (availabilityData) => {
  const response = await API.post("/api/availability", availabilityData);
  return response.data;
};

export const updateAvailability = async (id, updateData) => {
  const response = await API.put(`/api/availability/${id}`, updateData);
  return response.data;
};

export const deleteAvailability = async (id) => {
  const response = await API.delete(`/api/availability/${id}`);
  return response.data;
};
/**
 * Get available dates and times for a specific doctor
 * Endpoint: GET /api/availability/doctor/:doctorId?date=:date
 * @param {string} doctorId - The doctor ID
 * @param {string} date - The selected date
 * @returns {array} - Available time slots for the doctor
 */
export const getAvailableDatesAndTimes = async (doctorId, date) => {
  const response = await API.get(`/api/availability/doctor/${doctorId}?date=${date}`);
  return response.data;
};

/**
 * Get a list of doctors by city
 * Endpoint: GET /api/availability/doctors?city=:city
 * @param {string} city - The city to fetch doctors
 * @returns {array} - List of doctors in the city
 */
export const getDoctorsByCity = async (city) => {
  const response = await API.get(`/api/availability/doctors?city=${city}`);
  return response.data;
};