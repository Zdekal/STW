// src/components/admin/GlobalObjectThreats.js
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Typography, Box, Paper, CircularProgress, Alert, Button, TextField, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { allPossibleRisks } from '../../config/securityData'; // Znovu použijeme existující seznam

// Funkce pro vygenerování výchozí struktury
const generateDefaultThreats = () => {
    return allPossibleRisks.map((risk, index) => ({
        id: `threat-${index + 1}`,
        name: risk,
        category: 'Obecné', // Můžete později rozšířit
        applicable: true, // Ve výchozím stavu jsou všechny aplikovatelné
        probability: 3, // Stupnice 1-5
        impact: 3,      // Stupnice 1-5
    }));
};

function GlobalObjectThreats() {
    const [threats, setThreats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newThreatName, setNewThreatName] = useState('');

    const libraryRef = useCallback(() => doc(db, 'object_threats_library', 'default'), []);

    useEffect(() => {
        const unsubscribe = onSnapshot(libraryRef(), (docSnap) => {
            if (docSnap.exists()) {
                setThreats(docSnap.data().threats || []);
            } else {
                // Pokud knihovna neexistuje, vytvoříme ji z výchozích dat
                const defaultThreats = generateDefaultThreats();
                setDoc(libraryRef(), { threats: defaultThreats, lastUpdated: serverTimestamp() });
                setThreats(defaultThreats);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [libraryRef]);

    const handleSave = async (newThreats) => {
        await setDoc(libraryRef(), { threats: newThreats, lastUpdated: serverTimestamp() });
    };

    const handleAddThreat = () => {
        if (!newThreatName.trim()) return;
        const newThreat = {
            id: `threat-${Date.now()}`,
            name: newThreatName,
            category: 'Vlastní',
            applicable: true,
            probability: 3,
            impact: 3,
        };
        const newThreats = [...threats, newThreat];
        setThreats(newThreats);
        handleSave(newThreats);
        setNewThreatName('');
    };

    const handleDeleteThreat = (id) => {
        const newThreats = threats.filter(t => t.id !== id);
        setThreats(newThreats);
        handleSave(newThreats);
    };

    if (loading) return <CircularProgress />;

    return (
        <Paper sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>Správa globální knihovny hrozeb pro objekty</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>Zde upravujete výchozí šablonu, která se použije pro všechny nově vytvořené analýzy.</Alert>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField 
                    label="Název nové hrozby" 
                    value={newThreatName} 
                    onChange={(e) => setNewThreatName(e.target.value)}
                    fullWidth
                    size="small"
                />
                <Button variant="contained" onClick={handleAddThreat} startIcon={<AddIcon />}>Přidat</Button>
            </Box>
            <List>
                {threats.map(threat => (
                    <ListItem key={threat.id} secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteThreat(threat.id)}>
                            <DeleteIcon />
                        </IconButton>
                    }>
                        <ListItemText primary={threat.name} secondary={`Kategorie: ${threat.category}`} />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
}

export default GlobalObjectThreats;