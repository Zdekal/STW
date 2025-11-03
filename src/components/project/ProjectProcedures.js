import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
    TextField,
    CircularProgress,
    Chip,
    FormControlLabel,
    Switch
} from '@mui/material';
import { ExpandMore, CloudDone } from '@mui/icons-material';

// --- DOPORUČENÉ POSTUPY (extrahováno z tvého .docx souboru) ---
const defaultProcedures = {
    'závažné narušení': {
        immediateReaction: "1. Vyhodnotit závažnost (1-lze odstranit, 2-lze objet, 3-nelze pokračovat).\n2. Informovat telefonicky vedoucího úseku.\n3. Dbát na vlastní bezpečnost.\n4. Při závažnosti 3 se řídit pokyny vedení závodu.",
        coordTeamReaction: "Při závažnosti 3 je aktivován Koordinační tým a postupuje dle koordinačního plánu."
    },
    'hromadný pád': {
        immediateReaction: "1. Dbát na vlastní bezpečnost.\n2. Informovat velitele trati o situaci (počet zraněných, průjezdnost).\n3. Poskytnout první pomoc a být nápomocný dle pokynů.\n4. Nefotit nehodu ani závodníky.",
        coordTeamReaction: "Svolat poradu úzkého týmu (Event Director, Race Director, atd.) k zvážení dalšího postupu dle závažnosti."
    },
    'agresivní chování': {
        immediateReaction: "Verbální agrese:\n1. Deeskalovat situaci klidnou komunikací.\n2. Nabídnout přivolání nadřízeného.\n3. Informovat velitele trati.\n\nFyzické napadení:\n1. Izolovat incident (zaměřit se na přihlížející).\n2. Přivolat pomoc (PČR, MP).\n3. Informovat velitele trati.",
        coordTeamReaction: ""
    },
    'podezřelého předmětu': {
        immediateReaction: "1. S předmětem nakládat jako s reálnou hrozbou.\n2. NEDOTÝKAT SE a vzdálit se do bezpečí.\n3. Varovat ostatní v okolí a informovat velitele trati / Event Directora.\n4. Informovat PČR (linka 158).",
        coordTeamReaction: "Je aktivován Koordinační plán. Zahájit přípravu na možnou evakuaci a varování veřejnosti."
    },
    'nájezd vozidla': {
        immediateReaction: "1. Informovat PČR (linka 158).\n2. Varovat ostatní pracovníky v okolí a nahlásit Event Directorovi.\n3. Zajistit varování a instrukce veřejnosti (např. aparaturou).\n4. Zahájit evakuaci směrem od vozidla.\n5. Poskytnout první pomoc.",
        coordTeamReaction: "Je aktivován Koordinační plán. Spolupracovat s IZS na místě a řídit evakuaci."
    },
    'anonymní oznámení': {
        immediateReaction: "1. Zapsat telefonní číslo, pokud je to možné.\n2. Prodlužovat hovor a získat co nejvíce informací (kde, kdy, jak, proč).\n3. Všímat si hlasu a zvuků v pozadí.\n4. Ihned informovat Event Directora a PČR.",
        coordTeamReaction: "Je aktivován Koordinační plán. Postupovat dle instrukcí PČR."
    }
};

// Funkce pro nalezení správné nápovědy
const findPlaceholder = (riskName) => {
    const lowerCaseName = riskName.toLowerCase();
    for (const key in defaultProcedures) {
        if (lowerCaseName.includes(key)) {
            return defaultProcedures[key];
        }
    }
    return { immediateReaction: 'Popište kroky pro první osobu na místě...', coordTeamReaction: 'Popište kroky pro krizový štáb...' };
};

// --- Komponenty ---
const SaveStatusIndicator = ({ status }) => {
    if (status === 'Uloženo') return <Chip icon={<CloudDone />} label="Všechny změny uloženy" size="small" />;
    if (status === 'Ukládám...') return <Chip icon={<CircularProgress size={16} />} label="Ukládám..." size="small" variant="outlined" />;
    return null;
};

function ProjectProcedures() {
    const { id: projectId } = useParams();
    const [checkedRisks, setCheckedRisks] = useState([]);
    const [procedures, setProcedures] = useState({});
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('Načteno');
    const initialLoadRef = React.useRef(true);

    useEffect(() => {
        if (!projectId) return;
        const projectDocRef = doc(db, 'projects', projectId);
        const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCheckedRisks(data.risks || []);
                setProcedures(data.riskProcedures || {});
            }
            setLoading(false);
        }, (error) => {
            console.error("Chyba při načítání dat pro krizové postupy:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    const saveData = useCallback(async (dataToSave) => {
        if (!dataToSave || !projectId) return;
        const projectRef = doc(db, 'projects', projectId);
        try {
            await updateDoc(projectRef, { riskProcedures: dataToSave, lastEdited: serverTimestamp() });
            setSaveStatus('Uloženo');
        } catch (error) { console.error("Chyba při ukládání postupů:", error); }
    }, [projectId]);

    useEffect(() => {
        if (initialLoadRef.current) { initialLoadRef.current = false; return; }
        if (loading) return;
        setSaveStatus('Ukládám...');
        const handler = setTimeout(() => { saveData(procedures); }, 1500);
        return () => clearTimeout(handler);
    }, [procedures, loading, saveData]);

    const handleProcedureChange = (riskId, field, value) => {
        setProcedures(prev => ({
            ...prev,
            [riskId]: { ...(prev[riskId] || {}), [field]: value, },
        }));
    };

    if (loading) {
        return <Box className="flex justify-center items-center p-8"><CircularProgress /></Box>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <Typography variant="h4" component="h1" className="font-bold text-gray-800">
                    Krizové postupy
                </Typography>
                <SaveStatusIndicator status={saveStatus} />
            </div>
            <Typography>
                Pro každé identifikované riziko zde definujte konkrétní postupy. Pro běžné incidenty jsou předvyplněny doporučené kroky jako nápověda.
            </Typography>
            <div className="space-y-4">
                {checkedRisks.length > 0 ? (
                    checkedRisks.map(risk => {
                        const placeholders = findPlaceholder(risk.name);
                        return (
                            <Accordion key={risk.id} TransitionProps={{ unmountOnExit: true }} defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMore />} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                                    <Typography variant="h6">{risk.name}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <Box className="space-y-4">
                                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                Okamžitá reakce
                                            </Typography>
                                            <TextField
                                                multiline
                                                rows={10}
                                                fullWidth
                                                variant="outlined"
                                                placeholder={placeholders.immediateReaction}
                                                value={procedures[risk.id]?.immediateReaction || ''}
                                                onChange={(e) => handleProcedureChange(risk.id, 'immediateReaction', e.target.value)}
                                                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={!!procedures[risk.id]?.activateCoordTeam}
                                                        onChange={(e) => handleProcedureChange(risk.id, 'activateCoordTeam', e.target.checked)}
                                                    />
                                                }
                                                label="Aktivovat reakci koordinačního týmu"
                                            />
                                        </Box>
                                        <Box>
                                            {procedures[risk.id]?.activateCoordTeam && (
                                                <Box className="animate-fade-in">
                                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                        Reakce koordinačního týmu
                                                    </Typography>
                                                    <TextField
                                                        multiline
                                                        rows={10}
                                                        fullWidth
                                                        variant="outlined"
                                                        placeholder={placeholders.coordTeamReaction}
                                                        value={procedures[risk.id]?.coordTeamReaction || ''}
                                                        onChange={(e) => handleProcedureChange(risk.id, 'coordTeamReaction', e.target.value)}
                                                        sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'white' } }}
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })
                ) : (
                    <Typography className="p-8 text-center border-2 border-dashed rounded-lg text-gray-500">
                        Na stránce "Zvažovaná rizika" zatím nejsou aktivní žádná rizika. Přejděte prosím na analýzu rizik a vyberte relevantní hrozby.
                    </Typography>
                )}
            </div>
        </div>
    );
}

export default ProjectProcedures;