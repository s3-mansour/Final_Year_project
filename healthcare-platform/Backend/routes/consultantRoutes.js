// Backend/routes/consultantRoutes.js
const express = require("express");
const router = express.Router();
// *** Import protect and potentially doctorAuth ***
const { protect, doctorAuth } = require("../middleware/authMiddleware");
// *** Import updated controller functions ***
const {
  getPatientsList, // Renamed function
  getAppointmentsForConsultant,
  getConsultantsList, // New function
} = require("../controllers/consultantController");

// --- Doctor-Specific Routes (Require doctorAuth) ---
router.get("/patients", protect, doctorAuth, getPatientsList);
router.get("/appointments", protect, doctorAuth, getAppointmentsForConsultant);

// --- Route accessible by authenticated users (e.g., patient needs this for chat) ---
router.get("/doctors", protect, getConsultantsList); // Use protect only for now

module.exports = router;