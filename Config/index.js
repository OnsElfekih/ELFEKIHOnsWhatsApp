// Import the functions you need from the SDKs you need
import app from "firebase/compat/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import "firebase/compat/auth";
import "firebase/compat/database";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDakqxFZ-aEcymJSKbO1neQWHl7Lgka-s8",
  authDomain: "mobilewhatup-95fc7.firebaseapp.com",
  projectId: "mobilewhatup-95fc7",
  storageBucket: "mobilewhatup-95fc7.firebasestorage.app",
  messagingSenderId: "916616845921",
  appId: "1:916616845921:web:a66cc5ae94655166fc6820"
};

// Initialize Firebase
const firebase = app.initializeApp(firebaseConfig);
export default firebase;