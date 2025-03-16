// Example:
import API from "./api";

export const getPatients = async () => {
  const response = await API.get("/api/consultant/patients");
  return response.data;
};

export const getAppointments = async () => {
  const response = await API.get("/api/consultant/appointments");
  return response.data;
};
