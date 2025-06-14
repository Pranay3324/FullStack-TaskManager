// src/components/TaskForm.jsx
import React, { useState, useEffect } from "react";

// TaskForm is now exclusively for ADDING new tasks
// Ensure API_BASE_URL is accepted as a prop
const TaskForm = ({ onAddTask, API_BASE_URL }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiSuggestionMessage, setAiSuggestionMessage] = useState("");

  useEffect(() => {
    // Reset form fields when the component mounts or resets naturally (e.g., after add)
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setAiSuggestions([]);
    setAiSuggestionMessage("");
  }, []); // Empty dependency array means this runs once on mount

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Task title cannot be empty."); // Consider using a custom modal here for better UX
      return;
    }

    const taskData = {
      title,
      description: description.trim(),
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    };

    console.log("TaskForm: Adding new task. taskData:", taskData);
    onAddTask(taskData); // Always call onAddTask

    // Reset form after submission
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate("");
    setAiSuggestions([]);
    setAiSuggestionMessage("");
  };

  const handleGenerateSuggestions = async () => {
    if (!title.trim()) {
      setAiSuggestionMessage(
        "Please enter a main task title to get suggestions."
      );
      setAiSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    setAiSuggestions([]);
    setAiSuggestionMessage("");

    try {
      const token = localStorage.getItem("token"); // Get the auth token
      if (!token) {
        setAiSuggestionMessage("Please log in to use AI suggestions.");
        setIsLoadingSuggestions(false);
        return;
      }

      // CORRECTED: Use API_BASE_URL prop for the fetch call for AI suggestions
      const response = await fetch(`${API_BASE_URL}/api/tasks/suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token, // Send the auth token
        },
        body: JSON.stringify({ mainTaskTitle: title }),
      });

      const data = await response.json();

      if (response.ok) {
        if (
          data.suggestions &&
          Array.isArray(data.suggestions) &&
          data.suggestions.length > 0
        ) {
          setAiSuggestions(data.suggestions);
          setAiSuggestionMessage("AI Suggestions:");
        } else {
          setAiSuggestionMessage(
            "No suggestions found. Try a different task title."
          );
        }
      } else {
        setAiSuggestionMessage(data.msg || "Failed to get AI suggestions.");
        console.error("Backend error getting AI suggestions:", data.msg);
      }
    } catch (error) {
      setAiSuggestionMessage(
        "Network error during AI suggestion. Check backend server."
      );
      console.error("Error generating AI suggestions:", error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleAddSuggestionAsTask = (suggestionToAdd) => {
    const newTaskData = {
      title: suggestionToAdd,
      description: "", // Suggestions are concise, no desc by default
      priority: "medium", // Default priority for suggested tasks
      dueDate: null,
    };
    onAddTask(newTaskData);
    // Remove the added suggestion from the AI suggestions list
    setAiSuggestions((prevSuggestions) =>
      prevSuggestions.filter((s) => s !== suggestionToAdd)
    );
    if (aiSuggestions.length - 1 === 0) {
      // If it was the last suggestion
      setAiSuggestionMessage("All suggested tasks added!");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl mb-6 border-t-4 border-blue-500 dark:border-blue-700 transition-colors duration-300">
      <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Add New Task {/* Simplified title */}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
          >
            Task Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-400"
            placeholder="e.g., Plan a Birthday Party"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-400 h-24 resize-none"
            placeholder="e.g., Read documentation, build a small project"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="priority"
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
            >
              Priority
            </label>
            <select
              id="priority"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-400"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="dueDate"
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
            >
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-400"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {" "}
          {/* Use flex-wrap for better mobile layout */}
          <button
            type="submit"
            className="flex-1 min-w-[120px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-300 transform hover:scale-105"
          >
            Add Task
          </button>
          {/* Removed Cancel Edit button */}
          {/* New AI Suggestion Button */}
          <button
            type="button"
            onClick={handleGenerateSuggestions}
            className="flex-1 min-w-[180px] bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
            disabled={isLoadingSuggestions}
          >
            {isLoadingSuggestions ? (
              <svg
                className="animate-spin h-5 w-5 text-white mr-3"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.663 17h4.673M12 20v-3m0 0l-1.672-1.672M12 17l1.672 1.672M12 17l1.672-1.672M12 17h4.673M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                Suggest Subtasks (AI)
              </>
            )}
          </button>
        </div>
      </form>

      {/* Display AI Suggestions */}
      {aiSuggestionMessage && (
        <div
          className={`mt-6 p-4 rounded-lg border-l-4
                    ${
                      aiSuggestionMessage.startsWith("Error") ||
                      aiSuggestionMessage.startsWith("No suggestions") ||
                      aiSuggestionMessage.startsWith("Please enter") ||
                      aiSuggestionMessage.startsWith("Network error") ||
                      aiSuggestionMessage.startsWith("Please log in")
                        ? "bg-red-100 text-red-800 border-red-500 dark:bg-red-900 dark:text-red-100 dark:border-red-700"
                        : "bg-green-100 text-green-800 border-green-500 dark:bg-green-900 dark:text-green-100 dark:border-green-700"
                    }
                    `}
        >
          <p className="font-semibold mb-3 text-gray-900 dark:text-white">
            {aiSuggestionMessage}
          </p>
          {aiSuggestions.length > 0 && (
            <ul className="list-disc list-inside space-y-2">
              {aiSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center text-gray-700 dark:text-gray-200"
                >
                  <span>{suggestion}</span>
                  <button
                    onClick={() => handleAddSuggestionAsTask(suggestion)}
                    className="ml-2 px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs rounded-full shadow-md transition-all duration-200 transform hover:scale-105"
                  >
                    Add as Task
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskForm;
