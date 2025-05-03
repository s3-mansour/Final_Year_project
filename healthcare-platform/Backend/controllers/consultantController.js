// Backend/controllers/consultantController.js
const asyncHandler = require("express-async-handler");
const Appointment = require("../models/Appointment");
const User = require("../models/User");

/**
 * Get all patients (optionally filtered by consultant's location).
 * @route GET /api/consultant/patients
 * @access Private (doctor)
 */
// 
const getPatientsList = asyncHandler(async (req, res) => {
  const consultantLocation = req.user.location;
  let query = { role: "patient" }; // Base query

  // Optionally filter by location if the doctor has one set
  if (consultantLocation) {
    console.log(`Doctor ${req.user.email} fetching patients for location: ${consultantLocation}`);
    query.location = consultantLocation; // Add location filter
  } else {
      console.warn(`Doctor ${req.user.email} has no location set, fetching all patients.`);
  }

  // Find patients based on the query
  const patients = await User.find(query)
                             .select('_id firstName lastName email location role'); // Select needed fields
  res.status(200).json(patients);
});

/**
 * Get all appointments for the logged-in consultant.
 * @route GET /api/consultant/appointments
 * @access Private (doctor)
 */
const getAppointmentsForConsultant = asyncHandler(async (req, res) => {
  const consultantId = req.user._id;
  // Find appointments where doctor._id matches consultant's _id
  // Consider populating patient details if needed on frontend
  const appointments = await Appointment.find({ "doctor._id": consultantId })
                                      .sort({ date: -1, time: -1 }); // Sort by most recent first
  res.status(200).json(appointments);
});


/**
 * Get a list of all users with the role 'doctor'.
 * @route GET /api/consultant/doctors (or could be /api/users/doctors)
 * @access Private (e.g., authenticated users, or specifically patients)
 */
const getConsultantsList = asyncHandler(async (req, res) => {
  // Get the location of the user making the request (the patient)
  const requesterLocation = req.user.location; // req.user comes from 'protect' middleware

  // Base query to find doctors
  let query = { role: 'doctor' };

  // *** ADD Location Filter based on requester ***
  if (requesterLocation) {
      console.log(`Fetching doctors for location: ${requesterLocation} (requested by ${req.user.email})`);
      query.location = requesterLocation; // Find doctors in the same location
  } else {
      // Decide behavior if requester has no location:

       console.warn(`User ${req.user.email} has no location set. Fetching ALL doctors.`);

  }

  // Find doctors based on the constructed query
  const consultants = await User.find(query)
                               .select('_id firstName lastName email location role specialties'); // Select relevant fields

  console.log(`Found ${consultants.length} consultants matching query.`);
  res.status(200).json(consultants);
});

module.exports = {
  getPatientsList, // Renamed export
  getAppointmentsForConsultant,
  getConsultantsList, // Export new function
};