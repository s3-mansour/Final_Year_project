// Backend/routes/medicationRoutes.js
const express = require("express");
const router = express.Router();
const {
  getPatientMedications, // Controller likely needs update for doctors accessing specific patients
  createMedication,     // Controller already handles doctor vs patient roles
  updateMedication,     // Controller needs role checks for updating specific patients' meds
  deleteMedication,     // Controller needs role checks for deleting specific patients' meds
} = require("../controllers/medicationController");

const { protect } = require("../middleware/authMiddleware");
// const { doctorAuth } = require("../middleware/authMiddleware"); // Import if needed later

// Apply basic authentication middleware to all medication routes.
// Controller logic will handle specific role-based actions (e.g., doctor prescribing for patient).
router.use(protect);

// Define routes
router.route("/")
  // GET /api/medications: Currently fetches meds for logged-in user (req.user._id).
  // TODO: If doctors need to fetch for specific patients, update controller to accept patientId query param & add doctorAuth middleware.
  .get(getPatientMedications)
  // POST /api/medications: Creates medication. Controller checks role (doctor needs patientId in body).
  .post(createMedication);

router.route("/:id")
  // PUT /api/medications/:id: Updates medication.
  // TODO: Controller needs update to verify doctor's permission or patient's ownership.
  .put(updateMedication)
  // DELETE /api/medications/:id: Deletes medication.
  // TODO: Controller needs update to verify doctor's permission or patient's ownership.
  .delete(deleteMedication);

module.exports = router;