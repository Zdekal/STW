// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { hasRole } from "../utils/roles";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { currentUser, loading } = useAuth();

  // 1️⃣ – Počkej, až se ověří stav přihlášení
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Ověřování...</div>
      </div>
    );
  }

  // 2️⃣ – Pokud není přihlášen → login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 3️⃣ – Pokud je role vyžadována a uživatel ji nemá → forbidden
  if (role && !hasRole(currentUser, role)) {
    return <Navigate to="/forbidden" replace />;
  }

  // 4️⃣ – Jinak zobraz chráněný obsah
  return children;
}
