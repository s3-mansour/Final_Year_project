// src/services/consultantService.js
import API from "./api"; // your configured axios instance

export const getConsultantPatients = async () => {
  const response = await API.get("/api/consultant/patients");
  return response.data; // array of patient objects
};

export const getConsultantAppointments = async () => {
  const response = await API.get("/api/consultant/appointments");
  return response.data; // array of appointment objects
};
