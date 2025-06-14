// src/components/AuthForm.jsx
import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext"; // Import useTheme

const AuthForm = ({ onAuthSuccess, API_BASE_URL }) => {
  const { isDarkMode } = useTheme(); // Use theme for conditional styling
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [isLoading, setIsLoading] = useState(false);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000); // Message disappears after 3 seconds
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setMessageType("");

    const loginUrl = `${API_BASE_URL}/api/auth/login`; // Corrected: Added /api/
    const registerUrl = `${API_BASE_URL}/api/auth/register`; // Corrected: Added /api/

    if (!email.trim() || !password.trim()) {
      showMessage("Email/Username and password are required.", "error");
      setIsLoading(false);
      return;
    }

    if (!isLogin && (!username.trim() || !confirmPassword.trim())) {
      showMessage("All fields are required for registration.", "error");
      setIsLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      showMessage("Passwords do not match.", "error");
      setIsLoading(false);
      return;
    }

    try {
      let response;
      let data;

      if (isLogin) {
        console.log(`AuthForm: Attempting login to: ${loginUrl}`);
        response = await fetch(loginUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrUsername: email, password }),
        });
      } else {
        console.log(`AuthForm: Attempting registration to: ${registerUrl}`);
        response = await fetch(registerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
      }

      data = await response.json();

      if (response.ok) {
        showMessage(
          isLogin
            ? "Login successful!"
            : "Registration successful! You can now log in.",
          "success"
        );
        if (isLogin) {
          onAuthSuccess(data.token, data.userId, data.username);
        } else {
          // After successful registration, switch to login form
          setIsLogin(true);
          setEmail("");
          setPassword("");
          setUsername("");
          setConfirmPassword("");
        }
      } else {
        showMessage(
          data.msg || (isLogin ? "Login failed." : "Registration failed."),
          "error"
        );
        console.error("AuthForm: API Error:", data.msg || response.statusText);
      }
    } catch (error) {
      console.error("AuthForm: Network error during authentication:", error);
      showMessage("Network error. Please check server connection.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300
            ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div
        className={`max-w-md w-full p-8 space-y-8 rounded-lg shadow-2xl transform transition-all duration-300
                ${
                  isDarkMode
                    ? "bg-gray-800 text-white border border-blue-700"
                    : "bg-white text-gray-900 border border-blue-200"
                }`}
      >
        <div>
          <h2
            className={`mt-6 text-center text-3xl font-extrabold
                        ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            {isLogin ? "Sign in to your account" : "Register a new account"}
          </h2>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`p-3 rounded-md text-sm text-center
                        ${
                          messageType === "success"
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                            : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                        }`}
          >
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border
                                    ${
                                      isDarkMode
                                        ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                                        : "border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500"
                                    }
                                    focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="sr-only">
              Email address or Username
            </label>
            <input
              id="email"
              name="email"
              type="text" // Changed to text to allow username for login
              autoComplete="email"
              required
              className={`appearance-none rounded-md relative block w-full px-3 py-2 border
                                ${
                                  isDarkMode
                                    ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                                    : "border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500"
                                }
                                focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
              placeholder={isLogin ? "Email or Username" : "Email address"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              className={`appearance-none rounded-md relative block w-full px-3 py-2 border
                                    ${
                                      isDarkMode
                                        ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                                        : "border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500"
                                    }
                                    focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {!isLogin && (
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className={`appearance-none rounded-md relative block w-full px-3 py-2 border
                                    ${
                                      isDarkMode
                                        ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                                        : "border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500"
                                    }
                                    focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white
                                ${
                                  isLoading
                                    ? "bg-blue-400"
                                    : "bg-blue-600 hover:bg-blue-700"
                                }
                                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200`}
              disabled={isLoading}
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
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
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Register"
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className={`font-medium
                            ${
                              isDarkMode
                                ? "text-blue-400 hover:text-blue-300"
                                : "text-blue-600 hover:text-blue-500"
                            }
                            transition-colors duration-200`}
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
