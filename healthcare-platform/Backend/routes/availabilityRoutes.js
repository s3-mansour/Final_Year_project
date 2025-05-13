// Backend/routes/availabilityRoutes.js
const express = require("express");
const router = express.Router();
const {
  getAvailability, // Doctor gets their own availability blocks
  addAvailability, // Doctor adds new availability block
  updateAvailability, // Doctor updates availability block
  deleteAvailability, // Doctor deletes availability block
  getDoctorsByCity, // Patient gets list of doctors by city
  getDoctorTimeSlotsForDate, // Patient gets available slots for a specific doctor/date
} = require("../controllers/availabilityController"); // Import availability controllers

const { protect, doctorAuth } = require("../middleware/authMiddleware"); // Import middleware


// --- Routes for Doctor Availability Management ---
// These routes require a logged-in user AND that user must be a doctor
router.route('/')
  .get(protect, doctorAuth, getAvailability) // GET /api/availability (Doctor gets their own blocks)
  .post(protect, doctorAuth, addAvailability); // POST /api/availability (Doctor adds a new block)

router.route('/:id')
  .put(protect, doctorAuth, updateAvailability) // PUT /api/availability/:id (Doctor updates a block)
  .delete(protect, doctorAuth, deleteAvailability); // DELETE /api/availability/:id (Doctor deletes a block)


// --- Routes for Patient/Other Users to View Availability Information ---
// These routes require a logged-in user (via protect middleware) but not necessarily doctor role

// Route to get a list of doctors by city (used by patients for booking)
// Example: GET /api/availability/doctors?city=Birmingham
router.get('/doctors', protect, getDoctorsByCity);

// Route to get the available time slots for a specific doctor on a specific date (used by patients for booking)
// Example: GET /api/availability/doctor/someDoctorId123/slots?date=2025-03-25
router.get('/doctor/:doctorId/slots', protect, getDoctorTimeSlotsForDate);


module.exports = router;