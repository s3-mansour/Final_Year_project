// Backend/middleware/resetAuthMiddleware.js
const jwt = require("jsonwebtoken"); // Assuming jsonwebtoken is installed
const asyncHandler = require("express-async-handler");
const User = require("../models/User"); // Import User model

// Middleware to verify the password reset verification token
const verifyResetToken = asyncHandler(async (req, res, next) => {
  let token;

  // Token is expected in the Authorization header as "Bearer TOKEN"
  if ( req.headers.authorization && req.headers.authorization.startsWith("Bearer") ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token using your JWT secret
      // The generateToken function should have created this token with user ID and an expiry
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user based on the ID in the token payload
      // Select only necessary fields (ID, potentially email/role for logging)
      // Do NOT select password or security answer here
      const user = await User.findById(decoded.id).select("_id email role");

      if (!user) {
        // Token is valid but user not found (e.g., user deleted)
        res.status(401); // Unauthorized
        throw new Error("Not authorized, user not found for token");
      }

      // Attach the user to the request object for the next handler (resetPassword controller)
      req.user = user;

      next(); // Proceed to the next middleware/route handler

    } catch (error) {
      // Handle token verification failures (invalid signature, expired token, etc.)
      console.error('Reset token verification failed:', error.message);
      res.status(401); // Unauthorized
      // Send a specific error message based on the type of error
      if (error.name === 'TokenExpiredError') {
           throw new Error('Password reset token has expired.');
      }
      throw new Error("Not authorized, invalid reset token");
    }
  } else {
    // No token provided in the header
    res.status(401); // Unauthorized
    throw new Error("Not authorized, no reset token provided");
  }
});

module.exports = { verifyResetToken };