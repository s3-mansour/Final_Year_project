// Backend/routes/availabilityRoutes.js
const express = require("express");
const router = express.Router();
const { protect, doctorAuth } = require("../middleware/authMiddleware");
const {
  getAvailability,
  addAvailability,
  updateAvailability,
  deleteAvailability,
  getDoctorsByCity,
  getAvailableDatesAndTimes,
} = require("../controllers/availabilityController");

// Routes for managing availability (accessible only to doctors)
router.get("/", protect, doctorAuth, getAvailability);
router.post("/", protect, doctorAuth, addAvailability);
router.put("/:id", protect, doctorAuth, updateAvailability);
router.delete("/:id", protect, doctorAuth, deleteAvailability);
router.get("/doctors/:city", getDoctorsByCity); // Fetch doctors by city
router.get('/doctors', getDoctorsByCity); 

router.get("/doctor/:doctorId", getAvailableDatesAndTimes);

module.exports = router;
