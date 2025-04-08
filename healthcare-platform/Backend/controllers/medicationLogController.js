// Backend/controllers/medicationLogController.js
const asyncHandler = require("express-async-handler");
const MedicationLog = require("../models/MedicationLog");
const Medication = require("../models/Medication"); // Needed if validating medId

// @desc    Log that a medication dose was taken
// @route   POST /api/medication-logs
// @access  Private (Patient)
const logDose = asyncHandler(async (req, res) => {
  const { scheduleItemId, medicationId, scheduledDate, scheduledTime } = req.body;
  const patientId = req.user._id;

  // --- Validation ---
  if (!scheduleItemId || !scheduledDate || !scheduledTime) {
    res.status(400);
    throw new Error("Missing required fields: scheduleItemId, scheduledDate, scheduledTime");
  }

  // Optional: Validate medicationId if provided
  if (medicationId) {
      const medicationExists = await Medication.findOne({ _id: medicationId, patient: patientId });
      if (!medicationExists) {
          res.status(404);
          throw new Error("Associated medication not found or does not belong to user.");
      }
  }

  // --- Check for existing log for this exact dose instance ---
  // This uses the unique index defined in the model
  const existingLog = await MedicationLog.findOne({
    patient: patientId,
    scheduleItemId: scheduleItemId,
  });

  if (existingLog) {
    // Decide how to handle: return existing log (200), or conflict (409)
    // Returning existing log might be friendlier for idempotent frontend calls
    return res.status(200).json({ message: "Dose already logged.", log: existingLog });
    // Or:
    // res.status(409); // Conflict
    // throw new Error("This dose has already been logged.");
  }

  // --- Create the log entry ---
  const newLog = await MedicationLog.create({
    patient: patientId,
    medication: medicationId, // Store reference if provided
    scheduleItemId: scheduleItemId,
    scheduledDate: new Date(scheduledDate), // Ensure it's saved as a Date object
    scheduledTime: scheduledTime,
    takenAt: new Date(), // Record the time the API call was made
  });

  res.status(201).json({ message: "Dose logged successfully.", log: newLog });
});


// @desc    Get medication logs for a specific date for the logged-in patient
// @route   GET /api/medication-logs?date=YYYY-MM-DD
// @access  Private (Patient)
const getLogsForDate = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const dateString = req.query.date; // Expecting "YYYY-MM-DD"

  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    res.status(400);
    throw new Error("Invalid or missing date query parameter. Use YYYY-MM-DD format.");
  }

  // Calculate date range for the *entire day* in UTC
  // Start of the day (UTC)
  const startDate = new Date(dateString + "T00:00:00.000Z");
  // End of the day (UTC) - Start of the next day
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 1);

  // Find logs for the patient within the date range based on scheduledDate
  const logs = await MedicationLog.find({
    patient: patientId,
    scheduledDate: {
      $gte: startDate, // Greater than or equal to the start of the day
      $lt: endDate,   // Less than the start of the next day
    },
  }).select('scheduleItemId takenAt'); // Select only needed fields for efficiency

  // Send back the logs (potentially just the scheduleItemIds for easy checking on frontend)
  res.status(200).json(logs);
});


// --- Controller Functions for Doctors (To be added later) ---
// const getLogsForPatientByDateRange = asyncHandler(async (req, res) => { ... });


module.exports = {
  logDose,
  getLogsForDate,
  // getLogsForPatientByDateRange (add later)
};