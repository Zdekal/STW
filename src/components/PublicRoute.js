import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();

  // ZDE JE ZMĚNA: I zde zobrazíme zprávu, dokud se načítá stav
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Načítání aplikace...</div>
      </div>
    );
  }

  // Pokud je uživatel přihlášen, přesměrujeme ho z veřejné stránky pryč
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Pokud není přihlášen, zobrazíme veřejnou stránku (Login, Signup)
  return children;
}

export default PublicRoute;
