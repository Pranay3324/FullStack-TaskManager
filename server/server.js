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
// Configure CORS to specifically allow your frontend's Render URL
// IMPORTANT: Replace 'https://fullstack-taskmanager-ux19.onrender.com' with your actual frontend URL if it changes.
// If you have multiple frontend URLs (e.g., development, staging), you can add them to an array:
// const allowedOrigins = ['https://fullstack-taskmanager-ux19.onrender.com', 'http://localhost:5173']; // Example for multiple origins
// app.use(cors({ origin: allowedOrigins }));
app.use(
  cors({
    origin: "https://fullstack-taskmanager-ux19.onrender.com", // Your deployed frontend URL
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true, // Allow cookies to be sent (if applicable, though JWTs are usually in headers)
    optionsSuccessStatus: 204,
  })
);
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
