// config/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAQgG0lkYYPUz8f6_856gnoq93ksb-wRc",
  authDomain: "wishlane-c8b7f.firebaseapp.com",
  projectId: "wishlane-c8b7f",
  storageBucket: "wishlane-c8b7f.appspot.com",
  messagingSenderId: "1045322245921",
  appId: "1:1045322245921:web:713eb3a8e259ede12c8060",
  measurementId: "G-NGBSP2MH3K",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };


