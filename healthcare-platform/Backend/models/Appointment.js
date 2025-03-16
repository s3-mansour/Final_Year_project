// src/models/Appointment.js
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      location: { type: String, required: true }, // <--- Add location here
    },
    doctor: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      location: { type: String, required: true }, // <--- Add location here
    },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
