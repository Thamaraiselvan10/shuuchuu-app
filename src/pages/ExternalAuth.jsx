import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// This component is DETACHED from the main app flow.
// It is intended to be opened in a REAL browser (Chrome/Edge), not Electron.
const ExternalAuth = () => {
    const [status, setStatus] = useState('Initializing...');
    const [error, setError] = useState(null);
    const [authToken, setAuthToken] = useState(null);

    useEffect(() => {
        const performAuth = async () => {
            try {
                setStatus('Opening Google Sign-In...');
                const provider = new GoogleAuthProvider();

                // This popup will open in the SAME browser window (as a tab) or new window
                const result = await signInWithPopup(auth, provider);

                // Get the ID Token
                setStatus('Login Successful!');

                // IMPORTANT: We need the GOOGLE ID Token, not the Firebase ID Token
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.idToken;
                setAuthToken(token);

                // Try automatic redirect with a slight delay to allow UI to update
                setTimeout(() => {
                    window.location.href = `focusbro://auth/callback?token=${token}`;
                }, 500);

                setStatus('Login Successful! Redirecting...');

            } catch (err) {
                console.error(err);
                setError(err.message);
                setStatus('Login Failed.');
            }
        };

        performAuth();
    }, []);

    const handleOpenApp = () => {
        if (authToken) {
            window.location.href = `focusbro://auth/callback?token=${authToken}`;
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#121212',
            color: 'white',
            fontFamily: 'sans-serif'
        }}>
            <h1>Shuuchuu - Secure Login</h1>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>
                    {status === 'Login Failed.' ? 'Please try again if the prompt did not appear.' : status}
                </p>

                {authToken && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <p style={{ color: '#aaa', maxWidth: '300px' }}>
                            Chrome may block the automatic redirect. Click the button below to open the app manually.
                        </p>
                        <button
                            onClick={handleOpenApp}
                            style={{
                                marginTop: '10px',
                                padding: '16px 32px',
                                backgroundColor: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1.2rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                                transition: 'transform 0.2s',
                            }}
                            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            Open Shuuchuu App
                        </button>
                    </div>
                )}
            </div>

            <p style={{ marginTop: '30px', fontSize: '0.8rem', color: '#888' }}>
                {authToken ? 'You can close this tab after opening the app.' : 'Please wait for authentication...'}
            </p>
        </div>
    );
};

export default ExternalAuth;
