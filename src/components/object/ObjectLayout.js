import React from 'react';
import { NavLink, Outlet, Link, useParams } from 'react-router-dom';
import { Box, Paper, List, ListItemText, Typography, ListItemButton } from '@mui/material';

// --- ZMĚNA ZDE: Doplněny položky Rizika a Opatření ---
const navItems = [
    { to: 'questionnaire', label: 'Bezpečnostní dotazník' },
    { to: 'threat-analysis', label: 'Analýza ohroženosti' },
    { to: 'risks', label: 'Rizika' },
    { to: 'measures', label: 'Opatření' },
    { to: 'directives', label: 'Bezpečnostní směrnice' },
    { to: 'soft-target-card', label: 'Karta objektu' },
    { divider: true },
    { to: 'output-documents', label: 'Výstupní dokumenty' },
];

function ObjectLayout() {
    const { id: projectId } = useParams();
    const basePath = `/project/${projectId}`;

    return (
        <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f4f6f8' }}>
            <Paper component="aside" elevation={2} sx={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <Box p={2} borderBottom={1} borderColor="divider">
                    <Typography variant="h6" component="h1" fontWeight="bold">
                        Správa Objektu
                    </Typography>
                </Box>
                <List component="nav" sx={{ flexGrow: 1 }}>
                    {navItems.map((item, idx) => (
                        item.divider ? (
                            <Box key={`div-${idx}`} sx={{ my: 1, borderTop: '1px solid #e0e0e0' }} />
                        ) : (
                            <ListItemButton key={item.to} component={NavLink} to={`${basePath}/${item.to}`} end>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        )
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

export default ObjectLayout;