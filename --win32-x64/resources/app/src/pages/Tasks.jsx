import React, { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', category: 'General', priority: 0 });
    const [filter, setFilter] = useState('all'); // all, pending, completed
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [categories, setCategories] = useState(['General', 'Work', 'Personal', 'Study']);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        loadTasks();
        const savedCategories = localStorage.getItem('task_categories');
        if (savedCategories) {
            setCategories(JSON.parse(savedCategories));
        }
    }, []);

    const loadTasks = async () => {
        try {
            const result = await taskService.getAll();
            setTasks(result);
        } catch (err) {
            console.error('Failed to load tasks', err);
        }
    };

    const handleCreate = async () => {
        if (!newTask.title.trim()) return;
        await taskService.create(newTask);
        setNewTask({ title: '', category: 'General', priority: 0 });
        setIsModalOpen(false);
        loadTasks();
    };

    const handleCreateCategory = () => {
        if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
            const updatedCategories = [...categories, newCategoryName.trim()];
            setCategories(updatedCategories);
            localStorage.setItem('task_categories', JSON.stringify(updatedCategories));
            setNewCategoryName('');
            setIsCategoryModalOpen(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this task?')) {
            await taskService.delete(id);
            loadTasks();
        }
    };

    const handleToggle = async (task) => {
        await taskService.toggleStatus(task.id, task.status);
        loadTasks();
    };

    const filteredTasks = tasks.filter(task => {
        const statusMatch = filter === 'all' ? true : task.status === filter;
        const categoryMatch = selectedCategory === 'All' ? true : task.category === selectedCategory;
        return statusMatch && categoryMatch;
    }).sort((a, b) => {
        // Sort by status: pending first, completed last
        if (a.status === b.status) return 0;
        return a.status === 'completed' ? 1 : -1;
    });

    return (
        <div className="tasks-container">
            <div className="category-sidebar glass-panel">
                <div className="sidebar-header">
                    <h3>Categories</h3>
                    <Button onClick={() => setIsCategoryModalOpen(true)} style={{ padding: '4px 8px', fontSize: '0.8rem' }}>+</Button>
                </div>
                <div className="category-list">
                    <div
                        className={`category-item ${selectedCategory === 'All' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('All')}
                    >
                        All Tasks
                    </div>
                    {categories.map(cat => (
                        <div
                            key={cat}
                            className={`category-item ${selectedCategory === cat ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat)}
                        >
                            {cat}
                        </div>
                    ))}
                </div>
            </div>

            <div className="tasks-content">
                <div className="tasks-header glass-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--primary-color)' }}>{selectedCategory} Tasks</h1>
                        <span className="task-count">{filteredTasks.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="anime-select"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>
                        <Button onClick={() => setIsModalOpen(true)}>+ New Task</Button>
                    </div>
                </div>

                <div className="tasks-grid">
                    {filteredTasks.length === 0 ? (
                        <div className="empty-state">
                            <p>No tasks found in this category.</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <div key={task.id} className={`anime-task-card ${task.status === 'completed' ? 'completed' : ''}`}>
                                <div className="task-checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        checked={task.status === 'completed'}
                                        onChange={() => handleToggle(task)}
                                        className="anime-checkbox"
                                    />
                                </div>
                                <div className="task-info">
                                    <div className="task-title">{task.title}</div>
                                    <div className="task-meta">
                                        <span className="task-category-tag">{task.category}</span>
                                        {task.priority > 0 && (
                                            <span className={`task-priority p-${task.priority}`}>
                                                {task.priority === 1 ? 'Medium' : 'High'} Priority
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Button variant="danger" onClick={() => handleDelete(task.id)} className="delete-btn">×</Button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Task">
                <Input
                    label="Title"
                    value={newTask.title}
                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="What needs to be done?"
                    autoFocus
                />
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Category</label>
                    <select
                        value={newTask.category}
                        onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                        className="anime-select full-width"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Priority</label>
                    <select
                        value={newTask.priority}
                        onChange={e => setNewTask({ ...newTask, priority: parseInt(e.target.value) })}
                        className="anime-select full-width"
                    >
                        <option value={0}>Low</option>
                        <option value={1}>Medium</option>
                        <option value={2}>High</option>
                    </select>
                </div>
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <Button onClick={handleCreate}>Save Task</Button>
                </div>
            </Modal>

            <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Add Category">
                <Input
                    label="Category Name"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Shopping"
                    autoFocus
                />
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <Button onClick={handleCreateCategory}>Create</Button>
                </div>
            </Modal>

            <style>{`
                .tasks-container {
                    display: flex;
                    gap: 20px;
                    height: calc(100vh - 100px);
                }

                .category-sidebar {
                    width: 250px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                }

                .sidebar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid rgba(0,0,0,0.1);
                }

                .category-list {
                    flex: 1;
                    overflow-y: auto;
                }

                .category-item {
                    padding: 10px 15px;
                    margin-bottom: 5px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 500;
                    color: var(--text-color);
                }

                .category-item:hover {
                    background: rgba(255,255,255,0.3);
                }

                .category-item.active {
                    background: var(--primary-color);
                    color: white;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }

                .tasks-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    overflow: hidden;
                }

                .tasks-header {
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .task-count {
                    background: var(--secondary-color);
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-weight: bold;
                }

                .tasks-grid {
                    flex: 1;
                    overflow-y: auto;
                    padding-right: 5px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }

                .anime-task-card {
                    background: rgba(255,255,255,0.6);
                    backdrop-filter: blur(5px);
                    padding: 15px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    transition: all 0.2s;
                    border: 1px solid rgba(255,255,255,0.4);
                }

                .anime-task-card:hover {
                    transform: translateY(-2px);
                    background: rgba(255,255,255,0.8);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                }

                .anime-task-card.completed {
                    opacity: 0.6;
                    background: rgba(0,0,0,0.05);
                }

                .anime-task-card.completed .task-title {
                    text-decoration: line-through;
                }

                .task-checkbox-wrapper {
                    display: flex;
                    align-items: center;
                }

                .anime-checkbox {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                    accent-color: var(--primary-color);
                }

                .task-info {
                    flex: 1;
                }

                .task-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 4px;
                }

                .task-meta {
                    display: flex;
                    gap: 10px;
                    font-size: 0.8rem;
                }

                .task-category-tag {
                    color: #666;
                    background: rgba(0,0,0,0.05);
                    padding: 2px 6px;
                    border-radius: 4px;
                }

                .task-priority.p-1 { color: orange; }
                .task-priority.p-2 { color: red; font-weight: bold; }

                .delete-btn {
                    padding: 5px 10px;
                    font-size: 1.2rem;
                    line-height: 1;
                    background: transparent;
                    color: #999;
                    box-shadow: none;
                }

                .delete-btn:hover {
                    color: red;
                    background: rgba(255,0,0,0.1);
                }

                .anime-select {
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid rgba(0,0,0,0.1);
                    background: rgba(255,255,255,0.5);
                    font-family: inherit;
                    outline: none;
                }

                .anime-select.full-width {
                    width: 100%;
                }

                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #999;
                    font-style: italic;
                }

                @media (prefers-color-scheme: dark) {
                    .anime-task-card {
                        background: rgba(0,0,0,0.3);
                        border-color: rgba(255,255,255,0.05);
                    }
                    .anime-task-card:hover {
                        background: rgba(0,0,0,0.5);
                    }
                    .anime-select {
                        background: rgba(0,0,0,0.3);
                        color: white;
                    }
                }
            `}</style>
        </div>
    );
};

export default Tasks;
