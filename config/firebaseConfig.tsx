// config/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyAQSgGOlkYPPUz8f6_856gnoq93ksb-wRc",
  authDomain: "wishlane-c8b7f.firebaseapp.com",
  projectId: "wishlane-c8b7f",
  storageBucket: "wishlane-c8b7f.firebasestorage.app",
  messagingSenderId: "1045322245921",
  appId: "1:1045322245921:web:713eb3a8e259ede12c8060",
  measurementId: "G-NGBSP2MH3K",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable offline persistence on native; web uses multi-tab manager
export const db = Platform.OS === 'web'
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  : initializeFirestore(app, {
      localCache: persistentLocalCache(),
    });

export const storage = getStorage(app);
export { app };
