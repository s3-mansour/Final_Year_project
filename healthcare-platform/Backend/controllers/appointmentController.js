// Backend/controllers/appointmentController.js
const asyncHandler = require("express-async-handler");
const Appointment = require("../models/Appointment"); // Import updated Appointment model
const User = require("../models/User");
const Availability = require("../models/Availability");
const { getDoctorTimeSlotsForDateHelper } = require('./availabilityController');
const mongoose = require('mongoose');

/**
 * @desc Create a new appointment request by a patient.
 * @route POST /api/appointments
 * @access Private (patient)
 * Expects { date, time, doctorId, message } in request body.
 */
const createAppointment = asyncHandler(async (req, res) => {
  const { date, time, doctorId, message } = req.body;
  const patientId = req.user._id;

  if (!date || !time || !doctorId) {
    res.status(400);
    throw new Error("Date, time, and doctor are required.");
  }
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
       res.status(400);
       throw new Error("Invalid Doctor ID format.");
  }
   if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
         res.status(400);
         throw new Error("Invalid date format. Use YYYY-MM-DD.");
    }

  try {
    const trulyAvailableSlots = await getDoctorTimeSlotsForDateHelper(doctorId, date);
     if (!trulyAvailableSlots.includes(time)) {
         res.status(409);
         throw new Error(`Selected time slot '${time}' is not available with this doctor on ${date}. Please select from the available times.`);
     }

    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: date,
      time: time,
      status: { $in: ['Pending', 'Confirmed'] } // Check for pending/confirmed appointments at this time
    });

    if (existingAppointment) {
       res.status(409);
       throw new Error("Selected time slot was just booked by another patient. Please choose another time.");
    }

    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      date: date,
      time: time,
      notes: message,
      status: 'Pending',
      // New appointments are NOT dismissed by default
      patientDismissed: false,
      doctorDismissed: false,
    });

    if (appointment) {
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('patient', '_id firstName lastName email location')
            .populate('doctor', '_id firstName lastName email location');

      res.status(201).json(populatedAppointment);
    } else {
      res.status(400);
      throw new Error("Failed to create appointment.");
    }

  } catch (error) {
    console.error("Error scheduling appointment:", error);
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    throw new Error(error.message || "Server error creating appointment.");
  }
});

/**
 * @desc Get appointments for the logged-in user (patient or doctor)
 * @route GET /api/appointments
 * @access Private
 * Returns appointments relevant to the user, filtering out dismissed ones.
 */
const getAppointments = asyncHandler(async (req, res) => {
  let appointments;
  const userId = req.user._id;
  const userRole = req.user.role;

  if (userRole === "doctor") {
    // Doctor view: Filter out appointments the doctor has dismissed
    appointments = await Appointment.find({
        doctor: userId,
        doctorDismissed: { $ne: true } // Only include appointments NOT dismissed by the doctor
    })
    .populate('patient', '_id firstName lastName email location')
    .populate('doctor', '_id firstName lastName email location');
  } else { // User is a patient
    // Patient view: Filter out appointments the patient has dismissed
    appointments = await Appointment.find({
        patient: userId,
        patientDismissed: { $ne: true } // Only include appointments NOT dismissed by the patient
    })
    .populate('patient', '_id firstName lastName email location')
    .populate('doctor', '_id firstName lastName email location');
  }
  res.status(200).json(appointments);
});

// *** REMOVED: The deleteAppointment controller and its logic for hard deletion ***
// All 'deletion' will now be handled as a status update or a dismissal flag update via PUT.
// If a hard delete route is absolutely needed for edge cases or admin, it should be separate.


/**
 * @desc Update an existing appointment (date/time/notes/status, or dismissal flags).
 * @route PUT /api/appointments/:id
 * @access Private (patient can update notes/cancel/dismiss, doctor can update status/notes/date/time/dismiss).
 * This is the primary route for changing appointment status AND setting dismissal flags.
 */
const updateAppointment = asyncHandler(async (req, res) => {
    const appointmentId = req.params.id;
    // Get update fields from request body. This can now include dismissal flags.
    const { date, time, notes, status, patientDismissed, doctorDismissed } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

     // Validate appointmentId format.
     if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        res.status(400);
        throw new Error("Invalid Appointment ID format.");
    }

    // 1. Find the appointment by ID.
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 2. Authorization checks: Ensure user is either the patient OR the doctor of this appointment.
    if (
        (userRole === "patient" && appointment.patient.toString() !== userId.toString()) ||
        (userRole === "doctor" && appointment.doctor.toString() !== userId.toString())
    ) {
        res.status(403);
        throw new Error("Not authorized to update this appointment");
    }

     // 3. Role-based update permissions and validation.
     // Define what each role is allowed to update via this PUT route.

    if (userRole === "patient") {
        // --- Logic for PATIENT updates ---
        // Patients are primarily allowed to update notes, change status to 'Cancelled', AND set their own dismissal flag.

        if (notes !== undefined) appointment.notes = notes;

        if (status !== undefined) {
             // Patient can ONLY change status to 'Cancelled' via this route.
             if (status !== 'Cancelled') {
                 res.status(400);
                 throw new Error("Patients can only update appointment status to 'Cancelled'.");
             }
             // Patient can only change status to 'Cancelled' if the current status is 'Pending' or 'Confirmed'.
             if (!['Pending', 'Confirmed'].includes(appointment.status)) {
                  res.status(400);
                  throw new Error(`Cannot cancel appointment with status: ${appointment.status}.`);
             }
             // If the status is valid ('Cancelled') and the transition is allowed for a patient, update status.
             appointment.status = status; // Set status to 'Cancelled'.
        }

        // Patients ARE allowed to set their own dismissal flag
        if (patientDismissed === true) { // Only handle setting to true via PUT
             appointment.patientDismissed = true;
        }
         // Patients are NOT allowed to set the doctorDismissed flag
        if (doctorDismissed !== undefined) {
            res.status(403);
            throw new Error("Patients cannot update doctor dismissal status.");
        }


        // Patients are NOT allowed to change date or time via this route.
        if (date !== undefined || time !== undefined) {
             res.status(403);
             throw new Error("Patients cannot directly change appointment date or time.");
        }

    } else if (userRole === "doctor") {
        // --- Logic for DOCTOR updates ---
        // Doctors can update status, notes, date, time, AND set their own dismissal flag.

        if (status !== undefined) {
             // Validate the new status value against allowed statuses for doctors.
             const validStatuses = ['Pending', 'Confirmed', 'Denied', 'Cancelled', 'Completed'];
             if (!validStatuses.includes(status)) {
                 res.status(400); throw new Error(`Invalid status provided. Must be one of: ${validStatuses.join(', ')}`);
             }
             // Optional: Add validation for valid status transitions for doctor if needed
             // (e.g., can't go from Completed back to Pending)
             appointment.status = status;
        }
        if (notes !== undefined) appointment.notes = notes;
        if (date !== undefined) appointment.date = date;
        if (time !== undefined) appointment.time = time; // Assuming doctor can freely update time via this route for rescheduling.

        // Doctors ARE allowed to set their own dismissal flag
        if (doctorDismissed === true) { // Only handle setting to true via PUT
             appointment.doctorDismissed = true;
        }
        // Doctors are NOT allowed to set the patientDismissed flag
        if (patientDismissed !== undefined) {
            res.status(403);
            throw new Error("Doctors cannot update patient dismissal status.");
        }


    } else {
        // This block should ideally not be reached if protect middleware works correctly and assigns a role.
        res.status(403); // Forbidden
        throw new Error("Unauthorized role to update appointment.");
    }


    // 4. Save the changes to the appointment document in the database.
    const updated = await appointment.save();

    // Optional: Populate patient/doctor details before sending the updated appointment response.
     const populatedAppointment = await Appointment.findById(updated._id)
        .populate('patient', '_id firstName lastName email location')
        .populate('doctor', '_id firstName lastName email location');

    res.json({
      message: "Appointment updated successfully",
      appointment: populatedAppointment, // Send the updated appointment data.
    });
  });


module.exports = {
  createAppointment, // Patient creates, status is Pending
  getAppointments, // Gets list filtering by dismissal flags
  updateAppointment, // Patient cancels (Pending/Confirmed) / dismisses (Denied/Cancelled); Doctor updates status (Accept/Deny/Cancel/Complete) / dismisses (Denied/Cancelled/Completed)
};