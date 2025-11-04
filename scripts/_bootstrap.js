// scripts/_bootstrap.js
const admin = require("firebase-admin");

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "eventsecurityplanner";

// U emulátoru stačí projectId; když běžíš na produkci, admin si načte default cred.
if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}

if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`ℹ️ Běží proti emulátoru Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

const db = admin.firestore();

module.exports = { admin, db };
