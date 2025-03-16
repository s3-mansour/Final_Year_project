// src/controllers/appointmentController.js
const asyncHandler = require("express-async-handler");
const Appointment = require("../models/Appointment");
const User = require("../models/User");

/**
 * @desc Create a new appointment automatically assigning a doctor in the same location
 * @route POST /api/appointments
 * @access Private (patient)
 */
const createAppointment = asyncHandler(async (req, res) => {
  const { date, time, message } = req.body;
  const patient = req.user; // Provided by protect middleware

  if (!date || !time) {
    return res.status(400).json({ message: "Please provide both date and time." });
  }

  // Find a doctor in the same location as the patient
  const doctor = await User.findOne({ role: "doctor", location: patient.location });
  if (!doctor) {
    return res.status(400).json({
      message: `No doctor available in your area (${patient.location}). Please try again later or choose a different location.`,
    });
  }

  // Check for existing appointment at same date & time for that doctor
  const existingAppointment = await Appointment.findOne({
    "doctor._id": doctor._id,
    date,
    time,
  });
  if (existingAppointment) {
    return res.status(400).json({
      message: "An appointment at this time already exists. Please choose a different time or date.",
    });
  }

  // Create the appointment
  const appointment = await Appointment.create({
    patient: {
      _id: patient._id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      location: patient.location,
    },
    doctor: {
      _id: doctor._id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      email: doctor.email,
      location: doctor.location,
    },
    date,
    time,
    notes: message,
  });

  res.status(201).json(appointment);
});

/**
 * @desc Get appointments for the logged-in user (patient or doctor)
 * @route GET /api/appointments
 * @access Private
 */
const getAppointments = asyncHandler(async (req, res) => {
  let appointments;
  if (req.user.role === "doctor") {
    appointments = await Appointment.find({ "doctor._id": req.user._id });
  } else {
    appointments = await Appointment.find({ "patient._id": req.user._id });
  }
  res.status(200).json(appointments);
});

/**
 * @desc Delete (cancel) an appointment
 * @route DELETE /api/appointments/:id
 * @access Private
 */
const deleteAppointment = asyncHandler(async (req, res) => {
  const appointmentId = req.params.id;

  // Optionally check if the appointment exists and if the user is authorized
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  if (
    req.user.role === "patient" &&
    appointment.patient._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ message: "Not authorized to cancel this appointment" });
  }

  if (
    req.user.role === "doctor" &&
    appointment.doctor._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({ message: "Not authorized to cancel this appointment" });
  }

  // Use findByIdAndDelete instead of appointment.remove()
  const deletedAppointment = await Appointment.findByIdAndDelete(appointmentId);

  if (!deletedAppointment) {
    return res.status(500).json({ message: "Failed to cancel appointment" });
  }

  res.json({ message: "Appointment cancelled successfully" });
});


/**
 * @desc Update an existing appointment (date/time/notes)
 * @route PUT /api/appointments/:id
 * @access Private
 */
const updateAppointment = asyncHandler(async (req, res) => {
    const appointmentId = req.params.id;
    const { date, time, notes } = req.body;
  
    // 1. Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
  
    // 2. Authorization checks (patient or doctor of that appointment)
    if (
      req.user.role === "patient" &&
      appointment.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to update this appointment" });
    }
  
    if (
      req.user.role === "doctor" &&
      appointment.doctor._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized to update this appointment" });
    }
  
    // 3. Update fields
    if (date) appointment.date = date;
    if (time) appointment.time = time;
    if (notes !== undefined) appointment.notes = notes;
  
    // 4. Save changes
    const updated = await appointment.save();
  
    res.json({
      message: "Appointment updated successfully",
      appointment: updated,
    });
  });
  
module.exports = {
  createAppointment,
  getAppointments,
  deleteAppointment,
  updateAppointment,
};
