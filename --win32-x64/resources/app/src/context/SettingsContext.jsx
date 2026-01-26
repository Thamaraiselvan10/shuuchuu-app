import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('app-settings');
        return saved ? JSON.parse(saved) : {
            timer: {
                focus: 25,
                shortBreak: 5,
                longBreak: 15
            },
            soundEnabled: true,
            notificationsEnabled: true
        };
    });

    useEffect(() => {
        localStorage.setItem('app-settings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
