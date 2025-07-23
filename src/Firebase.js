// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBPus6EJkzdP8wkqhyb_sT6k7_-z6dgxIw",
  authDomain: "volleyball-track.firebaseapp.com",
  databaseURL: "https://volleyball-track-default-rtdb.firebaseio.com",
  projectId: "volleyball-track",
  storageBucket: "volleyball-track.firebasestorage.app",
  messagingSenderId: "890904526464",
  appId: "1:890904526464:web:5e98f1f284d07cd4b37065",
  measurementId: "G-G7L7EQ33HC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };