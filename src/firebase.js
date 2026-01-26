import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCoMwCR7qAxDN5pzhuYs8GcAY6UMu2h8-U",
    authDomain: "focus-bro.firebaseapp.com",
    projectId: "focus-bro",
    storageBucket: "focus-bro.firebasestorage.app",
    messagingSenderId: "615574208944",
    appId: "1:615574208944:web:dfd6f4877365f007345675",
    measurementId: "G-NZXZGVJNDJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
