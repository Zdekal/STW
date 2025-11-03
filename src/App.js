// src/App.js

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// --- Základní komponenty ---
import Login from './components/Login';
import Signup from './components/Signup';
import UserManagement from './components/UserManagement';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Help from './components/Help';

// --- Administrátorské komponenty ---
import GlobalObjectThreats from './components/admin/GlobalObjectThreats';
import ProjectRiskMapping from './components/ProjectRiskMapping';

// --- Komponenty pro ochranu a strukturu ---
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import DashboardLayout from './components/DashboardLayout';
import ProjectRouter from './components/ProjectRouter'; // Importujeme "chytrou výhybku"

/**
 * Hlavní komponenta aplikace, která definuje veškeré routování.
 */
function App() {
  return (
    <Routes>
      {/* --- Veřejné routy (dostupné pouze pro nepřihlášené) --- */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      
      {/* --- Přesměrování z kořenové adresy --- */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* --- Chráněné routy v hlavním layoutu (s postranním panelem) --- */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
        
        {/* Administrátorské sekce */}
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/settings/global-object-threats" element={<GlobalObjectThreats />} />
        <Route path="/settings/risk-mapping" element={<ProjectRiskMapping />} />
        <Route path="/settings/global-risk-mapping" element={<ProjectRiskMapping />} /> 
      </Route>

      {/* --- Chráněná routa pro detail projektu, která používá chytrou výhybku --- */}
      <Route 
        path="/project/:id/*" 
        element={
          <ProtectedRoute>
            <ProjectRouter />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default App;
