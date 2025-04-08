// Backend/models/Availability.js
const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    doctor: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    date: { 
      type: Date, 
      required: true 
    },
    startTime: { 
      type: String, // e.g., "07:00"
      required: true 
    },
    endTime: { 
      type: String, // e.g., "17:00"
      required: true 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Availability", availabilitySchema);
