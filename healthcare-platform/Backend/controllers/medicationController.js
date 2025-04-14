// Backend/controllers/medicationController.js
const asyncHandler = require("express-async-handler");
const Medication = require("../models/Medication");
const User = require("../models/User");
const mongoose = require('mongoose');

// --- getPatientMedications function remains the same as the last version ---
const getPatientMedications = asyncHandler(async (req, res) => {
  let targetPatientId;
  if (req.user.role === 'patient') {
    targetPatientId = req.user._id;
    console.log(`Patient ${req.user.email} fetching their medications.`);
  } else if (req.user.role === 'doctor') {
    if (!req.query.patientId) {
      res.status(400); throw new Error("Doctor must provide patientId as a query parameter (?patientId=...).");
    }
    targetPatientId = req.query.patientId;
    console.log(`Doctor ${req.user.email} fetching medications for patient ${targetPatientId}.`);
    // --- TODO: Add REAL authorization ---
  } else {
    res.status(403).json({ message: "Unauthorized role." }); return;
  }
  try {
    if (!mongoose.Types.ObjectId.isValid(targetPatientId)) {
         res.status(400); throw new Error("Invalid Patient ID format provided.");
    }
    const medications = await Medication.find({ patient: targetPatientId }).sort({ createdAt: -1 });
    res.status(200).json(medications);
  } catch (error) {
     console.error("Error fetching medications in controller:", error);
     res.status(500); throw new Error("Failed to retrieve medications due to a server error.");
  }
});


// @desc    Create a new medication entry with structured frequency
// @route   POST /api/medications
// @access  Private (Patient or Doctor)
const createMedication = asyncHandler(async (req, res) => {
  // *** UPDATED: Destructure new frequency fields, remove old 'frequency' ***
  const { name, dosage, frequencyType, frequencyValue, daysOfWeek, times,
          startDate, endDate, notes, isActive, patientId } = req.body;
  let targetPatientId;

  // --- Determine Target Patient ID (logic remains the same) ---
  if (req.user.role === 'doctor') {
    if (!patientId) { res.status(400); throw new Error("Doctor must provide target patientId."); }
    const patientExists = await User.findById(patientId);
    if (!patientExists || patientExists.role !== 'patient') { res.status(404); throw new Error('Target patient not found or invalid role.'); }
    targetPatientId = patientId;
    console.log(`Doctor ${req.user.email} prescribing for patient ${targetPatientId}`);
  } else if (req.user.role === 'patient') {
    console.warn(`Patient ${req.user.email} creating medication directly (Temporary).`);
    targetPatientId = req.user._id;
    if (patientId && patientId.toString() !== targetPatientId.toString()) { console.warn(`Patient ${req.user.email} attempted cross-assign. Assigning to self.`); }
  } else {
    res.status(403); throw new Error("Unauthorized role.");
  }

  // --- Validation for Core Fields ---
  if (!name || !dosage || !frequencyType) { // Check frequencyType now
    res.status(400);
    throw new Error("Please provide name, dosage, and frequency type.");
  }

  // --- Validation for Dates (logic remains the same) ---
   if (!startDate) { res.status(400); throw new Error("Start date required."); }
   let parsedStartDate; try { parsedStartDate = new Date(startDate); if (isNaN(parsedStartDate.getTime())) throw new Error(); } catch (e) { res.status(400); throw new Error("Invalid start date format.");}
   let parsedEndDate = null; if (endDate) { try { parsedEndDate = new Date(endDate); if (isNaN(parsedEndDate.getTime())) throw new Error(); if (parsedEndDate < parsedStartDate) { res.status(400); throw new Error("End date cannot be before start date."); } } catch(e) { res.status(400); throw new Error("Invalid end date format."); } }

  // *** ADDED: Validation based on frequencyType ***
  if (frequencyType === 'interval_hours' && (!frequencyValue || frequencyValue < 1)) {
      res.status(400); throw new Error("Frequency value (hours) required for interval_hours type.");
  }
  if (frequencyType === 'daily' && frequencyValue && frequencyValue < 1) {
       res.status(400); throw new Error("Frequency value (days) must be 1 or greater for daily type.");
  }
  if ((frequencyType === 'weekly' || frequencyType === 'specific_days') && (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0)) {
      res.status(400); throw new Error("Days of week must be provided for weekly/specific_days frequency type.");
  }
  if (frequencyType !== 'as_needed' && (!Array.isArray(times) || times.filter(t => t).length === 0)) {
     // Require times for most types, could be made optional if needed
     // res.status(400); throw new Error("Specific times must be provided unless frequency is 'as_needed'.");
     console.warn("No specific times provided for a scheduled medication."); // Or make it an error
  }
  // *** END FREQUENCY VALIDATION ***

  // --- Create the medication document ---
  const medicationData = {
      patient: targetPatientId,
      name,
      dosage,
      // *** Use new frequency fields ***
      frequencyType,
      frequencyValue: frequencyValue || (frequencyType === 'daily' ? 1 : undefined), // Default daily value to 1 if not provided
      daysOfWeek: (frequencyType === 'weekly' || frequencyType === 'specific_days') ? daysOfWeek : undefined, // Only save if relevant type
      times: times?.filter(t => t && typeof t === 'string' && t.trim() !== "") || [], // Clean times array
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      notes,
      isActive: isActive === undefined ? true : isActive,
  };

  // Remove optional fields if they are undefined to keep DB clean
  if (medicationData.frequencyValue === undefined) delete medicationData.frequencyValue;
  if (medicationData.daysOfWeek === undefined) delete medicationData.daysOfWeek;

  const medication = await Medication.create(medicationData);

  res.status(201).json(medication);
});


// @desc    Update a specific medication entry with structured frequency
// @route   PUT /api/medications/:id
// @access  Private (Patient/Doctor) - TODO: Needs proper role checks
const updateMedication = asyncHandler(async (req, res) => {
  const medication = await Medication.findById(req.params.id);
  if (!medication) { res.status(404); throw new Error("Medication not found."); }

  // --- AUTHORIZATION CHECK --- (logic remains the same) ---
  if (req.user.role === 'patient' && medication.patient.toString() !== req.user._id.toString()) { res.status(403); throw new Error("Patient not authorized."); }
  else if (req.user.role === 'doctor') { console.log(`Doctor ${req.user.email} attempting update for med ${medication._id}`); /* TODO: Add REAL authorization */ }
  else { res.status(403); throw new Error("Unauthorized role."); }

  // --- Get Updates, including new frequency fields ---
  const { name, dosage, frequencyType, frequencyValue, daysOfWeek, times,
          startDate, endDate, notes, isActive } = req.body;

  // --- Validate Dates if provided (logic remains similar) ---
  let newStartDate = medication.startDate; if (startDate) { try { newStartDate = new Date(startDate); if (isNaN(newStartDate.getTime())) throw new Error(); } catch(e) { res.status(400); throw new Error("Invalid start date format."); } }
  let newEndDate = medication.endDate; let endDateProvided = req.body.hasOwnProperty('endDate'); if (endDateProvided) { if (endDate) { try { newEndDate = new Date(endDate); if (isNaN(newEndDate.getTime())) throw new Error(); } catch (e) { res.status(400); throw new Error("Invalid end date format."); } } else { newEndDate = null; } }
  if (newEndDate && newStartDate && newEndDate < newStartDate) { res.status(400); throw new Error("End date cannot be before start date."); }

  // --- Apply updates, including new frequency fields ---
  medication.name = name ?? medication.name;
  medication.dosage = dosage ?? medication.dosage;
  medication.notes = notes ?? medication.notes;
  medication.startDate = newStartDate;
  if (endDateProvided) { medication.endDate = newEndDate; }
  if (typeof isActive === 'boolean') { medication.isActive = isActive; }
  medication.times = times?.filter(t => t && typeof t === 'string' && t.trim() !== "") ?? medication.times;

  // *** Update frequency fields IF provided ***
  if (frequencyType) {
      // Add validation similar to createMedication based on the new frequencyType being set
      if (frequencyType === 'interval_hours' && (!frequencyValue || frequencyValue < 1)) { throw new Error("Frequency value required for interval_hours."); }
      if ((frequencyType === 'weekly' || frequencyType === 'specific_days') && (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0)) { throw new Error("Days of week required for weekly/specific_days."); }

      medication.frequencyType = frequencyType;
      medication.frequencyValue = frequencyValue || (frequencyType === 'daily' ? 1 : undefined);
      medication.daysOfWeek = (frequencyType === 'weekly' || frequencyType === 'specific_days') ? daysOfWeek : undefined;

      // Clean up fields that are no longer relevant for the new type
      if (medication.frequencyType !== 'daily' && medication.frequencyType !== 'interval_hours') {
          medication.frequencyValue = undefined; // Clear value if not needed
      }
      if (medication.frequencyType !== 'weekly' && medication.frequencyType !== 'specific_days') {
          medication.daysOfWeek = undefined; // Clear days if not needed
      }

  } else {
      // If only value or daysOfWeek are provided without type, handle appropriately (maybe update only if type matches?)
      // Example: Only update frequencyValue if current type allows it
       if (frequencyValue && (medication.frequencyType === 'daily' || medication.frequencyType === 'interval_hours')) {
           medication.frequencyValue = frequencyValue;
       }
       // Example: Only update daysOfWeek if current type allows it
       if (daysOfWeek && (medication.frequencyType === 'weekly' || medication.frequencyType === 'specific_days')) {
            medication.daysOfWeek = daysOfWeek;
       }
  }
  // *** End frequency update ***


  const updatedMedication = await medication.save();
  res.status(200).json(updatedMedication);
});


// --- deleteMedication function remains the same as the last version ---
const deleteMedication = asyncHandler(async (req, res) => {
  const medication = await Medication.findById(req.params.id);
  if (!medication) { res.status(404); throw new Error("Medication not found."); }
  // Authorization Check (remains same)
  if (req.user.role === 'patient' && medication.patient.toString() !== req.user._id.toString()) { res.status(403); throw new Error("Patient not authorized."); }
  else if (req.user.role === 'doctor') { console.log(`Doctor ${req.user.email} attempting delete for med ${medication._id}`); /* TODO: Add REAL authorization */}
  else { res.status(403); throw new Error("Unauthorized role."); }
  // Perform Deletion
  await Medication.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Medication removed successfully", id: req.params.id });
});


// --- Export ALL functions ---
module.exports = {
  getPatientMedications,
  createMedication,
  updateMedication,
  deleteMedication,
};