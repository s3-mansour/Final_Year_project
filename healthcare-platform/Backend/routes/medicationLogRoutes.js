// Backend/routes/medicationLogRoutes.js
const express = require("express");
const router = express.Router();
const {
  logDose,
  getLogsForDate,
  getLogsForPatientByDateRange, 
} = require("../controllers/medicationLogController");

const { protect, doctorAuth } = require("../middleware/authMiddleware");

router.use(protect);

// --- Patient Routes ---
router.post("/", logDose);         // POST /api/medication-logs (Patient logs a dose)
router.get("/", getLogsForDate);   // GET /api/medication-logs?date=YYYY-MM-DD (Patient gets own logs for a date)


router.get(
    '/patient/:patientId',          // Route path with parameter
    doctorAuth,                     // Middleware to ensure user is a doctor
    getLogsForPatientByDateRange    // Controller function to handle the request
);

module.exports = router;