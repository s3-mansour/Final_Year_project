// Backend/controllers/availabilityController.js
const asyncHandler = require("express-async-handler");
const Availability = require("../models/Availability");
const User = require("../models/User");
const Appointment = require("../models/Appointment"); // Import Appointment model to check booked slots.
const mongoose = require("mongoose"); // Import mongoose for ObjectId validation.

// Helper function to parse HH:MM time string (24-hour format) into minutes past midnight.
// IMPORTANT: Ensure this function correctly parses the time format used for startTime/endTime in Availability model
// and 'time' in Appointment model. This is CRITICAL for slot calculation and validation.
// If using HH:MM AM/PM, IMPLEMENT PROPER PARSING LOGIC HERE.
const timeToMinutes = (timeStr) => {
    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) throw new Error("Invalid time format");
        // Validate hours (0-23) and minutes (0-59).
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) throw new Error("Time out of range");
        return hours * 60 + minutes;
    } catch (e) {
        console.error(`Error parsing time string "${timeStr}" to minutes:`, e);
        return NaN; // Return NaN to indicate parsing failure.
    }
};

// Helper function to convert minutes past midnight back to HH:MM time string (24-hour format).
// IMPORTANT: Ensure this function correctly formats the time string as expected by the frontend dropdown.
// If using HH:MM AM/PM, IMPLEMENT PROPER FORMATTING LOGIC HERE.
const minutesToTime = (totalMinutes) => {
    if (isNaN(totalMinutes) || totalMinutes < 0) return "Invalid Time";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}`;
    // If frontend needs AM/PM format, add conversion here:
    // const ampmHours = hours % 12 || 12;
    // const ampm = hours >= 12 ? 'PM' : 'AM';
    // return `${String(ampmHours).padStart(2, '0')}:${paddedMinutes} ${ampm}`;
};


/**
 * Helper function used internally by controllers (like createAppointment)
 * to generate available time slots for a specific doctor on a specific date.
 * It considers doctor's availability blocks AND filters out slots booked by pending/confirmed appointments.
 * Does NOT send an HTTP response. Returns an array of time strings (e.g., ["08:00", "08:30"]).
 * @param {string | mongoose.Types.ObjectId} doctorId - The doctor ID.
 * @param {string} dateString - The date in YYYY-MM-DD format.
 * @returns {Promise<string[]>} - Promise resolving to an array of available time slot strings.
 * @throws {Error} - Throws error if fundamental issues occur (like DB query failure), but returns empty array if no slots available/defined.
 */
const getDoctorTimeSlotsForDateHelper = async (doctorId, dateString) => {
    if (!doctorId || !dateString) {
        console.warn("getDoctorTimeSlotsForDateHelper called with missing doctorId or dateString");
        return [];
    }

    try {
        // 1. Find all availability block documents for the doctor on the requested date.
        // These blocks define the *ranges* and *slot duration* available for booking.
        const doctorAvailabilities = await Availability.find({
            doctor: doctorId,
            date: dateString // Match date string (e.g., 'YYYY-MM-DD')
        });

        if (!doctorAvailabilities || doctorAvailabilities.length === 0) {
            // If no availability blocks are defined for this doctor on this date.
            console.log(`Helper: No availability blocks found for doctor ${doctorId} on ${dateString}.`);
            return []; // Return empty array if no availability defined for the date.
        }

        // 2. Find existing appointments for this doctor on this date that are confirmed or pending.
        // These appointments occupy slots and should not be shown as available.
        const bookedAppointments = await Appointment.find({
            doctor: doctorId,
            date: dateString,
            status: { $in: ['Pending', 'Confirmed'] } // Consider these statuses as booked slots.
        });

        // Extract the time strings of these booked appointments.
        const bookedTimes = bookedAppointments.map(appt => appt.time); // Assuming appointment 'time' is HH:MM or HH:MM AM/PM format.

        // 3. Generate all possible discrete time slots from availability ranges and then filter out booked ones.
        let possibleSlots = [];

        doctorAvailabilities.forEach(avail => {
            const slotDuration = avail.slotDurationMinutes;
            // Skip this availability block if slot duration is invalid.
            if (!slotDuration || slotDuration <= 0) {
                 console.warn(`Helper: Skipping availability block ${avail._id} due to invalid slot duration: ${slotDuration}`);
                 return;
            }

            // Convert block start/end times to minutes for calculation.
            const startMinutes = timeToMinutes(avail.startTime);
            const endMinutes = timeToMinutes(avail.endTime);

             // Skip this block if start/end times are invalid or the range is zero/inverted.
             if (isNaN(startMinutes) || isNaN(endMinutes) || startMinutes >= endMinutes) {
                 console.warn(`Helper: Skipping availability block ${avail._id} due to invalid start/end times: ${avail.startTime} - ${avail.endTime}`);
                 return;
             }


            // Generate slots within the valid time range based on slot duration.
            // Loop starts at the block's start time in minutes.
            // Continues as long as a slot of 'slotDuration' minutes can fit before or exactly at the end time.
            for (let currentSlotMinutes = startMinutes; currentSlotMinutes + slotDuration <= endMinutes; currentSlotMinutes += slotDuration) {
                const slotTime = minutesToTime(currentSlotMinutes);
                 // Add the generated time string to the possible slots list.
                 if (slotTime !== "Invalid Time") { // Only add valid time strings.
                   possibleSlots.push(slotTime);
                 }
            }
        });

        // Remove duplicate time slots if multiple availability blocks cover the same time (e.g., 9-10 and 10-11 blocks with 30min slots would both generate 10:00)
        const uniquePossibleSlots = [...new Set(possibleSlots)];

        // Filter the unique possible slots to remove those that are already booked.
        const trulyAvailableSlots = uniquePossibleSlots.filter(slotTime => !bookedTimes.includes(slotTime));


        // Optional: Sort the final list of truly available slots chronologically.
        // This sort works correctly for HH:MM 24hr format. For HH:MM AM/PM, a custom sort function is needed.
        trulyAvailableSlots.sort(); // Sort time strings lexicographically.

        return trulyAvailableSlots; // Return the array of available time strings.

    } catch (error) {
        console.error(`Helper: Error generating time slots for doctor ${doctorId} on ${dateString}:`, error);
        // Re-throw the error to be caught by the route handler or calling controller.
        throw error;
    }
};


/**
 * @desc Get all availability blocks for the logged-in doctor.
 * @route GET /api/availability
 * @access Private (doctor)
 * Returns availability blocks associated with the logged-in doctor.
 */
const getAvailability = asyncHandler(async (req, res) => {
  const doctorId = req.user._id; // Get logged-in doctor ID from authenticated user.
  // Find all availability blocks associated with this doctor.
  const slots = await Availability.find({ doctor: doctorId });
  res.json(slots); // Return the array of availability blocks.
});

/**
 * @desc Add a new availability slot block for the logged-in doctor.
 * @route POST /api/availability
 * @access Private (doctor)
 * Expects { date, startTime, endTime, slotDurationMinutes } in request body.
 */
const addAvailability = asyncHandler(async (req, res) => {
  // Get availability block details from request body.
  const { date, startTime, endTime, slotDurationMinutes } = req.body;
  const doctorId = req.user._id; // Get logged-in doctor ID from authenticated user.

  // Basic input validation for required fields and slot duration.
  if (!date || !startTime || !endTime || slotDurationMinutes === undefined || slotDurationMinutes === null || typeof slotDurationMinutes !== 'number' || slotDurationMinutes <= 0) {
      res.status(400);
      throw new Error("Date, start time, end time, and valid slot duration (minutes > 0) are required.");
  }
   // Optional: Validate date/time formats (e.g., YYYY-MM-DD, HH:MM) if strict format is required beyond basic parsing.

  // --- Overlap check with existing availability blocks for the same doctor and date ---
  const existingBlocks = await Availability.find({
    doctor: doctorId,
    date, // Match date string (e.g., 'YYYY-MM-DD').
  });

   // Convert new block times to minutes for comparison.
  const newStartMinutes = timeToMinutes(startTime);
  const newEndMinutes = timeToMinutes(endTime);

    // Validate converted times.
   if (isNaN(newStartMinutes) || isNaN(newEndMinutes) || newStartMinutes >= newEndMinutes) {
       res.status(400);
       throw new Error("Invalid start or end time, or start time is not before end time.");
   }


  for (const block of existingBlocks) {
      // Convert existing block times to minutes for comparison.
      const blockStartMinutes = timeToMinutes(block.startTime);
      const blockEndMinutes = timeToMinutes(block.endTime);

      // Skip checking against existing blocks with invalid times if they couldn't be parsed.
      if (isNaN(blockStartMinutes) || isNaN(blockEndMinutes)) {
           console.warn(`Skipping overlap check for invalid existing block times during add: ${block.startTime} - ${block.endTime}`);
           continue;
       }

    // Overlap exists if the new block starts before the existing block ends AND the new block ends after the existing block starts.
    if (newStartMinutes < blockEndMinutes && newEndMinutes > blockStartMinutes) {
      return res.status(400).json({
        message: `This availability block (${startTime}-${endTime}) overlaps with an existing one (${block.startTime}-${block.endTime}).`,
      });
    }
  }
  // --- End Overlap check ---


  // If no overlap found, create the new availability block document.
  const slot = await Availability.create({
    doctor: doctorId,
    date,
    startTime,
    endTime,
    slotDurationMinutes, // Save the slot duration.
  });
  return res.status(201).json(slot); // Send 201 Created status and the created block document.
});

/**
 * @desc Update an existing availability slot block for the logged-in doctor.
 * @route PUT /api/availability/:id
 * @access Private (doctor)
 * Expects { date, startTime, endTime, slotDurationMinutes } (optional fields) in request body.
 */
const updateAvailability = asyncHandler(async (req, res) => {
   // Get update fields from request body.
   const { date, startTime, endTime, slotDurationMinutes } = req.body;
   const slotId = req.params.id; // Get block ID from URL parameters.
   const doctorId = req.user._id; // Get logged-in doctor ID from authenticated user.

   // Validate slotId format.
   if (!mongoose.Types.ObjectId.isValid(slotId)) {
        res.status(400);
        throw new Error("Invalid Availability Slot ID format.");
    }


   const slot = await Availability.findById(slotId); // Find the availability block by ID.

   if (!slot) {
     res.status(404); // Not Found.
     throw new Error("Availability slot not found");
   }

   // Ensure the logged-in doctor owns this slot block.
   if (slot.doctor.toString() !== doctorId.toString()) {
     res.status(403); // Forbidden.
     throw new Error("Not authorized to update this availability");
   }

   // --- Overlap check if date, start time, or end time is being updated ---
   // Use potentially updated values for the overlap check.
   const updatedDate = date !== undefined ? date : slot.date;
   const updatedStartTime = startTime !== undefined ? startTime : slot.startTime;
   const updatedEndTime = endTime !== undefined ? endTime : slot.endTime;
   const updatedSlotDurationMinutes = slotDurationMinutes !== undefined ? slotDurationMinutes : slot.slotDurationMinutes; // Use potential new duration if provided.


   // Validate potentially updated time values.
   const updatedStartMinutes = timeToMinutes(updatedStartTime);
   const updatedEndMinutes = timeToMinutes(updatedEndTime);
    if (isNaN(updatedStartMinutes) || isNaN(updatedEndMinutes) || updatedStartMinutes >= updatedEndMinutes) {
       res.status(400);
       throw new Error("Invalid start or end time, or start time is not before end time for update.");
   }
   // Validate potentially updated slot duration.
   if (updatedSlotDurationMinutes !== undefined && (typeof updatedSlotDurationMinutes !== 'number' || updatedSlotDurationMinutes <= 0)) {
       res.status(400);
       throw new Error("Invalid slot duration provided for update.");
   }


   // Find *other* availability blocks for the same doctor on the potentially new date.
   const existingBlocks = await Availability.find({
     doctor: doctorId,
     date: updatedDate,
     _id: { $ne: slotId }, // Exclude the current slot block being updated.
   });


   for (const block of existingBlocks) {
       // Convert existing block times to minutes for comparison.
       const blockStartMinutes = timeToMinutes(block.startTime);
       const blockEndMinutes = timeToMinutes(block.endTime);

       // Skip checking against invalid existing blocks.
       if (isNaN(blockStartMinutes) || isNaN(blockEndMinutes)) {
            console.warn(`Skipping overlap check for invalid existing block times during update: ${block.startTime} - ${block.endTime}`);
            continue;
        }

     // Overlap exists if the updated block starts before the existing block ends AND the updated block ends after the existing block starts.
     if (updatedStartMinutes < blockEndMinutes && updatedEndMinutes > blockStartMinutes) {
       return res.status(400).json({
         message: `Updated availability block (${updatedStartTime}-${updatedEndTime}) overlaps with an existing one (${block.startTime}-${block.endTime}).`,
       });
     }
   }
   // --- End Overlap check ---


   // Update the fields of the found slot document (only if provided in body and valid).
   if (date !== undefined) slot.date = date;
   if (startTime !== undefined) slot.startTime = startTime;
   if (endTime !== undefined) slot.endTime = endTime;
   if (slotDurationMinutes !== undefined) slot.slotDurationMinutes = slotDurationMinutes;


   const updatedSlot = await slot.save(); // Save the changes to the database.
   res.json(updatedSlot); // Return the updated block document.
});

/**
 * @desc Delete (remove) an availability slot block for the logged-in doctor.
 * @route DELETE /api/availability/:id
 * @access Private (doctor)
 * Deletes an availability block owned by the logged-in doctor.
 */
const deleteAvailability = asyncHandler(async (req, res) => {
   const slotId = req.params.id; // Get block ID from URL parameters.
   const doctorId = req.user._id; // Get logged-in doctor ID from authenticated user.

   // Validate slotId format.
   if (!mongoose.Types.ObjectId.isValid(slotId)) {
        res.status(400);
        throw new Error("Invalid Availability Slot ID format.");
    }


   const slot = await Availability.findById(slotId); // Find the availability block by ID.

   if (!slot) {
     res.status(404); // Not Found.
     throw new Error("Availability slot not found");
   }

   // Ensure the logged-in doctor owns this slot block.
   if (slot.doctor.toString() !== doctorId.toString()) {
     res.status(403); // Forbidden.
     throw new Error("Not authorized to delete this availability");
   }

   // Use findByIdAndDelete to remove the availability block document.
   await Availability.findByIdAndDelete(slotId);
   res.json({ message: "Availability slot removed successfully" }); // Send success message.
});


/**
 * @desc Get a list of doctors by city.
 * @route GET /api/availability/doctors?city=:city
 * @access Private (Accessible by patients via protect middleware).
 * Returns a list of doctor user objects filtered by city.
 */
const getDoctorsByCity = asyncHandler(async (req, res) => {
  const { city } = req.query; // Get city from query parameters.

  if (!city) {
       res.status(400); // Bad Request.
       throw new Error("City query parameter is required.");
  }

  try {
    // Find users with role 'doctor' in the given city.
    // Select only necessary fields for the frontend dropdown (exclude sensitive ones like password).
    const doctors = await User.find({ role: 'doctor', location: city }).select('_id firstName lastName location email');

    if (!doctors || doctors.length === 0) {
      // If no doctors found, return 200 with an empty array.
      return res.status(200).json([]);
    }

    // Return the list of doctor objects.
    res.json(doctors);
  } catch (error) {
      console.error(`Error fetching doctors for city ${city}:`, error);
      res.status(500); // Internal Server Error.
      throw new Error("Server error fetching doctors.");
  }
});


/**
 * @desc Get available time slots for a specific doctor on a specific date.
 * @route GET /api/availability/doctor/:doctorId/slots?date=YYYY-MM-DD
 * @access Private (Accessible by patients via protect middleware).
 * Uses the helper to calculate available slots.
 * Expects doctorId from URL params and date=YYYY-MM-DD from query params.
 */
const getDoctorTimeSlotsForDate = asyncHandler(async (req, res) => {
    const doctorId = req.params.doctorId; // Get doctorId from URL parameters.
    const dateString = req.query.date; // Get date from query parameters.

    // Basic validation for input parameters.
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        res.status(400);
        throw new Error("Invalid Doctor ID format.");
    }
    if (!dateString) {
         res.status(400);
         throw new Error("Date query parameter (date=YYYY-MM-DD) is required.");
    }
     // Optional: Validate dateString format strictly.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
         res.status(400);
         throw new Error("Invalid date format. Use YYYY-MM-DD.");
    }


    try {
        // Use the internal helper function to generate the list of available slots.
        // The helper returns an array of time strings or throws an error on failure.
        const availableSlots = await getDoctorTimeSlotsForDateHelper(doctorId, dateString);

        // Return the array of available time strings (e.g., ["08:00", "08:30"]).
        res.status(200).json(availableSlots);

    } catch (error) {
        console.error(`Error fetching time slots for doctor ${doctorId} on ${dateString}:`, error);
        // If the helper function throws an error, propagate a 500 status.
        res.status(500);
        throw new Error("Server error fetching available time slots.");
    }
});


module.exports = {
  getAvailability, // Doctor gets their own availability blocks.
  addAvailability, // Doctor adds new availability block.
  updateAvailability, // Doctor updates availability block.
  deleteAvailability, // Doctor deletes availability block.
  getDoctorsByCity, // Patient gets list of doctors by city.
  getDoctorTimeSlotsForDate, // Patient gets available slots for a specific doctor/date (via API).
  getDoctorTimeSlotsForDateHelper // Export helper for internal use (e.g., by appointmentController).
};