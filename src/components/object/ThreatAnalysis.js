import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import {
    Box, Typography, Paper, CircularProgress, Alert, IconButton, Tooltip, Button, Menu, MenuItem, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { threatSources } from '../../config/threatMethodologyData';
import ThreatScoringDialog from './ThreatScoringDialog';
import RiskMatrix from './RiskMatrix';

function ThreatAnalysis() {
    const { id: projectId, objectId } = useParams();
    const [threats, setThreats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State for the new features
    const [anchorEl, setAnchorEl] = useState(null);
    const [customThreatName, setCustomThreatName] = useState('');
    const [editingThreat, setEditingThreat] = useState(null);

    const objectRef = useCallback(() => doc(db, 'projects', projectId, 'buildings', objectId), [projectId, objectId]);

    // --- CORRECTED DATA LOADING LOGIC ---

    // Effect 1: Check and Initialize the document ONCE on load.
    useEffect(() => {
        const checkAndInitialize = async () => {
            if (projectId.startsWith('local-')) {
                import('../../services/localStore').then(({ listProjects, updateProject }) => {
                    const existing = listProjects().find(p => p.id === projectId);
                    if (existing && existing.buildings && existing.buildings[objectId]) {
                        if (!existing.buildings[objectId].threatAnalysis) {
                            const updatedBuildings = { ...existing.buildings };
                            updatedBuildings[objectId] = { ...updatedBuildings[objectId], threatAnalysis: [] };
                            updateProject({ ...existing, buildings: updatedBuildings });
                        }
                    }
                });
                return;
            }

            if (!db) return;
            const docRef = objectRef();
            const docSnap = await getDoc(docRef);

            if (docSnap.exists() && !docSnap.data().threatAnalysis) {
                // The document exists, but the analysis field is missing. Let's create it with an empty array.
                await setDoc(docRef, { threatAnalysis: [] }, { merge: true });
            }
        };

        checkAndInitialize().catch(err => {
            setError('Initialization failed.');
            console.error(err);
        });
    }, [objectRef, projectId, objectId]);

    // Effect 2: Listen for real-time updates and set the state.
    useEffect(() => {
        setLoading(true);

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects }) => {
                const lp = listProjects().find(p => p.id === projectId);
                if (lp && lp.buildings && lp.buildings[objectId]) {
                    setThreats(lp.buildings[objectId].threatAnalysis || []);
                }
                setLoading(false);
            });
            return;
        }

        if (!db) {
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(objectRef(), (docSnap) => {
            if (docSnap.exists()) {
                setThreats(docSnap.data().threatAnalysis || []);
            }
            setLoading(false);
        }, (err) => {
            setError('Nepodařilo se načíst data.');
            console.error(err);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [objectRef, projectId, objectId]);

    // Function to save changes to Firestore / LocalStore
    const handleUpdateThreats = async (updatedThreats) => {
        setThreats(updatedThreats);

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects, updateProject }) => {
                const existing = listProjects().find(p => p.id === projectId);
                if (existing && existing.buildings && existing.buildings[objectId]) {
                    const updatedBuildings = { ...existing.buildings };
                    updatedBuildings[objectId] = {
                        ...updatedBuildings[objectId],
                        threatAnalysis: updatedThreats
                    };
                    updateProject({
                        ...existing,
                        buildings: updatedBuildings,
                        lastModified: new Date().toISOString()
                    });
                }
            });
            return;
        }

        if (!db) return;
        await setDoc(objectRef(), {
            threatAnalysis: updatedThreats,
            threatAnalysisLastUpdated: serverTimestamp()
        }, { merge: true });
    };

    const handleAddThreatGroup = (sourceKey) => {
        const newThreats = threatSources[sourceKey].threats.map(name => ({
            id: uuidv4(),
            name,
            source: sourceKey,
            availability: 1, occurrence: 1, complexity: 1,
            lifeAndHealth: 1, facility: 1, financial: 1, community: 1,
        }));
        const uniqueNewThreats = newThreats.filter(nt => !threats.some(et => et.name === nt.name));
        handleUpdateThreats([...threats, ...uniqueNewThreats]);
        setAnchorEl(null);
    };

    const handleAddCustomThreat = () => {
        if (!customThreatName.trim()) return;
        const newThreat = {
            id: uuidv4(),
            name: customThreatName,
            source: 'custom',
            availability: 1, occurrence: 1, complexity: 1,
            lifeAndHealth: 1, facility: 1, financial: 1, community: 1,
        };
        handleUpdateThreats([...threats, newThreat]);
        setCustomThreatName('');
    };

    const handleDeleteThreat = (idToDelete) => {
        if (window.confirm("Opravdu chcete smazat tuto hrozbu?")) {
            const updatedThreats = threats.filter(t => t.id !== idToDelete);
            handleUpdateThreats(updatedThreats);
        }
    };

    const handleSaveScores = (id, newScores) => {
        const updatedThreats = threats.map(t => t.id === id ? { ...t, ...newScores } : t);
        handleUpdateThreats(updatedThreats);
    };

    if (loading) return <CircularProgress />;

    return (
        <Paper sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" component="h1">Analýza ohroženosti objektu</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" onClick={(e) => setAnchorEl(e.currentTarget)}>
                        Přidat skupinu hrozeb
                    </Button>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        {Object.entries(threatSources).map(([key, value]) => (
                            <MenuItem key={key} onClick={() => handleAddThreatGroup(key)}>
                                {value.name}
                            </MenuItem>
                        ))}
                    </Menu>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <TextField
                    label="Přidat vlastní hrozbu"
                    value={customThreatName}
                    onChange={(e) => setCustomThreatName(e.target.value)}
                    size="small"
                    fullWidth
                />
                <Button variant="contained" onClick={handleAddCustomThreat} startIcon={<AddIcon />}>
                    Přidat
                </Button>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            {Array.isArray(threats) && (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Hrozba</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Pravděpodobnost</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Dopad</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Akce</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {threats.map((threat) => {
                                if (!threat || typeof threat !== 'object') return null;
                                const probability = (Number(threat.availability) || 1) + (Number(threat.occurrence) || 1) + (Number(threat.complexity) || 1);
                                const impact = (Number(threat.lifeAndHealth) || 1) + (Number(threat.facility) || 1) + (Number(threat.financial) || 1) + (Number(threat.community) || 1);

                                return (
                                    <TableRow key={threat.id || uuidv4()} hover>
                                        <TableCell>{typeof threat.name === 'string' ? threat.name : 'Neznámá hrozba'}</TableCell>
                                        <TableCell align="center"><Chip label={`${probability} / 21`} /></TableCell>
                                        <TableCell align="center"><Chip label={`${impact} / 28`} color="warning" /></TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Upravit hodnocení">
                                                <IconButton onClick={() => setEditingThreat(threat)}><EditIcon /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="Smazat hrozbu">
                                                <IconButton onClick={() => handleDeleteThreat(threat.id)}><DeleteIcon /></IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {editingThreat && (
                <ThreatScoringDialog
                    open={!!editingThreat}
                    onClose={() => setEditingThreat(null)}
                    threat={editingThreat}
                    onSave={handleSaveScores}
                />
            )}

            {Array.isArray(threats) && <RiskMatrix threats={threats} />}

        </Paper>
    );
}

export default ThreatAnalysis;