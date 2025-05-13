// Backend/routes/appointmentRoutes.js
const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  // REMOVED: deleteAppointment, // We no longer use a separate controller for DELETE /:id
  updateAppointment, // We use updateAppointment for status changes and dismissal flags
} = require("../controllers/appointmentController"); // Import necessary appointment controllers

const { protect } = require("../middleware/authMiddleware"); // Import protect middleware

// Apply protect middleware to all appointment routes, as they involve specific users.
router.use(protect);

// Define routes for /api/appointments
// POST /api/appointments: Create new appointment (Patient)
// GET /api/appointments: Get appointments list (Patient or Doctor)
router.route("/")
  .post(createAppointment)
  .get(getAppointments);



router.route("/:id")
  .put(updateAppointment);


module.exports = router;