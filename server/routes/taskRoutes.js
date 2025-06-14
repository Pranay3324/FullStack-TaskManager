// backend/routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const Task = require("../models/Task"); // Import the Task model
const auth = require("../middleware/authMiddleware"); // Import the auth middleware
const fetch = require("node-fetch"); // Import node-fetch for API calls (ensure it's installed: npm install node-fetch)
const dotenv = require("dotenv"); // To access API_KEY from .env

dotenv.config(); // Load environment variables

// --- AI Suggestion Route ---
// @route   POST /api/tasks/suggest
// @desc    Get AI-powered sub-task suggestions for a given main task title
// @access  Private (requires authentication)
router.post("/suggest", auth, async (req, res) => {
  const { mainTaskTitle } = req.body;

  if (!mainTaskTitle) {
    return res
      .status(400)
      .json({ msg: "Please provide a main task title for suggestions." });
  }

  try {
    // Retrieve the API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in .env");
      return res
        .status(500)
        .json({ msg: "AI service not configured: API key missing." });
    }

    let chatHistory = [];
    // The prompt instructs the LLM to return a JSON array of strings
    const prompt = `Given the main task "${mainTaskTitle}", suggest 3-5 concise sub-tasks or action items. Respond as a JSON array of strings, like ["Subtask 1", "Subtask 2"]. Do not include any other text or formatting outside the JSON array.`;
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = {
      contents: chatHistory,
      generationConfig: {
        // Ensure the model knows we expect JSON output
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: { type: "STRING" },
        },
      },
    };

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.json();
      console.error("Gemini API error response:", errorBody);
      return res
        .status(apiResponse.status)
        .json({
          msg: "Failed to get suggestions from AI.",
          details: errorBody,
        });
    }

    const result = await apiResponse.json();

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      const jsonString = result.candidates[0].content.parts[0].text;
      let suggestions = [];
      try {
        // The LLM might sometimes return the JSON wrapped in a markdown code block (e.g., ```json\n...\n```)
        // This regex removes that wrapping to ensure valid JSON parsing.
        const cleanJsonString = jsonString
          .replace(/```json\n|\n```/g, "")
          .trim();
        suggestions = JSON.parse(cleanJsonString);
        if (!Array.isArray(suggestions)) {
          throw new Error("AI response was not a JSON array after parsing.");
        }
      } catch (parseError) {
        console.error("Error parsing AI response JSON:", parseError);
        // Fallback: if not valid JSON, try to extract lines as suggestions (less robust but better than nothing)
        suggestions = jsonString
          .split("\n")
          .filter((line) => line.trim() !== "");
      }
      res.json({ suggestions });
    } else {
      res.status(500).json({ msg: "AI response was empty or malformed." });
    }
  } catch (err) {
    console.error("Error in /suggest route:", err.message);
    res
      .status(500)
      .json({
        msg: "Server Error during AI suggestion generation",
        details: err.message,
      });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private (requires authentication)
router.post("/", auth, async (req, res) => {
  const { title, description, priority, dueDate, reminders } = req.body;
  try {
    const newTask = new Task({
      userId: req.user.id, // Get user ID from the authenticated token
      title,
      description,
      priority: priority || "medium", // Default to medium
      dueDate: dueDate ? new Date(dueDate) : null,
      reminders:
        reminders && Array.isArray(reminders)
          ? reminders.map((r) => new Date(r))
          : [],
    });

    const task = await newTask.save();
    res.status(201).json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error", details: err.message }); // Ensure JSON response
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks for the authenticated user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({
      createdAt: -1,
    }); // Sort by creation date descending
    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: "Server Error", details: err.message }); // Ensure JSON response
  }
});

// @route   GET /api/tasks/:id
// @desc    Get a single task by ID for the authenticated user
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    // Ensure task belongs to the authenticated user
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    res.json(task);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      // Handle invalid ObjectId format
      return res.status(404).json({ msg: "Task not found" });
    }
    res.status(500).json({ msg: "Server Error", details: err.message }); // Ensure JSON response
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task by ID for the authenticated user
// @access  Private
router.put("/:id", auth, async (req, res) => {
  const { title, description, status, priority, dueDate, reminders } = req.body;

  console.log("Backend: PUT /api/tasks/:id received. Task ID:", req.params.id);
  console.log("Backend: Request body:", req.body); // Log the incoming request body

  const taskFields = {};
  if (title !== undefined) taskFields.title = title; // Check for undefined, not just falsy
  if (description !== undefined) taskFields.description = description;
  if (status !== undefined) taskFields.status = status; // This is the critical one for toggle
  if (priority !== undefined) taskFields.priority = priority;
  if (dueDate !== undefined)
    taskFields.dueDate = dueDate ? new Date(dueDate) : null;
  if (reminders !== undefined && Array.isArray(reminders))
    taskFields.reminders = reminders.map((r) => new Date(r));
  taskFields.updatedAt = Date.now(); // Manually update updatedAt

  console.log("Backend: Fields to update:", taskFields); // Log the fields being applied

  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      console.warn("Backend: Task not found for ID:", req.params.id);
      return res.status(404).json({ msg: "Task not found" });
    }

    // Ensure task belongs to the authenticated user
    if (task.userId.toString() !== req.user.id) {
      console.warn(
        "Backend: User not authorized to update task ID:",
        req.params.id,
        "User ID:",
        req.user.id
      );
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Check for empty updates
    if (Object.keys(taskFields).length === 1 && taskFields.updatedAt) {
      // Only updatedAt means no functional changes
      console.log(
        "Backend: No substantial fields to update, returning existing task."
      );
      return res.json(task); // Return current task if no other fields changed
    }

    // Update task
    task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: taskFields },
      { new: true, runValidators: true } // Return the updated document, run schema validators
    );
    console.log("Backend: Task updated successfully:", task);
    res.json(task);
  } catch (err) {
    console.error("Backend: Error updating task:", err.message);
    // Log validation errors specifically
    if (err.name === "ValidationError") {
      const errors = Object.keys(err.errors).map(
        (key) => err.errors[key].message
      );
      return res.status(400).json({ msg: "Validation Error", errors });
    }
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Task not found" });
    }
    res.status(500).json({ msg: "Server Error", details: err.message }); // Ensure JSON response
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task by ID for the authenticated user
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ msg: "Task not found" });
    }

    // Ensure task belongs to the authenticated user
    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Use findByIdAndDelete instead of findByIdAndRemove
    await Task.findByIdAndDelete(req.params.id);

    res.json({ msg: "Task removed" }); // This is a JSON response for success
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Task not found" });
    }
    res.status(500).json({ msg: "Server Error", details: err.message }); // Ensure JSON response here
  }
});

module.exports = router;
