import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import {
    Checkbox,
    FormControlLabel,
    FormGroup,
    CircularProgress,
    Chip,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box
} from '@mui/material';
import { ExpandMore, CloudDone, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';

// Indikátor stavu uložení
const SaveStatusIndicator = ({ status }) => {
    if (status === 'Uloženo') return <Chip icon={<CloudDone />} label="Všechny změny uloženy" size="small" />;
    if (status === 'Ukládám...') return <Chip icon={<CircularProgress size={16} />} label="Ukládám..." size="small" variant="outlined" />;
    return null;
};

// Indikátor pokrytí rizika (P/D/R)
const CoverageIndicator = ({ risk, selectedMeasures, measuresLibrary }) => {
    const relevantMeasures = useMemo(() => ({
        prevence: measuresLibrary.prevence.filter(m => !m.applicableRisks || m.applicableRisks.length === 0 || m.applicableRisks.includes(risk.name)),
        detekce: measuresLibrary.detekce.filter(m => !m.applicableRisks || m.applicableRisks.length === 0 || m.applicableRisks.includes(risk.name)),
        reakce: measuresLibrary.reakce.filter(m => !m.applicableRisks || m.applicableRisks.length === 0 || m.applicableRisks.includes(risk.name)),
    }), [risk.name, measuresLibrary]);

    const coverage = useMemo(() => ({
        P: relevantMeasures.prevence.length > 0 && relevantMeasures.prevence.some(measure => selectedMeasures[measure.name]),
        D: relevantMeasures.detekce.length > 0 && relevantMeasures.detekce.some(measure => selectedMeasures[measure.name]),
        R: relevantMeasures.reakce.length > 0 && relevantMeasures.reakce.some(measure => selectedMeasures[measure.name]),
    }), [relevantMeasures, selectedMeasures]);

    const Indicator = ({ label, isCovered }) => (
        <Chip icon={isCovered ? <CheckCircle sx={{ color: 'white !important' }} /> : <RadioButtonUnchecked />} label={label} size="small" sx={{ backgroundColor: isCovered ? 'success.main' : 'grey.300', color: isCovered ? 'white' : 'grey.700', fontWeight: 'bold', pointerEvents: 'none' }} />
    );

    return (
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Indicator label="P" isCovered={coverage.P} />
            <Indicator label="D" isCovered={coverage.D} />
            <Indicator label="R" isCovered={coverage.R} />
        </Box>
    );
};

function ProjectMeasures() {
    const { id: projectId } = useParams();
    const { currentUser } = useAuth();
    const [checkedRisks, setCheckedRisks] = useState([]);
    const [selectedMeasures, setSelectedMeasures] = useState({});
    const [measuresLibrary, setMeasuresLibrary] = useState({ prevence: [], detekce: [], reakce: [] });
    const [loading, setLoading] = useState(true);
    const [libraryLoading, setLibraryLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('Načteno');
    const latestDataRef = useRef(null);

    useEffect(() => {
        if (!projectId) return;
        const projectDocRef = doc(db, 'projects', projectId);
        const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCheckedRisks(data.risks || []);
                setSelectedMeasures(data.selectedMeasures || {});
            } else {
                console.error("Project document not found!");
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching project data:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    // Načtení knihovny opatření
    useEffect(() => {
        const fetchMeasuresLibrary = async () => {
            if (!currentUser) return;

            const userLibraryRef = collection(db, 'users', currentUser.uid, 'measures_library');
            const userQuerySnapshot = await getDocs(userLibraryRef);
            
            let finalLibrary = { prevence: [], detekce: [], reakce: [] };
            let userLibraryEmpty = true;

            userQuerySnapshot.forEach((doc) => {
                userLibraryEmpty = false;
                const measure = { id: doc.id, ...doc.data() };
                const categories = measure.categories || (measure.category ? [measure.category] : []);
                categories.forEach(cat => {
                    if (finalLibrary[cat]) {
                        finalLibrary[cat].push(measure);
                    }
                });
            });

            if (userLibraryEmpty) {
                const globalLibraryRef = collection(db, 'measures_library');
                const globalQuerySnapshot = await getDocs(globalLibraryRef);
                 globalQuerySnapshot.forEach((doc) => {
                    const measure = { id: doc.id, ...doc.data() };
                    const categories = measure.categories || (measure.category ? [measure.category] : []);
                    categories.forEach(cat => {
                        if (finalLibrary[cat]) {
                            finalLibrary[cat].push(measure);
                        }
                    });
                });
            }

            setMeasuresLibrary(finalLibrary);
            setLibraryLoading(false);
        };

        fetchMeasuresLibrary().catch(error => {
            console.error("Error fetching measures library:", error);
            setLibraryLoading(false);
        });
    }, [currentUser]);

    // Automatické ukládání
    useEffect(() => {
        if (loading || libraryLoading || saveStatus !== 'Ukládám...') return;
        
        latestDataRef.current = selectedMeasures;
        
        const handler = setTimeout(async () => {
            const projectDocRef = doc(db, 'projects', projectId);
            try {
                await setDoc(projectDocRef, { 
                    selectedMeasures: latestDataRef.current,
                    lastEdited: serverTimestamp() 
                }, { merge: true });
                setSaveStatus('Uloženo');
            } catch (error) {
                console.error("Error saving measures: ", error);
                setSaveStatus('Chyba');
            }
        }, 1500);

        return () => clearTimeout(handler);
    }, [selectedMeasures, saveStatus, projectId, loading, libraryLoading]);
    
    const handleMeasureToggle = (measureName) => {
        const newSelectedMeasures = { ...selectedMeasures, [measureName]: !selectedMeasures[measureName] };
        setSelectedMeasures(newSelectedMeasures);
        setSaveStatus('Ukládám...');
    };
    
    const isLibraryEmpty = useMemo(() => 
        measuresLibrary.prevence.length === 0 &&
        measuresLibrary.detekce.length === 0 &&
        measuresLibrary.reakce.length === 0,
    [measuresLibrary]);

    if (loading || libraryLoading) {
        return <div className="flex justify-center items-center p-8"><CircularProgress /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <Typography variant="h4" component="h1" className="font-bold text-gray-800">
                    Bezpečnostní opatření
                </Typography>
                <SaveStatusIndicator status={saveStatus} />
            </div>
            
            <Typography>
                Zde si vyberte konkrétní opatření, která pro daná rizika zavedete. Systém vám pomůže sledovat, zda máte pokrytou prevenci (P), detekci (D) i reakci (R) pro každé riziko.
            </Typography>

            {checkedRisks.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border max-w-4xl" style={{ maxHeight: '16rem', overflowY: 'auto' }}>
                    {/* --- ZMĚNA ZDE: Přidána třída z-10 pro zajištění vrstvení nad obsahem --- */}
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 sticky top-0 bg-gray-50 py-2 -mt-4 z-10">
                        Přehled pokrytí rizik
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                        {checkedRisks.map(risk => (
                            <div key={risk.id} className="flex justify-between items-center py-1 border-b md:border-none">
                                <Typography variant="body2">{risk.name}</Typography>
                                <CoverageIndicator risk={risk} selectedMeasures={selectedMeasures} measuresLibrary={measuresLibrary} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="space-y-2">
                <h2 className="text-2xl font-bold border-b pb-3 mb-2">Výběr opatření pro identifikovaná rizika</h2>
                {checkedRisks.length > 0 ? (
                    isLibraryEmpty ? (
                         <Typography className="p-8 text-center border-2 border-dashed rounded-lg text-gray-500">
                            Vaše knihovna opatření je prázdná. Přejděte prosím do Nastavení a definujte bezpečnostní opatření, nebo kontaktujte administrátora pro nastavení globální knihovny.
                        </Typography>
                    ) : (
                        checkedRisks.map(risk => {
                            const relevantMeasures = {
                                prevence: measuresLibrary.prevence.filter(m => !m.applicableRisks || m.applicableRisks.length === 0 || m.applicableRisks.includes(risk.name)),
                                detekce: measuresLibrary.detekce.filter(m => !m.applicableRisks || m.applicableRisks.length === 0 || m.applicableRisks.includes(risk.name)),
                                reakce: measuresLibrary.reakce.filter(m => !m.applicableRisks || m.applicableRisks.length === 0 || m.applicableRisks.includes(risk.name)),
                            };

                            return (
                                <Accordion key={risk.id} TransitionProps={{ unmountOnExit: true }} defaultExpanded>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography variant="h6">{risk.name}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                                            {Object.entries(relevantMeasures).map(([category, measures]) => (
                                                <div key={category}>
                                                    <Typography className={`font-semibold mb-2 ${
                                                        category === 'prevence' ? 'text-blue-700' : category === 'detekce' ? 'text-orange-700' : 'text-red-700'
                                                    }`}>{category.charAt(0).toUpperCase() + category.slice(1)}</Typography>
                                                    <FormGroup>
                                                        {measures.length > 0 ? measures.map(measure => (
                                                            <FormControlLabel key={measure.id} control={<Checkbox checked={selectedMeasures[measure.name] || false} onChange={() => handleMeasureToggle(measure.name)} size="small"/>} label={<Typography variant="body2">{measure.name}</Typography>} />
                                                        )) : (
                                                            <Typography variant="body2" className="text-gray-500 italic">Žádná specifická opatření v knihovně.</Typography>
                                                        )}
                                                    </FormGroup>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })
                    )
                ) : (
                    <Typography className="p-8 text-center border-2 border-dashed rounded-lg text-gray-500">
                        Na stránce "Rizika" zatím nejsou zaškrtnuta žádná zvažovaná rizika. Přejděte prosím na analýzu rizik a vyberte relevantní hrozby.
                    </Typography>
                )}
            </div>
        </div>
    );
}

export default ProjectMeasures;