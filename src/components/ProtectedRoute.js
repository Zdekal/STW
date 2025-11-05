// src/components/ProtectedRoute.js
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasRole } from "../utils/roles";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // DEV offline režim – povol bez přihlášení
  const OFFLINE = String(process.env.REACT_APP_DEV_OFFLINE || "").toLowerCase() === "true";
  const allowOffline = OFFLINE && !currentUser;

  // 1) Počkej na auth
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Ověřování…</div>
      </div>
    );
  }

  // 2) Neprihlášený → povol v offline módu, jinak login
  if (!currentUser && !allowOffline) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3) Role guard (offline mód role neřeší)
  if (role && currentUser && !hasRole(currentUser, role)) {
    return <Navigate to="/forbidden" replace />;
  }

  // 4) Propusť chráněný obsah
  return children ?? <Outlet />;
}
