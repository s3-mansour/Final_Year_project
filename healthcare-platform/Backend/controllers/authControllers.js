// Backend/controllers/authControllers.js
const asyncHandler = require("express-async-handler");
const User = require("../models/User"); // Import User model (must include dob, securityQuestion, securityAnswer)
const generateToken = require("../utils/generateToken"); // Assuming generateToken utility exists
const mongoose = require('mongoose'); // Import mongoose for ObjectId validation


// @desc Register new user
// @route POST /api/auth/register
// @access Public
// Expects { firstName, lastName, email, password, role, location, dob, securityQuestion, securityAnswer } in body
const registerUser = asyncHandler(async (req, res) => {
  // Include new fields in destructuring
  const { firstName, lastName, email, password, role, location, dob, securityQuestion, securityAnswer } = req.body;

  // Check if user already exists by email
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists with this email.");
  }

  // Validate role
  const userRole = role ? role : "patient";
  if (!["patient", "doctor"].includes(userRole)) {
    res.status(400);
    throw new Error("Invalid role. Must be 'patient' or 'doctor'.");
  }

  // Validate location
  if (!location) {
    res.status(400);
    throw new Error("Location is required.");
  }

  // Optional validation for other fields if required by your rules
  // Example: if (!dob) { res.status(400); throw new Error("Date of Birth is required."); }
  // Optional: Validate password complexity on backend too


  // Create user document. Model hook handles password and securityAnswer hashing.
  const user = await User.create({
    firstName, lastName, email, password, role: userRole, location,
    // Include new fields in create payload
    dob: dob || null,
    securityQuestion: securityQuestion || '',
    securityAnswer: securityAnswer || '',
  });

  if (user) {
    // Send back user details and a token (excluding hashed answer)
    res.status(201).json({
      _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, location: user.location,
      // Include new fields in response
      dob: user.dob, securityQuestion: user.securityQuestion,
      token: generateToken(user._id), // Assuming generateToken exists and works
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data provided during registration.");
  }
});

// @desc Authenticate user & get token
// @route POST /api/auth/login
// @access Public
// Expects { email, password } in body
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });

  // Check if user exists AND password matches using model method
  if (user && (await user.matchPassword(password))) {
    // If successful, send back user details and a token (excluding hashed answer)
    res.json({
      _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, location: user.location,
      // Include new fields in login response
      dob: user.dob, securityQuestion: user.securityQuestion,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc Get logged-in user profile
// @route GET /api/auth/profile
// @access Private (Requires protect middleware)
// Returns the profile of the authenticated user (excluding sensitive hashed fields).
const getUserProfile = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  const user = await User.findById(req.user._id).select("-password -securityAnswer"); // Exclude hashed fields

  if (user) {
    res.json(user);
  } else {
    res.status(404); // Should not happen if protect middleware works
    throw new Error("User not found");
  }
});

/**
 * @desc Update logged-in user profile
 * @route PUT /api/auth/profile
 * @access Private (Requires protect middleware)
 * Allows updating profile fields. Handles hashing if password or securityAnswer are provided.
 * Expects { firstName, lastName, email, location, dob, securityQuestion, securityAnswer, password } (optional fields) in body.
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error("User not found"); }

  // Update fields if they are provided in the request body.
  user.firstName = req.body.firstName || user.firstName;
  user.lastName  = req.body.lastName  || user.lastName;
  user.location  = req.body.location  || user.location;
  user.email = req.body.email || user.email;

   // Allow updating DOB, securityQuestion, securityAnswer if provided
   if (req.body.dob !== undefined) { user.dob = req.body.dob || null; } // Allow setting to null
   if (req.body.securityQuestion !== undefined) { user.securityQuestion = req.body.securityQuestion || ''; } // Allow setting to empty string
   // Update and hash securityAnswer if provided and not empty. Model hook handles hashing.
   if (req.body.securityAnswer !== undefined && req.body.securityAnswer !== '') {
       user.securityAnswer = req.body.securityAnswer; // Model's pre('save') hook hashes this
   }

   // Allow updating password if provided and not empty. Model hook handles hashing.
   if (req.body.password !== undefined && req.body.password !== '') {
       // Optional: Validate new password complexity on backend before saving.
       user.password = req.body.password; // Model hook hashes this
   }

  const updatedUser = await user.save(); // Save changes (triggers model hook)

  // Send back updated user details (excluding sensitive fields)
  res.json({
    _id: updatedUser._id, firstName: updatedUser.firstName, lastName: updatedUser.lastName, email: updatedUser.email, role: updatedUser.role, location: updatedUser.location,
    // Include new fields in response
    dob: updatedUser.dob, securityQuestion: updatedUser.securityQuestion,
  });
});


// --- Controllers for Forgot Password flow ---

/**
 * @desc Request password reset by verifying user details (email, DOB, Security Question/Answer).
 * @route POST /api/auth/forgot-password-request
 * @access Public
 * Expects { email, dob, securityQuestion, securityAnswer } in body.
 * If verification passes, returns a temporary verification token.
 */
const requestPasswordReset = asyncHandler(async (req, res) => {
    const { email, dob, securityQuestion, securityAnswer } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    // Return generic error message to avoid revealing if email exists
    if (!user) {
        res.status(401);
        throw new Error("Verification failed. Please check your details.");
    }

    // 2. Verify DOB matches
    const providedDob = new Date(dob);
    // Check if provided dob is a valid date AND if the date parts match the user's stored DOB.
    // Assumes user.dob is stored as a Date object in DB and frontend sends a YYYY-MM-DD string.
    if (isNaN(providedDob.getTime()) || !user.dob || user.dob.toDateString() !== providedDob.toDateString()) {
         res.status(401); // Unauthorized
         throw new Error("Verification failed. Please check your details.");
    }


    // 3. Verify Security Question and Answer match
    if (!user.securityQuestion || !user.securityAnswer) {
         res.status(400); // Bad Request
         throw new Error("Password reset via security question is not set up for this account.");
    }
    // Verify the provided question matches the stored question
    if (user.securityQuestion !== securityQuestion) {
        res.status(401); // Unauthorized
        throw new Error("Verification failed. Please check your details.");
    }
    // Use the model's comparison method for the hashed answer
    if (!(await user.matchSecurityAnswer(securityAnswer))) {
         res.status(401); // Unauthorized
         throw new Error("Verification failed. Please check your details.");
    }

    // 4. If all verification passes, generate and return a temporary verification token.
    // This token will be used by the /reset-password endpoint to authenticate the user for reset.
    const verificationToken = generateToken(user._id, '15m'); // generateToken utility needs to accept expiry time

    res.json({ message: "Verification successful. Proceed to reset password.", verificationToken });
});

/**
 * @desc Reset user password after verification.
 * @route PUT /api/auth/reset-password
 * @access Private (Requires verification token verified by middleware).
 * Expects { newPassword, confirmNewPassword } in body.
 */
const resetPassword = asyncHandler(async (req, res) => {
    // req.user is set by the resetAuthMiddleware (assuming it verifies the token and finds the user based on token ID)
    const user = req.user; // User object from verification token provided by middleware
    const { newPassword, confirmNewPassword } = req.body;

    // Basic validation for new passwords
    if (!newPassword || !confirmNewPassword) {
         res.status(400);
         throw new Error("Please provide and confirm the new password.");
    }
    if (newPassword !== confirmNewPassword) {
         res.status(400);
         throw new Error("New passwords do not match.");
    }

    // Optional: Validate new password complexity on backend for security.
     const minLength = 8;
     const hasUppercase = /[A-Z]/.test(newPassword);
     const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
     if (newPassword.length < minLength || !hasUppercase || !hasSpecialChar) {
         res.status(400);
         throw new Error("New password does not meet complexity requirements.");
     }


    // Update the user's password. Model hook will hash this on save.
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password reset successfully." });
});


module.exports = {
  // Export existing controllers
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  // Export new controllers for forgot password flow
  requestPasswordReset,
  resetPassword,
};