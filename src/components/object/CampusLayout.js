import React from 'react';
import { NavLink, Outlet, Link, useParams } from 'react-router-dom';
import { Box, Paper, List, ListItemText, Typography, ListItemButton } from '@mui/material';

function CampusLayout() {
    const { id: projectId } = useParams();

    // --- OPRAVA ZDE: Doplněny chybějící položky navigace ---
    const navItems = [
        { to: 'overview', label: 'Přehled objektů' },
        { to: 'central-measures', label: 'Centrální opatření' },
        { to: 'crisis-team', label: 'Společný krizový tým' },
        { to: 'central-incident-log', label: 'Centrální záznam incidentů' },
        { to: 'directives', label: 'Bezpečnostní směrnice' },
        { to: 'plan', label: 'Bezpečnostní plán' },
    ];
    
    const activeLinkStyle = {
        backgroundColor: 'rgba(0, 123, 255, 0.08)',
        borderLeft: '4px solid #007BFF',
        color: '#007BFF',
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f4f6f8' }}>
            <Paper component="aside" elevation={2} sx={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <Box p={2} borderBottom={1} borderColor="divider">
                    <Typography variant="h6" component="h1" fontWeight="bold">
                        Správa Kampusu
                    </Typography>
                </Box>
                <List component="nav" sx={{ flexGrow: 1, p: 1 }}>
                    {navItems.map((item) => (
                        <ListItemButton 
                            key={item.to} 
                            component={NavLink} 
                            to={item.to} 
                            end
                            sx={{ borderRadius: '6px', mb: 0.5, '&.active': activeLinkStyle }}
                        >
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    ))}
                </List>
                 <div style={{ marginTop: 'auto', borderTop: '1px solid #ddd', padding: '8px' }}>
                    <Link to="/dashboard" style={{ display: 'block', textAlign: 'center', padding: '8px', textDecoration: 'none', color: 'inherit' }}>
                        Všechny projekty
                    </Link>
                </div>
            </Paper>
            <main style={{ flexGrow: 1, padding: '24px', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </Box>
    );
}

export default CampusLayout;