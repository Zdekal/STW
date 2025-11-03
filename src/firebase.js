// Jediný zdroj pravdy pro Firebase v appce (modular SDK)
import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator
} from "firebase/firestore";
import {
  getFunctions,
  connectFunctionsEmulator
} from "firebase/functions";
import {
  getStorage,
  connectStorageEmulator
} from "firebase/storage";

// Konfigurace z .env (v CRA musí mít prefix REACT_APP_)
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID
};

// Inicializace
export const app = initializeApp(firebaseConfig);

// Služby
export const auth = getAuth(app);
export const db = getFirestore(app);
// Functions region nechávám default (us-central1), stejný používá emulator.
// Pokud nasazuješ do EU regionu, změň zde (např. "europe-west1").
export const fns = getFunctions(app /*, "us-central1"*/);
export const storage = getStorage(app);

// Emulátory – zapni proměnnou REACT_APP_USE_EMULATORS=1 (např. ve start skriptu)
const usingEmulators =
  (process.env.REACT_APP_USE_EMULATORS === "1") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost");

if (usingEmulators) {
  // Auth
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  // Firestore
  connectFirestoreEmulator(db, "localhost", 8080);
  // Functions
  connectFunctionsEmulator(fns, "localhost", 5001);
  // Storage
  connectStorageEmulator(storage, "localhost", 9199);
}

// Volitelné: jazykové nastavení pro Auth (e-maily apod.)
// auth.useDeviceLanguage();
