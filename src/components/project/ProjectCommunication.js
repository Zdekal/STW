import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
    Typography, Box, TextField, CircularProgress, Chip, Button, IconButton, Paper, Divider, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { CloudDone, AddCircleOutline, Delete, ExpandMore } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

// --- Komponenty ---
const SaveStatusIndicator = ({ status }) => {
    if (status === 'Uloženo') return <Chip icon={<CloudDone />} label="Všechny změny uloženy" size="small" />;
    if (status === 'Ukládám...') return <Chip icon={<CircularProgress size={16} />} label="Ukládám..." size="small" variant="outlined" />;
    return null;
};

// Komponenta pro jednu fázi komunikace
const CommunicationPhase = ({ title, time, phaseKey, scenarioId, phaseData, onPhaseChange }) => (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{mt: -1, mb: 2}}>{time}</Typography>
        <TextField
            label="Komunikační kanály"
            fullWidth
            variant="outlined"
            size="small"
            value={phaseData.channels || ''}
            onChange={(e) => onPhaseChange(scenarioId, phaseKey, 'channels', e.target.value)}
            helperText="Např. SMS, sociální sítě, web, e-mail..."
            sx={{ mb: 2 }}
        />
        <TextField
            label="Cílové skupiny"
            fullWidth
            variant="outlined"
            size="small"
            value={phaseData.groups || ''}
            onChange={(e) => onPhaseChange(scenarioId, phaseKey, 'groups', e.target.value)}
            helperText="Např. personál, návštěvníci, média, IZS..."
            sx={{ mb: 2 }}
        />
        <TextField
            label="Předpřipravená zpráva / Šablona"
            multiline
            rows={5}
            fullWidth
            variant="outlined"
            value={phaseData.messageTemplate || ''}
            onChange={(e) => onPhaseChange(scenarioId, phaseKey, 'messageTemplate', e.target.value)}
        />
    </Paper>
);

function ProjectCommunication() {
    const { id: projectId } = useParams();
    const [plan, setPlan] = useState(null);
    const [involvedTeams, setInvolvedTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('Načteno');
    const initialLoadRef = React.useRef(true);

    // Načítání dat z Firestore
    useEffect(() => {
        if (!projectId) return;
        const projectDocRef = doc(db, 'projects', projectId);
        const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Načteme týmy ze základních údajů
                const teamsFromDb = data.involvedTeams ? Object.keys(data.involvedTeams).filter(key => data.involvedTeams[key]) : [];
                setInvolvedTeams(teamsFromDb);

                // Inicializujeme plán komunikace, pokud neexistuje
                if (data.crisisCommunicationPlan) {
                    // Zajistíme, že interní kontakty jsou synchronizované s týmy
                    const syncedContacts = teamsFromDb.reduce((acc, teamName) => {
                        acc[teamName] = data.crisisCommunicationPlan.internalContacts?.[teamName] || '';
                        return acc;
                    }, {});
                    setPlan({ ...data.crisisCommunicationPlan, internalContacts: syncedContacts });
                } else {
                    const initialContacts = teamsFromDb.reduce((acc, teamName) => ({...acc, [teamName]: ''}), {});
                    setPlan({
                        mediaSpokesperson: { name: '', phone: '' },
                        internalContacts: initialContacts,
                        scenarios: [{
                            id: uuidv4(),
                            title: 'Výchozí scénář (např. požár)',
                            phases: {
                                immediate: { channels: '', groups: '', messageTemplate: '' },
                                summary: { channels: '', groups: '', messageTemplate: '' },
                                followUp: { channels: '', groups: '', messageTemplate: '' },
                            }
                        }]
                    });
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    // Automatické ukládání
    const saveData = useCallback(async (dataToSave) => {
        if (!dataToSave || !projectId) return;
        const projectRef = doc(db, 'projects', projectId);
        try {
            await updateDoc(projectRef, { crisisCommunicationPlan: dataToSave, lastEdited: serverTimestamp() });
            setSaveStatus('Uloženo');
        } catch (error) { console.error("Chyba při ukládání komunikačního plánu:", error); }
    }, [projectId]);

    useEffect(() => {
        if (initialLoadRef.current) { initialLoadRef.current = false; return; }
        if (loading || !plan) return;
        setSaveStatus('Ukládám...');
        const handler = setTimeout(() => { saveData(plan); }, 2000);
        return () => clearTimeout(handler);
    }, [plan, loading, saveData]);

    // Handlery pro úpravy
    const handlePlanChange = (field, value) => setPlan(prev => ({ ...prev, [field]: value }));
    const handleSpokespersonChange = (field, value) => handlePlanChange('mediaSpokesperson', { ...plan.mediaSpokesperson, [field]: value });
    const handleInternalContactChange = (teamName, value) => handlePlanChange('internalContacts', { ...plan.internalContacts, [teamName]: value });
    
    const handleAddScenario = () => {
        const newScenario = {
            id: uuidv4(), title: 'Nový scénář',
            phases: { immediate: {}, summary: {}, followUp: {} }
        };
        handlePlanChange('scenarios', [...plan.scenarios, newScenario]);
    };

    const handleRemoveScenario = (id) => {
        if(window.confirm('Opravdu smazat tento scénář?')) {
            handlePlanChange('scenarios', plan.scenarios.filter(s => s.id !== id));
        }
    };
    
    const handleScenarioChange = (id, field, value) => {
        const newScenarios = plan.scenarios.map(s => s.id === id ? { ...s, [field]: value } : s);
        handlePlanChange('scenarios', newScenarios);
    };

    const handlePhaseChange = (scenarioId, phaseKey, field, value) => {
        const newScenarios = plan.scenarios.map(s => {
            if (s.id === scenarioId) {
                return { ...s, phases: { ...s.phases, [phaseKey]: { ...(s.phases[phaseKey] || {}), [field]: value } } };
            }
            return s;
        });
        handlePlanChange('scenarios', newScenarios);
    };


    if (loading || !plan) {
        return <Box className="flex justify-center items-center p-8"><CircularProgress /></Box>;
    }

    return (
        <Box className="space-y-8">
            <Box className="flex justify-between items-start">
                <Typography variant="h4" component="h1" className="font-bold text-gray-800">
                    Krizová komunikace
                </Typography>
                <SaveStatusIndicator status={saveStatus} />
            </Box>
            
            {/* --- Sekce: Mluvčí a Interní kontakty --- */}
            <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>Klíčové kontakty</Typography>
                <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Box>
                        <Typography variant="h6" gutterBottom>Mluvčí pro média</Typography>
                        <TextField label="Jméno a příjmení" fullWidth variant="outlined" size="small" value={plan.mediaSpokesperson.name} onChange={(e) => handleSpokespersonChange('name', e.target.value)} sx={{mb:2}} />
                        <TextField label="Kontaktní mobil" fullWidth variant="outlined" size="small" value={plan.mediaSpokesperson.phone} onChange={(e) => handleSpokespersonChange('phone', e.target.value)} />
                    </Box>
                    <Box>
                        <Typography variant="h6" gutterBottom>Kontakty pro interní komunikaci</Typography>
                        <Box sx={{maxHeight: 200, overflowY: 'auto', pr: 1}}>
                        {involvedTeams.length > 0 ? involvedTeams.map(team => (
                            <TextField key={team} label={team} fullWidth variant="outlined" size="small" placeholder="Jméno kontaktní osoby..." value={plan.internalContacts[team] || ''} onChange={(e) => handleInternalContactChange(team, e.target.value)} sx={{mb:2}} />
                        )) : <Typography variant="body2" color="text.secondary">V sekci "Základní údaje" zatím nebyly vybrány žádné týmy.</Typography>}
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* --- Sekce: Komunikační scénáře --- */}
            <Box>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                    <Typography variant="h5">Komunikační scénáře</Typography>
                    <Button variant="contained" startIcon={<AddCircleOutline />} onClick={handleAddScenario}>Přidat scénář</Button>
                </Box>
                
                <Box className="space-y-4">
                    {plan.scenarios.map(scenario => (
                        <Accordion key={scenario.id} TransitionProps={{ unmountOnExit: true }} defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                <TextField fullWidth variant="standard" value={scenario.title} onClick={(e) => e.stopPropagation()} onChange={(e) => handleScenarioChange(scenario.id, 'title', e.target.value)} InputProps={{ style: { fontSize: '1.5rem', fontWeight: 'bold' }, disableUnderline: true }} />
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRemoveScenario(scenario.id); }}><Delete /></IconButton>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <CommunicationPhase title="1. Okamžité varování" time="do 15 minut" phaseKey="immediate" scenarioId={scenario.id} phaseData={scenario.phases.immediate || {}} onPhaseChange={handlePhaseChange} />
                                    <CommunicationPhase title="2. První shrnutí" time="do 2 hodin" phaseKey="summary" scenarioId={scenario.id} phaseData={scenario.phases.summary || {}} onPhaseChange={handlePhaseChange} />
                                    <CommunicationPhase title="3. Následná komunikace" time="do večera" phaseKey="followUp" scenarioId={scenario.id} phaseData={scenario.phases.followUp || {}} onPhaseChange={handlePhaseChange} />
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}

export default ProjectCommunication;