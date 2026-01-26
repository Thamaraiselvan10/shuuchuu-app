import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { taskService } from '../services/taskService';
import { format, subDays, isAfter, parseISO } from 'date-fns';

const Dashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [focusHistory, setFocusHistory] = useState([]);
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        totalFocusMinutes: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allTasks = await taskService.getAll();
            setTasks(allTasks);

            // Calculate Task Stats
            const completed = allTasks.filter(t => t.status === 'completed').length;
            const pending = allTasks.filter(t => t.status === 'pending').length;
            setStats(prev => ({
                ...prev,
                totalTasks: allTasks.length,
                completedTasks: completed,
                pendingTasks: pending
            }));

            // Load Focus History (Mock data for now, replace with actual DB call if available)
            // In a real app, we'd query the pomodoro_sessions table.
            // For now, let's simulate "Last 7 Days" data or fetch if available.
            if (window.electronAPI) {
                const sessions = await window.electronAPI.dbQuery('SELECT * FROM pomodoro_sessions');
                processFocusHistory(sessions);
            }

        } catch (err) {
            console.error('Failed to load dashboard data', err);
        }
    };

    const processFocusHistory = (sessions) => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(new Date(), 6 - i);
            return format(d, 'yyyy-MM-dd');
        });

        const historyMap = {};
        last7Days.forEach(date => historyMap[date] = 0);

        if (sessions && Array.isArray(sessions)) {
            sessions.forEach(session => {
                const date = session.start_at.split('T')[0];
                if (historyMap.hasOwnProperty(date)) {
                    historyMap[date] += session.duration_minutes;
                }
            });
        }

        const data = last7Days.map(date => ({
            date: format(parseISO(date), 'MMM dd'),
            minutes: Math.round(historyMap[date])
        }));

        setFocusHistory(data);

        const totalMinutes = sessions ? sessions.reduce((acc, curr) => acc + curr.duration_minutes, 0) : 0;
        setStats(prev => ({ ...prev, totalFocusMinutes: Math.round(totalMinutes) }));
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Dashboard</h1>

            <div className="stats-grid">
                <div className="stat-card glass-panel">
                    <h3>Total Tasks</h3>
                    <div className="stat-value">{stats.totalTasks}</div>
                </div>
                <div className="stat-card glass-panel">
                    <h3>Completed</h3>
                    <div className="stat-value text-success">{stats.completedTasks}</div>
                </div>
                <div className="stat-card glass-panel">
                    <h3>Pending</h3>
                    <div className="stat-value text-warning">{stats.pendingTasks}</div>
                </div>
                <div className="stat-card glass-panel">
                    <h3>Focus Time</h3>
                    <div className="stat-value text-primary">{Math.floor(stats.totalFocusMinutes / 60)}h {stats.totalFocusMinutes % 60}m</div>
                </div>
            </div>

            <div className="charts-container">
                <div className="chart-wrapper glass-panel">
                    <h3>Focus History (Last 7 Days)</h3>
                    <div style={{ width: '100%', height: 250, flex: 1 }}>
                        <ResponsiveContainer>
                            <BarChart data={focusHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--text-color)" tick={{ fill: 'var(--text-color)', fontSize: 12 }} />
                                <YAxis stroke="var(--text-color)" tick={{ fill: 'var(--text-color)', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', border: 'none', color: '#333' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                />
                                <Bar dataKey="minutes" fill="var(--primary-color)" radius={[4, 4, 0, 0]} name="Minutes Focused" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-wrapper glass-panel">
                    <h3>Task Completion</h3>
                    <div style={{ width: '100%', height: 250, flex: 1 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Completed', value: stats.completedTasks },
                                        { name: 'Pending', value: stats.pendingTasks }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell key="cell-0" fill="var(--secondary-color)" />
                                    <Cell key="cell-1" fill="#FFBB28" />
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '8px', border: 'none', color: '#333' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-container {
                    padding: 20px;
                    overflow-y: auto;
                    height: calc(100vh - 80px); /* Adjusted for header */
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .dashboard-title {
                    margin-bottom: 10px;
                    color: var(--primary-color);
                    font-size: 2rem;
                    font-weight: 800;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr); /* Force 4 columns */
                    gap: 15px;
                    margin-bottom: 10px;
                }

                .stat-card {
                    padding: 15px;
                    border-radius: 16px;
                    text-align: center;
                    transition: transform 0.2s;
                }

                .stat-card:hover {
                    transform: translateY(-3px);
                }

                .stat-card h3 {
                    margin: 0 0 5px 0;
                    font-size: 0.9rem;
                    color: var(--text-color);
                    opacity: 0.7;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--text-color);
                }

                .text-success { color: var(--secondary-color); }
                .text-warning { color: #FFBB28; }
                .text-primary { color: var(--primary-color); }

                .charts-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr; /* Two columns side by side */
                    gap: 20px;
                    flex: 1; /* Take remaining space */
                    min-height: 0;
                }

                .chart-wrapper {
                    padding: 15px;
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                }

                .chart-wrapper h3 {
                    margin-bottom: 15px;
                    text-align: center;
                    color: var(--text-color);
                    font-size: 1.1rem;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
