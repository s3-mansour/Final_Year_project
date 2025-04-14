// Backend/middleware/socketAuthMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path if needed
const asyncHandler = require('express-async-handler'); // Optional, but good for async error handling

const protectSocket = asyncHandler(async (socket, next) => {
    let token;

    // Option 1: Get token from handshake auth object (Recommended)
    // Client needs to send it like: io({ auth: { token: "Bearer YOUR_TOKEN" } })
    if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
        // Optional: Check if it starts with Bearer (if client includes it)
        if (token.startsWith('Bearer ')) {
            token = token.split(' ')[1];
        }
         console.log("Socket Auth: Token found in handshake.auth");
    }
    // Option 2: Fallback to query parameter (Less Secure, potentially visible in logs)
    // Client needs to send it like: io("...", { query: { token: "YOUR_TOKEN" } })
    else if (socket.handshake.query && socket.handshake.query.token) {
        token = socket.handshake.query.token;
        console.warn("Socket Auth: Token found in handshake.query (less secure)");
    }

    if (!token) {
        console.log("Socket Auth Error: No token provided.");
        return next(new Error('Authentication error: No token')); // Reject connection
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from the token payload (ID)
        // Select necessary fields, EXCLUDE password
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            console.log(`Socket Auth Error: User not found for token ID: ${decoded.id}`);
            return next(new Error('Authentication error: User not found')); // Reject connection
        }

        // --- Attach user info to the socket object ---
        // Option A: Attach full user object (minus password)
        socket.user = user;
        // Option B: Attach only the user ID (might be sufficient)
        // socket.userId = user._id;

        console.log(`Socket Auth Success: User ${user.email} authenticated for socket ${socket.id}`);
        next(); // Allow connection

    } catch (error) {
        console.error('Socket Auth Error: Token verification failed:', error.message);
        if (error.name === 'TokenExpiredError') {
            return next(new Error('Authentication error: Token expired'));
        }
        return next(new Error('Authentication error: Token invalid')); // Reject connection
    }
});

module.exports = { protectSocket };