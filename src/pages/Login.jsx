import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
    const { loginWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = React.useState('');

    // Redirect if already logged in
    React.useEffect(() => {
        if (currentUser) {
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [currentUser, navigate, location]);

    const handleLogin = async () => {
        setError('');
        try {
            // OPEN SYSTEM BROWSER for Secure Login
            // This bypasses the "Secure Browser" error by using the real Chrome/Edge
            // Use exposed API from preload.js
            if (window.electronAPI) {
                window.electronAPI.openExternal('https://focus-bro.web.app/#/external-auth');
            } else {
                console.error("electronAPI is not defined. Preload failed?");
                // Fallback for debugging (this will fail if no node integrations, but good to try or just error out)
                throw new Error("Application Bridge missing. Please restart the app.");
            }

            // We don't await anything here because the user completes login in the other window.
            // The app will wait for the IPC message to complete login.
        } catch (error) {
            console.error("Failed to open external login", error);
            setError('Failed to open browser: ' + error.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass-panel">
                <div className="logo-section">
                    <div className="logo-glow"></div>
                    <div className="app-logo">SC</div>
                </div>

                <h1 className="app-title">Shuuchuu</h1>
                <p className="app-tagline">Master your time, master your life.</p>

                <div className="login-content">
                    <p className="login-msg">Welcome back! Please sign in to continue.</p>

                    {error && <div className="error-banner">{error}</div>}

                    <button
                        onClick={handleLogin}
                        className="google-btn"
                    >
                        <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            alt="Google"
                            className="google-icon"
                        />
                        <span>Sign in with Google</span>
                        <div className="btn-shine"></div>
                    </button>

                    {/* Debug Info Removed */}

                    <p className="secure-note">
                        <span className="lock-icon">🔒</span> Secure Authentication via Firebase
                    </p>
                </div>
            </div>

            <style>{`
                .login-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    width: 100vw;
                    background: radial-gradient(circle at 50% 10%, #2a2d3e 0%, #121212 100%);
                    position: relative;
                    overflow: hidden;
                }

                /* Animated Background Blobs */
                .login-container::before, .login-container::after {
                    content: '';
                    position: absolute;
                    width: 300px;
                    height: 300px;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.4;
                    animation: float 10s infinite alternate;
                }
                
                .login-container::before {
                    background: var(--primary-color, #6366f1);
                    top: 10%;
                    left: 20%;
                    animation-delay: 0s;
                }
                
                .login-container::after {
                    background: #8b5cf6;
                    bottom: 10%;
                    right: 20%;
                    animation-delay: -5s;
                }

                @keyframes float {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(30px, 50px) scale(1.1); }
                }

                .login-card {
                    width: 100%;
                    max-width: 420px;
                    padding: 40px;
                    border-radius: 24px;
                    background: rgba(30, 32, 45, 0.4);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    text-align: center;
                    position: relative;
                    z-index: 10;
                    margin: 20px;
                }

                .logo-section {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .logo-glow {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: var(--primary-color, #6366f1);
                    border-radius: 50%;
                    filter: blur(20px);
                    opacity: 0.5;
                    animation: pulse 3s infinite;
                }

                .app-logo {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, var(--primary-color, #6366f1), #8b5cf6);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.8rem;
                    font-weight: 900;
                    color: white;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                    transform: rotate(-5deg);
                }

                @keyframes pulse {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.1); }
                }

                .app-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    margin: 0 0 10px 0;
                    background: linear-gradient(to right, #fff, #a5b4fc);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: 2px;
                    font-family: 'Monoton', cursive;
                    font-weight: 400;
                }

                .app-tagline {
                    color: rgba(255, 255, 255, 0.6);
                    margin: 0 0 40px 0;
                    font-size: 1rem;
                }

                .login-content {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .error-banner {
                    background: rgba(255, 77, 77, 0.2);
                    border: 1px solid rgba(255, 77, 77, 0.5);
                    color: #ffcccc;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    text-align: left;
                }

                .google-btn {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 14px 24px;
                    background: white;
                    color: #333;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    overflow: hidden;
                    gap: 12px;
                    width: 100%;
                }

                .google-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                    background: #f8f9fa;
                }

                .google-btn:active {
                    transform: translateY(1px);
                }

                .google-icon {
                    width: 24px;
                    height: 24px;
                }

                .btn-shine {
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 50%;
                    height: 100%;
                    background: linear-gradient(
                        120deg,
                        transparent,
                        rgba(255,255,255,0.4),
                        transparent
                    );
                    transition: all 0.6s;
                }

                .google-btn:hover .btn-shine {
                    left: 200%;
                    transition: 0.6s;
                }

                .secure-note {
                    color: rgba(255, 255, 255, 0.4);
                    font-size: 0.8rem;
                    margin-top: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                }

                .lock-icon {
                    font-size: 0.9rem;
                }
            `}</style>
        </div>
    );
};

export default Login;
