// src/context/AuthContext.js
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
  signInAnonymously,
} from "firebase/auth";
import { upsertUser } from "../services/users";

const AuthContext = React.createContext();

const DEV_BYPASS =
  process.env.NODE_ENV !== "production" &&
  typeof window !== "undefined" &&
  window.location.hostname === "localhost" &&
  process.env.REACT_APP_BYPASS_AUTH === "1";

const OFFLINE = String(process.env.REACT_APP_DEV_OFFLINE || "").toLowerCase() === "true";
const USING_EMULATORS = String(process.env.REACT_APP_USE_EMULATORS || "").toLowerCase() === "true";

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hlavní listener auth stavu
  useEffect(() => {
    if (DEV_BYPASS) {
      console.info("[auth] DEV_BYPASS -> fake user");
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

    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // claims jen pokud nejsme na emulátoru (na emu to často není potřeba)
          if (!USING_EMULATORS) {
            const idTokenResult = await user.getIdTokenResult().catch(() => null);
            user.claims = idTokenResult?.claims || {};
          }
          // upsertUser přeskoč na emulátoru (ať nenarážíš na rules)
          if (!USING_EMULATORS) {
            await upsertUser(user).catch(() => {});
          }
          console.info("[auth] signed in:", {
            uid: user.uid,
            isAnonymous: user.isAnonymous ?? false,
            emu: USING_EMULATORS,
          });
        } else {
          console.info("[auth] signed out");
        }
        setCurrentUser(user);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  // V OFFLINE režimu (na lokále) se přihlaš anonymně, aby Firestore měl request.auth.uid
  useEffect(() => {
    if (!DEV_BYPASS && OFFLINE && !currentUser) {
      console.info("[auth] DEV_OFFLINE -> signInAnonymously()");
      signInAnonymously(auth).catch((e) => {
        console.warn("[auth] anonymous sign-in failed:", e?.code || e?.message || e);
      });
    }
  }, [currentUser]);

  // Auth API
  const value = useMemo(
    () => ({
      currentUser,
      signup: (email, password) => createUserWithEmailAndPassword(auth, email, password),
      login: (email, password) => signInWithEmailAndPassword(auth, email, password),
      loginWithGoogle: async () => {
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
          if (popupCodes.has(e?.code)) return await signInWithRedirect(auth, provider);
          throw e;
        }
      },
      resetPassword: (email) => sendPasswordResetEmail(auth, email),
      logout: () => signOut(auth),
    }),
    [currentUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
