import React, { useContext, useState, useEffect, useMemo } from "react";
import { auth, db } from "../firebase";
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
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

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

  // --- E-mail/heslo ---
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // --- Google přihlášení s fallbackem na redirect (Safari, popup blokátory) ---
  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      return await signInWithPopup(auth, provider);
    } catch (e) {
      // Safari, iOS, popup-blocked, network issues apod. -> redirect
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
    // DEV bypass: vytvoří „fake“ uživatele pro lokální vývoj bez přihlášení
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
          // načti ID token + claims (true = vynutí refresh)
          try {
            const idTokenResult = await user.getIdTokenResult(true);
            user.claims = idTokenResult?.claims || {};
          } catch {
            user.claims = {};
          }

          // zapiš/aktualizuj profil uživatele ve Firestore
          const userRef = doc(db, "users", user.uid);
          const userData = {
            email: user.email || null,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null,
            lastLogin: serverTimestamp(),
          };
          await setDoc(userRef, userData, { merge: true });
        }

        setCurrentUser(user);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Memoizace pro stabilní context value
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
