import React, { useContext, useState, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  function logout() {
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // TOTO JE NOVÁ, DŮLEŽITÁ ČÁST
        // Načteme si výsledek tokenu, který obsahuje i naše claims
        const idTokenResult = await user.getIdTokenResult(true); // true = vynutí obnovení
        
        // Přidáme claims přímo do objektu uživatele
        user.claims = idTokenResult.claims;
        
        // Zbytek kódu pro uložení do DB zůstává
        const userRef = doc(db, 'users', user.uid);
        const userData = {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          lastLogin: new Date(),
        };
        await setDoc(userRef, userData, { merge: true });
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // --- KLÍČOVÁ OPRAVA ZDE ---
  // Memoizujeme hodnotu contextu, abychom zabránili zbytečnému překreslování
  // a nekonečným smyčkám v komponentách, které tento context používají.
  const value = useMemo(
    () => ({
      currentUser,
      login,
      signup,
      logout,
      loginWithGoogle,
      resetPassword,
    }),
    [currentUser] // Objekt se vytvoří znovu pouze tehdy, když se změní currentUser
  );

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
