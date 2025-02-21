const express = require("express");
const { registerUser, loginUser, getUserProfile } = require("../controllers/authControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getUserProfile);

// Handle invalid routes
router.all("*", (req, res) => {
    res.status(404).json({ message: "Invalid Auth Route" });
});

module.exports = router;
