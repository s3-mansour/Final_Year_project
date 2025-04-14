// Backend/controllers/medicationLogController.js
const asyncHandler = require("express-async-handler");
const MedicationLog = require("../models/MedicationLog");
const Medication = require("../models/Medication"); // Keep if used in other functions
const mongoose = require('mongoose'); // Need mongoose for ObjectId validation

// @desc    Log that a medication dose was taken
// @route   POST /api/medication-logs
// @access  Private (Patient)
const logDose = asyncHandler(async (req, res) => {
  const { scheduleItemId, medicationId, scheduledDate, scheduledTime } = req.body;
  const patientId = req.user._id;

  if (!scheduleItemId || !scheduledDate || !scheduledTime) {
    res.status(400); throw new Error("Missing required fields");
  }
  // Optional: Validate medicationId
  if (medicationId) {
      const medicationExists = await Medication.findOne({ _id: medicationId, patient: patientId });
      if (!medicationExists) { res.status(404); throw new Error("Associated medication not found or invalid."); }
  }
  // Check for existing log (uses unique index)
  const existingLog = await MedicationLog.findOne({ patient: patientId, scheduleItemId: scheduleItemId });
  if (existingLog) { return res.status(200).json({ message: "Dose already logged.", log: existingLog }); }

  // Create log entry
  const newLog = await MedicationLog.create({
    patient: patientId,
    medication: medicationId,
    scheduleItemId: scheduleItemId,
    scheduledDate: new Date(scheduledDate),
    scheduledTime: scheduledTime,
    takenAt: new Date(),
  });
  res.status(201).json({ message: "Dose logged successfully.", log: newLog });
});


// @desc    Get medication logs for a specific date for the logged-in patient
// @route   GET /api/medication-logs?date=YYYY-MM-DD
// @access  Private (Patient)
const getLogsForDate = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const dateString = req.query.date;
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    res.status(400); throw new Error("Invalid or missing date query parameter (YYYY-MM-DD).");
  }
  // Calculate date range for the day in UTC
  const startDate = new Date(dateString + "T00:00:00.000Z");
  const endDate = new Date(startDate); endDate.setUTCDate(startDate.getUTCDate() + 1);
  // Find logs for the patient within the date range
  const logs = await MedicationLog.find({
    patient: patientId,
    scheduledDate: { $gte: startDate, $lt: endDate },
  }).select('scheduleItemId takenAt'); // Select minimal fields
  res.status(200).json(logs);
});


// *** ADDED FUNCTION FOR DOCTOR ***
// @desc    Get medication logs for a specific patient within a date range (for Doctor)
// @route   GET /api/medication-logs/patient/:patientId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Doctor)
const getLogsForPatientByDateRange = asyncHandler(async (req, res) => {
    const targetPatientId = req.params.patientId; // Get patientId from URL parameter
    const { startDate: startDateString, endDate: endDateString } = req.query; // Get dates from query string

    console.log(`Doctor ${req.user.email} requesting logs for patient ${targetPatientId} from ${startDateString} to ${endDateString}`);

    // --- TODO: Add REAL authorization check: Is req.user._id allowed to view targetPatientId's logs? ---

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(targetPatientId)) {
        res.status(400); throw new Error("Invalid Patient ID format.");
    }
    if (!startDateString || !endDateString ||
        !/^\d{4}-\d{2}-\d{2}$/.test(startDateString) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(endDateString)) {
       res.status(400);
       throw new Error("Invalid or missing startDate/endDate query parameters. Use YYYY-MM-DD format.");
    }

    // Calculate date range (inclusive) - ensure correct time handling
    let startDate, endDate;
    try {
        startDate = new Date(startDateString); startDate.setHours(0, 0, 0, 0); // Start of start day
        endDate = new Date(endDateString); endDate.setHours(23, 59, 59, 999); // End of the end day
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) throw new Error("Invalid Date Object");
        if (endDate < startDate) { res.status(400); throw new Error("End date cannot be before start date."); }
    } catch (e) {
        res.status(400); throw new Error("Invalid date format processing.");
    }

    // Fetch logs within the date range based on scheduledDate
    try {
        const logs = await MedicationLog.find({
            patient: targetPatientId,
            scheduledDate: { // Query based on the scheduled date of the dose
                $gte: startDate,
                $lte: endDate, // Use $lte for inclusive end date
            },
        })
        .populate('medication', 'name dosage') // *** OPTIONAL: Populate medication name/dosage ***
        .select('scheduleItemId scheduledDate scheduledTime takenAt medication') // Select useful fields
        .sort({ scheduledDate: 1, takenAt: 1 }); // Sort chronologically

        res.status(200).json(logs);

    } catch (error) {
        console.error("Error fetching patient logs for doctor:", error);
        res.status(500);
        throw new Error("Failed to retrieve patient medication logs.");
    }
});


// --- Updated Exports ---
module.exports = {
  logDose,
  getLogsForDate,
  getLogsForPatientByDateRange, // *** ADDED EXPORT ***
};