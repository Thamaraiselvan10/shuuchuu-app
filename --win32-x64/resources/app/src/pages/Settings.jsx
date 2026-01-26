import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

const Settings = () => {
    const { settings, updateSettings } = useSettings();
    const { theme, setTheme } = useTheme();

    const handleTimerChange = (key, value) => {
        updateSettings({
            timer: {
                ...settings.timer,
                [key]: parseInt(value) || 0
            }
        });
    };

    const handleExport = async () => {
        if (window.electronAPI) {
            await window.electronAPI.invoke('db-backup');
            alert('Backup saved!');
        } else {
            const data = localStorage.getItem('diary_entries');
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'diary_backup.json';
            a.click();
        }
    };

    const handleImport = async () => {
        if (confirm('Restoring will overwrite current data. Continue?')) {
            if (window.electronAPI) {
                await window.electronAPI.invoke('db-restore');
                alert('Data restored! Please restart the app.');
            } else {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        localStorage.setItem('diary_entries', event.target.result);
                        alert('Data restored! Please refresh the page.');
                    };
                    reader.readAsText(file);
                };
                input.click();
            }
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '30px', color: 'var(--primary-color)' }}>Settings</h1>

            <div style={{ display: 'grid', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '25px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem' }}>Appearance</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <label style={{ fontWeight: 600 }}>Theme:</label>
                        <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            className="theme-select"
                        >
                            <option value="system">System Default</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '25px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem' }}>Timer Settings (minutes)</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                        <Input
                            label="Focus Duration"
                            type="number"
                            value={settings.timer.focus}
                            onChange={(e) => handleTimerChange('focus', e.target.value)}
                        />
                        <Input
                            label="Short Break"
                            type="number"
                            value={settings.timer.shortBreak}
                            onChange={(e) => handleTimerChange('shortBreak', e.target.value)}
                        />
                        <Input
                            label="Long Break"
                            type="number"
                            value={settings.timer.longBreak}
                            onChange={(e) => handleTimerChange('longBreak', e.target.value)}
                        />
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '25px' }}>
                    <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.2rem' }}>Data Management</h2>
                    <p style={{ marginBottom: '20px', color: 'var(--text-color)', opacity: 0.8 }}>
                        Backup your data to a JSON file or restore from a previous backup.
                    </p>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <Button onClick={handleExport}>Export Data</Button>
                        <Button onClick={handleImport} variant="secondary">Import Data</Button>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '25px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: 'var(--primary-color)' }}>Developer Info</h3>
                    <p style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '15px' }}>Thamaraiselvan S</p>

                    <div className="social-links">
                        <a href="https://www.linkedin.com/in/thamarai-selvan-15765a2a2" target="_blank" rel="noopener noreferrer" className="social-icon" title="LinkedIn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                        </a>
                        <a href="" target="_blank" rel="noopener noreferrer" className="social-icon" title="Instagram">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        </a>
                        <a href="#" target="_blank" rel="noopener noreferrer" className="social-icon" title="Profile">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </a>
                        <a href="https://github.com/Thamaraiselvan10" target="_blank" rel="noopener noreferrer" className="social-icon" title="GitHub">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                        </a>
                    </div>
                </div>
            </div>

            <style>{`
                .theme-select {
                    padding: 10px 16px;
                    border-radius: 12px;
                    border: 2px solid transparent;
                    background: rgba(255, 255, 255, 0.5);
                    font-family: inherit;
                    font-size: 1rem;
                    color: var(--text-color);
                    cursor: pointer;
                    outline: none;
                    transition: all 0.3s ease;
                }
                .theme-select:focus {
                    background: rgba(255, 255, 255, 0.8);
                    border-color: var(--primary-color);
                }
                [data-theme='dark'] .theme-select {
                    background: rgba(0, 0, 0, 0.2);
                }
                [data-theme='dark'] .theme-select:focus {
                    background: rgba(0, 0, 0, 0.4);
                }
                
                .social-links {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 10px;
                }
                
                .social-icon {
                    color: var(--text-color);
                    opacity: 0.7;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px;
                    border-radius: 50%;
                    background: rgba(0,0,0,0.05);
                }
                
                .social-icon:hover {
                    opacity: 1;
                    color: var(--primary-color);
                    background: rgba(255,255,255,0.5);
                    transform: translateY(-3px);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                }
            `}</style>
        </div>
    );
};

export default Settings;
