// src/context/AuthContext.js
// Firebase-first Auth + "approval gate" (pending/approved/disabled).

import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

const LOCAL_MODE = String(process.env.REACT_APP_LOCAL_MODE || "").toLowerCase() === "true";
const ADMIN_EMAIL = (process.env.REACT_APP_ADMIN_EMAIL || "").trim().toLowerCase();

const AuthContext = React.createContext(null);
export function useAuth() {
  return useContext(AuthContext);
}

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

async function ensureUserDoc(firebaseUser) {
  if (!db) return null;

  const ref = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(ref);

  const email = normalizeEmail(firebaseUser.email);
  const ADMIN_UID = 'Ubqw75LKRdS1riTCXg6QhPOa8dM2'; // UID administrátora (Email/heslo)
  const ADMIN_EMAIL_HARDCODED = 'zdenekkalvach@gmail.com'; // Hlavní email administrátora
  const isAdmin =
    email === ADMIN_EMAIL_HARDCODED ||
    firebaseUser.uid === ADMIN_UID ||
    (ADMIN_EMAIL && email === ADMIN_EMAIL);

  if (!snap.exists()) {
    const base = {
      email: firebaseUser.email ?? null,
      displayName: firebaseUser.displayName ?? null,
      photoURL: firebaseUser.photoURL ?? null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      role: isAdmin ? "admin" : "user",
      status: isAdmin ? "approved" : "pending",
    };
    await setDoc(ref, base, { merge: true });
    return { id: firebaseUser.uid, ...base };
  }

  const data = snap.data() || {};

  // doplň chybějící systémová pole (migrace starých dokumentů)
  const patch = {};
  if (!data.createdAt) patch.createdAt = serverTimestamp();
  if (!data.role) patch.role = isAdmin ? "admin" : "user";
  if (!data.status) patch.status = isAdmin ? "approved" : "pending";
  if (Object.keys(patch).length) {
    await updateDoc(ref, patch).catch(() => { });
  }

  // auto-promote admin by email (useful when you rebuild / migrate)
  if (isAdmin && (data.role !== "admin" || data.status !== "approved")) {
    await updateDoc(ref, {
      role: "admin",
      status: "approved",
      lastLoginAt: serverTimestamp(),
    });
    return { id: snap.id, ...data, role: "admin", status: "approved" };
  }

  await updateDoc(ref, { lastLoginAt: serverTimestamp() }).catch(() => { });
  return { id: snap.id, ...data, ...patch };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null); // users/{uid}
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (LOCAL_MODE) {
      // Upraveno pro lokální přístup bez hesla přímo na Váš admin účet
      setCurrentUser({ uid: "Ubqw75LKRdS1riTCXg6QhPOa8dM2", email: "zdenekkalvach@gmail.com", displayName: "Admin Lokálně" });
      setProfile({ role: "admin", status: "approved" });
      setLoading(false);
      return;
    }

    if (!auth) {
      console.error("[AuthContext] Firebase auth is not initialized. Check env vars.");
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        setCurrentUser(u || null);
        if (!u) {
          setProfile(null);
          setLoading(false);
          return;
        }
        const userDoc = await ensureUserDoc(u);
        setProfile(userDoc);
        setLoading(false);
      } catch (e) {
        console.error("[AuthContext] Failed to load user profile:", e);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const signup = async (email, password, displayName) => {
    if (!auth) throw new Error("Auth not initialized");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName }).catch(() => { });
    }
    // user doc will be created by onAuthStateChanged via ensureUserDoc
    return cred.user;
  };

  const login = async (email, password) => {
    if (!auth) throw new Error("Auth not initialized");
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Auth not initialized");
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  };

  const resetPassword = async (email) => {
    if (!auth) throw new Error("Auth not initialized");
    return sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    if (LOCAL_MODE) {
      setCurrentUser(null);
      setProfile(null);
      return;
    }
    if (!auth) return;
    await signOut(auth);
  };

  const value = useMemo(() => {
    const merged = {
      uid: currentUser?.uid,
      email: currentUser?.email,
      displayName: currentUser?.displayName,
      photoURL: currentUser?.photoURL,
      role: profile?.role || "user",
      status: profile?.status || "pending",
      // backward compatibility (some components check currentUser.claims.admin)
      claims: { admin: (profile?.role || "user") === "admin" },
    };

    return {
      currentUser: currentUser ? merged : null,
      profile,
      loading,
      signup,
      login,
      loginWithGoogle,
      resetPassword,
      logout,
    };
  }, [currentUser, profile, loading]);

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
