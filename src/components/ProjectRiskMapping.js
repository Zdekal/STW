import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
    TextField, Button, IconButton, Typography, Paper, CircularProgress, Box, Checkbox,
    FormGroup, FormControlLabel, FormControl, InputLabel, Select, MenuItem, OutlinedInput,
    ListItemText, Chip, Switch, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { Add, Delete, Edit, Save, AdminPanelSettings, Refresh } from '@mui/icons-material';
// --- OPRAVA ZDE: Správná cesta k souboru v rámci složky src ---
import { defaultMeasures, allPossibleRisks } from '../config/securityData';

const ADMIN_UID = 'Ubqw75LKRdS1riTCXg6QhPOa8dM2';

const generateUniqueId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

function ProjectRiskMapping() {
    const { currentUser } = useAuth();
    const [measures, setMeasures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    
    const [newMeasure, setNewMeasure] = useState({ text: '', isPrevention: true, isDetection: false, isReaction: false, applicableRisks: [] });
    const [editingId, setEditingId] = useState(null);
    const [editingData, setEditingData] = useState(null);

    useEffect(() => {
        if (currentUser && currentUser.uid === ADMIN_UID) {
            setIsAdmin(true);
        }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;

        let unsubscribe = () => {};
        setLoading(true);

        const personalLibraryRef = doc(db, 'users', currentUser.uid, 'settings', 'measureLibrary');
        const globalLibraryRef = doc(db, 'measures_library', 'default');
        const targetRef = isAdmin && isAdminMode ? globalLibraryRef : personalLibraryRef;

        const initializeAndListen = async () => {
            try {
                const docSnap = await getDoc(targetRef);

                if (!docSnap.exists() && !(isAdmin && isAdminMode)) {
                    console.log("Osobní knihovna neexistuje, vytvářím kopii...");
                    const globalSnap = await getDoc(globalLibraryRef);
                    const templateItems = globalSnap.exists() ? globalSnap.data().items : defaultMeasures;
                    await setDoc(personalLibraryRef, { items: templateItems, created: serverTimestamp() });
                }

                unsubscribe = onSnapshot(targetRef, (doc) => {
                    setMeasures(doc.exists() ? doc.data().items || [] : defaultMeasures);
                    setLoading(false);
                }, (error) => {
                    console.error("Chyba při naslouchání změnám (onSnapshot):", error);
                    setLoading(false);
                });

            } catch (err) {
                console.error("Došlo k chybě při inicializaci knihovny:", err);
                setLoading(false);
            }
        };

        initializeAndListen();

        return () => {
            unsubscribe();
        };
    }, [currentUser, isAdmin, isAdminMode]);


    const saveMeasures = useCallback(async (updatedMeasures) => {
        if (!currentUser) return;
        
        const personalLibraryRef = doc(db, 'users', currentUser.uid, 'settings', 'measureLibrary');
        const globalLibraryRef = doc(db, 'measures_library', 'default');
        const targetRef = isAdmin && isAdminMode ? globalLibraryRef : personalLibraryRef;
        
        await setDoc(targetRef, { items: updatedMeasures, lastUpdated: serverTimestamp() }, { merge: true });
    }, [currentUser, isAdmin, isAdminMode]);
    
    const handleResetLibrary = async () => {
        setLoading(true);
        await saveMeasures(defaultMeasures);
        setMeasures(defaultMeasures);
        setLoading(false);
        setResetConfirmOpen(false);
    };

    const handleAddMeasure = () => {
        if (newMeasure.text.trim() === '') return;
        const newMeasureItem = { id: generateUniqueId(), ...newMeasure };
        const updatedMeasures = [...measures, newMeasureItem];
        setMeasures(updatedMeasures);
        saveMeasures(updatedMeasures);
        setNewMeasure({ text: '', isPrevention: true, isDetection: false, isReaction: false, applicableRisks: [] });
    };
    
    const handleRemoveMeasure = (id) => {
        const updatedMeasures = measures.filter(m => m.id !== id);
        setMeasures(updatedMeasures);
        saveMeasures(updatedMeasures);
    };

    const handleEdit = (measure) => {
        setEditingId(measure.id);
        setEditingData({...measure, applicableRisks: measure.applicableRisks || []});
    };

    const handleSaveEdit = () => {
        const updatedMeasures = measures.map(m => m.id === editingId ? editingData : m);
        setMeasures(updatedMeasures);
        saveMeasures(updatedMeasures);
        setEditingId(null);
        setEditingData(null);
    };
    
    const handleEditingCheckboxChange = (field) => {
        setEditingData(prev => ({...prev, [field]: !prev[field]}));
    };
    
    const handleNewCheckboxChange = (field) => {
        setNewMeasure(prev => ({...prev, [field]: !prev[field]}));
    };

    if (loading) return <div className="p-8 flex justify-center"><CircularProgress /></div>;

    return (
        <div className="p-8">
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                 <Typography variant="h4" component="h1" className="font-bold">
                    {isAdmin && isAdminMode ? 'Globální knihovna (Šablona)' : 'Moje knihovna opatření'}
                </Typography>
                 <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        variant="outlined"
                        color="secondary"
                        startIcon={<Refresh />}
                        onClick={() => setResetConfirmOpen(true)}
                    >
                        Resetovat knihovnu
                    </Button>
                    {isAdmin && (
                        <FormControlLabel
                            control={<Switch checked={isAdminMode} onChange={(e) => setIsAdminMode(e.target.checked)} />}
                            label={<Box display="flex" alignItems="center"><AdminPanelSettings fontSize="small" sx={{mr: 1}}/> Admin režim</Box>}
                        />
                    )}
                 </Box>
            </Box>
            {isAdmin && (
                <Alert severity="info" variant="outlined" sx={{ my: 2 }}>
                    <span>
                        Jste v {isAdminMode ? <strong>administrátorském režimu</strong> : <strong>uživatelském režimu</strong>}
                        {' a upravujete '}
                        {isAdminMode ? 'globální šablonu pro všechny nové uživatele.' : 'pouze svoji osobní knihovnu.'}
                    </span>
                </Alert>
            )}

            <Paper elevation={2} className="p-6 mt-4">
                 <div className="grid grid-cols-12 gap-4 font-semibold text-gray-600 border-b pb-2 mb-2">
                    <div className="col-span-4">Opatření</div>
                    <div className="col-span-3 text-center">Typ (P/D/R)</div>
                    <div className="col-span-4">Relevantní pro rizika</div>
                    <div className="col-span-1 text-center">Akce</div>
                </div>

                <div className="divide-y">
                    {measures.map(m => (
                        <div key={m.id} className="grid grid-cols-12 gap-4 items-start py-3">
                           {editingId === m.id ? (
                                <div className="col-span-12 space-y-3 p-4 bg-blue-50 rounded-lg">
                                     <TextField label="Text opatření" value={editingData.text} onChange={(e) => setEditingData({...editingData, text: e.target.value})} size="small" fullWidth />
                                     <FormGroup row className="justify-center">
                                        <FormControlLabel control={<Checkbox checked={!!editingData.isPrevention} onChange={() => handleEditingCheckboxChange('isPrevention')} />} label="Prevence" />
                                        <FormControlLabel control={<Checkbox checked={!!editingData.isDetection} onChange={() => handleEditingCheckboxChange('isDetection')} />} label="Detekce" />
                                        <FormControlLabel control={<Checkbox checked={!!editingData.isReaction} onChange={() => handleEditingCheckboxChange('isReaction')} />} label="Reakce" />
                                    </FormGroup>
                                     <FormControl fullWidth size="small">
                                        <InputLabel>Přiřazená rizika</InputLabel>
                                        <Select multiple value={editingData.applicableRisks || []} onChange={(e) => setEditingData({...editingData, applicableRisks: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value})} input={<OutlinedInput label="Přiřazená rizika" />} renderValue={(selected) => <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map((value) => (<Chip key={value} label={value} size="small" />))}</Box>}>
                                            {allPossibleRisks.map((risk) => ( <MenuItem key={risk} value={risk}> <Checkbox checked={(editingData.applicableRisks || []).indexOf(risk) > -1} /> <ListItemText primary={risk} /> </MenuItem> ))}
                                        </Select>
                                    </FormControl>
                                     <Button onClick={handleSaveEdit} size="small" variant="contained" startIcon={<Save />}>Uložit změny</Button>
                                </div>
                            ) : (
                                <>
                                    <div className="col-span-4 font-medium self-center">{m.text}</div>
                                    <div className="col-span-3 text-center self-center">
                                        <Chip label="P" size="small" color={m.isPrevention ? "primary" : "default"} sx={{mr: 0.5}} />
                                        <Chip label="D" size="small" color={m.isDetection ? "warning" : "default"} sx={{mr: 0.5}} />
                                        <Chip label="R" size="small" color={m.isReaction ? "error" : "default"} />
                                    </div>
                                    <div className="col-span-4 self-center">
                                         <Box className="flex flex-wrap gap-1">
                                            {(m.applicableRisks || []).map(risk => <Chip key={risk} label={risk} size="small" variant="outlined" />)}
                                        </Box>
                                    </div>
                                    <div className="col-span-1 flex items-center justify-end self-center">
                                        <IconButton onClick={() => handleEdit(m)} size="small" title="Upravit"><Edit /></IconButton>
                                        <IconButton onClick={() => handleRemoveMeasure(m.id)} size="small" title="Smazat"><Delete /></IconButton>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
                 <div className="border-t pt-4 mt-6">
                    <Typography variant="h6" className="font-semibold mb-2">Přidat nové opatření</Typography>
                    <div className="space-y-4">
                        <TextField label="Text nového opatření" value={newMeasure.text} onChange={(e) => setNewMeasure(prev => ({...prev, text: e.target.value}))} fullWidth variant="outlined" size="small" />
                        <FormGroup row>
                            <Typography className="mr-4 self-center">Zařadit do:</Typography>
                            <FormControlLabel control={<Checkbox checked={newMeasure.isPrevention} onChange={() => handleNewCheckboxChange('isPrevention')} />} label="Prevence" />
                            <FormControlLabel control={<Checkbox checked={newMeasure.isDetection} onChange={() => handleNewCheckboxChange('isDetection')} />} label="Detekce" />
                            <FormControlLabel control={<Checkbox checked={newMeasure.isReaction} onChange={() => handleNewCheckboxChange('isReaction')} />} label="Reakce" />
                        </FormGroup>
                        <FormControl size="small" variant="outlined" fullWidth>
                            <InputLabel>Přiřazená rizika</InputLabel>
                            <Select multiple value={newMeasure.applicableRisks} onChange={(e) => setNewMeasure(prev => ({...prev, applicableRisks: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value}))} input={<OutlinedInput label="Přiřazená rizika" />} renderValue={(selected) => <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map((value) => (<Chip key={value} label={value} size="small" />))}</Box>}>
                                {allPossibleRisks.map((risk) => ( <MenuItem key={risk} value={risk}> <Checkbox checked={(newMeasure.applicableRisks || []).indexOf(risk) > -1} /> <ListItemText primary={risk} /> </MenuItem> ))}
                            </Select>
                        </FormControl>
                        <Button onClick={handleAddMeasure} variant="contained" startIcon={<Add />}>Přidat do knihovny</Button>
                    </div>
                </div>
            </Paper>

            <Dialog
                open={resetConfirmOpen}
                onClose={() => setResetConfirmOpen(false)}
            >
                <DialogTitle>Opravdu resetovat knihovnu?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tato akce trvale přepíše vaši současnou <strong>{isAdminMode ? 'globální' : 'osobní'}</strong> knihovnu
                        výchozí šablonou obsahující 22 opatření. Všechny vaše vlastní úpravy budou ztraceny.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetConfirmOpen(false)}>Zrušit</Button>
                    <Button onClick={handleResetLibrary} color="error" autoFocus>
                        Ano, resetovat
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default ProjectRiskMapping;
