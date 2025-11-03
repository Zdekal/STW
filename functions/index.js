// functions/index.js
// Node: 20+ (nebo 22), firebase-functions v4+
// Callable endpoint: adminCreateUser
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

setGlobalOptions({ region: "us-central1", maxInstances: 10 });
admin.initializeApp();

const db = admin.firestore();

/** Zjistí, zda volající je admin (custom claim nebo dokument v /admins/{uid}) */
async function isAdminRequest(context) {
  const uid = context?.auth?.uid;
  if (!uid) return false;
  if (context.auth.token?.admin === true) return true;
  // allowlist přes Firestore
  const doc = await db.doc(`admins/${uid}`).get();
  return doc.exists === true;
}

/**
 * Vytvoření uživatele s rolí (member/manager/admin),
 * zápis profilu do /users/{uid} a vrácení reset-linku (aby si nastavil heslo).
 */
exports.adminCreateUser = onCall(async (request) => {
  const context = request;
  if (!(await isAdminRequest(context))) {
    throw new HttpsError("permission-denied", "Only admins can create users.");
  }

  const data = request.data || {};
  const email = (data.email || "").trim().toLowerCase();
  const password = data.password || ""; // můžeš poslat prázdné => pošleme reset link
  const displayName = (data.displayName || "").trim();
  const role = (data.role || "member").toLowerCase();

  if (!email) throw new HttpsError("invalid-argument", "Email is required.");
  if (!["member", "manager", "admin"].includes(role)) {
    throw new HttpsError("invalid-argument", "Invalid role.");
  }

  // už existuje?
  try {
    const existing = await admin.auth().getUserByEmail(email);
    if (existing) throw new HttpsError("already-exists", "User already exists.");
  } catch (e) {
    // pokud getUserByEmail hodí 'auth/user-not-found', je to v pořádku – pokračujeme
    if (e.code && e.code !== "auth/user-not-found") throw e;
  }

  // vytvoř uživatele
  const user = await admin.auth().createUser({
    email,
    password: password || undefined, // když nedáš, použijeme reset link
    displayName: displayName || undefined,
    disabled: false,
    emailVerified: false,
  });

  // nastav custom claims
  const claims = { role, [role]: true };
  if (role === "admin") claims.admin = true;
  await admin.auth().setCustomUserClaims(user.uid, claims);

  // profil ve Firestore
  await db.doc(`users/${user.uid}`).set({
    email,
    displayName: displayName || "",
    role,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: context.auth.uid,
    status: "active",
  }, { merge: true });

  // reset link (admin ho může poslat uživateli e-mailem)
  const resetLink = await admin.auth().generatePasswordResetLink(email, {
    // volitelně přidej redirect:
    // url: "https://tvoje-domena/login"
  });

  return { uid: user.uid, role, resetLink };
});

/** Volitelné: změna role existujícího uživatele */
exports.adminSetRole = onCall(async (request) => {
  const context = request;
  if (!(await isAdminRequest(context))) {
    throw new HttpsError("permission-denied", "Only admins can set roles.");
  }
  const { uid, role } = request.data || {};
  if (!uid) throw new HttpsError("invalid-argument", "uid required.");
  if (!["member", "manager", "admin"].includes(role)) {
    throw new HttpsError("invalid-argument", "Invalid role.");
  }
  const claims = { role, member: false, manager: false, admin: role === "admin" };
  claims[role] = true;
  await admin.auth().setCustomUserClaims(uid, claims);
  await db.doc(`users/${uid}`).set({ role }, { merge: true });
  return { uid, role };
});
