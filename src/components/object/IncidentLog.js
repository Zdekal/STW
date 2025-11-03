// src/components/object/IncidentLog.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { collection, addDoc, getDocs, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import {
    Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, CircularProgress, Alert, Modal, TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
};

function IncidentLog() {
    const { id: projectId, objectId: objectIdFromUrl } = useParams();
    const effectiveObjectId = objectIdFromUrl || projectId;

    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newIncident, setNewIncident] = useState({ date: '', time: '', description: '', category: '' });

    const fetchIncidents = useCallback(async () => {
        if (!effectiveObjectId) return;
        setLoading(true);
        try {
            const incidentsRef = collection(db, 'projects', projectId, 'buildings', effectiveObjectId, 'incidents');
            const q = query(incidentsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const incidentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setIncidents(incidentsList);
        } catch (err) {
            console.error("Chyba při načítání incidentů:", err);
            setError("Data se nepodařilo načíst.");
        }
        setLoading(false);
    }, [projectId, effectiveObjectId]);

    useEffect(() => {
        fetchIncidents();
    }, [fetchIncidents]);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNewIncident({ date: '', time: '', description: '', category: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewIncident(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveIncident = async (e) => {
        e.preventDefault();
        if (!newIncident.date || !newIncident.description) {
            alert('Vyplňte prosím datum a popis incidentu.');
            return;
        }
        try {
            const incidentsRef = collection(db, 'projects', projectId, 'buildings', effectiveObjectId, 'incidents');
            const docRef = await addDoc(incidentsRef, {
                ...newIncident,
                createdAt: serverTimestamp()
            });
            // Okamžitě aktualizujeme stav v aplikaci pro rychlou odezvu
            setIncidents(prev => [{ id: docRef.id, ...newIncident, createdAt: { toDate: () => new Date() } }, ...prev]);
            handleCloseModal();
        } catch (err) {
            console.error("Chyba při ukládání incidentu:", err);
            setError("Uložení incidentu selhalo.");
        }
    };
    
    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Evidence událostí</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenModal}>Nový záznam</Button>
            </Box>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Datum a čas</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Kategorie</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Popis</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {incidents.map((incident) => {
                            const displayDate = incident.createdAt?.toDate
                                ? new Date(incident.createdAt.toDate()).toLocaleString('cs-CZ')
                                : 'Právě teď';
                            
                            return (
                                <TableRow key={incident.id}>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{displayDate}</TableCell>
                                    <TableCell>{incident.category}</TableCell>
                                    <TableCell>{incident.description}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            <Modal open={isModalOpen} onClose={handleCloseModal}>
                <Box component="form" onSubmit={handleSaveIncident} sx={modalStyle}>
                    <Typography variant="h6" component="h2" mb={2}>Nový záznam o události</Typography>
                    <TextField name="date" label="Datum" type="date" fullWidth required sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} onChange={handleInputChange} value={newIncident.date} />
                    <TextField name="time" label="Čas" type="time" fullWidth sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} onChange={handleInputChange} value={newIncident.time} />
                    <TextField name="category" label="Kategorie" fullWidth sx={{ mb: 2 }} onChange={handleInputChange} value={newIncident.category} />
                    <TextField name="description" label="Popis události" multiline required rows={4} fullWidth sx={{ mb: 2 }} onChange={handleInputChange} value={newIncident.description} />
                    <Box sx={{ textAlign: 'right', mt: 2 }}>
                        <Button onClick={handleCloseModal} sx={{ mr: 1 }}>Zrušit</Button>
                        <Button variant="contained" type="submit">Uložit</Button>
                    </Box>
                </Box>
            </Modal>
        </Paper>
    );
}

export default IncidentLog;