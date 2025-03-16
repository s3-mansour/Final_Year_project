const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(express.json()); // Middleware for JSON parsing
app.use(cors()); // Enable CORS

// Import Routes
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
// Use Routes
app.use("/api/auth", authRoutes);

app.use("/api/appointments", appointmentRoutes);

// Default route
app.get("/", (req, res) => {
    res.send("🚀 API is running...");
});

// Handle 404 Errors
app.use((req, res) => {
    res.status(404).json({ message: "Route Not Found" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
