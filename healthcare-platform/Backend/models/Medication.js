// Backend/models/Medication.js
const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Please add a medication name"],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, "Please add dosage information"],
    },
    frequency: {
      type: String,
      required: [true, "Please add frequency information"],
    },
    times: [
      {
        type: String,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Please use HH:MM format for times"],
      }
    ],
    // *** Ensure these Date fields are present ***
    startDate: {
      type: Date,
      required: [true, "Please provide a start date for the medication"], // Make start date required
      // default: Date.now, // Defaulting might not be ideal for prescriptions - doctor should set it
    },
    endDate: {
      type: Date, // Optional: medication might be ongoing
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: { // Can still be useful to manually disable a med within its date range
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Medication", medicationSchema);