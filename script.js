// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC08ihJ4f3arua6_pWyzimT3ndAWPVKjbc",
  authDomain: "yoyo-3b06a.firebaseapp.com",
  projectId: "yoyo-3b06a",
  storageBucket: "yoyo-3b06a.firebasestorage.app",
  messagingSenderId: "942048587610",
  appId: "1:942048587610:web:d14af13e481ed44b198d63",
  measurementId: "G-D99SSSVG7F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

