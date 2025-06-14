// src/components/AuthForm.jsx
import React, { useState } from "react";

// Assuming API_BASE_URL is passed as a prop or defined globally/contextually if preferred
// For now, I'll pass it as a prop for clarity.
const AuthForm = ({ onAuthSuccess, API_BASE_URL }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authMessageType, setAuthMessageType] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthMessage(""); // Clear previous messages
    const url = isRegister
      ? `${API_BASE_URL}/auth/register`
      : `${API_BASE_URL}/auth/login`;
    const body = isRegister
      ? { username, email, password }
      : { emailOrUsername: email || username, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (response.ok) {
        setAuthMessage(
          isRegister
            ? "Registration successful! Please log in."
            : "Login successful!"
        );
        setAuthMessageType("success");
        if (!isRegister) {
          onAuthSuccess(data.token, data.userId, data.username);
        } else {
          // After successful registration, switch to login mode automatically
          setIsRegister(false);
          setEmail(""); // Clear email and password fields after successful registration
          setPassword("");
          setUsername("");
        }
      } else {
        setAuthMessage(data.msg || "Authentication failed.");
        setAuthMessageType("error");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthMessage("Network error. Please try again.");
      setAuthMessageType("error");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          {isRegister ? "Register" : "Login"}
        </h2>
        {authMessage && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              authMessageType === "success"
                ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
                : "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100"
            }`}
          >
            {authMessage}
          </div>
        )}
        {isRegister && (
          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="username"
            >
              Username
            </label>
            <input
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required={isRegister}
            />
          </div>
        )}
        <div className="mb-4">
          <label
            className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
            htmlFor="email"
          >
            Email (or Username for Login)
          </label>
          <input
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            id="email"
            type="text"
            placeholder="Email or Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label
            className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 mb-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200"
            type="submit"
          >
            {isRegister ? "Register" : "Login"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister((prev) => !prev);
              setAuthMessage(""); // Clear message on mode switch
              setUsername("");
              setEmail("");
              setPassword("");
            }}
            className="inline-block align-baseline font-bold text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600 transition-colors duration-200"
          >
            {isRegister
              ? "Already have an account? Login"
              : "Don't have an account? Register"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthForm;
