import React, { useContext, useState, useEffect, useMemo } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  sendPasswordResetEmail,
} from "firebase/auth";
import { upsertUser } from "../services/users"; // <<-- sem přidáš tvůj nový modul

const AuthContext = React.createContext();

const DEV_BYPASS =
  process.env.NODE_ENV !== "production" &&
  typeof window !== "undefined" &&
  window.location.hostname === "localhost" &&
  process.env.REACT_APP_BYPASS_AUTH === "1";

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Email + heslo ---
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // --- Google přihlášení s fallbackem ---
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      return await signInWithPopup(auth, provider);
    } catch (e) {
      const popupCodes = new Set([
        "auth/popup-blocked",
        "auth/popup-closed-by-user",
        "auth/cancelled-popup-request",
        "auth/network-request-failed",
        "auth/internal-error",
      ]);
      if (popupCodes.has(e?.code)) {
        return await signInWithRedirect(auth, provider);
      }
      throw e;
    }
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    if (DEV_BYPASS) {
      const fakeUser = {
        uid: "dev-bypass",
        email: "dev@local",
        displayName: "Dev User",
        photoURL: null,
        claims: { admin: true, dev: true },
      };
      setCurrentUser(fakeUser);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // aktualizuj claims (bez forced refresh)
          const idTokenResult = await user.getIdTokenResult().catch(() => null);
          user.claims = idTokenResult?.claims || {};

          // 💾 Ulož nebo aktualizuj uživatele pomocí služby
          await upsertUser(user);
        }

        setCurrentUser(user);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      signup,
      login,
      loginWithGoogle,
      resetPassword,
      logout,
    }),
    [currentUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
