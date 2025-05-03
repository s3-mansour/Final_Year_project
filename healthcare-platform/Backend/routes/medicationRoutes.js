// Backend/routes/medicationRoutes.js
const express = require("express");
const router = express.Router();
const {
  getPatientMedications,
  createMedication,     
  updateMedication,     
  deleteMedication,    
} = require("../controllers/medicationController");

const { protect } = require("../middleware/authMiddleware");
// const { doctorAuth } = require("../middleware/authMiddleware"); // Import if needed later


router.use(protect);

// Define routes
router.route("/")

  .get(getPatientMedications)
  // POST /api/medications: Creates medication. Controller checks role (doctor needs patientId in body).
  .post(createMedication);

router.route("/:id")

  .put(updateMedication)

  .delete(deleteMedication);

module.exports = router;