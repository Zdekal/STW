import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Ověřování...</div>
      </div>
    );
  }

  // Pokud není uživatel přihlášen, přesměrujeme ho na LOGIN
  if (!currentUser) {
    // ZDE JE KLÍČOVÁ ZMĚNA
    return <Navigate to="/login" replace />;
  }

  // Pokud je přihlášen, zobrazíme chráněný obsah
  return children;
}

export default ProtectedRoute;