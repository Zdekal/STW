// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence, connectAuthEmulator } from "firebase/auth";
import { initializeFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const LOCAL_MODE = String(process.env.REACT_APP_LOCAL_MODE || "").toLowerCase() === "true";

// top-level proměnné + exporty (tady žádné if)
let app = null, auth = null, db = null, storage = null;

if (LOCAL_MODE) {
  console.warn("[firebase] Local mode aktivní – Firebase se neinicializuje.");
} else {
  const firebaseConfig = {
    apiKey: "AIzaSyCM3I_qTPaEsrZVjtNZjOXn3qF4dq0mWKE",
    authDomain: "eventsecurityplanner.firebaseapp.com",
    projectId: "eventsecurityplanner",
    storageBucket: "eventsecurityplanner.firebasestorage.app",
    messagingSenderId: "124730808517",
    appId: "1:124730808517:web:ddb6302aee24c1508d78ac",
  };

  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Standardní inicializace bez zastaralých forceLongPolling obskurností,
  // které mohou způsobovat WebChannelConnections errory:
  db = initializeFirestore(app, {});
  storage = getStorage(app);

  setPersistence(auth, browserLocalPersistence).catch(() => { });

  const useEmu = String(process.env.REACT_APP_USE_EMULATORS || "").toLowerCase() === "true";
  if (useEmu) {
    console.info("[firebase] Using EMULATORS (Auth:9099, Firestore:8080, Storage:9199)");
    try { connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true }); } catch { }
    try { connectFirestoreEmulator(db, "localhost", 8080); } catch { }
    try { connectStorageEmulator(storage, "localhost", 9199); } catch { }
  } else {
    console.info("[firebase] Using PROD services");
  }
}

export { app, auth, db, storage };
export default {};
