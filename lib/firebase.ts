// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

  //  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  // authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  // appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};
// // 🔥 DEBUG (VERY IMPORTANT)
// console.log("🔥 Firebase Config Loaded:", firebaseConfig);

// // Prevent empty config crash
// if (!firebaseConfig.apiKey) {
//   throw new Error("Firebase API Key is missing!");
// }

// const app = getApps().length ? getApps() : initializeApp(firebaseConfig);

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;