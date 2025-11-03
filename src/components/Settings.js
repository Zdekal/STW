// src/components/Settings.js

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Paper, 
  Typography, 
  List, 
  ListItemText, 
  ListItemIcon, 
  ListItemButton, 
  Divider, 
  Chip 
} from '@mui/material';
import { 
  ArrowForwardIos, 
  Hub, 
  AdminPanelSettings, 
  GppGood 
} from '@mui/icons-material';

/**
 * Komponenta pro stránku nastavení.
 * Zobrazuje informace o uživateli a odkazy na správu dat.
 * Administrátorům zobrazuje dodatečné odkazy pro globální správu.
 */
function Settings() {
  // Získání aktuálně přihlášeného uživatele z kontextu
  const { currentUser } = useAuth();
  
  // Zjištění, zda má uživatel administrátorská práva pomocí custom claims.
  // Otazník (?) zajišťuje, že se kód nepokusí číst 'claims' z 'undefined', pokud currentUser ještě není načten.
  const isUserAdmin = currentUser?.claims?.admin === true;

  return (
    <div className="space-y-6">
      {/* Hlavní nadpis stránky */}
      <Typography variant="h4" component="h1" className="font-bold text-gray-800">
        Nastavení
      </Typography>
      
      {/* Sekce s informacemi o účtu */}
      <Paper elevation={2} className="p-6 rounded-lg">
        <Typography variant="h6" component="h2" className="font-semibold mb-4">
          Informace o účtu
        </Typography>
        {currentUser ? (
          <div className="space-y-2">
            <p><span className="font-semibold">E-mail:</span> {currentUser.email}</p>
            <p>
              <span className="font-semibold">User ID:</span> 
              <code className="text-sm bg-gray-200 p-1 rounded ml-2">{currentUser.uid}</code>
            </p>
          </div>
        ) : (
          <p>Načítání informací o uživateli...</p>
        )}
      </Paper>

      {/* Sekce pro správu dat */}
      <Paper elevation={2} className="p-6 rounded-lg">
        <Typography variant="h6" component="h2" className="font-semibold mb-2">
          Správa dat
        </Typography>
        <List>
            {/* Odkaz pro běžné uživatele */}
            <ListItemButton component={Link} to="/settings/risk-mapping" className="rounded-lg">
                <ListItemIcon><Hub /></ListItemIcon>
                <ListItemText 
                  primary="Moje knihovna opatření" 
                  secondary="Správa vaší osobní knihovny rizik a bezpečnostních opatření"
                />
                <ArrowForwardIos sx={{ color: 'grey.500' }} />
            </ListItemButton>
        </List>
        
        {/* Podmíněně zobrazená sekce pouze pro administrátory */}
        {isUserAdmin && (
          <>
            <Divider sx={{ my: 2 }}>
              <Chip label="Administrátor" size="small" />
            </Divider>
            <List>
                {/* Odkaz na správu globální knihovny */}
                <ListItemButton component={Link} to="/settings/global-risk-mapping" className="rounded-lg" sx={{ mb: 1 }}>
                    <ListItemIcon><AdminPanelSettings /></ListItemIcon>
                    <ListItemText 
                      primary="Správa globální knihovny opatření" 
                      secondary="Úprava sdílené knihovny opatření pro akce"
                    />
                    <ArrowForwardIos sx={{ color: 'grey.500' }} />
                </ListItemButton>
                {/* Odkaz na správu globálních hrozeb */}
                <ListItemButton component={Link} to="/settings/global-object-threats" className="rounded-lg">
                    <ListItemIcon><GppGood /></ListItemIcon>
                    <ListItemText 
                      primary="Správa hrozeb pro objekty" 
                      secondary="Úprava globální šablony hrozeb pro objekty a kampusy"
                    />
                    <ArrowForwardIos sx={{ color: 'grey.500' }} />
                </ListItemButton>
            </List>
          </>
        )}
      </Paper>
    </div>
  );
}

export default Settings;