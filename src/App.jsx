import React, { Suspense, lazy } from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { TimerProvider } from './context/TimerContext'
import { ProfileProvider } from './context/ProfileContext'
import { ThemeProvider } from './context/ThemeContext'
import { SettingsProvider } from './context/SettingsContext'
import { GoalsProvider } from './context/GoalsContext'
import { ToastProvider } from './context/ToastContext'
import { TasksProvider } from './context/TasksContext'
import { HabitsProvider } from './context/HabitsContext'

import Layout from './layouts/Layout'

import AlarmManager from './components/AlarmManager';

// Static imports for pre-loading - Reverted for smoother UX
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Timer from './pages/Timer';
import Alarms from './pages/Alarms';
import Calendar from './pages/Calendar';
import Diary from './pages/Diary';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Goals from './pages/Goals';
import GoalDetails from './pages/GoalDetails';
import Habits from './pages/Habits';
import Notes from './pages/Notes';
import Wellness from './pages/Wellness';
import MiniTimer from './pages/MiniTimer';

// Navigation Handler Component
// Ensures robust navigation when restoring from Mini Mode
import { useNavigate } from 'react-router-dom';

const NavigationHandler = ({ isMiniMode, prevMiniModeRef }) => {
    const navigate = useNavigate();

    React.useEffect(() => {
        // If we transitioned from Mini (true) to Normal (false)
        if (prevMiniModeRef.current === true && isMiniMode === false) {
            console.log("Restoring from Mini Mode -> Navigating to /focus");
            // Add slight delay to ensure Router is ready
            setTimeout(() => {
                navigate('/focus');
            }, 100);
        }
        // Update ref
        prevMiniModeRef.current = isMiniMode;
    }, [isMiniMode, navigate, prevMiniModeRef]);

    return null;
};

import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import ExternalAuth from './pages/ExternalAuth'
import RequireAuth from './components/RequireAuth'

function App() {
    const [isMiniMode, setIsMiniMode] = React.useState(false);
    const prevMiniModeRef = React.useRef(false);

    React.useEffect(() => {
        const handleMiniModeChange = (isMini) => {
            setIsMiniMode(isMini);
        };

        if (window.electronAPI?.onMiniModeChange) {
            window.electronAPI.onMiniModeChange(handleMiniModeChange);
        }

        // Check initial state
        if (window.electronAPI?.getMiniMode) {
            window.electronAPI.getMiniMode().then(isMini => {
                setIsMiniMode(isMini);
            });
        }
    }, []);

    return (
        <ThemeProvider>
            <SettingsProvider>
                <TimerProvider>
                    <ProfileProvider>
                        <GoalsProvider>
                            <ToastProvider>
                                <AuthProvider>
                                    <TasksProvider>
                                        <HabitsProvider>
                                            <AlarmManager />
                                            <Router>
                                                {/* Helper to handle navigation logic inside Router context - MUST BE ALWAYS MOUNTED */}
                                                <NavigationHandler isMiniMode={isMiniMode} prevMiniModeRef={prevMiniModeRef} />

                                                {isMiniMode ? (
                                                    <MiniTimer />
                                                ) : (
                                                    <Routes>
                                                        <Route path="/login" element={<Login />} />
                                                        <Route path="/external-auth" element={<ExternalAuth />} />
                                                        <Route path="/" element={
                                                            <RequireAuth>
                                                                <Layout />
                                                            </RequireAuth>
                                                        }>
                                                            <Route index element={<Dashboard />} />
                                                            <Route path="tasks" element={<Tasks />} />
                                                            <Route path="goals" element={<Goals />} />
                                                            <Route path="goals/:id" element={<GoalDetails />} />
                                                            <Route path="calendar" element={<Calendar />} />
                                                            <Route path="diary" element={<Diary />} />
                                                            <Route path="alarms" element={<Alarms />} />
                                                            <Route path="focus" element={<Timer />} />
                                                            <Route path="habits" element={<Habits />} />
                                                            <Route path="notes" element={<Notes />} />
                                                            <Route path="wellness" element={<Wellness />} />
                                                            <Route path="settings" element={<Settings />} />
                                                            <Route path="profile" element={<Profile />} />
                                                        </Route>
                                                    </Routes>
                                                )}
                                            </Router>
                                        </HabitsProvider>
                                    </TasksProvider>
                                </AuthProvider>
                            </ToastProvider>
                        </GoalsProvider>
                    </ProfileProvider>
                </TimerProvider>
            </SettingsProvider>
        </ThemeProvider>
    )
}

export default App
