// src/components/ProtectedRoute.js
// Route-guard: requires login + (optionally) role + approval status.

import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Center({ children }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-lg w-full bg-white rounded-xl shadow p-6">{children}</div>
    </div>
  );
}

export default function ProtectedRoute({ children, role }) {
  const { currentUser, loading, logout } = useAuth();

  if (loading) {
    return (
      <Center>
        <div>Načítání…</div>
      </Center>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // approval gate
  if (currentUser.status !== "approved") {
    return (
      <Center>
        <h2 className="text-xl font-semibold mb-2">Účet čeká na schválení</h2>
        <p className="text-gray-700 mb-4">
          Váš účet je vytvořený, ale zatím nemá povolený přístup do systému. Jakmile administrátor účet schválí,
          budete se moci přihlásit a pracovat s projekty.
        </p>
        <button
          className="px-4 py-2 rounded bg-gray-800 text-white"
          onClick={() => logout?.()}
          type="button"
        >
          Odhlásit se
        </button>
      </Center>
    );
  }

  // role gate
  if (role && currentUser.role !== role) {
    return (
      <Center>
        <h2 className="text-xl font-semibold mb-2">Přístup odepřen</h2>
        <p className="text-gray-700">Tato část aplikace je dostupná pouze pro roli: <b>{role}</b>.</p>
      </Center>
    );
  }

  return children ?? <Outlet />;
}
