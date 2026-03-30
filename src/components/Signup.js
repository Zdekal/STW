import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doc, serverTimestamp, setDoc, addDoc, collection } from "firebase/firestore";

import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";

/**
 * Registrace: vytvoří Firebase Auth účet a založí profil v Firestore se stavem "pending".
 * Admin (definovaný přes REACT_APP_ADMIN_EMAIL) následně uživatele schválí.
 */
export default function Signup() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signup, logout, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const u = await signup(email, password, name);

      // Ulož/aktualizuj profil (status "pending" se nastaví v AuthContext.ensureUserDoc)
      if (db && u?.uid) {
        await setDoc(
          doc(db, "users", u.uid),
          {
            displayName: name || null,
            company: company || null,
            // status/role ponecháváme na AuthContext (admin auto-approve)
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Auditní žádost (bez hesla!)
        await addDoc(collection(db, "registrationRequests"), {
          uid: u.uid,
          email: u.email,
          name: name || null,
          company: company || null,
          status: "pending",
          createdAt: serverTimestamp(),
        });
      }

      // Po registraci uživatele odhlásíme a ukážeme instrukce.
      await logout?.();
      setDone(true);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Registrace selhala.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setError("");
      setLoading(true);
      const u = await loginWithGoogle();

      if (db && u?.uid) {
        await setDoc(
          doc(db, "users", u.uid),
          {
            displayName: u.displayName || null,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        await addDoc(collection(db, "registrationRequests"), {
          uid: u.uid,
          email: u.email,
          name: u.displayName || null,
          company: null,
          status: "pending",
          createdAt: serverTimestamp(),
        });
      }

      await logout?.();
      setDone(true);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Registrace přes Google selhala.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-lg p-8 bg-white rounded-xl shadow">
          <h2 className="text-2xl font-bold mb-3">Žádost o registraci odeslána</h2>
          <p className="text-gray-700 mb-6">
            Účet byl vytvořen a čeká na schválení administrátorem. Jakmile bude schválen, můžete se přihlásit.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded bg-blue-600 text-white"
              onClick={() => navigate("/login")}
            >
              Přejít na přihlášení
            </button>
            <Link className="px-4 py-2 rounded border" to="/login">
              Zavřít
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">Registrace</h2>

        {error && <p className="p-3 text-sm font-medium text-red-800 bg-red-100 rounded-lg">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full px-4 py-3 text-gray-800 bg-gray-100 rounded-lg"
            placeholder="Celé jméno"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="w-full px-4 py-3 text-gray-800 bg-gray-100 rounded-lg"
            placeholder="Firma (nepovinné)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <input
            className="w-full px-4 py-3 text-gray-800 bg-gray-100 rounded-lg"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full px-4 py-3 text-gray-800 bg-gray-100 rounded-lg"
            type="password"
            placeholder="Heslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            disabled={loading}
            className="w-full px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg disabled:bg-gray-400"
            type="submit"
          >
            {loading ? "Odesílám…" : "Vytvořit účet"}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">Nebo</span>
          </div>
        </div>

        <div>
          <button
            onClick={handleGoogleSignup}
            type="button"
            className="w-full flex items-center justify-center px-4 py-3 font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Registrovat se přes Google
          </button>
        </div>

        <div className="text-sm text-center text-gray-600 pt-2">
          Už máte účet?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Přihlásit se
          </Link>
        </div>
      </div>
    </div>
  );
}
