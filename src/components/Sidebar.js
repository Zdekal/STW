import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
    Box,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Typography,
    Chip
} from '@mui/material';
import {
    Dashboard,
    Settings,
    HelpOutline,
    Logout,
    SupervisedUserCircle,
    Home,
    Security,
    Task,
    Group,
    Campaign,
    Description,
    ListAlt,
    Share
} from '@mui/icons-material';
import logoFull from '../assets/logo-full.png';

// ID administrátora není natvrdo potřeba, kontroluje se pomocí claims

/**
 * Sjednocená komponenta Sidebar.
 * Zobrazuje hlavní navigaci a kontextově i navigaci pro konkrétní projekt.
 */
function Sidebar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const { id: projectId } = useParams(); // Získáme ID projektu z URL

    const [projectName, setProjectName] = useState('');
    const [projectType, setProjectType] = useState('');

    // Načtení názvu projektu, pokud jsme v detailu projektu
    useEffect(() => {
        if (projectId) {
            if (projectId.startsWith('local-')) {
                import('../services/localStore').then(({ listProjects }) => {
                    const lp = listProjects().find(p => p.id === projectId);
                    if (lp) {
                        setProjectName(lp.name);
                        setProjectType(lp.projectType || 'event');
                    }
                });
                return;
            }
            if (!db) return;
            const projectRef = doc(db, 'projects', projectId);
            const unsubscribe = onSnapshot(projectRef, (docSnap) => {
                if (docSnap.exists()) {
                    setProjectName(docSnap.data().name);
                    setProjectType(docSnap.data().projectType || 'event');
                }
            });
            return () => unsubscribe();
        } else {
            setProjectName(''); // Vyčistíme název, pokud nejsme na stránce projektu
            setProjectType('');
        }
    }, [projectId]);


    const isUserAdmin = currentUser?.claims?.admin === true;

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Chyba při odhlašování:', error);
        }
    };

    const activeLinkStyle = {
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderRight: '4px solid #007BFF',
        color: '#007BFF',
        '& .MuiListItemIcon-root': {
            color: '#007BFF',
        },
    };

    const mainNavItems = [
        { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
        { text: 'Nastavení', icon: <Settings />, path: '/settings' },
        { text: 'Nápověda', icon: <HelpOutline />, path: '/help' },
    ];

    // Dynamicky generované položky pro projektové menu podle typu
    let projectNavItems = [];
    if (projectId) {
        if (projectType === 'kampus') {
            projectNavItems = [
                { text: 'Přehled kampusu', icon: <Home />, path: `/project/${projectId}/overview` },
                { text: 'Centrální opatření', icon: <Task />, path: `/project/${projectId}/central-measures` },
                { text: 'Bezpečnostní směrnice', icon: <Description />, path: `/project/${projectId}/directives` },
                { text: 'Bezpečnostní plán', icon: <Description />, path: `/project/${projectId}/plan` },
                { text: 'Krizový štáb', icon: <Group />, path: `/project/${projectId}/crisis-team` },
                { text: 'Deník incidentů', icon: <ListAlt />, path: `/project/${projectId}/central-incident-log` },
            ];
        } else if (projectType === 'objekt') {
            projectNavItems = [
                { text: 'Dotazník ohroženosti', icon: <Home />, path: `/project/${projectId}/questionnaire` },
                { text: 'Analýza hrozeb', icon: <Security />, path: `/project/${projectId}/threat-analysis` },
                { text: 'Bezpečnostní rizika', icon: <Security />, path: `/project/${projectId}/risks` },
                { text: 'Bezpečnostní opatření', icon: <Task />, path: `/project/${projectId}/measures` },
                { text: 'Bezpečnostní směrnice', icon: <Description />, path: `/project/${projectId}/directives` },
                { text: 'Bezpečnostní plán', icon: <Description />, path: `/project/${projectId}/plan` },
                { text: 'Měkký cíl', icon: <Description />, path: `/project/${projectId}/soft-target-card` }
            ];
        } else {
            // event (Akce)
            projectNavItems = [
                { text: 'Základní údaje', icon: <Home />, path: `/project/${projectId}/basic` },
                { text: 'Rizika', icon: <Security />, path: `/project/${projectId}/risks` },
                { text: 'Opatření', icon: <Task />, path: `/project/${projectId}/measures` },
                { text: 'Postupy', icon: <ListAlt />, path: `/project/${projectId}/procedures` },
                { text: 'Tým', icon: <Group />, path: `/project/${projectId}/team` },
                { text: 'Komunikace', icon: <Campaign />, path: `/project/${projectId}/communication` },
                { text: 'Checklist', icon: <ListAlt />, path: `/project/${projectId}/checklist` },
                { text: 'Dokument Plánu', icon: <Description />, path: `/project/${projectId}/plan` },
                { text: 'Deník akce', icon: <ListAlt />, path: `/project/${projectId}/log` },
                { text: 'Sdílení', icon: <Share />, path: `/project/${projectId}/sharing` },
                { text: 'Správa projektu', icon: <Settings />, path: `/project/${projectId}/management` },
            ];
        }
    }

    return (
        <Box
            sx={{
                width: 260,
                flexShrink: 0,
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                borderRight: '1px solid #e0e0e0',
                bgcolor: '#fcfcfc'
            }}
        >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src={logoFull} alt="BetterSafe Logo" style={{ maxWidth: '150px', height: 'auto' }} />
            </Box>
            <Divider />

            <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {/* Hlavní navigace */}
                {mainNavItems.map((item) => (
                    <ListItemButton key={item.text} component={NavLink} to={item.path} end sx={{ '&.active': activeLinkStyle, m: 1, borderRadius: '8px' }}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItemButton>
                ))}

                {/* Projektová navigace (zobrazí se pouze na stránkách projektu) */}
                {projectId && (
                    <>
                        <Divider sx={{ my: 1 }}><Chip label={projectName || "Projekt"} size="small" /></Divider>
                        {projectNavItems.map((item) => (
                            <ListItemButton key={item.text} component={NavLink} to={item.path} sx={{ '&.active': activeLinkStyle, m: 1, borderRadius: '8px' }}>
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        ))}
                    </>
                )}

                {/* Administrátorská sekce */}
                {isUserAdmin && (
                    <>
                        <Divider sx={{ my: 1 }}><Chip label="Admin" size="small" /></Divider>
                        <ListItemButton component={NavLink} to="/user-management" sx={{ '&.active': activeLinkStyle, m: 1, borderRadius: '8px' }}>
                            <ListItemIcon><SupervisedUserCircle /></ListItemIcon>
                            <ListItemText primary="Správa registrací" />
                        </ListItemButton>
                    </>
                )}
            </List>

            <Box sx={{ p: 2, mt: 'auto' }}>
                <Divider />
                <Typography variant="body2" noWrap sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
                    {currentUser?.email}
                </Typography>
                <ListItemButton onClick={handleLogout} sx={{ borderRadius: '8px', '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.08)' } }}>
                    <ListItemIcon><Logout color="error" /></ListItemIcon>
                    <ListItemText primary="Odhlásit se" />
                </ListItemButton>
            </Box>
        </Box>
    );
}

export default Sidebar;
