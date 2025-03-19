// Backend/routes/consultantRoutes.js
const express = require("express");
const router = express.Router();
const { protect, doctorAuth } = require("../middleware/authMiddleware");
const {
  getPatientsForConsultant,
  getAppointmentsForConsultant,
} = require("../controllers/consultantController");

// Debug: Log the imported functions to verify they're defined
console.log("Consultant Controller Functions:", {
  getPatientsForConsultant,
  getAppointmentsForConsultant,
});

// Define routes
router.get("/patients", protect, doctorAuth, getPatientsForConsultant);
router.get("/appointments", protect, doctorAuth, getAppointmentsForConsultant);

module.exports = router;
