// src/components/TaskItem.jsx
import React, { useState, useEffect } from 'react';

const TaskItem = ({ task, onEdit, onDelete, onToggleStatus, onUpdateTaskInPlace }) => {
    // Add a guard clause to ensure task is defined
    if (!task) {
        console.error("TaskItem received an undefined task prop.");
        return null; // Don't render if task is undefined
    }

    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title || '');
    const [editedDescription, setEditedDescription] = useState(task.description || '');
    const [editedPriority, setEditedPriority] = useState(task.priority || 'medium');
    const [editedDueDate, setEditedDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');

    // Update local state when the task prop changes (e.g., after an update from App.jsx)
    useEffect(() => {
        setEditedTitle(task.title || '');
        setEditedDescription(task.description || '');
        setEditedPriority(task.priority || 'medium');
        setEditedDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    }, [task]);

    // Derived states for styling
    const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDateObj && task.status === 'pending' && dueDateObj < new Date();

    const handleEditClick = () => {
        setIsEditing(true);
        // Ensure local state is in sync with current task data before editing
        setEditedTitle(task.title || '');
        setEditedDescription(task.description || '');
        setEditedPriority(task.priority || 'medium');
        setEditedDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    };

    const handleSaveEdit = () => {
        if (!editedTitle.trim()) {
            alert('Task title cannot be empty.');
            return;
        }

        const updatedTaskData = {
            title: editedTitle.trim(),
            description: editedDescription.trim(),
            priority: editedPriority,
            dueDate: editedDueDate ? new Date(editedDueDate).toISOString() : null,
            status: task.status // Keep current status
        };

        // Call the parent's update function, passing the task ID and the updated data
        onUpdateTaskInPlace(task._id, updatedTaskData);
        setIsEditing(false); // Exit editing mode
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // Reset local state to original task values
        setEditedTitle(task.title || '');
        setEditedDescription(task.description || '');
        setEditedPriority(task.priority || 'medium');
        setEditedDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    };

    return (
        <div className={`
            bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 border transition-all duration-300 ease-in-out transform
            ${task.status === 'completed'
                ? 'border-green-400 dark:border-green-600 opacity-60 scale-[0.99] shadow-inner-lg' // Overall task item fades slightly
                : isOverdue
                    ? 'border-red-400 dark:border-red-600 shadow-md hover:shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 shadow-md hover:shadow-lg'
            }
            hover:-translate-y-0.5 hover:shadow-xl
        `}>
            {isEditing ? (
                // Editing mode UI
                <div className="space-y-3">
                    <div>
                        <label htmlFor={`edit-title-${task._id}`} className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">Title</label>
                        <input
                            type="text"
                            id={`edit-title-${task._id}`}
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-400"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor={`edit-description-${task._id}`} className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">Description</label>
                        <textarea
                            id={`edit-description-${task._id}`}
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-400 h-20 resize-none"
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                        ></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label htmlFor={`edit-priority-${task._id}`} className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">Priority</label>
                            <select
                                id={`edit-priority-${task._id}`}
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-400"
                                value={editedPriority}
                                onChange={(e) => setEditedPriority(e.target.value)}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor={`edit-dueDate-${task._id}`} className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-1">Due Date</label>
                            <input
                                type="date"
                                id={`edit-dueDate-${task._id}`}
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-400"
                                value={editedDueDate}
                                onChange={(e) => setEditedDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors duration-200"
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors duration-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                // Display mode UI
                <>
                    <div className="flex justify-between items-center mb-2">
                        {/* The task title with animated strikethrough */}
                        <h4 className={`text-lg font-semibold dark:text-white relative inline-block
                            ${task.status === 'completed' ? 'text-gray-500 dark:text-gray-400 italic' : 'text-gray-900'}
                            `}>
                            {task.title}
                            {/* Animated strikethrough line */}
                            <span className={`absolute left-0 top-1/2 bg-gray-500 dark:bg-gray-400 transform -translate-y-1/2 origin-left
                                transition-all duration-700 ease-out
                                ${task.status === 'completed' ? 'w-full h-[4px] opacity-100' : 'w-0 h-[0px] opacity-0'}`} // Control width, height, and opacity
                            ></span>
                        </h4>
                        <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                                ${task.priority === 'high' ? 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100' :
                                  task.priority === 'medium' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                                  'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-100'}`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                            </span>
                            <input
                                type="checkbox"
                                checked={task.status === 'completed'}
                                onChange={() => onToggleStatus(task._id, task.status === 'completed' ? 'pending' : 'completed')}
                                className="form-checkbox h-5 w-5 text-green-600 dark:text-green-400 rounded-md focus:ring-green-500 dark:focus:ring-green-400 transition-colors duration-200"
                            />
                        </div>
                    </div>
                    {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 transition-colors duration-300">{task.description}</p>
                    )}
                    <div className="flex justify-between items-end text-sm text-gray-500 dark:text-gray-400">
                        {dueDateObj && (
                            <span className={`flex-shrink-0 ${isOverdue ? 'text-red-600 dark:text-red-400 font-bold' : ''}`}>
                                Due: {dueDateObj.toLocaleDateString()}
                            </span>
                        )}
                        <div className="flex space-x-2 flex-grow justify-end">
                            <button
                                onClick={handleEditClick} // Call local handler to switch to editing mode
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600 text-sm transition-colors duration-200"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => onDelete(task._id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600 text-sm transition-colors duration-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TaskItem;
