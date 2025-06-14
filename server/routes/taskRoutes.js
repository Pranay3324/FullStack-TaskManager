// backend/routes/taskRoutes.js
const express = require("express");
const router = express.Router();
// CORRECTED: Updated path to auth middleware to include the correct filename 'authMiddleware'
const auth = require("../middleware/authMiddleware"); // Middleware for JWT authentication
const Task = require("../models/Task"); // Task model
const fetch = require("node-fetch"); // Make sure node-fetch is installed: npm install node-fetch

// IMPORTANT: For local development, you can use process.env.GEMINI_API_KEY
// For Render deployment, ensure GEMINI_API_KEY is set in Render's environment variables.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ""; // Empty string for Canvas environment, or provide your key if not using Canvas built-in

// @route   POST /api/tasks
// @desc    Add a new task
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    // Basic validation
    if (!title) {
      return res.status(400).json({ msg: "Task title is required" });
    }

    const newTask = new Task({
      user: req.user.id, // User ID from auth middleware
      title,
      description,
      priority,
      dueDate: dueDate || null, // Ensure dueDate is null if not provided
    });

    const task = await newTask.save();
    res.status(201).json(task); // Respond with the created task
  } catch (err) {
    console.error("Error adding task:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks for the authenticated user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({
      createdAt: -1,
    }); // Sort by creation date descending
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, description, priority, dueDate, status } = req.body;

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    // Ensure user owns the task
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Update task fields
    task.title = title || task.title;
    task.description =
      description !== undefined ? description : task.description;
    task.priority = priority || task.priority;
    task.dueDate = dueDate !== undefined ? dueDate : task.dueDate;
    task.status = status || task.status;

    // Ensure dueDate is set to null if an empty string is passed
    if (dueDate === "") {
      task.dueDate = null;
    }

    await task.save();
    res.json(task); // Respond with the updated task
  } catch (err) {
    console.error("Error updating task:", err.message);
    // Check for CastError if ID format is invalid
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid task ID" });
    }
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    // Ensure user owns the task
    if (task.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await Task.deleteOne({ _id: req.params.id }); // Use deleteOne for Mongoose 6+
    res.json({ msg: "Task removed" });
  } catch (err) {
    console.error("Error deleting task:", err.message);
    // Check for CastError if ID format is invalid
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid task ID" });
    }
    res.status(500).json({ msg: "Server error" });
  }
});

// @route   POST /api/tasks/suggest
// @desc    Get AI-powered subtask suggestions using Gemini API
// @access  Private
router.post("/suggest", auth, async (req, res) => {
  const { mainTaskTitle } = req.body;

  if (!mainTaskTitle) {
    return res
      .status(400)
      .json({ msg: "Main task title is required for suggestions." });
  }

  // Check if API key is configured
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    return res
      .status(500)
      .json({ msg: "AI service not configured: GEMINI_API_KEY is missing." });
  }

  try {
    const prompt = `Given the main task "${mainTaskTitle}", suggest 3-5 concise, actionable subtasks. Respond only with a JSON array of strings, e.g., ["Subtask 1", "Subtask 2"].`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: { type: "STRING" },
        },
      },
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    console.log("Backend: Sending request to Gemini API...");
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Check if the response from Gemini itself was not OK
    if (!response.ok) {
      const errorText = await response.text(); // Get raw error text from Gemini
      console.error(
        `Backend: Gemini API error: ${response.status} - ${errorText}`
      );
      return res
        .status(response.status)
        .json({
          msg: `Gemini API error: ${response.statusText}`,
          details: errorText,
        });
    }

    const result = await response.json(); // This is where "Unexpected end of JSON input" can happen if response is empty/malformed

    // Validate the structure of the Gemini response
    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0 &&
      result.candidates[0].content.parts[0].text
    ) {
      // The content part should be a JSON string that we need to parse again
      const rawJsonText = result.candidates[0].content.parts[0].text;
      let suggestions;
      try {
        suggestions = JSON.parse(rawJsonText);
        if (!Array.isArray(suggestions)) {
          throw new Error("Parsed suggestions are not an array.");
        }
      } catch (parseError) {
        console.error(
          "Backend: Error parsing Gemini response content as JSON:",
          parseError
        );
        return res
          .status(500)
          .json({
            msg: "Failed to parse AI suggestions (invalid format from Gemini).",
            details: parseError.message,
          });
      }

      res.json({ suggestions });
    } else {
      console.warn(
        "Backend: Gemini API returned unexpected structure or no content."
      );
      res
        .status(500)
        .json({ msg: "No valid AI suggestions received from the service." });
    }
  } catch (error) {
    console.error("Backend: Error generating AI suggestions:", error);
    res
      .status(500)
      .json({
        msg: "Server error while fetching AI suggestions.",
        details: error.message,
      });
  }
});

module.exports = router;
