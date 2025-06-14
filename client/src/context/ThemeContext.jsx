// src/context/ThemeContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

// Create a context for themes (dark/light mode)
export const ThemeContext = createContext();

// ThemeProvider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from localStorage or default to false
    const savedMode = localStorage.getItem("isDarkMode");
    const initialMode = savedMode ? JSON.parse(savedMode) : false;
    console.log("ThemeContext: Initializing isDarkMode to", initialMode);
    return initialMode;
  });

  useEffect(() => {
    console.log(
      "ThemeContext: useEffect triggered. isDarkMode is now",
      isDarkMode
    );
    // Apply dark mode class to the <html> element
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light"); // Ensure 'light' is removed if it was manually added elsewhere
      console.log('ThemeContext: Added "dark" class to <html>');
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light"); // Optionally add 'light' for explicit light mode styling
      console.log('ThemeContext: Removed "dark" class from <html>');
    }
    // Save preference to localStorage
    localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
    console.log("ThemeContext: Saved isDarkMode to localStorage:", isDarkMode);
  }, [isDarkMode]); // Re-run effect whenever isDarkMode changes

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      console.log(
        "ThemeContext: toggleDarkMode called. New state will be",
        newMode
      );
      return newMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => useContext(ThemeContext);
