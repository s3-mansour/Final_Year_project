// Backend/routes/medicationLogRoutes.js
const express = require("express");
const router = express.Router();
const {
  logDose,
  getLogsForDate,
} = require("../controllers/medicationLogController");

const { protect } = require("../middleware/authMiddleware");
// Could potentially add patient-only role check if desired

// Apply protect middleware to ensure user is logged in
router.use(protect);

// Route for logging a dose
router.post("/", logDose); // POST /api/medication-logs

// Route for getting logs for a specific date
router.get("/", getLogsForDate); // GET /api/medication-logs?date=YYYY-MM-DD

module.exports = router;