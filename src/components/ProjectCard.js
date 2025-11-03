import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { exportProjectToJSON } from './ExportUtils';
import { 
    Box, 
    Typography, 
    Button, 
    IconButton, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogContentText, 
    DialogTitle 
} from '@mui/material';
import { 
    Delete as DeleteIcon, 
    Event as EventIcon, 
    Business as BusinessIcon,
    Domain as DomainIcon // Přidán import pro ikonu Objektu
} from '@mui/icons-material';

// Mapování typů projektů na jejich názvy a ikony pro přehledné zobrazení
const projectTypeDetails = {
  event: { label: 'Akce', icon: <EventIcon fontSize="inherit" sx={{ mr: 0.5 }} /> },
  objekt: { label: 'Objekt', icon: <DomainIcon fontSize="inherit" sx={{ mr: 0.5 }} /> },
  kampus: { label: 'Kampus', icon: <BusinessIcon fontSize="inherit" sx={{ mr: 0.5 }} /> },
};


function ProjectCard({ project }) {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    // Zjistíme, zda je aktuální uživatel vlastníkem projektu
    const isOwner = currentUser && currentUser.uid === project.ownerId;
    
    // Získáme detaily (ikonu a popisek) pro daný typ projektu, s pojistkou pro neznámý typ
    const details = projectTypeDetails[project.projectType] || projectTypeDetails.event;

    // Použijeme lastModified pro datum, pokud existuje, jinak createdAt
    const displayDate = project.lastModified?.toDate() || project.createdAt?.toDate();
    const lastEditedDate = displayDate ? displayDate.toLocaleString('cs-CZ') : 'N/A';

    // Funkce pro otevření potvrzovacího dialogu
    const handleOpenDeleteDialog = (e) => {
        e.stopPropagation(); // Zabráníme prokliku na kartu
        setOpenDeleteDialog(true);
    };

    // Funkce pro zavření dialogu
    const handleCloseDeleteDialog = (e) => {
        e.stopPropagation();
        setOpenDeleteDialog(false);
    };

    // Funkce pro smazání projektu z databáze
    const handleDeleteProject = async (e) => {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, 'projects', project.id));
            handleCloseDeleteDialog(e);
        } catch (error) {
            console.error("Chyba při mazání projektu: ", error);
        }
    };

    return (
        <Box 
            sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px', 
                p: 2, 
                boxShadow: '0 1px 3px rgba(0,0,0,0.12)', 
                '&:hover': { boxShadow: '0 3px 6px rgba(0,0,0,0.16)' }, 
                bgcolor: 'white', 
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                cursor: 'pointer'
            }}
            onClick={() => navigate(`/project/${project.id}`)}
        >
            {/* Tlačítko pro smazání se zobrazí jen vlastníkovi */}
            {isOwner && (
                <IconButton
                    aria-label="delete project"
                    onClick={handleOpenDeleteDialog}
                    size="small"
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'grey.500',
                        '&:hover': { color: 'error.main' }
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            )}
            
            <Box>
                <Typography variant="h6" component="h2" sx={{ mb: 1, pr: '32px', fontWeight: 'bold' }}>
                    {project.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    {details.icon}
                    {details.label}
                </Typography>
            </Box>

            <Box mt={2}>
                 <Typography variant="caption" color="text.secondary">
                    Upraveno: {lastEditedDate}
                </Typography>
                <Button
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        exportProjectToJSON(project);
                    }}
                    sx={{ display: 'block', mt: 1, p: 0, justifyContent: 'flex-start' }}
                >
                    Exportovat jako JSON
                </Button>
            </Box>

            {/* Dialog pro potvrzení smazání */}
            <Dialog
                open={openDeleteDialog}
                onClose={handleCloseDeleteDialog}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle>Smazat projekt?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete trvale smazat projekt "{project.name}"? Tuto akci nelze vrátit zpět.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteDialog}>Zrušit</Button>
                    <Button onClick={handleDeleteProject} color="error" autoFocus>
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default ProjectCard;