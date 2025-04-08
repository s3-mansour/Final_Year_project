// Backend/controllers/availabilityController.js
const asyncHandler = require("express-async-handler");
const Availability = require("../models/Availability");
const User = require("../models/User");

/**
 * @desc Get all availability slots for the logged-in doctor.
 * @route GET /api/availability
 * @access Private (doctor)
 */
const getAvailability = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const slots = await Availability.find({ doctor: doctorId });
  res.json(slots);
});

/**
 * @desc Add a new availability slot.
 * @route POST /api/availability
 * @access Private (doctor)
 */
const addAvailability = asyncHandler(async (req, res) => {
  const { date, startTime, endTime } = req.body;
  const doctorId = req.user._id;

  // Optional: Overlap check
  const existingSlots = await Availability.find({
    doctor: doctorId,
    date,
  });

  const parseTime = (t) => {
    // "HH:MM"
    const [h, m] = t.split(":");
    return parseInt(h, 10) * 60 + parseInt(m, 10);
  };

  const newStart = parseTime(startTime);
  const newEnd = parseTime(endTime);

  for (const slot of existingSlots) {
    const slotStart = parseTime(slot.startTime);
    const slotEnd = parseTime(slot.endTime);
    // Overlap if: newStart < slotEnd && newEnd > slotStart
    if (newStart < slotEnd && newEnd > slotStart) {
      return res.status(400).json({
        message: "This availability slot overlaps with an existing one.",
      });
    }
  }

  // If no overlap, create the slot
  const slot = await Availability.create({
    doctor: doctorId,
    date,
    startTime,
    endTime,
  });
  return res.status(201).json(slot);
});

/**
 * @desc Update an existing availability slot.
 * @route PUT /api/availability/:id
 * @access Private (doctor)
 */
const updateAvailability = asyncHandler(async (req, res) => {
  const { date, startTime, endTime } = req.body;
  const slot = await Availability.findById(req.params.id);

  if (!slot) {
    res.status(404);
    throw new Error("Availability slot not found");
  }

  // Ensure the logged-in doctor owns this slot
  if (slot.doctor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this availability");
  }

  // Optional: Overlap check if date/time changed
  if (date !== slot.date.toISOString().split("T")[0] || startTime !== slot.startTime || endTime !== slot.endTime) {
    // Check overlap with other slots for the same day
    const existingSlots = await Availability.find({
      doctor: slot.doctor,
      date,
      _id: { $ne: slot._id }, // exclude current slot
    });

    const parseTime = (t) => {
      const [h, m] = t.split(":");
      return parseInt(h, 10) * 60 + parseInt(m, 10);
    };

    const newStart = parseTime(startTime);
    const newEnd = parseTime(endTime);

    for (const s of existingSlots) {
      const sStart = parseTime(s.startTime);
      const sEnd = parseTime(s.endTime);
      if (newStart < sEnd && newEnd > sStart) {
        return res.status(400).json({
          message: "This availability slot overlaps with an existing one.",
        });
      }
    }
  }

  // Update fields
  slot.date = date || slot.date;
  slot.startTime = startTime || slot.startTime;
  slot.endTime = endTime || slot.endTime;

  const updatedSlot = await slot.save();
  res.json(updatedSlot);
});

/**
 * @desc Delete (remove) an availability slot.
 * @route DELETE /api/availability/:id
 * @access Private (doctor)
 */
const deleteAvailability = asyncHandler(async (req, res) => {
  const slot = await Availability.findById(req.params.id);

  if (!slot) {
    res.status(404);
    throw new Error("Availability slot not found");
  }

  if (slot.doctor.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this availability");
  }

  // Instead of slot.remove(), use deleteOne() or findByIdAndDelete
  await slot.deleteOne();
  res.json({ message: "Availability slot removed successfully" });
});
const getDoctorsByCity = asyncHandler(async (req, res) => {
  const { city } = req.query; // Expect city as query parameter

  // Fetch doctors from the given city
  const doctors = await User.find({ role: 'doctor', location: city });

  if (doctors.length === 0) {
    return res.status(404).json({ message: "No doctors found in this city." });
  }

  res.json(doctors); // Send the list of doctors
});
// In availabilityController.js
const getAvailableDatesAndTimes = asyncHandler(async (req, res) => {
  const doctorId = req.params.doctorId;
  const { date } = req.query; // Accept date to filter availability

  if (!doctorId) {
    res.status(400).json({ message: "Doctor ID is required." });
    return;
  }

  const availableSlots = await Availability.find({
    doctor: doctorId,
    date,
  });

  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    date,
  });

  // Extract available times, considering appointments already booked
  const availableTimes = availableSlots.map((slot) => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
  }));

  const bookedTimes = bookedAppointments.map((appt) => ({
    startTime: appt.startTime,
    endTime: appt.endTime,
  }));

  // Filter out booked time slots
  const availableTimeSlots = availableTimes.filter((slot) => {
    return !bookedTimes.some(
      (appt) =>
        appt.startTime <= slot.endTime && appt.endTime >= slot.startTime
    );
  });

  res.json(availableTimeSlots);
});

module.exports = {
  getAvailability,
  addAvailability,
  updateAvailability,
  deleteAvailability,
  getDoctorsByCity,
  getAvailableDatesAndTimes,
};
