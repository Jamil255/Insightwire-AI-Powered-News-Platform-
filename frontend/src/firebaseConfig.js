// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlUpAmnjqVmMkd2PFIWvcXMhJ2v7sUa3c",
  authDomain: "insightwire-f8b50.firebaseapp.com",
  projectId: "insightwire-f8b50",
  storageBucket: "insightwire-f8b50.firebasestorage.app",
  messagingSenderId: "626923372027",
  appId: "1:626923372027:web:b2c95a65bea09d213c5f5e",
  measurementId: "G-Z4JP7QHZYH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export authentication module to use for OTP and other auth operations
export const auth = getAuth(app);

export default app;
