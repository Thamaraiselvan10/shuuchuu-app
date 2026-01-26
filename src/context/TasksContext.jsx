import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';

const TasksContext = createContext();

export const useTasks = () => {
    const context = useContext(TasksContext);
    if (!context) {
        throw new Error('useTasks must be used within a TasksProvider');
    }
    return context;
};

export const TasksProvider = ({ children }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refreshTasks = useCallback(async () => {
        try {
            // Don't set loading to true for background refreshes
            const data = await taskService.getAll();
            setTasks(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        refreshTasks();
    }, [refreshTasks]);

    // Poll for updates (every minute)
    useEffect(() => {
        const interval = setInterval(refreshTasks, 60000);
        return () => clearInterval(interval);
    }, [refreshTasks]);

    // CRUD Wrappers that automatically update state
    const addTask = async (taskData) => {
        try {
            await taskService.create(taskData);
            await refreshTasks();
            return true;
        } catch (err) {
            console.error('Failed to add task:', err);
            throw err;
        }
    };

    const updateTask = async (id, updates) => {
        try {
            await taskService.update(id, updates);
            await refreshTasks();
            return true;
        } catch (err) {
            console.error('Failed to update task:', err);
            throw err;
        }
    };

    const deleteTask = async (id) => {
        try {
            await taskService.delete(id);
            await refreshTasks();
            return true;
        } catch (err) {
            console.error('Failed to delete task:', err);
            throw err;
        }
    };

    const toggleTaskStatus = async (id, currentStatus) => {
        try {
            await taskService.toggleStatus(id, currentStatus);
            await refreshTasks();
            return true;
        } catch (err) {
            console.error('Failed to toggle task status:', err);
            throw err;
        }
    };

    // Direct status update for Kanban moves
    const updateTaskStatus = async (id, newStatus) => {
        try {
            await taskService.updateStatus(id, newStatus);
            await refreshTasks();
            return true;
        } catch (err) {
            console.error('Failed to update task status:', err);
            throw err;
        }
    };

    // Direct priority update for Priority column moves
    const updateTaskPriority = async (id, newPriority) => {
        try {
            await taskService.updatePriority(id, newPriority);
            await refreshTasks();
            return true;
        } catch (err) {
            console.error('Failed to update task priority:', err);
            throw err;
        }
    };

    const value = {
        tasks,
        loading,
        error,
        refreshTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        updateTaskStatus,
        updateTaskPriority
    };

    return (
        <TasksContext.Provider value={value}>
            {children}
        </TasksContext.Provider>
    );
};
