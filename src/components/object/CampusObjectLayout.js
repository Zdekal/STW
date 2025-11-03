import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useParams } from 'react-router-dom';
import { Box, Paper, List, ListItemText, Typography, ListItemButton, Breadcrumbs, Skeleton } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function CampusObjectLayout() {
    const { id: projectId, objectId } = useParams();
    const [projectData, setProjectData] = useState({ projectName: '', objectName: '' });
    const [loading, setLoading] = useState(true);
    
    // OPRAVA ZDE: Ponechány pouze položky, které mají definovanou routu v App.js
    const navItems = [
        { to: 'questionnaire', label: 'Bezpečnostní dotazník' },
        { to: 'threat-analysis', label: 'Analýza ohroženosti' },
        { to: 'risks', label: 'Rizika' },
        { to: 'measures', label: 'Opatření' },
        { to: 'incident-log', label: 'Evidence událostí' },
        { to: 'documentation', label: 'Bezpečnostní dokumentace' },
        { to: 'object-plan', label: 'Bezpečnostní plán' },
        { to: 'soft-target-card', label: 'Karta objektu' },
    ];
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const projectRef = doc(db, 'projects', projectId);
                const objectRef = doc(db, 'projects', projectId, 'buildings', objectId);
                const [projectSnap, objectSnap] = await Promise.all([getDoc(projectRef), getDoc(objectRef)]);
                
                setProjectData({
                    projectName: projectSnap.exists() ? projectSnap.data().name : 'Kampus',
                    objectName: objectSnap.exists() ? objectSnap.data().name : 'Objekt'
                });
            } catch (error) {
                console.error("Error fetching names:", error);
                 setProjectData({ projectName: 'Kampus', objectName: 'Objekt' });
            }
            setLoading(false);
        };
        fetchData();
    }, [projectId, objectId]);

    const activeLinkStyle = {
        backgroundColor: 'rgba(0, 123, 255, 0.08)',
        borderLeft: '4px solid #007BFF',
        color: '#007BFF',
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f4f6f8' }}>
            <Paper component="aside" elevation={2} sx={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <Box p={2} borderBottom={1} borderColor="divider">
                    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                        <Link to="/dashboard" style={{textDecoration: 'none', color: 'inherit'}}>
                           <Typography color="text.secondary">Projekty</Typography>
                        </Link>
                        <Link to={`/project/${projectId}/overview`} style={{textDecoration: 'none', color: 'inherit'}}>
                           {loading ? <Skeleton width={80} /> : <Typography color="text.primary">{projectData.projectName}</Typography>}
                        </Link>
                    </Breadcrumbs>
                    <Typography variant="h6" component="h1" fontWeight="bold" mt={1}>
                        {loading ? <Skeleton width={120} /> : projectData.objectName}
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
            </Paper>
            <main style={{ flexGrow: 1, padding: '24px', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </Box>
    );
}

export default CampusObjectLayout;