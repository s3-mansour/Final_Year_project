// Backend/models/Availability.js
const mongoose = require('mongoose');

// REMOVED: const Appointment = require("../models/Appointment"); // Fix: Avoid requiring models within other model files

const availabilitySchema = new mongoose.Schema(
    {
        // Link to the Doctor User who owns this availability
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Date of the availability block (e.g., 'YYYY-MM-DD')
        date: {
            type: String, // Storing date as string for simple matching
            required: true
        },
        // Start time of the availability block (range, e.g., '09:00')
        startTime: {
            type: String,
            required: true
        },
        // End time of the availability block (range, e.g., '17:00')
        endTime: {
            type: String,
            required: true
        },
        // Duration of each bookable slot within this range (in minutes)
        slotDurationMinutes: {
             type: Number,
             required: true,
             min: 1 // Duration must be positive
        },
    },
    {
        timestamps: true // Add createdAt and updatedAt fields
    }
);

// Unique index to prevent duplicate availability blocks for the same time range on the same day for a doctor
availabilitySchema.index({ doctor: 1, date: 1, startTime: 1, endTime: 1 }, { unique: true });
// Index for fetching availability by doctor and date
availabilitySchema.index({ doctor: 1, date: 1 });


module.exports = mongoose.model('Availability', availabilitySchema); // Export the Availability model