// Backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

// Import Routes
const authRoutes = require("./routes/authRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const consultantRoutes = require("./routes/consultantRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes"); 
const medicationRoutes = require("./routes/medicationRoutes");
const medicationLogRoutes = require("./routes/medicationLogRoutes");
// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/consultant", consultantRoutes);
app.use("/api/availability", availabilityRoutes); 
app.use("/api/medications", medicationRoutes);
app.use("/api/medication-logs", medicationLogRoutes);
// Default route
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route Not Found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
