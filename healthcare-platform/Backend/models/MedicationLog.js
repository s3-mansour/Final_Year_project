// Backend/models/MedicationLog.js
const mongoose = require("mongoose");

const medicationLogSchema = new mongoose.Schema(
  {
    // Reference to the patient who took the dose
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    // Optional but helpful: Reference to the specific medication regimen
    medication: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Make false if scheduleItemId is primary key for log entry
      ref: "Medication",
    },
    // Unique identifier for the specific dose instance being logged
    // e.g., generated on frontend like: `${medication._id}-${isoDateString}-${scheduledTime}`
    scheduleItemId: {
      type: String,
      required: true,
      index: true, // Index for faster lookups/duplicate checks
    },
    // The date the dose was *scheduled* for
    scheduledDate: {
      type: Date,
      required: true,
    },
    // The time the dose was *scheduled* for (e.g., "08:00", "Any time")
    scheduledTime: {
      type: String,
      required: true,
    },
    // Timestamp of when the patient actually marked the dose as taken
    takenAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt, updatedAt
  }
);

// Optional: Compound index to prevent duplicate logs for the same patient + schedule item
medicationLogSchema.index({ patient: 1, scheduleItemId: 1 }, { unique: true });


module.exports = mongoose.model("MedicationLog", medicationLogSchema);