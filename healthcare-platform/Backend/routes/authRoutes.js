// Backend/routes/authRoutes.js
const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  requestPasswordReset,
  resetPassword, 
} = require("../controllers/authControllers");

// Import middleware
const { protect } = require("../middleware/authMiddleware"); // Middleware for standard protected routes
// *** Immport reset token verification middleware ***
const { verifyResetToken } = require('../middleware/resetAuthMiddleware');


const router = express.Router();

// Authentication Routes
router.post("/register", registerUser); // Public
router.post("/login", loginUser);       // Public
router.get("/profile", protect, getUserProfile);     // Protected by standard auth
router.put("/profile", protect, updateUserProfile);   // Protected by standard auth

// ---  Forgot Password Routes ---
// Route to request password reset (Verify email, DOB, security Q/A)
// Accessible publicly
router.post("/forgot-password-request", requestPasswordReset); // Public

// Route to reset password using a verification token
// Protected by the new reset token middleware
router.put("/reset-password", verifyResetToken, resetPassword); // Protected by verifyResetToken middleware



module.exports = router;