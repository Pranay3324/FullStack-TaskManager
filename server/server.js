// backend/server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors"); // For cross-origin requests

const connectDB = require("./config/db"); // Import DB connection
const authRoutes = require("./routes/authRoutes"); // Import auth routes
const taskRoutes = require("./routes/taskRoutes"); // Import task routes

// Load environment variables from .env file
dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middleware
// IMPORTANT: CORS middleware should generally be applied early, before your routes.
app.use(cors()); // Enable CORS for all origins (adjust in production if needed for specific origins)
app.use(express.json()); // Body parser for JSON requests

// Define API routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Basic error handling middleware (optional but good practice)
// This middleware now sends a JSON response for all errors.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({
      msg: "Server Error",
      details: err.message || "Something broke unexpectedly!",
    });
});

// --- Server Listening ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


