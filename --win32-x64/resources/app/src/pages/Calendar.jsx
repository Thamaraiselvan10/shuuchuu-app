import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { taskService } from '../services/taskService';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState('');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const result = await taskService.getAll();
            setTasks(result);
        } catch (err) {
            console.error('Failed to load tasks', err);
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const onDateClick = (day) => {
        setSelectedDate(day);
        setIsPopupOpen(true);
        setNewEventTitle('');
    };

    const handleCreateEvent = async () => {
        if (!newEventTitle.trim()) return;

        const newTask = {
            title: newEventTitle,
            due_at: selectedDate.toISOString(),
            category: 'Event',
            priority: 1
        };

        try {
            await taskService.create(newTask);
            setNewEventTitle('');
            loadTasks();
        } catch (err) {
            console.error('Failed to create event', err);
        }
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Filter tasks for the selected date popup
    const selectedDateTasks = tasks.filter(task =>
        task.due_at && isSameDay(new Date(task.due_at), selectedDate)
    );

    return (
        <div className="anime-calendar-container glass-panel">
            <div className="calendar-header">
                <div className="header-left">
                    <h2 className="month-title">{format(currentDate, 'MMMM yyyy')}</h2>
                </div>
                <div className="header-actions">
                    <button onClick={prevMonth} className="nav-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="today-btn">Today</button>
                    <button onClick={nextMonth} className="nav-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>
            </div>

            <div className="calendar-grid">
                {weekDays.map(day => (
                    <div key={day} className="weekday-header">{day}</div>
                ))}

                {calendarDays.map(day => {
                    const dayTasks = tasks.filter(task =>
                        task.due_at && isSameDay(new Date(task.due_at), day)
                    );

                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isDayToday = isToday(day);

                    return (
                        <div
                            key={day.toString()}
                            className={`calendar-cell ${!isCurrentMonth ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isDayToday ? 'today' : ''}`}
                            onClick={() => onDateClick(day)}
                        >
                            <div className="cell-header">
                                <span className="day-number">{format(day, 'd')}</span>
                            </div>
                            <div className="cell-content">
                                {dayTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className={`mini-task-pill ${task.status}`} title={task.title}>
                                        {task.title}
                                    </div>
                                ))}
                                {dayTasks.length > 3 && (
                                    <div className="more-tasks">+{dayTasks.length - 3} more</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                title={format(selectedDate, 'EEEE, MMMM do, yyyy')}
            >
                <div className="event-popup-content">
                    <div className="event-list">
                        {selectedDateTasks.length === 0 ? (
                            <p className="no-events">No events scheduled for this day.</p>
                        ) : (
                            selectedDateTasks.map(task => (
                                <div key={task.id} className={`event-item ${task.status}`}>
                                    <div className="event-time">All Day</div>
                                    <div className="event-details">
                                        <div className="event-title">{task.title}</div>
                                        <div className="event-category">{task.category}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="new-event-form">
                        <h4 style={{ marginBottom: '10px', color: 'var(--primary-color)' }}>Add New Event</h4>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Input
                                placeholder="Event title..."
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                style={{ marginBottom: 0 }}
                            />
                            <Button onClick={handleCreateEvent}>Add</Button>
                        </div>
                    </div>
                </div>
            </Modal>

            <style>{`
                .anime-calendar-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    padding: 20px;
                    box-sizing: border-box;
                    overflow: hidden;
                }

                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .month-title {
                    font-size: 2rem;
                    color: var(--primary-color);
                    margin: 0;
                    font-weight: 800;
                    text-shadow: 2px 2px 0px rgba(0,0,0,0.05);
                }

                .header-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .nav-btn {
                    background: rgba(255,255,255,0.5);
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--text-color);
                    transition: all 0.2s ease;
                }

                .nav-btn:hover {
                    background: var(--primary-color);
                    color: white;
                    transform: scale(1.1);
                }

                .today-btn {
                    background: var(--secondary-color);
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 600;
                    color: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .today-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    grid-template-rows: auto 1fr 1fr 1fr 1fr 1fr; /* Header + 5/6 weeks */
                    gap: 8px;
                    flex: 1;
                    min-height: 0; /* Important for grid overflow */
                }

                .weekday-header {
                    text-align: center;
                    font-weight: 700;
                    color: var(--text-color);
                    opacity: 0.7;
                    padding-bottom: 10px;
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    letter-spacing: 1px;
                }

                .calendar-cell {
                    background: rgba(255, 255, 255, 0.4);
                    border-radius: 12px;
                    padding: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid transparent;
                    min-height: 0; /* Allow shrinking */
                    overflow: hidden;
                }

                .calendar-cell:hover {
                    background: rgba(255, 255, 255, 0.6);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    z-index: 1;
                }

                .calendar-cell.disabled {
                    opacity: 0.4;
                    background: rgba(0,0,0,0.02);
                }

                .calendar-cell.selected {
                    border-color: var(--primary-color);
                    background: rgba(255, 255, 255, 0.8);
                    box-shadow: 0 0 0 2px var(--primary-color) inset;
                }

                .calendar-cell.today {
                    background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, var(--accent-color) 100%);
                }
                
                .calendar-cell.today .day-number {
                    background: var(--primary-color);
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .cell-header {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 4px;
                }

                .day-number {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: var(--text-color);
                }

                .cell-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    overflow-y: auto;
                }

                .cell-content::-webkit-scrollbar {
                    width: 0px; /* Hide scrollbar for cleaner look */
                }

                .mini-task-pill {
                    font-size: 0.7rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: var(--primary-color);
                    color: white;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .mini-task-pill.completed {
                    background: var(--secondary-color);
                    text-decoration: line-through;
                    opacity: 0.8;
                }

                .more-tasks {
                    font-size: 0.65rem;
                    color: var(--text-color);
                    text-align: center;
                    opacity: 0.7;
                }

                /* Popup Styles */
                .event-list {
                    max-height: 300px;
                    overflow-y: auto;
                    margin-bottom: 20px;
                }

                .event-item {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    background: rgba(255,255,255,0.5);
                    border-radius: 8px;
                    margin-bottom: 8px;
                    border-left: 4px solid var(--primary-color);
                }

                .event-item.completed {
                    border-left-color: var(--secondary-color);
                    opacity: 0.7;
                }

                .event-time {
                    font-size: 0.8rem;
                    color: #666;
                    width: 60px;
                    flex-shrink: 0;
                }

                .event-details {
                    flex: 1;
                }

                .event-title {
                    font-weight: 600;
                    color: var(--text-color);
                }

                .event-category {
                    font-size: 0.75rem;
                    color: #888;
                }

                .no-events {
                    text-align: center;
                    color: #999;
                    padding: 20px;
                    font-style: italic;
                }

                .new-event-form {
                    border-top: 1px solid rgba(0,0,0,0.1);
                    padding-top: 15px;
                }

                @media (prefers-color-scheme: dark) {
                    .calendar-cell {
                        background: rgba(0, 0, 0, 0.2);
                    }
                    .calendar-cell:hover {
                        background: rgba(0, 0, 0, 0.3);
                    }
                    .calendar-cell.disabled {
                        background: rgba(0,0,0,0.1);
                    }
                    .nav-btn {
                        background: rgba(255,255,255,0.1);
                    }
                    .event-item {
                        background: rgba(0,0,0,0.3);
                    }
                }
            `}</style>
        </div>
    );
};

export default Calendar;
