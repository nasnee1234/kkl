import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBs1VLYTEV-vUCvI-OLmoM66DFhPn_K29k",
  authDomain: "kkl1-66a9e.firebaseapp.com",
  projectId: "kkl1-66a9e",
  storageBucket: "kkl1-66a9e.firebasestorage.app",
  messagingSenderId: "962313536294",
  appId: "1:962313536294:web:c18766283aa5460cb937e7",
  measurementId: "G-7NB2ZE0WYJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
