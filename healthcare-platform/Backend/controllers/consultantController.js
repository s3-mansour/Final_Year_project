// Backend/controllers/consultantController.js
const asyncHandler = require("express-async-handler");
const Appointment = require("../models/Appointment");
const User = require("../models/User");

/**
 * Get all patients in the same city as the consultant.
 * @route GET /api/consultant/patients
 * @access Private (doctor)
 */
const getPatientsForConsultant = asyncHandler(async (req, res) => {
  // Get consultant's city from req.user (set by protect middleware)
  const consultantLocation = req.user.location;
  if (!consultantLocation) {
    res.status(400);
    throw new Error("Consultant location not found");
  }
  // Find all patients with role "patient" in that location
  const patients = await User.find({
    role: "patient",
    location: consultantLocation,
  });
  res.json(patients);
});

/**
 * Get all appointments for the logged-in consultant.
 * @route GET /api/consultant/appointments
 * @access Private (doctor)
 */
const getAppointmentsForConsultant = asyncHandler(async (req, res) => {
  const consultantId = req.user._id;
  if (!consultantId) {
    res.status(400);
    throw new Error("Consultant ID not found");
  }
  // Find appointments where doctor._id matches consultant's _id
  const appointments = await Appointment.find({ "doctor._id": consultantId });
  res.json(appointments);
});

module.exports = {
  getPatientsForConsultant,
  getAppointmentsForConsultant,
};
