// Backend/controllers/medicationController.js
const asyncHandler = require("express-async-handler");
const Medication = require("../models/Medication");
const User = require("../models/User"); // Import User model
const mongoose = require('mongoose'); // *** ADD MONGOOSE IMPORT ***

// @desc    Get medications (for logged-in patient OR specific patient for doctor)
// @route   GET /api/medications?patientId=<ID> (optional query for doctors)
// @access  Private (Patient or Doctor)
const getPatientMedications = asyncHandler(async (req, res) => {
  let targetPatientId;

  if (req.user.role === 'patient') {
    // If patient is logged in, ignore any query param and use their own ID
    targetPatientId = req.user._id;
    console.log(`Patient ${req.user.email} fetching their medications.`);

  } else if (req.user.role === 'doctor') {
    // If doctor is logged in, REQUIRE patientId from query
    if (!req.query.patientId) {
      res.status(400);
      throw new Error("Doctor must provide patientId as a query parameter (?patientId=...).");
    }
    targetPatientId = req.query.patientId; // *** USE the query parameter ***
    console.log(`Doctor ${req.user.email} fetching medications for patient ${targetPatientId}.`);

    // --- TODO: Add REAL authorization: Is this doctor allowed to view this patient's meds? ---
    // e.g., Check if patient is in doctor's patient list

  } else {
    // Block other roles if any exist
    res.status(403).json({ message: "Unauthorized role." });
    return;
  }

  // Fetch medications for the determined target patient ID
  try {
    // Validate targetPatientId is a potentially valid ObjectId format before querying
    if (!mongoose.Types.ObjectId.isValid(targetPatientId)) {
         res.status(400);
         throw new Error("Invalid Patient ID format provided.");
    }

    const medications = await Medication.find({ patient: targetPatientId }).sort({ createdAt: -1 });

    // Send the found medications (or empty array if none)
    res.status(200).json(medications);

  } catch (error) {
     console.error("Error fetching medications in controller:", error);
     res.status(500);
     throw new Error("Failed to retrieve medications due to a server error.");
  }
});


// @desc    Create a new medication entry (Prescribed by Doctor OR added by Patient)
// @route   POST /api/medications
// @access  Private (Patient or Doctor)
const createMedication = asyncHandler(async (req, res) => {
  // Destructure potential patientId from body
  const { name, dosage, frequency, times, startDate, endDate, notes, isActive, patientId } = req.body;
  let targetPatientId;

  // --- Determine Target Patient ID based on logged-in user role ---
  // (Role checking logic remains the same as previous version)
  if (req.user.role === 'doctor') {
    if (!patientId) {
      res.status(400); throw new Error("Doctor must provide the target patientId in the request body.");
    }
    const patientExists = await User.findById(patientId);
    if (!patientExists || patientExists.role !== 'patient') {
      res.status(404); throw new Error('Target patient not found or is not a patient role.');
    }
    targetPatientId = patientId;
    console.log(`Doctor ${req.user.email} prescribing for patient ${targetPatientId}`);
  } else if (req.user.role === 'patient') {
    console.warn(`Patient ${req.user.email} creating medication directly (Temporary for testing).`);
    targetPatientId = req.user._id;
    if (patientId && patientId.toString() !== targetPatientId.toString()) {
      console.warn(`Patient ${req.user.email} attempted to add medication for different patient ${patientId}. Assigning to self.`);
    }
  } else {
    res.status(403); throw new Error("User role not authorized to create medications.");
  }

  // --- Basic validation for medication data ---
  if (!name || !dosage || !frequency) {
    res.status(400);
    throw new Error("Please provide name, dosage, and frequency for the medication.");
  }
  // *** ADDED/REFINED: Validation for startDate presence and date range ***
  if (!startDate) {
      res.status(400);
      throw new Error("A start date (YYYY-MM-DD) is required for the medication.");
  }
  let parsedStartDate;
  try {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) throw new Error(); // Check if valid date
  } catch (e) {
       res.status(400); throw new Error("Invalid start date format. Please use YYYY-MM-DD.");
  }
  let parsedEndDate = null;
  if (endDate) {
      try {
          parsedEndDate = new Date(endDate);
          if (isNaN(parsedEndDate.getTime())) throw new Error(); // Check if valid date
          if (parsedEndDate < parsedStartDate) {
              res.status(400); throw new Error("End date cannot be before the start date.");
          }
      } catch(e) {
          res.status(400); throw new Error("Invalid end date format. Please use YYYY-MM-DD.");
      }
  }
  // *** END VALIDATION ***

  // --- Create the medication document ---
  const medication = await Medication.create({
    patient: targetPatientId,
    name,
    dosage,
    frequency,
    times: times?.filter(t => t && typeof t === 'string' && t.trim() !== "") || [],
    // *** Use parsed dates ***
    startDate: parsedStartDate,
    endDate: parsedEndDate, // Will be null if endDate wasn't provided or was invalid initially (caught by validation)
    notes,
    isActive: isActive === undefined ? true : isActive, // Ensure default is applied if undefined
  });

  res.status(201).json(medication);
});

// @desc    Update a specific medication entry
// @route   PUT /api/medications/:id
// @access  Private (Patient/Doctor) - TODO: Needs proper role checks
const updateMedication = asyncHandler(async (req, res) => {
  const medication = await Medication.findById(req.params.id);

  if (!medication) {
    res.status(404); throw new Error("Medication not found.");
  }

  // --- AUTHORIZATION CHECK ---
  // (Authorization logic remains the same as previous version)
  if (req.user.role === 'patient' && medication.patient.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error("Patient not authorized to update this medication.");
  }
  else if (req.user.role === 'doctor') {
      console.log(`Doctor ${req.user.email} attempting update for medication belonging to ${medication.patient}`);
      // --- TODO: Add REAL authorization check ---
  }
  else {
      res.status(403); throw new Error("User role not authorized for this action.");
  }

  // --- Update fields ---
  const { name, dosage, frequency, times, startDate, endDate, notes, isActive } = req.body;

  // *** ADDED/REFINED: Validate dates if they are being updated ***
  let newStartDate = medication.startDate; // Keep original if not updating
  if (startDate) {
      try {
          newStartDate = new Date(startDate);
          if (isNaN(newStartDate.getTime())) throw new Error();
      } catch(e) {
          res.status(400); throw new Error("Invalid start date format. Please use YYYY-MM-DD.");
      }
  }
  let newEndDate = medication.endDate; // Keep original if not updating
  let endDateProvided = req.body.hasOwnProperty('endDate'); // Check if key exists
  if (endDateProvided) {
      if (endDate) { // If endDate is not null/empty string
          try {
              newEndDate = new Date(endDate);
              if (isNaN(newEndDate.getTime())) throw new Error();
          } catch (e) {
              res.status(400); throw new Error("Invalid end date format. Please use YYYY-MM-DD.");
          }
      } else { // If endDate provided is null or empty string, clear it
          newEndDate = null;
      }
  }
  // Check date range consistency (using the potentially updated values)
  if (newEndDate && newStartDate && newEndDate < newStartDate) {
      res.status(400); throw new Error("End date cannot be before the start date.");
  }
  // *** END DATE VALIDATION ***

  // Apply updates
  medication.name = name ?? medication.name;
  medication.dosage = dosage ?? medication.dosage;
  medication.frequency = frequency ?? medication.frequency;
  medication.times = times?.filter(t => t && typeof t === 'string' && t.trim() !== "") ?? medication.times;
  // *** Assign validated dates ***
  medication.startDate = newStartDate;
  if (endDateProvided) { // Only update endDate if it was actually provided in the request body
      medication.endDate = newEndDate;
  }
  medication.notes = notes ?? medication.notes;
  if (typeof isActive === 'boolean') {
      medication.isActive = isActive;
  }

  const updatedMedication = await medication.save();
  res.status(200).json(updatedMedication);
});


// @desc    Delete a specific medication entry
// @route   DELETE /api/medications/:id
// @access  Private (Patient/Doctor) - TODO: Needs proper role checks
const deleteMedication = asyncHandler(async (req, res) => {
  const medication = await Medication.findById(req.params.id);

  if (!medication) {
    res.status(404); throw new Error("Medication not found.");
  }

  // --- AUTHORIZATION CHECK ---
  // (Authorization logic remains the same as previous version)
   if (req.user.role === 'patient' && medication.patient.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error("Patient not authorized to delete this medication.");
  }
  else if (req.user.role === 'doctor') {
      console.log(`Doctor ${req.user.email} attempting delete for medication belonging to ${medication.patient}`);
      // --- TODO: Add REAL authorization check ---
  }
   else {
      res.status(403); throw new Error("User role not authorized for this action.");
  }

  // --- Perform Deletion ---
  await Medication.findByIdAndDelete(req.params.id);

  res.status(200).json({ message: "Medication removed successfully", id: req.params.id });
});


// --- Export ALL functions used by the routes ---
module.exports = {
  getPatientMedications,
  createMedication,
  updateMedication,
  deleteMedication,
};