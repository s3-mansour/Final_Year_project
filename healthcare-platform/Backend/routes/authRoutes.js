const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require("../controllers/authControllers");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);

// Handle invalid routes
router.all("*", (req, res) => {
  res.status(404).json({ message: "Invalid Auth Route" });
});

module.exports = router;
