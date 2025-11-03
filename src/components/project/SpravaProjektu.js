// src/components/project/SpravaProjektu.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
// <-- UPRAVENÉ IMPORTY -->
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore'; 
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
    Container, Paper, Typography, TextField, Button, CircularProgress,
    Box, Alert, List, ListItem, Chip
} from '@mui/material';
import { PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const SpravaProjektu = () => {
    const { id: projectId } = useParams();
    const { currentUser } = useAuth();
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState('');
    const [members, setMembers] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    useEffect(() => {
        const projectRef = doc(db, 'projects', projectId);
        const unsubscribe = onSnapshot(projectRef, (docSnap) => {
            if (docSnap.exists()) {
                setProjectData({ id: docSnap.id, ...docSnap.data() });
                setError('');
            } else {
                setError('Projekt nebyl nalezen.');
            }
            setLoading(false);
        }, (err) => {
            console.error("Chyba při načítání projektu:", err);
            setError('Nepodařilo se načíst data projektu.');
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    // <-- ZDE JE FINÁLNÍ OPRAVA LOGIKY NAČÍTÁNÍ ČLENŮ -->
    useEffect(() => {
        const fetchMembers = async () => {
            if (projectData && projectData.members && projectData.members.length > 0) {
                try {
                    // Vytvoříme pole "příslibů" (promises), kde každý příslib načte jeden dokument uživatele podle jeho ID
                    const memberPromises = projectData.members.map(memberId =>
                        getDoc(doc(db, 'users', memberId))
                    );

                    // Počkáme, až se všechny dokumenty načtou najednou
                    const memberDocs = await Promise.all(memberPromises);

                    // Zpracujeme načtené dokumenty do pole, které můžeme zobrazit
                    const memberData = memberDocs
                        .filter(docSnap => docSnap.exists()) // Zahrneme jen ty, co skutečně existují
                        .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

                    setMembers(memberData);
                } catch (e) {
                    console.error("Chyba při načítání členů:", e);
                }
            } else {
                setMembers([]);
            }
        };

        fetchMembers();
    }, [projectData]);
    
    const isOwner = currentUser && projectData && currentUser.uid === projectData.ownerId;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProjectData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setFeedback('Ukládám...');
        const projectRef = doc(db, 'projects', projectId);
        const dataToSave = {
            name: projectData.name || '',
            organizationName: projectData.organizationName || null,
            organizationAddress: projectData.organizationAddress || null,
        };
        try {
            await updateDoc(projectRef, dataToSave);
            setFeedback('Změny úspěšně uloženy!');
        } catch (err) {
            console.error("Chyba při ukládání:", err);
            setFeedback('Uložení selhalo.');
        }
    };
    
    const handleInvite = async () => {
        if (!inviteEmail) return;
        setIsInviting(true);
        setError('');
        try {
            const functions = getFunctions(undefined, 'europe-west1');
            const inviteCollaborator = httpsCallable(functions, 'invitecollaboratorbyemail');
            const result = await inviteCollaborator({ projectId, collaboratorEmail: inviteEmail });
            if(result.data.success) {
                 setFeedback(result.data.message);
                 setInviteEmail('');
            } else {
                setError(result.data.message || 'Pozvání se nezdařilo.');
            }
        } catch (err) {
            setError(err.message);
        }
        setIsInviting(false);
    };

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!projectData) return <Alert severity="info">Projekt nenalezen.</Alert>;

    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>Správa projektu</Typography>
                
                <TextField name="name" label="Název projektu (na dlaždici)" value={projectData.name || ''} onChange={handleChange} fullWidth margin="normal" />
                <TextField name="organizationName" label="Oficiální název organizace" value={projectData.organizationName || ''} onChange={handleChange} fullWidth margin="normal" />
                <TextField name="organizationAddress" label="Adresa organizace" value={projectData.organizationAddress || ''} onChange={handleChange} fullWidth margin="normal" />

                <Box sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={handleSave}>Uložit změny</Button>
                    {feedback && <Typography sx={{ display: 'inline', ml: 2 }}>{feedback}</Typography>}
                </Box>

                <Typography variant="h5" sx={{ mt: 5, mb: 2 }}>Spolupracovníci</Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {members.length > 0 ? (
                        members.map(member => (
                            <Chip 
                                key={member.id} 
                                label={member.displayName || member.email} 
                                variant="outlined" 
                            />
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary">V tomto projektu nejsou žádní spolupracovníci.</Typography>
                    )}
                </Box>
                
                {isOwner && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
                        <TextField 
                            label="Pozvat uživatele podle e-mailu" 
                            variant="outlined" 
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            size="small"
                            sx={{ flexGrow: 1, mr: 1 }}
                        />
                        <Button variant="outlined" startIcon={<PersonAddIcon />} onClick={handleInvite} disabled={isInviting}>
                            {isInviting ? <CircularProgress size={24} /> : 'Pozvat'}
                        </Button>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}

export default SpravaProjektu;