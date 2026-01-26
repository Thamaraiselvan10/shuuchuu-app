import React from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { SettingsProvider } from './context/SettingsContext'
import Layout from './layouts/Layout'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Timer from './pages/Timer'
import Alarms from './pages/Alarms'
import Calendar from './pages/Calendar'
import Diary from './pages/Diary'
import Settings from './pages/Settings'
import AlarmManager from './components/AlarmManager';

function App() {
    return (
        <ThemeProvider>
            <SettingsProvider>
                <AlarmManager />
                <Router>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="tasks" element={<Tasks />} />
                            <Route path="calendar" element={<Calendar />} />
                            <Route path="diary" element={<Diary />} />
                            <Route path="alarms" element={<Alarms />} />
                            <Route path="timer" element={<Timer />} />
                            <Route path="settings" element={<Settings />} />
                        </Route>
                    </Routes>
                </Router>
            </SettingsProvider>
        </ThemeProvider>
    )
}

export default App
