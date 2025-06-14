import React, { useState, useEffect } from "react";

// Import components and context
import AuthForm from "./components/AuthForm";
import TaskForm from "./components/TaskForm";
import TaskItem from "./components/TaskItem";
import PomodoroTimer from "./components/PomodoroTimer";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ConfirmationModal from "./components/ConfirmationModal";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

// Base URL for the backend API
// IMPORTANT: This should be the ROOT URL of your deployed Render backend service.
// DO NOT include '/api' or any route paths here, as they are appended automatically by your fetch calls.
// Example: If your Render backend URL is 'https://my-backend-service.onrender.com', then set API_BASE_URL to 'https://my-backend-service.onrender.com'.
const API_BASE_URL = "https://fullstack-taskmanager-ux19.onrender.com"; // <--- This is your backend's root URL

const App = () => {
  // State for user authentication: token, userId, username
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userId, setUserId] = useState(localStorage.getItem("userId"));
  const [username, setUsername] = useState(localStorage.getItem("username"));

  // State for navigation (simple routing)
  // Initialize currentPage based on token presence
  const [currentPage, setCurrentPage] = useState(token ? "dashboard" : "login");

  // State for tasks
  const [tasks, setTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'pending', 'completed'
  const [filterPriority, setFilterPriority] = useState("all"); // 'all', 'low', 'medium', 'high'
  const [sortBy, setSortBy] = useState("createdAt"); // 'createdAt', 'dueDate', 'priority'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc', 'desc'

  // Removed editingTask state from App.jsx as editing is now handled in TaskItem directly
  // const [editingTask, setEditingTask] = useState(null);

  // State for messages/notifications
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'

  // State for delete confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Function to show transient messages
  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000); // Message disappears after 3 seconds
  };

  // Handle user login
  const handleLogin = (jwtToken, id, name) => {
    console.log("App: Login successful. Storing token and user info.");
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("userId", id);
    localStorage.setItem("username", name);
    setToken(jwtToken); // Update React state
    setUserId(id); // Update React state
    setUsername(name); // Update React state
    setCurrentPage("dashboard");
    showMessage("Logged in successfully!", "success");
  };

  // Handle user logout
  const handleLogout = () => {
    console.log("App: Logging out. Clearing token and user info.");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setToken(null); // Clear React state
    setUserId(null); // Clear React state
    setUsername(null); // Clear React state
    setTasks([]); // Clear tasks on logout
    setCurrentPage("login");
    showMessage("Logged out successfully!", "success");
  };

  // Fetch tasks from the backend
  const fetchTasks = async () => {
    const storedToken = localStorage.getItem("token");
    console.log(
      "App: fetchTasks called. Token from localStorage:",
      storedToken ? "Present" : "Absent"
    );

    // Only proceed if a token is present in localStorage
    if (!storedToken) {
      // If no token, and current page is not login, redirect to login
      if (currentPage !== "login") {
        console.log("App: No token found. Redirecting to login page.");
        setCurrentPage("login");
      }
      return;
    }

    try {
      console.log("App: Sending fetch tasks request with token.");
      // CORRECTED: Ensure '/api/tasks' is correctly used
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: {
          "x-auth-token": storedToken, // Use the token from localStorage
        },
      });
      const data = await response.json();
      if (response.ok) {
        console.log("App: Tasks fetched successfully:", data);
        setTasks(data);
      } else {
        console.error(
          "App: Failed to fetch tasks:",
          data.msg || response.statusText
        );
        showMessage(data.msg || "Failed to fetch tasks", "error");
        // If the token is invalid or unauthorized, force logout
        if (response.status === 401 || response.status === 403) {
          console.log(
            "App: 401/403 Unauthorized during task fetch. Forcing logout."
          );
          handleLogout(); // This will clear token and redirect to login
        }
      }
    } catch (error) {
      console.error("App: Network error while fetching tasks:", error);
      showMessage("Network error while fetching tasks", "error");
    }
  };

  // Effect to fetch tasks when token state changes or on initial load
  useEffect(() => {
    fetchTasks();
  }, [token, currentPage]); // Re-run when token changes or if currentPage implies dashboard load

  // Filter and sort tasks for display
  const getFilteredAndSortedTasks = () => {
    let filteredTasks = tasks;

    // Critical: Filter out any invalid task objects before processing
    filteredTasks = filteredTasks.filter(
      (task) => task && typeof task === "object" && task._id
    );

    if (filterStatus !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.status === filterStatus
      );
    }
    if (filterPriority !== "all") {
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === filterPriority
      );
    }

    filteredTasks.sort((a, b) => {
      // First, sort by status: completed tasks come after pending tasks
      if (a.status === "completed" && b.status !== "completed") {
        return 1;
      }
      if (a.status !== "completed" && b.status === "completed") {
        return -1;
      }

      let comparison = 0;
      if (sortBy === "createdAt") {
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === "dueDate") {
        if (a.dueDate === null && b.dueDate !== null)
          return sortOrder === "asc" ? 1 : -1;
        if (b.dueDate === null && a.dueDate !== null)
          return sortOrder === "asc" ? -1 : 1;
        if (a.dueDate === null && b.dueDate === null) return 0;
        comparison = new Date(a.dueDate) - new Date(b.dueDate);
      } else if (sortBy === "priority") {
        const priorityOrder = { low: 1, medium: 2, high: 3 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filteredTasks;
  };

  // CRUD operations for tasks
  const addTask = async (taskData) => {
    const storedToken = localStorage.getItem("token");
    console.log(
      "App: addTask called. Token from localStorage:",
      storedToken ? "Present" : "Absent"
    );
    if (!storedToken) {
      showMessage("You must be logged in to add tasks.", "error");
      setCurrentPage("login"); // Redirect to login
      return;
    }

    try {
      // CORRECTED: Ensure '/api/tasks' is correctly used
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": storedToken, // Use the token from localStorage
        },
        body: JSON.stringify(taskData),
      });
      const data = await response.json();
      if (response.ok) {
        setTasks((prevTasks) => [data, ...prevTasks]);
        showMessage("Task added successfully!", "success");
      } else {
        showMessage(data.msg || "Failed to add task", "error");
        if (response.status === 401 || response.status === 403) handleLogout(); // Force logout on invalid token
      }
    } catch (error) {
      console.error("App: Error adding task:", error);
      showMessage("Network error while adding task", "error");
    }
  };

  // This function now handles updates from both checkbox (status) and in-place edit (full task data)
  const updateTask = async (taskId, updatedData) => {
    const storedToken = localStorage.getItem("token");
    console.log(
      "App: updateTask called. Token from localStorage:",
      storedToken ? "Present" : "Absent"
    );
    if (!storedToken) {
      showMessage("You must be logged in to update tasks.", "error");
      setCurrentPage("login"); // Redirect to login
      return;
    }

    // 'updatedData' can be a string (for status toggle) or an object (for full edit)
    let requestBody;
    if (typeof updatedData === "string") {
      requestBody = { status: updatedData }; // For status toggle, wrap in object
    } else {
      requestBody = updatedData; // For full edit, use the object directly
    }

    try {
      // CORRECTED: Ensure '/api/tasks' is correctly used
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": storedToken,
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (response.ok) {
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task._id === taskId ? data : task))
        );
        showMessage("Task updated successfully!", "success");
        // No need to reset editingTask here, it's handled locally in TaskItem
      } else {
        showMessage(data.msg || "Failed to update task", "error");
        if (response.status === 401 || response.status === 403) handleLogout();
      }
    } catch (error) {
      console.error("App: Error updating task:", error);
      showMessage("Network error while updating task", "error");
    }
  };

  const handleDeleteClick = (taskId) => {
    console.log("App: Attempting to delete task with ID:", taskId);
    setTaskToDelete(taskId);
    setShowConfirmModal(true);
  };

  const confirmDeleteTask = async () => {
    const storedToken = localStorage.getItem("token");
    console.log(
      "App: confirmDeleteTask called. Token from localStorage:",
      storedToken ? "Present" : "Absent"
    );
    if (!storedToken) {
      showMessage("You must be logged in to delete tasks.", "error");
      setCurrentPage("login"); // Redirect to login
      setShowConfirmModal(false);
      setTaskToDelete(null);
      return;
    }

    if (!taskToDelete) {
      console.log("App: No task selected for deletion.");
      setShowConfirmModal(false);
      return;
    }

    console.log("App: Confirming deletion for task ID:", taskToDelete);
    try {
      // CORRECTED: Ensure '/api/tasks' is correctly used
      const response = await fetch(
        `${API_BASE_URL}/api/tasks/${taskToDelete}`,
        {
          method: "DELETE",
          headers: {
            "x-auth-token": storedToken, // Use the token from localStorage
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        console.log("App: Task deleted successfully on backend:", data);
        setTasks((prevTasks) =>
          prevTasks.filter((task) => task._id !== taskToDelete)
        );
        showMessage("Task deleted successfully!", "success");
      } else {
        showMessage(
          data.msg || `Failed to delete task: ${response.statusText}`,
          "error"
        );
        if (response.status === 401 || response.status === 403) handleLogout(); // Force logout on invalid token
      }
    } catch (error) {
      console.error("App: Network error during task deletion:", error);
      showMessage("Network error during task deletion", "error");
    } finally {
      setShowConfirmModal(false);
      setTaskToDelete(null);
    }
  };

  // Callback for AuthForm's authentication success
  const handleAuthSuccess = (jwtToken, id, name) => {
    handleLogin(jwtToken, id, name);
  };

  const cancelDeleteTask = () => {
    console.log("App: Deletion cancelled.");
    setShowConfirmModal(false);
    setTaskToDelete(null);
  };

  // Dark Mode Toggle Button Component
  const DarkModeToggle = () => {
    const { isDarkMode, toggleDarkMode } = useTheme();
    return (
      <button
        onClick={toggleDarkMode}
        className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md hover:scale-105 transition-transform duration-200"
        title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {/* Using inline SVG for a simple moon/sun icon */}
        {isDarkMode ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 4a1 1 0 011 1v1a1 1 0 11-2 0V7a1 1 0 011-1zm-4 8a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-4-4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm14.586-2.586a1 1 0 010 1.414l-1 1a1 1 0 01-1.414-1.414l1-1a1 1 0 011.414 0zM5.414 14.586a1 1 0 010-1.414l1-1a1 1 0 011.414 1.414l-1 1a1 1 0 01-1.414 0zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM3 7a1 1 0 011-1h1a1 1 0 010 2H4a1 1 0 01-1-1z"></path>
          </svg>
        )}
      </button>
    );
  };

  // Main App Render based on currentPage state
  const renderPage = () => {
    switch (currentPage) {
      case "login":
        // Pass handleAuthSuccess to AuthForm
        return (
          <AuthForm
            onAuthSuccess={handleAuthSuccess}
            API_BASE_URL={API_BASE_URL}
          />
        );
      case "dashboard":
        return (
          <div className="container mx-auto p-4 md:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300 font-sans">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome, {username || "User"}!
              </h1>
              <div className="flex items-center space-x-4">
                {/* Dark Mode Toggle */}
                <DarkModeToggle />
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </header>

            {/* Message Display */}
            {message && (
              <div
                className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50
                                ${
                                  messageType === "success"
                                    ? "bg-green-500 text-white"
                                    : "bg-red-500 text-white"
                                }`}
              >
                {message}
              </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
              show={showConfirmModal}
              title="Delete Task"
              message="Are you sure you want to delete this task? This action cannot be undone."
              onConfirm={confirmDeleteTask}
              onCancel={cancelDeleteTask}
            />

            {/* Task Form (now only for adding tasks) */}
            <TaskForm
              onAddTask={addTask}
              // Removed onUpdateTask, editingTask, setEditingTask props
            />

            {/* Filters and Sort */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 transition-colors duration-300">
              <div>
                <label
                  htmlFor="filterStatus"
                  className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                >
                  Filter by Status
                </label>
                <select
                  id="filterStatus"
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="filterPriority"
                  className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                >
                  Filter by Priority
                </label>
                <select
                  id="filterPriority"
                  className="shadow border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <label
                    htmlFor="sortBy"
                    className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
                  >
                    Sort By
                  </label>
                  <select
                    id="sortBy"
                    className="shadow border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="dueDate">Due Date</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-3 rounded-lg shadow-sm transition-colors duration-200"
                  title={`Sort ${
                    sortOrder === "asc" ? "Descending" : "Ascending"
                  }`}
                >
                  {/* Using simple text for arrow icons as external libraries are not loaded */}
                  {sortOrder === "asc" ? "↓" : "↑"}
                </button>
              </div>
            </div>

            {/* Task List */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Your Tasks
              </h3>
              {getFilteredAndSortedTasks().length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300 text-center py-8">
                  {tasks.length === 0
                    ? "No tasks yet! Add one above."
                    : "No tasks matching your current filters."}
                </p>
              ) : (
                <div>
                  {getFilteredAndSortedTasks().map(
                    (task) =>
                      // Added a robust check here to ensure task and its _id are valid before rendering
                      task && task._id ? (
                        <TaskItem
                          key={task._id}
                          task={task}
                          // onEdit prop removed as editing is now internal to TaskItem
                          onDelete={handleDeleteClick}
                          onToggleStatus={updateTask}
                          onUpdateTaskInPlace={updateTask} // Pass updateTask function to TaskItem
                        />
                      ) : null // Render nothing if task or its ID is invalid
                  )}
                </div>
              )}
            </div>

            {/* Bonus Features Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <PomodoroTimer showMessage={showMessage} />
              <AnalyticsDashboard tasks={tasks} />
            </div>
          </div>
        );
      default:
        return (
          <AuthForm
            onAuthSuccess={handleAuthSuccess}
            API_BASE_URL={API_BASE_URL}
          />
        );
    }
  };

  return <ThemeProvider>{renderPage()}</ThemeProvider>;
};

export default App;
