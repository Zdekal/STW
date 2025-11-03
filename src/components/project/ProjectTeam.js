import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
    Typography, Box, TextField, CircularProgress, Chip, Button, IconButton, Paper, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Radio, RadioGroup, FormControlLabel
} from '@mui/material';
import { CloudDone, AddCircleOutline, Delete } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

// --- VÝCHOZÍ DATA (zůstávají pro inicializaci) ---
const defaultStaffMembers = [
    { id: uuidv4(), role: "Předseda", description: "Reprezentuje tým navenek, má rozhodující slovo.", name: "", phone: "", email: "", isDefault: true },
    { id: uuidv4(), role: "Manažer krizového týmu", description: "Řídí koordinační tým, zodpovídá za agendu bezpečnosti.", name: "", phone: "", email: "", isDefault: true },
    { id: uuidv4(), role: "Sportovní koordinátor", description: "Koordinace se sportovní částí závodu.", name: "", phone: "", email: "", isDefault: true },
    { id: uuidv4(), role: "Koordinátor s IZS", description: "Komunikace s Integrovaným záchranným systémem.", name: "", phone: "", email: "", isDefault: true },
    { id: uuidv4(), role: "Interní komunikace", description: "Komunikace s týmem, partnery a lidmi na trati.", name: "", phone: "", email: "", isDefault: true },
    { id: uuidv4(), role: "Externí komunikace (PR)", description: "Komunikace směrem k médiím a veřejnosti.", name: "", phone: "", email: "", isDefault: true },
    { id: uuidv4(), role: "Logistika", description: "Stará se o technické vybavení a potřeby koordinačního centra.", name: "", phone: "", email: "", isDefault: true },
    { id: uuidv4(), role: "Koordinátor v místě incidentu", description: "Zůstává na místě incidentu a podává zprávy do KC.", name: "", phone: "", email: "", isDefault: true },
    { id: uuidv4(), role: "Zapisovatel", description: "Zaznamenává klíčové informace a rozhodnutí v KC.", name: "Ad hoc", phone: "", email: "", isDefault: true },
];

// --- KOMPONENTY ---
const SaveStatusIndicator = ({ status }) => {
    if (status === 'Uloženo') return <Chip icon={<CloudDone />} label="Všechny změny uloženy" size="small" />;
    if (status === 'Ukládám...') return <Chip icon={<CircularProgress size={16} />} label="Ukládám..." size="small" variant="outlined" />;
    return null;
};

function ProjectTeam() {
    const { id: projectId } = useParams();
    const [plan, setPlan] = useState(null);
    const [projectRisks, setProjectRisks] = useState([]);
    const [riskProcedures, setRiskProcedures] = useState({}); // <-- NOVÝ STAV pro data z Krizových postupů
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('Načteno');
    const initialLoadRef = React.useRef(true);

    // Načítáme data projektu včetně pole rizik A procedur
    useEffect(() => {
        if (!projectId) return;
        const projectDocRef = doc(db, 'projects', projectId);
        const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProjectRisks(data.risks || []);
                setRiskProcedures(data.riskProcedures || {}); // <-- Načtení dat z Krizových postupů

                if (data.crisisStaffPlan) {
                    setPlan(data.crisisStaffPlan);
                } else {
                    // Inicializace
                    setPlan({
                        staffMembers: defaultStaffMembers,
                        activationMethod: "V případě závažného incidentu si členové koordinačního týmu volají navzájem. Dále je zřízena WhatsApp skupina pro rychlé sdílení informací.",
                        incidentTriggers: { automatic: [], manual: [] },
                        coordinationCenters: [{ id: uuidv4(), stage: 'Etapa 1', primaryLocation: '', secondaryLocation: '' }]
                    });
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    // --- ZMĚNA ZDE: Vytvoříme filtrovaný seznam rizik pro zobrazení ---
    const triggerableRisks = useMemo(() => {
        // Zobrazíme jen ta rizika, která mají v postupech zaškrtnutou aktivaci týmu
        return projectRisks.filter(risk => riskProcedures[risk.id]?.activateCoordTeam === true);
    }, [projectRisks, riskProcedures]);


    // Automatické ukládání (beze změny)
    const saveData = useCallback(async (dataToSave) => {
        if (!dataToSave || !projectId) return;
        const projectRef = doc(db, 'projects', projectId);
        try {
            await updateDoc(projectRef, { crisisStaffPlan: dataToSave, lastEdited: serverTimestamp() });
            setSaveStatus('Uloženo');
        } catch (error) { console.error("Chyba při ukládání Krizového štábu:", error); }
    }, [projectId]);

    useEffect(() => {
        if (initialLoadRef.current) { initialLoadRef.current = false; return; }
        if (loading || !plan) return;
        setSaveStatus('Ukládám...');
        const handler = setTimeout(() => { saveData(plan); }, 2000);
        return () => clearTimeout(handler);
    }, [plan, loading, saveData]);

    // Handlery pro úpravy (beze změny)
    const handleTriggerChange = (riskId, activationType) => {
        const newTriggers = {
            automatic: [...(plan.incidentTriggers.automatic || [])].filter(id => id !== riskId),
            manual: [...(plan.incidentTriggers.manual || [])].filter(id => id !== riskId),
        };
        if (activationType === 'automatic') newTriggers.automatic.push(riskId);
        else if (activationType === 'manual') newTriggers.manual.push(riskId);
        handlePlanChange('incidentTriggers', newTriggers);
    };
    const handlePlanChange = (field, value) => setPlan(prev => ({ ...prev, [field]: value }));
    const handleMemberChange = (id, field, value) => {
        const newMembers = plan.staffMembers.map(m => m.id === id ? { ...m, [field]: value } : m);
        handlePlanChange('staffMembers', newMembers);
    };
    const handleAddMember = () => {
        const newMember = { id: uuidv4(), role: 'Nová pozice', description: '', name: '', phone: '', email: '', isDefault: false };
        handlePlanChange('staffMembers', [...plan.staffMembers, newMember]);
    };
    const handleRemoveMember = (id) => handlePlanChange('staffMembers', plan.staffMembers.filter(m => m.id !== id));
    const handleCenterChange = (id, field, value) => {
        const newCenters = plan.coordinationCenters.map(c => c.id === id ? { ...c, [field]: value } : c);
        handlePlanChange('coordinationCenters', newCenters);
    };
    const handleAddCenter = () => {
        const newCenter = { id: uuidv4(), stage: `Etapa ${plan.coordinationCenters.length + 1}`, primaryLocation: '', secondaryLocation: '' };
        handlePlanChange('coordinationCenters', [...plan.coordinationCenters, newCenter]);
    };
    const handleRemoveCenter = (id) => {
        if (plan.coordinationCenters.length <= 1) return;
        handlePlanChange('coordinationCenters', plan.coordinationCenters.filter(c => c.id !== id));
    };

    if (loading || !plan) {
        return <Box className="flex justify-center items-center p-8"><CircularProgress /></Box>;
    }

    return (
        <Box className="space-y-8">
            <Box className="flex justify-between items-start">
                <Typography variant="h4" component="h1" className="font-bold text-gray-800">Plán Krizového štábu</Typography>
                <SaveStatusIndicator status={saveStatus} />
            </Box>

            {/* --- Sekce 1 a 2 (beze změny) --- */}
            <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>1. Složení Krizového štábu</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead><TableRow><TableCell sx={{fontWeight:'bold'}}>Role</TableCell><TableCell sx={{fontWeight:'bold'}}>Jméno</TableCell><TableCell sx={{fontWeight:'bold'}}>Telefon</TableCell><TableCell sx={{fontWeight:'bold'}}>E-mail</TableCell><TableCell></TableCell></TableRow></TableHead>
                        <TableBody>
                            {plan.staffMembers.map((member) => (
                                <TableRow key={member.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell><TextField variant="standard" fullWidth value={member.role} onChange={(e) => handleMemberChange(member.id, 'role', e.target.value)} disabled={member.isDefault} /><Typography variant="caption" color="text.secondary">{member.description}</Typography></TableCell>
                                    <TableCell><TextField variant="standard" fullWidth value={member.name} onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)} /></TableCell>
                                    <TableCell><TextField variant="standard" fullWidth value={member.phone} onChange={(e) => handleMemberChange(member.id, 'phone', e.target.value)} /></TableCell>
                                    <TableCell><TextField variant="standard" fullWidth value={member.email} onChange={(e) => handleMemberChange(member.id, 'email', e.target.value)} /></TableCell>
                                    <TableCell>{!member.isDefault && (<Tooltip title="Smazat pozici"><IconButton size="small" onClick={() => handleRemoveMember(member.id)}><Delete /></IconButton></Tooltip>)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Button startIcon={<AddCircleOutline />} onClick={handleAddMember} sx={{ mt: 2 }}>Přidat člena / pozici</Button>
            </Paper>
            <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>2. Způsob aktivace štábu</Typography>
                <TextField multiline rows={3} fullWidth variant="outlined" label="Popište, jak je štáb svoláván" value={plan.activationMethod} onChange={(e) => handlePlanChange('activationMethod', e.target.value)} />
            </Paper>
            
            {/* --- ZMĚNA ZDE: Sekce 3 nyní používá filtrovaný seznam rizik --- */}
            <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>3. Incidenty vedoucí k aktivaci</Typography>
                <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                    Tento seznam se automaticky generuje podle rizik, u kterých jste v sekci "Krizové postupy" zaškrtli, že mají aktivovat koordinační tým.
                </Typography>

                {triggerableRisks.length > 0 ? (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Riziko / Incident</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Způsob aktivace</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {triggerableRisks.map((risk) => {
                                    const automatic = (plan.incidentTriggers.automatic || []).includes(risk.id);
                                    const manual = (plan.incidentTriggers.manual || []).includes(risk.id);
                                    let currentValue = 'none';
                                    if (automatic) currentValue = 'automatic';
                                    if (manual) currentValue = 'manual';

                                    return (
                                    <TableRow key={risk.id}>
                                        <TableCell><Typography>{risk.name}</Typography></TableCell>
                                        <TableCell>
                                            <RadioGroup row value={currentValue} onChange={(e) => handleTriggerChange(risk.id, e.target.value)} sx={{justifyContent: 'center'}}>
                                                <FormControlLabel value="none" control={<Radio />} label="Neaktivuje" />
                                                <FormControlLabel value="automatic" control={<Radio />} label="Automaticky" />
                                                <FormControlLabel value="manual" control={<Radio />} label="Manuálně" />
                                            </RadioGroup>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Typography className="p-4 text-center border-2 border-dashed rounded-lg text-gray-500">
                        Zatím žádný krizový postup neobsahuje pokyn k aktivaci krizového štábu.
                    </Typography>
                )}
            </Paper>

            {/* --- Sekce 4 (beze změny) --- */}
            <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>4. Plán Koordinačních center</Typography>
                <Box className="space-y-4">
                {plan.coordinationCenters.map((center, index) => (
                    <Paper key={center.id} variant="outlined" sx={{ p: 2 }}>
                         <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                             <Typography variant="h6">Centrum {index + 1}</Typography>
                             <Tooltip title="Smazat centrum"><IconButton size="small" onClick={() => handleRemoveCenter(center.id)} disabled={plan.coordinationCenters.length <= 1}><Delete /></IconButton></Tooltip>
                         </Box>
                         <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <TextField label="Etapa / Místo" variant="outlined" value={center.stage} onChange={(e) => handleCenterChange(center.id, 'stage', e.target.value)} />
                            <TextField label="Primární KC-1 (Adresa, popis)" variant="outlined" value={center.primaryLocation} onChange={(e) => handleCenterChange(center.id, 'primaryLocation', e.target.value)} />
                            <TextField label="Sekundární KC-2 (Adresa, popis)" variant="outlined" value={center.secondaryLocation} onChange={(e) => handleCenterChange(center.id, 'secondaryLocation', e.target.value)} />
                         </Box>
                    </Paper>
                ))}
                </Box>
                <Button startIcon={<AddCircleOutline />} onClick={handleAddCenter} sx={{ mt: 2 }}>Přidat koordinační centrum</Button>
            </Paper>
        </Box>
    );
}

export default ProjectTeam;