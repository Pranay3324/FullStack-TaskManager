// src/components/AnalyticsDashboard.jsx
import React from "react";

const AnalyticsDashboard = ({ tasks }) => {
  // Calculate completion trends
  const completedTasksCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;
  const totalTasksCount = tasks.length;
  const completionRate =
    totalTasksCount > 0
      ? ((completedTasksCount / totalTasksCount) * 100).toFixed(2)
      : 0;

  // Group tasks by completion date for daily/weekly trends (simple example)
  const completionByDate = tasks.reduce((acc, task) => {
    if (task.status === "completed" && task.updatedAt) {
      const date = new Date(task.updatedAt).toLocaleDateString(); // "MM/DD/YYYY"
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {});

  const sortedDates = Object.keys(completionByDate).sort(
    (a, b) => new Date(a) - new Date(b)
  );
  const chartData = sortedDates.map((date) => ({
    date,
    completed: completionByDate[date],
  }));

  // Very basic visual representation (e.g., using a bar for completion rate)
  const CompletionBar = ({ percentage }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
      <div
        className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-300">
      <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Productivity Dashboard
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
        <div>
          <p className="text-lg font-medium">
            Total Tasks:{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              {totalTasksCount}
            </span>
          </p>
          <p className="text-lg font-medium">
            Completed Tasks:{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              {completedTasksCount}
            </span>
          </p>
          <p className="text-lg font-medium">
            Completion Rate:{" "}
            <span className="font-bold text-blue-600">{completionRate}%</span>
          </p>
          <CompletionBar percentage={completionRate} />
        </div>
        <div>
          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
            Completed Tasks by Date:
          </h4>
          {chartData.length > 0 ? (
            <ul className="list-disc list-inside text-sm">
              {chartData.map((data, index) => (
                <li key={index}>
                  {data.date}: {data.completed} tasks
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">No completed tasks yet to show trends.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
