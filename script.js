// استيراد Firebase من CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// تهيئة Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC08ihJ4f3arua6_pWyzimT3ndAWPVKjbc",
  authDomain: "yoyo-3b06a.firebaseapp.com",
  projectId: "yoyo-3b06a",
  storageBucket: "yoyo-3b06a.firebasestorage.app",
  messagingSenderId: "942048587610",
  appId: "1:942048587610:web:6118a870029bcb3e198d63",
  measurementId: "G-6MPXNLDKWF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// زر تسجيل الدخول
const btnGoogle = document.getElementById('btnGoogle');
const userInfo = document.getElementById('userInfo');

btnGoogle.addEventListener('click', () => {
  signInWithPopup(auth, provider)
    .then(result => {
      const user = result.user;
      userInfo.innerHTML = `
        <p>مرحباً ${user.displayName}</p>
        <img src="${user.photoURL}" width="50">
      `;
    })
    .catch(err => console.error(err));
});

// متابعة تسجيل الدخول عند فتح الصفحة
onAuthStateChanged(auth, user => {
  if(user){
    userInfo.innerHTML = `
      <p>مرحباً ${user.displayName}</p>
      <img src="${user.photoURL}" width="50">
    `;
  }
});
