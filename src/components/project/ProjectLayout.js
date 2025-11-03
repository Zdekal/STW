// src/components/project/ProjectLayout.js

import React, { useState, useEffect } from 'react';
import { Outlet, useParams, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from 'firebase/firestore';
import { Typography, CircularProgress, Alert, Breadcrumbs, Link as MuiLink } from '@mui/material';

// --- Import ikon pro navigační menu ---
import HomeIcon from '@mui/icons-material/Home';
import SecurityIcon from '@mui/icons-material/Security';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import DescriptionIcon from '@mui/icons-material/Description';
import EventNoteIcon from '@mui/icons-material/EventNote';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import GroupsIcon from '@mui/icons-material/Groups';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CampaignIcon from '@mui/icons-material/Campaign';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import logo from '../../assets/logo-full.png';

const ProjectLayout = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const projectRef = doc(db, 'projects', id);
        const unsubscribe = onSnapshot(projectRef, (docSnap) => {
            if (docSnap.exists()) {
                setProject({ id: docSnap.id, ...docSnap.data() });
            } else {
                setError('Projekt nebyl nalezen.');
            }
            setLoading(false);
        }, (err) => {
            setError('Chyba při načítání projektu.');
            console.error(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id]);

    // --- ZMĚNA ZDE: Upraveno pořadí a názvy položek v menu ---
    const projectNavItems = [
        { text: 'Základní údaje', path: `/project/${id}/basic`, icon: <HomeIcon fontSize="small" /> },
        { text: 'Zvažovaná rizika', path: `/project/${id}/risks`, icon: <SecurityIcon fontSize="small" /> },
        { text: 'Bezpečnostní opatření', path: `/project/${id}/measures`, icon: <VerifiedUserIcon fontSize="small" /> },
        { text: 'Bezpečnostní plán', path: `/project/${id}/plan`, icon: <DescriptionIcon fontSize="small" /> },
        { text: 'Checklist', path: `/project/${id}/checklist`, icon: <PlaylistAddCheckIcon fontSize="small" /> },
        { text: 'Krizové postupy', path: `/project/${id}/procedures`, icon: <ListAltIcon fontSize="small" /> },
        { text: 'Krizový štáb', path: `/project/${id}/team`, icon: <GroupsIcon fontSize="small" /> },
        { text: 'Krizová komunikace', path: `/project/${id}/communication`, icon: <CampaignIcon fontSize="small" /> },
        { text: 'Protokol událostí', path: `/project/${id}/log`, icon: <EventNoteIcon fontSize="small" /> },
        { text: 'Správa projektu', path: `/project/${id}/management`, icon: <AdminPanelSettingsIcon fontSize="small" /> },
    ];

    const globalNavItems = [
        { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
        { text: 'Nastavení', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
    ];

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Chyba při odhlašování:", error);
        }
    };

    const getNavLinkClasses = (path) => {
        const isActive = location.pathname.startsWith(path);
        return `flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ${
            isActive
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-gray-600 hover:bg-gray-100'
        }`;
    };

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><CircularProgress /></div>;
    }

    if (error) {
        return <div className="p-4"><Alert severity="error">{error}</Alert></div>;
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <aside className="w-64 flex-shrink-0 bg-white border-r flex flex-col">
                <div className="h-16 flex items-center justify-center px-4 border-b">
                    <img src={logo} alt="Logo Aplikace" className="h-12" />
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {projectNavItems.map((item) => (
                        <NavLink key={item.text} to={item.path} className={() => getNavLinkClasses(item.path)}>
                            {item.icon}
                            <span className="ml-3">{item.text}</span>
                        </NavLink>
                    ))}
                    <hr className="my-3 border-gray-200" />
                    {globalNavItems.map((item) => (
                         <NavLink key={item.text} to={item.path} className={() => getNavLinkClasses(item.path)}>
                            {item.icon}
                            <span className="ml-3">{item.text}</span>
                        </NavLink>
                    ))}
                    <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 transition-colors duration-150">
                        <LogoutIcon fontSize="small" />
                        <span className="ml-3">Odhlásit se</span>
                    </button>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white border-b p-4">
                     <Breadcrumbs aria-label="breadcrumb">
                        <MuiLink component={NavLink} underline="hover" color="inherit" to="/dashboard">
                            Dashboard
                        </MuiLink>
                        <Typography color="text.primary">{project?.name || 'Projekt'}</Typography>
                    </Breadcrumbs>
                    <Typography variant="h5" component="h1" className="mt-1 font-bold">{project?.name || 'Načítání...'}</Typography>
                </div>
                <div className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default ProjectLayout;