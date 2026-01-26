import React from 'react';
import { useTimer } from '../hooks/useTimer';
import Button from '../components/Button';
import Card from '../components/Card';

const Timer = () => {
    const { mode, timeLeft, isActive, startTimer, pauseTimer, resetTimer, switchMode, formatTime } = useTimer();

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h1>Pomodoro Timer</h1>

            <Card className="timer-card">
                <div className="timer-modes">
                    <Button
                        variant={mode === 'focus' ? 'primary' : 'secondary'}
                        onClick={() => switchMode('focus')}
                    >
                        Focus
                    </Button>
                    <Button
                        variant={mode === 'shortBreak' ? 'primary' : 'secondary'}
                        onClick={() => switchMode('shortBreak')}
                        style={{ margin: '0 10px' }}
                    >
                        Short Break
                    </Button>
                    <Button
                        variant={mode === 'longBreak' ? 'primary' : 'secondary'}
                        onClick={() => switchMode('longBreak')}
                    >
                        Long Break
                    </Button>
                </div>

                <div className="timer-display" style={{ fontSize: '6rem', fontWeight: 'bold', margin: '40px 0', fontFamily: 'monospace' }}>
                    {formatTime(timeLeft)}
                </div>

                <div className="timer-controls">
                    {!isActive ? (
                        <Button onClick={startTimer} style={{ fontSize: '1.2rem', padding: '10px 30px' }}>Start</Button>
                    ) : (
                        <Button onClick={pauseTimer} variant="secondary" style={{ fontSize: '1.2rem', padding: '10px 30px' }}>Pause</Button>
                    )}
                    <Button onClick={resetTimer} variant="danger" style={{ marginLeft: '15px' }}>Reset</Button>
                </div>
            </Card>

            <div style={{ marginTop: '30px' }}>
                <h3>Today's Focus</h3>
                {/* Placeholder for session history */}
                <p>Session history will appear here.</p>
            </div>
        </div>
    );
};

export default Timer;
