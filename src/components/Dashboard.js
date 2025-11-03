import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import {
    Box, Button, Typography, Grid, CircularProgress, Alert,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField
} from '@mui/material';
import ProjectCard from './ProjectCard';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Přejmenováno pro přehlednost
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false); 
    // Nový stav pro první dialog s výběrem typu
    const [isTypeSelectionModalOpen, setIsTypeSelectionModalOpen] = useState(false); 
    // Nový stav pro uložení vybraného typu projektu
    const [selectedProjectType, setSelectedProjectType] = useState(null); 
    const [newProjectData, setNewProjectData] = useState({
        name: '',
        organizationName: '',
        authorName: '',
        organizationAddress: ''
    });

    const navigate = useNavigate();
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) {
            setError("Uživatel není přihlášen.");
            setLoading(false);
            return;
        }

        const q = query(collection(db, "projects"), where("members", "array-contains", user.uid));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const projectsData = [];
            querySnapshot.forEach((doc) => {
                projectsData.push({ id: doc.id, ...doc.data() });
            });
            setProjects(projectsData);
            setLoading(false);
        }, (err) => {
            console.error("Chyba při načítání projektů:", err);
            setError("Nepodařilo se načíst projekty.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Otevře první dialog pro výběr typu
    const handleOpenTypeSelectionModal = () => setIsTypeSelectionModalOpen(true);

    // Zavře oba dialogy a vše vyčistí
    const handleCloseAllModals = () => {
        setIsTypeSelectionModalOpen(false);
        setIsDetailsModalOpen(false);
        setSelectedProjectType(null);
        setNewProjectData({ name: '', organizationName: '', authorName: '', organizationAddress: '' });
    };

    // Zpracuje výběr typu, zavře první a otevře druhý dialog
    const handleTypeSelect = (type) => {
        setSelectedProjectType(type);
        setIsTypeSelectionModalOpen(false);
        setIsDetailsModalOpen(true);
    };  

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProjectData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateProject = async () => {
        if (!user) {
            setError("Pro vytvoření projektu musíte být přihlášen.");
            return;
        }
        if (!newProjectData.name) {
            alert("Název projektu je povinný.");
            return;
        }
        
        try {
            const docRef = await addDoc(collection(db, "projects"), {
            ...newProjectData,
            projectType: selectedProjectType, // <-- ZDE JE ZMĚNA
            ownerId: user.uid,
            members: [user.uid],
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp(),
        });
        console.log("Projekt vytvořen s ID: ", docRef.id);
        handleCloseAllModals(); // Použijeme novou funkci pro zavření
        navigate(`/project/${docRef.id}`);

        } catch (err) {
            console.error("Chyba při vytváření projektu: ", err);
            setError("Vytvoření projektu selhalo.");
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" component="h1">Moje projekty</Typography>
                <Button variant="contained" size="large" onClick={handleOpenTypeSelectionModal}>
                    + Založit nový projekt
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {projects.length > 0 ? (
                    projects.map(project => (
                        <Grid key={project.id} xs={12} sm={6} md={4}>
                            <ProjectCard project={project} />
                        </Grid>
                    ))
                ) : (
                    <Typography sx={{ p: 2 }}>Zatím nemáte žádné projekty. Založte si první!</Typography>
                )}
            </Grid>
            
            {/* --- Nový dialog pro výběr typu projektu --- */}
            <Dialog open={isTypeSelectionModalOpen} onClose={handleCloseAllModals}>
                <DialogTitle>Jaký typ projektu chcete založit?</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
                    <Button variant="outlined" onClick={() => handleTypeSelect('akce')}>
                        Akce
                    </Button>
                    <Button variant="outlined" onClick={() => handleTypeSelect('objekt')}>
                        Objekt
                    </Button>
                    <Button variant="outlined" onClick={() => handleTypeSelect('kampus')}>
                        Kampus
                    </Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAllModals}>Zrušit</Button>
                </DialogActions>
            </Dialog>

            {/* --- Upravený, původní dialog pro zadání detailů --- */}
            <Dialog open={isDetailsModalOpen} onClose={handleCloseAllModals} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Založit nový projekt typu "{selectedProjectType}"
                </DialogTitle>
                <DialogContent>
                    <TextField autoFocus required margin="dense" name="name" label="Název projektu (interní)" type="text" fullWidth variant="standard" onChange={handleInputChange} />
                    <TextField margin="dense" name="organizationName" label="Oficiální název organizace" type="text" fullWidth variant="standard" onChange={handleInputChange} />
                    <TextField margin="dense" name="authorName" label="Autor projektu" type="text" fullWidth variant="standard" onChange={handleInputChange} />
                    <TextField margin="dense" name="organizationAddress" label="Adresa organizace" type="text" fullWidth variant="standard" onChange={handleInputChange} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseAllModals}>Zrušit</Button>
                    <Button onClick={handleCreateProject} variant="contained">Vytvořit projekt</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}

export default Dashboard;