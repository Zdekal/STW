/* eslint-disable no-console */
const admin = require("firebase-admin");

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "eventsecurityplanner";

// Inicializace JEN jednou (žádná další initializeApp v ostatních skriptech)
if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`ℹ️ Firestore emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

const db = admin.firestore();

module.exports = { admin, db };
