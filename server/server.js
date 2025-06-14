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
// IMPORTANT: Replace 'https://fullstack-taskmanager-1.onrender.com' with your actual frontend URL if it changes.
// If you have multiple frontend URLs (e.g., development, staging), you can add them to an array.
const allowedOrigins = [
  "https://fullstack-taskmanager-1.onrender.com", // <--- YOUR FRONTEND URL IS NOW ADDED HERE!
  "http://localhost:5173", // Your local development frontend URL (if applicable)
  "https://fullstack-taskmanager-ux19.onrender.com", // Your backend's own URL (sometimes useful to include, but not strictly needed for frontend requests)
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
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

/*
    README for this Refactored Backend Code:

    1.  **File Structure:**
        To set up your backend, create a main directory (e.g., `backend/`) and organize the files as follows:

        ```
        backend/
        ├── config/
        │   └── db.js            <-- MongoDB connection setup
        ├── middleware/
        │   └── authMiddleware.js <-- JWT authentication middleware
        ├── models/
        │   ├── User.js          <-- Mongoose User schema and model
        │   └── Task.js          <-- Mongoose Task schema and model
        ├── routes/
        │   ├── authRoutes.js    <-- User authentication API endpoints
        │   └── taskRoutes.js    <-- Task CRUD API endpoints
        ├── .env                 <-- Environment variables (create this file)
        ├── package.json         <-- Project dependencies (create this with npm init)
        └── server.js            <-- Main application entry point (this file)
        ```

    2.  **`package.json` (Dependencies):**
        * If you haven't already, navigate to your `backend/` directory in your terminal.
        * Run `npm init -y` to create a `package.json` file.
        * Install the necessary dependencies:
            ```bash
            npm install express mongoose dotenv cors bcryptjs jsonwebtoken
            ```
        * Your `package.json` dependencies section should look something like this:
            ```json
            "dependencies": {
                "bcryptjs": "^2.4.3",
                "cors": "^2.8.5",
                "dotenv": "^16.4.5",
                "express": "^4.19.2",
                "jsonwebtoken": "^9.0.2",
                "mongoose": "^8.4.1"
            }
            ```

    3.  **`.env` File (Environment Variables):**
        * Create a file named `.env` in your `backend/` directory (at the same level as `server.js`).
        * Add your MongoDB connection URI and a JWT secret. **Replace `<your_mongodb_connection_string>` and `<your_secret_key>` with your actual values.**
            ```dotenv
            MONGODB_URI=<your_mongodb_connection_string>
            JWT_SECRET=<your_secret_key_for_jwt_signing_e.g._a_long_random_string>
            PORT=5000
            ```
        * **MongoDB URI:** You can get this from MongoDB Atlas if you're using a cloud database, or it will be `mongodb://localhost:27017/todoapp` if you're running MongoDB locally.
        * **JWT_SECRET:** This should be a long, complex, and random string. This is crucial for securing your tokens.

    4.  **Running the Backend:**
        * Navigate to your `backend/` directory in your terminal.
        * Run: `node server.js`
        * You should see "MongoDB connected successfully!" and "Server running on port 5000" in your console.

    **API Endpoints (remain the same):**

    * **Authentication:**
        * `POST /api/auth/register`: Register a new user.
            * Body: `{ "username": "testuser", "email": "test@example.com", "password": "password123" }`
        * `POST /api/auth/login`: Login an existing user.
            * Body: `{ "emailOrUsername": "test@example.com", "password": "password123" }` or `{ "emailOrUsername": "testuser", "password": "password123" }`
            * Returns: `{ "token": "...", "userId": "...", "username": "..." }`

    * **Tasks (requires `x-auth-token` header with JWT):**
        * `POST /api/tasks`: Create a new task.
            * Body: `{ "title": "Buy groceries", "description": "Milk, eggs, bread", "priority": "high", "dueDate": "2025-12-31T23:59:59Z", "reminders": ["2025-12-30T10:00:00Z"] }`
        * `GET /api/tasks`: Get all tasks for the authenticated user.
        * `GET /api/tasks/:id`: Get a specific task by ID.
        * `PUT /api/tasks/:id`: Update a task by ID.
            * Body: `{ "status": "completed", "priority": "low" }`
        * `DELETE /api/tasks/:id`: Delete a task by ID.
*/
