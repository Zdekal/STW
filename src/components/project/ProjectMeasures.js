import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
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

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects }) => {
                const lp = listProjects().find(p => p.id === projectId);
                if (lp) {
                    setCheckedRisks(lp.customRisks || lp.risks || []);
                    setSelectedMeasures(lp.selectedMeasures || lp.measures || {});
                } else {
                    console.error("Lokální projekt nenalezen!");
                }
                setLoading(false);
            });
            return;
        }

        if (!db) {
            setLoading(false);
            return;
        }

        const projectDocRef = doc(db, 'projects', projectId);
        const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
            if (docSnap.metadata.hasPendingWrites) return; // Ignoruj lokální zápisy
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCheckedRisks(data.customRisks || data.risks || []);
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
            let finalLibrary = { prevence: [], detekce: [], reakce: [] };

            if (projectId.startsWith('local-')) {
                // Poskytneme výchozí nebo testovací balík z konfiguračních dat v lokálním režimu, aby bylo možné hrát s aplikací
                import('../../config/measuresLibraryData').then(module => {
                    // Default library items pro ilustraci (fallback)
                    finalLibrary = module.initialGlobalMeasures || { prevence: [], detekce: [], reakce: [] };
                    setMeasuresLibrary(finalLibrary);
                    setLibraryLoading(false);
                }).catch(() => {
                    setMeasuresLibrary(finalLibrary);
                    setLibraryLoading(false);
                });
                return;
            }

            if (!currentUser || !db) {
                // Return default library format if no database
                setMeasuresLibrary(finalLibrary);
                setLibraryLoading(false);
                return;
            }

            const userLibraryRef = collection(db, 'users', currentUser.uid, 'measures_library');
            const userQuerySnapshot = await getDocs(userLibraryRef);

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

                let globalLibraryEmpty = true;
                globalQuerySnapshot.forEach((doc) => {
                    globalLibraryEmpty = false;
                    const measure = { id: doc.id, ...doc.data() };
                    const categories = measure.categories || (measure.category ? [measure.category] : []);
                    categories.forEach(cat => {
                        if (finalLibrary[cat]) {
                            finalLibrary[cat].push(measure);
                        }
                    });
                });

                if (globalLibraryEmpty) {
                    const { defaultMeasures } = await import('../../config/securityData');
                    defaultMeasures.forEach((measure) => {
                        const m = { ...measure, name: measure.text || measure.name };
                        if (measure.isPrevention) finalLibrary.prevence.push(m);
                        if (measure.isDetection) finalLibrary.detekce.push(m);
                        if (measure.isReaction) finalLibrary.reakce.push(m);
                    });
                }
            }

            setMeasuresLibrary(finalLibrary);
            setLibraryLoading(false);
        };

        fetchMeasuresLibrary().catch(error => {
            console.error("Error fetching measures library:", error);
            setLibraryLoading(false);
        });
    }, [currentUser, projectId]);

    // Automatické ukládání
    useEffect(() => {
        if (loading || libraryLoading || saveStatus !== 'Ukládám...') return;

        latestDataRef.current = selectedMeasures;

        const handler = setTimeout(async () => {
            try {
                if (projectId.startsWith('local-')) {
                    import('../../services/localStore').then(({ listProjects, updateProject }) => {
                        const existing = listProjects().find(p => p.id === projectId) || {};
                        updateProject({ ...existing, selectedMeasures: latestDataRef.current, measures: latestDataRef.current });
                        setSaveStatus('Uloženo');
                    });
                    return;
                }

                if (!db) return;
                const projectDocRef = doc(db, 'projects', projectId);
                import('firebase/firestore').then(({ setDoc, serverTimestamp }) => {
                    setDoc(projectDocRef, {
                        selectedMeasures: latestDataRef.current,
                        lastEdited: serverTimestamp()
                    }, { merge: true }).then(() => setSaveStatus('Uloženo'))
                        .catch(err => {
                            console.error('Error saving measures', err);
                            setSaveStatus('Chyba');
                        });
                });
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

            {/* TOP-LEVEL MASTER CHECKLIST */}
            {!isLibraryEmpty && (
                <div className="bg-white rounded-xl shadow-sm border p-6 mt-4">
                    <Typography variant="h5" component="h2" className="font-bold text-gray-800 mb-2">
                        Kompletní přehled bezpečnostních opatření
                    </Typography>
                    <Typography variant="body2" className="text-gray-500 mb-6">
                        Zde zaškrtnutím aktivujete vybraná bezpečnostní opatření plošně pro celou akci. Aktivní opatření se automaticky propíší ke všem relevantním rizikům níže.
                    </Typography>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {['prevence', 'detekce', 'reakce'].map((category) => {
                            const measures = measuresLibrary[category] || [];
                            if (measures.length === 0) return null;

                            return (
                                <div key={category} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <Typography variant="subtitle1" className={`font-bold uppercase tracking-wider text-sm mb-4 border-b pb-2 ${category === 'prevence' ? 'text-blue-700 border-blue-200' :
                                            category === 'detekce' ? 'text-orange-700 border-orange-200' : 'text-red-700 border-red-200'
                                        }`}>
                                        {category}
                                    </Typography>
                                    <FormGroup className="space-y-1">
                                        {measures.map(measure => (
                                            <FormControlLabel
                                                key={measure.id}
                                                control={
                                                    <Checkbox
                                                        checked={selectedMeasures[measure.name] || false}
                                                        onChange={() => handleMeasureToggle(measure.name)}
                                                        size="small"
                                                        color={category === 'prevence' ? 'primary' : category === 'detekce' ? 'warning' : 'error'}
                                                    />
                                                }
                                                label={<Typography variant="body2" className="text-gray-700 leading-tight">{measure.name || measure.text}</Typography>}
                                                className="hover:bg-gray-100 rounded-md transition-colors ml-0 pr-2 py-1"
                                                sx={{ alignItems: 'flex-start' }}
                                            />
                                        ))}
                                    </FormGroup>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* PŘEHLED VYBRANÝCH OPATŘENÍ */}
            <div className="bg-white rounded-xl shadow-sm border p-6 mt-4">
                <Typography variant="h5" component="h2" className="font-bold text-gray-800 mb-2">
                    Základní přehled vybraných opatření
                </Typography>
                <Typography variant="body2" className="text-gray-500 mb-4">
                    Výčet všech aktuálně aktivních bezpečnostních opatření napříč projektem.
                </Typography>
                {Object.keys(selectedMeasures).filter(k => selectedMeasures[k]).length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {Object.keys(selectedMeasures).filter(k => selectedMeasures[k]).map(m => (
                            <Chip key={m} label={m} size="small" color="primary" variant="outlined" sx={{ fontWeight: 'bold' }} />
                        ))}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary">Zatím nebyla vybrána žádná plošná opatření.</Typography>
                )}
            </div>

            <div className="space-y-4 pt-6 mt-8 border-t border-gray-200">
                <Typography variant="h5" component="h2" className="font-bold text-gray-800 mb-2">Pokrytí konkrétních částí (rizik)</Typography>
                <Typography variant="body2" className="text-gray-500 mb-4">
                    Níže můžete zkontrolovat, jak jednotlivá rizika uplatňují zaškrtnutá opatření v rámci prevence (P), detekce (D) a reakce (R). Zaškrtávání je provázáno se seznamem výše.
                </Typography>
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
                                <Accordion key={risk.id} TransitionProps={{ unmountOnExit: true }} sx={{ mb: 1, borderRadius: '8px', '&:before': { display: 'none' }, boxShadow: 2 }}>
                                    <AccordionSummary expandIcon={<ExpandMore />} sx={{ bgcolor: 'grey.50', borderRadius: '8px' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                                            <Typography variant="h6" className="font-semibold text-gray-800">{risk.name}</Typography>
                                            <CoverageIndicator risk={risk} selectedMeasures={selectedMeasures} measuresLibrary={measuresLibrary} />
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 3, pb: 4, px: 4 }}>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8">
                                            {Object.entries(relevantMeasures).map(([category, measures]) => (
                                                <div key={category} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm">
                                                    <Typography variant="subtitle1" className={`font-bold uppercase tracking-wider text-sm mb-4 border-b pb-2 ${category === 'prevence' ? 'text-blue-700 border-blue-200' :
                                                        category === 'detekce' ? 'text-orange-700 border-orange-200' : 'text-red-700 border-red-200'
                                                        }`}>
                                                        {category} opatření
                                                    </Typography>
                                                    <FormGroup className="space-y-1">
                                                        {measures.length > 0 ? measures.map(measure => (
                                                            <FormControlLabel
                                                                key={measure.id}
                                                                control={<Checkbox checked={selectedMeasures[measure.name] || false} onChange={() => handleMeasureToggle(measure.name)} size="small" color={category === 'prevence' ? 'primary' : category === 'detekce' ? 'warning' : 'error'} />}
                                                                label={<Typography variant="body2" className="text-gray-700">{measure.name || measure.text}</Typography>}
                                                                className="hover:bg-gray-100 rounded-md pr-2 transition-colors ml-0"
                                                            />
                                                        )) : (
                                                            <Typography variant="body2" className="text-gray-400 italic px-2">Žádná dostupná opatření.</Typography>
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
                        Zatím nejsou přidána/zaškrtnuta žádná rizika pro tento projekt. Přejděte prosím na analýzu rizik a vytvořte hrozby.
                    </Typography>
                )}
            </div>
        </div>
    );
}

export default ProjectMeasures;