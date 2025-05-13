// Backend/models/Appointment.js
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        // Link to Patient User using ObjectId reference
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Link to Doctor User using ObjectId reference
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        // Date of the appointment (e.g., 'YYYY-MM-DD')
        date: {
            type: String,
            required: true
        },
        // Specific time of the appointment (e.g., '10:00' or '10:00 AM')
        time: {
            type: String,
            required: true
        },
        notes: { // Optional notes from the patient
            type: String
        },
        // Current status of the appointment in its lifecycle
        status: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Denied', 'Cancelled', 'Completed'],
            default: 'Pending'
        },
        // ***  FIELDS for Soft Delete / Dismissal ***
        patientDismissed: { // True if the patient has dismissed this appointment from their view
            type: Boolean,
            default: false
        },
        doctorDismissed: { // True if the doctor has dismissed this appointment from their view
            type: Boolean,
            default: false
        },
    },
    {
        timestamps: true // Add createdAt and updatedAt fields automatically
    }
);

// Indexes for efficient querying appointments
// Include dismissal flags in indexes for filtering
appointmentSchema.index({ doctor: 1, date: 1, status: 1, doctorDismissed: 1 });
appointmentSchema.index({ patient: 1, date: 1, patientDismissed: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);