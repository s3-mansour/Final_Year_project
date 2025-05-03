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
      type: String, // Consider splitting later
      required: [true, "Please add dosage information"],
    },

    frequencyType: {
      type: String,
      required: [true, "Please specify frequency type"],
      enum: [
          'daily',         // Every X days (use frequencyValue for X, default 1)
          'weekly',        // On specific days of the week (use daysOfWeek)
          // 'monthly',    // Example: implement later if needed
          'interval_hours',// Every X hours (use frequencyValue for X)
          'as_needed',     // PRN - No regular schedule
          'specific_days'  // Example: Can be similar to weekly
      ],
      default: 'daily',
    },
    frequencyValue: {
      type: Number,
      min: [1, 'Frequency value must be at least 1'],
      // Validation: This field is conceptually required for 'daily' (if > 1) and 'interval_hours'
    },
    daysOfWeek: [ // Used for 'weekly' or 'specific_days'
        {
            type: String, // Recommend storing full names or consistent numbers (0-6)
           
        }
    ],

    // Times array remains relevant for most scheduled types
    times: [
      {
        type: String,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Please use HH:MM format for times"],
      }
    ],
    startDate: {
      type: Date,
      required: [true, "Please provide a start date for the medication"],
    },
    endDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Medication", medicationSchema);