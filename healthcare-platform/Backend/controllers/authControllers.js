const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc Register new user
// @route POST /api/auth/register
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, location } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
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

  // Create user
  const user = await User.create({ 
    firstName, 
    lastName, 
    email, 
    password, 
    role: userRole, 
    location 
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      location: user.location,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc Authenticate user & get token
// @route POST /api/auth/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      location: user.location,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc Get user profile
// @route GET /api/auth/profile
// @access Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      location: user.location,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

/**
 * @desc Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  // Get user from the request (set by protect middleware)
  const user = await User.findById(req.user._id);

  if (user) {
    // Allow updates for firstName, lastName, email, and location.
    // (You may want to handle password changes separately.)
    user.firstName = req.body.firstName || user.firstName;
    user.lastName  = req.body.lastName  || user.lastName;
    user.email     = req.body.email     || user.email;
    user.location  = req.body.location  || user.location;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      location: updatedUser.location,
      token: generateToken(updatedUser._id), // Optionally re-issue token
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});
module.exports = { registerUser, loginUser, getUserProfile,updateUserProfile };
