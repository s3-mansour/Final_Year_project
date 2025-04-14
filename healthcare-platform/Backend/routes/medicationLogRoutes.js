// Backend/routes/medicationLogRoutes.js
const express = require("express");
const router = express.Router();
const {
  logDose,
  getLogsForDate,
  getLogsForPatientByDateRange, // *** IMPORT NEW FUNCTION ***
} = require("../controllers/medicationLogController");

// *** IMPORT Doctor Auth Middleware ***
const { protect, doctorAuth } = require("../middleware/authMiddleware");

// Apply basic protect middleware to all routes initially
router.use(protect);

// --- Patient Routes ---
router.post("/", logDose);         // POST /api/medication-logs (Patient logs a dose)
router.get("/", getLogsForDate);   // GET /api/medication-logs?date=YYYY-MM-DD (Patient gets own logs for a date)

// --- Doctor Route ---
// *** ADD NEW ROUTE FOR DOCTORS ***
// Needs patientId in the URL path, requires doctor role via doctorAuth middleware
// Query params expected: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get(
    '/patient/:patientId',          // Route path with parameter
    doctorAuth,                     // Middleware to ensure user is a doctor
    getLogsForPatientByDateRange    // Controller function to handle the request
);

module.exports = router;