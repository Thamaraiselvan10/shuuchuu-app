import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_TIMES = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
};

export const useTimer = () => {
    const [mode, setMode] = useState('focus'); // focus, shortBreak, longBreak
    const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMES.focus);
    const [isActive, setIsActive] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const startTimeRef = useRef(null);
    const [durations, setDurations] = useState(DEFAULT_TIMES);

    // Load settings on mount and when mode changes (to ensure fresh settings)
    useEffect(() => {
        const savedSettings = localStorage.getItem('app-settings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            if (parsed.timer) {
                setDurations({
                    focus: parsed.timer.focus * 60,
                    shortBreak: parsed.timer.shortBreak * 60,
                    longBreak: parsed.timer.longBreak * 60
                });

                // Only update time left if timer is NOT active to avoid jumping
                if (!isActive) {
                    const newDuration = parsed.timer[mode] * 60;
                    setTimeLeft(newDuration);
                }
            }
        }
    }, [mode, isActive]);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            handleTimerComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleTimerComplete = async () => {
        setIsActive(false);
        // Play sound
        new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(e => console.error(e));

        // Show notification via IPC
        if (window.electronAPI && window.electronAPI.invoke) {
            window.electronAPI.invoke('show-notification', {
                title: 'Timer Complete',
                body: `${mode === 'focus' ? 'Focus session' : 'Break'} finished!`
            });
        }

        // Log session if it was focus mode
        if (mode === 'focus' && sessionId) {
            await logSession(sessionId, new Date().toISOString(), durations.focus / 60);
        }

        // Simple auto-switch logic:
        if (mode === 'focus') setMode('shortBreak');
        else setMode('focus');
    };

    const startTimer = () => {
        if (!isActive) {
            setIsActive(true);
            if (mode === 'focus' && !sessionId) {
                setSessionId(uuidv4());
                startTimeRef.current = new Date().toISOString();
            }
        }
    };

    const pauseTimer = () => {
        setIsActive(false);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(durations[mode]);
        setSessionId(null);
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        // We need to fetch the latest duration for this mode
        // The useEffect will handle updating timeLeft, but we can do it here too for immediate feedback
        // However, relying on the useEffect above is safer for sync
    };

    const logSession = async (id, endTime, duration) => {
        try {
            const session = {
                id,
                task_id: null, // TODO: Link to task
                start_at: startTimeRef.current,
                end_at: endTime,
                duration_minutes: duration,
                interrupted: 0,
                type: 'focus'
            };

            const sql = `INSERT INTO pomodoro_sessions (id, task_id, start_at, end_at, duration_minutes, interrupted, type) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            if (window.electronAPI) {
                await window.electronAPI.dbQuery(sql, [
                    session.id, session.task_id, session.start_at, session.end_at, session.duration_minutes, session.interrupted, session.type
                ]);
            }

        } catch (err) {
            console.error('Failed to log session', err);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return {
        mode,
        timeLeft,
        isActive,
        startTimer,
        pauseTimer,
        resetTimer,
        switchMode,
        formatTime
    };
};
