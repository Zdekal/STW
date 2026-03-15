// functions/index.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

setGlobalOptions({ region: "europe-west1", maxInstances: 10 });
admin.initializeApp();

const db = admin.firestore();

/** Checks whether the caller is an admin (custom claim or /admins/{uid} allowlist) */
async function isAdminRequest(context) {
  const uid = context?.auth?.uid;
  if (!uid) return false;
  if (context.auth.token?.admin === true) return true;
  const doc = await db.doc(`admins/${uid}`).get();
  return doc.exists === true;
}

/**
 * Shared logic: create a Firebase Auth user (no password — user sets it via reset link),
 * assign custom claims, write profile to /users/{uid}, return reset link.
 */
async function createUserWithRole({ email, displayName, role, createdByUid }) {
  const existing = await admin.auth().getUserByEmail(email).catch((e) => {
    if (e.code === "auth/user-not-found") return null;
    throw e;
  });
  if (existing) throw new HttpsError("already-exists", "User already exists.");

  // Create account without a password — user will set one via the reset link
  const user = await admin.auth().createUser({
    email,
    displayName: displayName || undefined,
    disabled: false,
    emailVerified: false,
  });

  const claims = { role, [role]: true };
  if (role === "admin") claims.admin = true;
  await admin.auth().setCustomUserClaims(user.uid, claims);

  await db.doc(`users/${user.uid}`).set(
    {
      email,
      displayName: displayName || "",
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: createdByUid,
      status: "active",
    },
    { merge: true }
  );

  const resetLink = await admin.auth().generatePasswordResetLink(email);
  return { uid: user.uid, role, resetLink };
}

/**
 * Approve a pending registration request.
 * Creates the user account and marks the request as approved.
 */
exports.approveregistrationrequest = onCall(async (request) => {
  if (!(await isAdminRequest(request))) {
    throw new HttpsError("permission-denied", "Only admins can approve registrations.");
  }

  const { requestId } = request.data || {};
  if (!requestId) throw new HttpsError("invalid-argument", "requestId is required.");

  const reqRef = db.doc(`registrationRequests/${requestId}`);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) throw new HttpsError("not-found", "Registration request not found.");

  const reqData = reqSnap.data();
  if (reqData.status !== "pending") {
    throw new HttpsError("failed-precondition", `Request is already ${reqData.status}.`);
  }

  const email = (reqData.email || "").trim().toLowerCase();
  const displayName = (reqData.name || "").trim();

  const result = await createUserWithRole({
    email,
    displayName,
    role: "member",
    createdByUid: request.auth.uid,
  });

  await reqRef.update({
    status: "approved",
    approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    approvedBy: request.auth.uid,
    uid: result.uid,
  });

  return {
    ...result,
    message: `Registrace schválena. Odkaz pro nastavení hesla: ${result.resetLink}`,
  };
});

/**
 * Directly create a new user (admin adds a user without a registration request).
 */
exports.createnewuserbyadmin = onCall(async (request) => {
  if (!(await isAdminRequest(request))) {
    throw new HttpsError("permission-denied", "Only admins can create users.");
  }

  const data = request.data || {};
  const email = (data.email || "").trim().toLowerCase();
  const displayName = (data.displayName || "").trim();
  const role = (data.role || "member").toLowerCase();

  if (!email) throw new HttpsError("invalid-argument", "Email is required.");
  if (!["member", "manager", "admin"].includes(role)) {
    throw new HttpsError("invalid-argument", "Invalid role.");
  }

  const result = await createUserWithRole({
    email,
    displayName,
    role,
    createdByUid: request.auth.uid,
  });

  return {
    ...result,
    message: `Uživatel ${email} byl úspěšně vytvořen. Odkaz pro nastavení hesla: ${result.resetLink}`,
  };
});

/** Change an existing user's role. */
exports.adminSetRole = onCall(async (request) => {
  if (!(await isAdminRequest(request))) {
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
