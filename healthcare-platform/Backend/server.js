// Backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const http = require('http');
const { Server } = require("socket.io");
const { protectSocket } = require('./middleware/socketAuthMiddleware'); // Ensure path is correct

// *** Import Mongoose and Models ***
const mongoose = require('mongoose');
const User = require('./models/User'); // Assuming models are in ./models/
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// Load environment variables
dotenv.config();



const app = express();

// Middleware
app.use(express.json()); // For parsing application/json

// Configure CORS
const corsOptions = {
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow your frontend
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
};
app.use(cors(corsOptions)); // Apply CORS to Express routes

// --- Create HTTP server and integrate Socket.IO ---
const server = http.createServer(app); // Create HTTP server from Express app
const io = new Server(server, { // Initialize Socket.IO server attached to HTTP server
    pingTimeout: 60000, // Close inactive connection after 60s
    cors: corsOptions // Apply CORS options to Socket.IO connections
});
// --- End Socket.IO Integration ---

// --- Import API Routes ---
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const consultantRoutes = require("./routes/consultantRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const medicationRoutes = require("./routes/medicationRoutes");
const medicationLogRoutes = require("./routes/medicationLogRoutes");
const chatRoutes = require("./routes/chatRoutes");
// *** Define path for user routes (ensure you created userRoutes.js if needed) ***
// const userRoutes = require("./routes/userRoutes");

// --- Mount API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/consultant", consultantRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/medication-logs", medicationLogRoutes);
app.use('/api/chat', chatRoutes);
// *** Mount user routes if you created them ***
// app.use('/api/users', userRoutes);

// --- Basic Routes ---
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// --- Socket.IO Setup ---

// Apply Authentication Middleware to Socket connections
io.use(protectSocket);

// In-memory map for active sockets { userId: socketId }
// WARNING: Replace with Redis or DB for production scalability
const userSockets = new Map();

// Handle New Socket Connections
io.on('connection', (socket) => {
    // Check if user data was attached by middleware
    if (!socket.user || !socket.user._id) {
        console.error(`Socket ${socket.id} connected without valid user data post-authentication.`);
        socket.disconnect(true); // Disconnect if auth somehow failed but middleware allowed it
        return;
    }
    const userId = socket.user._id.toString();
    const userEmail = socket.user.email; // For logging

    console.log(`🔌 Socket connected & authenticated: ${socket.id} (User: ${userEmail}, ID: ${userId})`);

    // --- Store User Socket Mapping & Join Room ---
    userSockets.set(userId, socket.id);
    socket.join(userId); // Each user joins a room identified by their own ID

    // --- Send Welcome Message (Optional) ---
    socket.emit('connected', { message: `Welcome ${socket.user.firstName}! You are connected.` });

    // --- Handle Incoming Chat Messages ---
    socket.on('sendMessage', async ({ recipientId, content }) => {
        const senderId = socket.user._id.toString(); // Get sender from authenticated socket

        // Validate Input
        if (!recipientId || !content || !content.trim()) {
            console.error(`sendMessage fail [${senderId} -> ${recipientId}]: Missing recipient/content.`);
            return socket.emit('send_error', { message: 'Recipient and message required.' });
        }
        if (!mongoose.Types.ObjectId.isValid(recipientId)) {
             console.error(`sendMessage fail [${senderId} -> ${recipientId}]: Invalid recipientId format.`);
             return socket.emit('send_error', { message: 'Invalid recipient format.'});
        }
        if (senderId === recipientId) {
             console.error(`sendMessage fail [${senderId} -> ${recipientId}]: Cannot send to self.`);
             return socket.emit('send_error', { message: 'Cannot send message to yourself.'});
        }

        console.log(`Message received [${senderId} -> ${recipientId}]: "${content}"`);

        try {
            // 1. Find or Create Conversation
            let conversation = await Conversation.findOne({
                participants: { $all: [senderId, recipientId], $size: 2 }
            });

            if (!conversation) {
                // Ensure recipient exists before creating conversation
                const recipientExists = await User.findById(recipientId).select('_id'); // Just check existence
                if (!recipientExists) {
                    return socket.emit('send_error', { message: 'Recipient user not found.' });
                }
                console.log(`Creating new conversation [${senderId} <=> ${recipientId}]`);
                conversation = await Conversation.create({ participants: [senderId, recipientId] });
                // Optional: Emit new conversation event?
            }

            if (!conversation) throw new Error("Conversation find/create failed.");
            const conversationId = conversation._id;

            // 2. Save Message to Database
            const newMessage = await Message.create({
                conversation: conversationId,
                sender: senderId,
                content: content.trim()
            });
            if (!newMessage) throw new Error("Failed to save message.");

            // 2b. Update Conversation's lastMessage & timestamp
            conversation.lastMessage = newMessage._id;
            await conversation.save(); // This also updates conversation's updatedAt timestamp

            // 3. Populate sender details for emission (important!)
            await newMessage.populate('sender', '_id firstName lastName email role');

            // 4. Emit to Recipient if Online
            const recipientSocketId = userSockets.get(recipientId);
            if (recipientSocketId) {
                console.log(`Emitting 'receiveMessage' to room: ${recipientId}`);
                // Emit the fully populated message object to the recipient's room
                io.to(recipientId).emit('receiveMessage', newMessage);
            } else {
                console.log(`Recipient ${recipientId} not online.`);
                // TODO: Add offline handling (e.g., unread count, push notification)
            }

            // 5. Emit confirmation back to sender
            socket.emit('messageSent', newMessage); // Send back the saved message object

        } catch (error) {
            console.error(`Error handling sendMessage [${senderId} -> ${recipientId}]:`, error);
            socket.emit('send_error', { message: 'Server error processing message.' });
        }
    }); // End socket.on('sendMessage')

    // --- Handle Disconnection ---
    socket.on('disconnect', (reason) => {
        console.log(`🔌 Socket disconnected: ${socket.id} (User: ${userEmail}, ID: ${userId}), Reason: ${reason}`);
        // Remove user from mapping if this specific socket ID was the one stored
        if (userSockets.get(userId) === socket.id) {
            userSockets.delete(userId);
            console.log(`User ${userId} mapping removed.`);
            // TODO: Optionally broadcast user offline status to relevant contacts/rooms
        }
    });


}); // End io.on('connection')


// --- Express 404 Handler (AFTER all API routes) ---
app.use((req, res, next) => {
  res.status(404).json({ message: `Route Not Found - ${req.method} ${req.originalUrl}` });
});

// --- Express Global Error Handler (Place LAST) ---
app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err.message); // Log just the message usually
    // console.error(err.stack) // Log full stack in dev if needed
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Default to 500 if status not set
    res.status(statusCode);
    res.json({
        message: err.message,
        // Only include stack trace in development environment for security
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack, // Funny stack in prod :)
    });
});

 // Only connect DB & start listening when *not* under Jest
if (process.env.NODE_ENV !== "test") {
   connectDB();
   const PORT = process.env.PORT || 5000;
   server.listen(PORT, () =>
     console.log(`🚀 Server (with Socket.IO) running on port ${PORT}`)
   );
}