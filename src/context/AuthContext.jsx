import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import {
    doc,
    setDoc,
    updateDoc,
    increment,
    getDoc,
    serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);

    const provider = new GoogleAuthProvider();

    // Login function
    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            // Optionally, save user to Firestore if new
            const user = result.user;
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    displayName: "", // Don't use Google Name
                    email: user.email,
                    photoURL: "", // Don't use Google Photo
                    createdAt: serverTimestamp(),
                    totalTime: 0
                });
            }
            return user;
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await signOut(auth);
            stopTimer(); // Ensure timer stops
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    // Time Tracking Logic
    const startTimer = (uid) => {
        if (timerRef.current) return; // Already running

        console.log("Starting time tracking for user:", uid);
        timerRef.current = setInterval(async () => {
            if (!uid) return;
            try {
                const userRef = doc(db, 'users', uid);
                // Increment totalTime by 60 seconds (or however often this runs)
                // We'll run it every 1 minute = 60 seconds
                // Use setDoc with merge to ensure document exists if it was somehow deleted
                await setDoc(userRef, {
                    totalTime: increment(60),
                    lastActive: serverTimestamp()
                }, { merge: true });
                console.log("Updated time for user:", uid);
            } catch (error) {
                console.error("Error updating time:", error);
            }
        }, 60000); // 1 minute
    };

    const stopTimer = () => {
        if (timerRef.current) {
            console.log("Stopping time tracking");
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    useEffect(() => {
        console.log("AuthContext: Setting up auth listener...");

        // Safety Fallback: If Firebase takes too long (e.g. offline), stop loading so user can at least see Login screen
        const safetyTimeout = setTimeout(() => {
            if (loading) {
                console.warn("AuthContext: Auth check timed out. Forcing app load.");
                setLoading(false);
            }
        }, 5000);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("AuthContext: Auth State Changed:", user ? "User Logged In" : "User Logged Out");
            clearTimeout(safetyTimeout); // Clear safety timeout since we got a response
            setCurrentUser(user);
            setLoading(false);


            if (user) {
                startTimer(user.uid);
            } else {
                stopTimer();
            }
        });

        // DEEP LINK AUTH LISTENER
        const handleDeepLinkAuth = async (token) => {
            console.log("AuthContext: Received Deep Link Token");
            try {
                const { GoogleAuthProvider, signInWithCredential } = await import('firebase/auth');
                const credential = GoogleAuthProvider.credential(token);
                await signInWithCredential(auth, credential);
                console.log("AuthContext: Deep Link Login Successful");
            } catch (error) {
                console.error("AuthContext: Deep Link Login Failed", error);
            }
        };

        if (window.electronAPI && window.electronAPI.onDeepLinkAuth) {
            window.electronAPI.onDeepLinkAuth(handleDeepLinkAuth);
        } else {
            console.warn("Electron API not available");
        }

        return () => {
            unsubscribe();
            stopTimer();
            if (window.electronAPI && window.electronAPI.removeDeepLinkAuthListener) {
                window.electronAPI.removeDeepLinkAuthListener();
            }
        };
    }, []);

    const value = {
        currentUser,
        loginWithGoogle,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : (
                <div style={{
                    height: '100vh',
                    width: '100vw',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#121212',
                    color: 'white'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(255,255,255,0.3)',
                            borderTop: '3px solid #6366f1',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 20px'
                        }}></div>
                        <p>Initializing App...</p>
                        <style>{`
                            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        `}</style>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
};
