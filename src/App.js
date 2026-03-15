// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";

// --- Veřejné stránky ---
import Login from "./components/Login";
import Signup from "./components/Signup";
import ForgotPassword from "./components/ForgotPassword";

// --- Chráněné (běžný uživatel) ---
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Help from "./components/Help";

// --- Admin sekce ---
import UserManagement from "./components/UserManagement";
import GlobalObjectThreats from "./components/admin/GlobalObjectThreats";
import ProjectRiskMapping from "./components/ProjectRiskMapping";
// Pokud tenhle soubor ještě nemáš, vytvoř ho nebo tu trasu dočasně smaž:
import AdminDashboard from "./components/admin/AdminDashboard";

// --- Ochrany / layouty / routery ---
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import DashboardLayout from "./components/DashboardLayout";
import ProjectRouter from "./components/ProjectRouter"; // pokud používáš „chytrou výhybku“ projektů

function Forbidden() {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" gap={2}>
      <Typography variant="h4">403 – Přístup odepřen</Typography>
      <Typography variant="body1" color="text.secondary">Na tuto stránku nemáte oprávnění.</Typography>
      <Button variant="contained" href="/dashboard">Zpět na přehled</Button>
    </Box>
  );
}

function App() {
  return (
    <Routes>
      {/* --- Veřejné routy (jen pro nepřihlášené) --- */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      {/* --- Root přesměrování --- */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* --- Chráněný layout (vlevo sidebar, uvnitř Outlet) --- */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Běžné chráněné stránky */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />

        {/* Pokud máš router pro projekty */}
        <Route path="/project/:id/*" element={<ProjectRouter />} />

        {/* Admin-only stránky (role guard přímo na elementu) */}
        <Route
          path="/user-management"
          element={
            <ProtectedRoute role="admin">
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/global-object-threats"
          element={
            <ProtectedRoute role="admin">
              <GlobalObjectThreats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/risk-mapping"
          element={
            <ProtectedRoute role="admin">
              <ProjectRiskMapping />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/global-risk-mapping"
          element={
            <ProtectedRoute role="admin">
              <ProjectRiskMapping />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Samostatná admin homepage (mimo layout, pokud chceš) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Forbidden (role check failed) */}
      <Route path="/forbidden" element={<Forbidden />} />

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
