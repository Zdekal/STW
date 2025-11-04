// src/firebase.js
// Jediný zdroj pravdy pro Firebase inicializaci v celé appce.

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  connectAuthEmulator,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// --- Načtení configu z .env ---
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// --- Bezpečná kontrola env v devu (pomáhá chytit překlep v .env) ---
if (
  process.env.NODE_ENV !== "production" &&
  Object.values(firebaseConfig).some((v) => !v)
) {
  // V dev režimu vyhoď jasnou chybu, ať víš, co chybí.
  // (V produkci to necháme být, třeba načítáš runtime proměnné jinak.)
  throw new Error(
    `[firebase] Chybí některé REACT_APP_FIREBASE_* proměnné v .env.
Zkontroluj:
  REACT_APP_FIREBASE_API_KEY
  REACT_APP_FIREBASE_AUTH_DOMAIN
  REACT_APP_FIREBASE_PROJECT_ID
  REACT_APP_FIREBASE_STORAGE_BUCKET
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID
  REACT_APP_FIREBASE_APP_ID`
  );
}

// --- Singleton inicializace (zabrání 'already exists' chybám) ---
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- Služby ---
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Perzistence (zůstaneš přihlášený po reloadu)
setPersistence(auth, browserLocalPersistence).catch(() => {
  /* ignore, fallback default */
});

// --- Emulátory (zapni přes REACT_APP_USE_EMULATORS=true) ---
const useEmu = String(process.env.REACT_APP_USE_EMULATORS).toLowerCase() === "true";
if (useEmu) {
  // Pozn.: použij 127.0.0.1 místo "localhost", ať máš méně CORS/hSTS problémů.
  try {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  } catch {}
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  } catch {}
  try {
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  } catch {}
}
