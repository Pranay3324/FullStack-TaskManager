// src/components/PomodoroTimer.jsx
import React, { useState, useEffect, useRef } from "react";

const PomodoroTimer = ({ showMessage }) => {
  // showMessage prop added
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("work"); // 'work', 'short-break', 'long-break'
  const timerRef = useRef(null);

  const WORK_TIME = 25 * 60; // 25 minutes in seconds
  const SHORT_BREAK_TIME = 5 * 60; // 5 minutes
  const LONG_BREAK_TIME = 15 * 60; // 15 minutes
  const [remainingTime, setRemainingTime] = useState(WORK_TIME);

  const resetTimer = (newMode) => {
    setIsActive(false);
    setMode(newMode);
    const time =
      newMode === "work"
        ? WORK_TIME
        : newMode === "short-break"
        ? SHORT_BREAK_TIME
        : LONG_BREAK_TIME;
    setRemainingTime(time);
    setMinutes(Math.floor(time / 60));
    setSeconds(time % 60);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (isActive && remainingTime > 0) {
      timerRef.current = setInterval(() => {
        setRemainingTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (remainingTime === 0) {
      clearInterval(timerRef.current);
      setIsActive(false);
      // Play a simple sound or show notification when timer ends
      showMessage(`${mode.toUpperCase()} session ended!`, "success");
      if (mode === "work") {
        resetTimer("short-break");
      } else {
        resetTimer("work");
      }
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, remainingTime, mode, showMessage]); // Add showMessage to dependency array

  useEffect(() => {
    setMinutes(Math.floor(remainingTime / 60));
    setSeconds(remainingTime % 60);
  }, [remainingTime]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6 text-center transition-colors duration-300">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Pomodoro Timer
      </h3>
      <div className="flex justify-center space-x-2 mb-4">
        <button
          onClick={() => resetTimer("work")}
          className={`py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200
                    ${
                      mode === "work"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                    }`}
        >
          Work (25 min)
        </button>
        <button
          onClick={() => resetTimer("short-break")}
          className={`py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200
                    ${
                      mode === "short-break"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                    }`}
        >
          Short Break (5 min)
        </button>
        <button
          onClick={() => resetTimer("long-break")}
          className={`py-2 px-4 rounded-lg font-medium text-sm transition-colors duration-200
                    ${
                      mode === "long-break"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                    }`}
        >
          Long Break (15 min)
        </button>
      </div>
      <div className="text-6xl font-bold mb-4 text-gray-900 dark:text-white">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
      <div className="space-x-4">
        <button
          onClick={() => setIsActive(true)}
          disabled={isActive}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline disabled:opacity-50 transition-colors duration-200"
        >
          Start
        </button>
        <button
          onClick={() => setIsActive(false)}
          disabled={!isActive}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline disabled:opacity-50 transition-colors duration-200"
        >
          Pause
        </button>
        <button
          onClick={() => resetTimer(mode)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;
