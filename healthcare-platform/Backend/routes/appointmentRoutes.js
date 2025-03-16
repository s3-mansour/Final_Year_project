// src/routes/appointmentRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createAppointment,
  getAppointments,
  deleteAppointment,
  updateAppointment,
} = require("../controllers/appointmentController");

// POST to create
router.post("/", protect, createAppointment);

// GET all for logged-in user
router.get("/", protect, getAppointments);

// PUT to update
router.put("/:id", protect, updateAppointment);

// DELETE to cancel
router.delete("/:id", protect, deleteAppointment);

module.exports = router;
