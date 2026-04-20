import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import {
    Checkbox, FormControlLabel, FormGroup, CircularProgress, Chip,
    Typography, Box, Paper, Tabs, Tab, Tooltip, Switch, IconButton,
    LinearProgress, Collapse, Button,
} from '@mui/material';
import {
    CloudDone, CheckCircle, RadioButtonUnchecked, ExpandMore,
    Route, LocalHospital, Thunderstorm, Groups, DirectionsCar,
    Headset, Engineering, Gavel, Shield, WarningAmber,
    CheckBoxOutlineBlank, CheckBox as CheckBoxIcon,
    LinkOutlined, ContactPhone, AssignmentInd, Checklist, Description,
} from '@mui/icons-material';
import { getMeasuresForEventType } from '../../config/cyclingRaceMeasures';
import { measureIntegrations } from '../../config/measureIntegrations';

/* ============================================================================ */
/*  Ikony pro kategorie                                                        */
/* ============================================================================ */
const categoryIcons = {
    Route: <Route />,
    LocalHospital: <LocalHospital />,
    Thunderstorm: <Thunderstorm />,
    Groups: <Groups />,
    DirectionsCar: <DirectionsCar />,
    Headset: <Headset />,
    Engineering: <Engineering />,
    Gavel: <Gavel />,
};

/* ============================================================================ */
/*  SaveStatus                                                                 */
/* ============================================================================ */
const SaveStatusIndicator = ({ status }) => {
    if (status === 'Uloženo') return <Chip icon={<CloudDone />} label="Uloženo" size="small" />;
    if (status === 'Ukládám...') return <Chip icon={<CircularProgress size={16} />} label="Ukládám..." size="small" variant="outlined" />;
    return null;
};

/* ============================================================================ */
/*  P/D/R indikátor pokrytí rizika                                             */
/* ============================================================================ */
const CoverageIndicator = ({ risk, selectedMeasures, allMeasuresFlat }) => {
    const coverage = useMemo(() => {
        const relevant = allMeasuresFlat.filter(m =>
            !m.applicableRisks || m.applicableRisks.length === 0 || m.applicableRisks.includes(risk.name)
        );
        const active = relevant.filter(m => selectedMeasures[m.text || m.name]);
        return {
            P: active.some(m => m.isPrevention),
            D: active.some(m => m.isDetection),
            R: active.some(m => m.isReaction),
        };
    }, [risk.name, selectedMeasures, allMeasuresFlat]);

    const Ind = ({ label, ok }) => (
        <Chip
            icon={ok ? <CheckCircle sx={{ color: 'white !important' }} /> : <RadioButtonUnchecked />}
            label={label} size="small"
            sx={{ backgroundColor: ok ? 'success.main' : 'grey.300', color: ok ? 'white' : 'grey.700', fontWeight: 700, pointerEvents: 'none', height: 24, fontSize: '0.7rem' }}
        />
    );

    return (
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <Ind label="P" ok={coverage.P} />
            <Ind label="D" ok={coverage.D} />
            <Ind label="R" ok={coverage.R} />
        </Box>
    );
};

/* ============================================================================ */
/*  Zobrazení provázaností opatření                                            */
/* ============================================================================ */
const MeasureIntegrationInfo = ({ measureText }) => {
    const integration = measureIntegrations[measureText];
    if (!integration) return null;

    const { crisisProcedure, coordinationRole, contactRequired, checklistExtra, documentNote } = integration;
    const hasAny = crisisProcedure || coordinationRole || contactRequired || checklistExtra || documentNote;
    if (!hasAny) return null;

    const items = [
        { icon: <WarningAmber sx={{ fontSize: 14, color: '#dc2626' }} />, label: 'Krizové postupy', text: crisisProcedure, color: '#fef2f2', border: '#fecaca' },
        { icon: <AssignmentInd sx={{ fontSize: 14, color: '#2563eb' }} />, label: 'Koordinační tým', text: coordinationRole, color: '#eff6ff', border: '#bfdbfe' },
        { icon: <ContactPhone sx={{ fontSize: 14, color: '#d97706' }} />, label: 'Kontakty k doplnění', text: contactRequired, color: '#fffbeb', border: '#fde68a' },
        { icon: <Checklist sx={{ fontSize: 14, color: '#16a34a' }} />, label: 'Checklist (extra)', text: checklistExtra, color: '#f0fdf4', border: '#bbf7d0' },
        { icon: <Description sx={{ fontSize: 14, color: '#7c3aed' }} />, label: 'Výstupní dokumenty', text: documentNote, color: '#faf5ff', border: '#ddd6fe' },
    ].filter(item => item.text);

    return (
        <Box sx={{ mt: 1, ml: 4, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                <LinkOutlined sx={{ fontSize: 13, color: '#94a3b8' }} />
                <Typography variant="caption" fontWeight={600} sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '0.6rem' }}>
                    Provázanosti
                </Typography>
            </Box>
            {items.map((item, idx) => (
                <Box key={idx} sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 0.8,
                    px: 1, py: 0.4, borderRadius: 1,
                    backgroundColor: item.color,
                    border: `1px solid ${item.border}`,
                }}>
                    {item.icon}
                    <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={600} sx={{ color: '#475569', fontSize: '0.6rem' }}>
                            {item.label}:
                        </Typography>
                        {' '}
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6rem', whiteSpace: 'pre-line' }}>
                            {item.text}
                        </Typography>
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

/* ============================================================================ */
/*  Hlavní komponenta                                                          */
/* ============================================================================ */
function ProjectMeasures() {
    const { id: projectId } = useParams();
    const { currentUser } = useAuth();
    const [checkedRisks, setCheckedRisks] = useState([]);
    const [eventType, setEventType] = useState('');
    const [selectedMeasures, setSelectedMeasures] = useState({});
    const [measuresLibrary, setMeasuresLibrary] = useState({ prevence: [], detekce: [], reakce: [] });
    const [loading, setLoading] = useState(true);
    const [libraryLoading, setLibraryLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('Načteno');
    const [tabValue, setTabValue] = useState(0);
    const [expandedCategories, setExpandedCategories] = useState({});
    const latestDataRef = useRef(null);
    const initialLoadDone = useRef(false);

    /* ---- Načtení projektu ---- */
    useEffect(() => {
        if (!projectId) return;
        initialLoadDone.current = false;

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects }) => {
                const lp = listProjects().find(p => p.id === projectId);
                if (lp) {
                    setCheckedRisks(lp.customRisks || lp.risks || []);
                    setSelectedMeasures(lp.selectedMeasures || lp.measures || {});
                    setEventType(lp.eventType || '');
                }
                setLoading(false);
            });
            return;
        }

        if (!db) { setLoading(false); return; }

        const projectDocRef = doc(db, 'projects', projectId);
        const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
            if (docSnap.metadata.hasPendingWrites) return;
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCheckedRisks(data.customRisks || data.risks || []);
                setEventType(data.eventType || '');
                if (!initialLoadDone.current) {
                    setSelectedMeasures(data.selectedMeasures || {});
                    initialLoadDone.current = true;
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    /* ---- Načtení knihovny opatření ---- */
    useEffect(() => {
        const fetchMeasuresLibrary = async () => {
            let finalLibrary = { prevence: [], detekce: [], reakce: [] };

            if (projectId.startsWith('local-')) {
                import('../../config/measuresLibraryData').then(module => {
                    setMeasuresLibrary(module.initialGlobalMeasures || finalLibrary);
                    setLibraryLoading(false);
                }).catch(() => { setMeasuresLibrary(finalLibrary); setLibraryLoading(false); });
                return;
            }

            if (!currentUser || !db) {
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
                categories.forEach(cat => { if (finalLibrary[cat]) finalLibrary[cat].push(measure); });
            });

            if (userLibraryEmpty) {
                const globalLibraryRef = collection(db, 'measures_library');
                const globalQuerySnapshot = await getDocs(globalLibraryRef);
                let globalLibraryEmpty = true;
                globalQuerySnapshot.forEach((doc) => {
                    globalLibraryEmpty = false;
                    const measure = { id: doc.id, ...doc.data() };
                    const categories = measure.categories || (measure.category ? [measure.category] : []);
                    categories.forEach(cat => { if (finalLibrary[cat]) finalLibrary[cat].push(measure); });
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

    /* ---- Auto-save ---- */
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
                    setDoc(projectDocRef, { selectedMeasures: latestDataRef.current, lastEdited: serverTimestamp() }, { merge: true })
                        .then(() => setSaveStatus('Uloženo'))
                        .catch(err => { console.error('Error saving measures', err); setSaveStatus('Chyba'); });
                });
            } catch (error) {
                console.error("Error saving measures: ", error);
                setSaveStatus('Chyba');
            }
        }, 1500);
        return () => clearTimeout(handler);
    }, [selectedMeasures, saveStatus, projectId, loading, libraryLoading]);

    /* ---- Handlers ---- */
    const handleMeasureToggle = useCallback((measureText) => {
        setSelectedMeasures(prev => ({ ...prev, [measureText]: !prev[measureText] }));
        setSaveStatus('Ukládám...');
    }, []);

    const toggleCategory = useCallback((catId) => {
        setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    }, []);

    /* ---- Event-type-specific measures ---- */
    const eventMeasureCategories = useMemo(() => getMeasuresForEventType(eventType), [eventType]);

    /* ---- Flat array všech opatření (generická + event-specific) ---- */
    const allMeasuresFlat = useMemo(() => {
        const fromLib = [
            ...measuresLibrary.prevence,
            ...measuresLibrary.detekce,
            ...measuresLibrary.reakce,
        ];
        const fromEvent = eventMeasureCategories
            ? eventMeasureCategories.flatMap(cat => cat.measures)
            : [];
        // Deduplicate by text/name
        const seen = new Set();
        const result = [];
        [...fromEvent, ...fromLib].forEach(m => {
            const key = m.text || m.name;
            if (!seen.has(key)) { seen.add(key); result.push(m); }
        });
        return result;
    }, [measuresLibrary, eventMeasureCategories]);

    /* ---- Statistiky ---- */
    const stats = useMemo(() => {
        const total = allMeasuresFlat.length;
        const active = allMeasuresFlat.filter(m => selectedMeasures[m.text || m.name]).length;
        const risksWithFullCoverage = checkedRisks.filter(risk => {
            const relevant = allMeasuresFlat.filter(m =>
                !m.applicableRisks || m.applicableRisks.length === 0 || m.applicableRisks.includes(risk.name)
            );
            const activeR = relevant.filter(m => selectedMeasures[m.text || m.name]);
            return activeR.some(m => m.isPrevention) && activeR.some(m => m.isDetection) && activeR.some(m => m.isReaction);
        }).length;
        return { total, active, risksWithFullCoverage, totalRisks: checkedRisks.length };
    }, [allMeasuresFlat, selectedMeasures, checkedRisks]);

    /* ---- Render helpers ---- */
    const renderPDRChips = (m) => (
        <Box sx={{ display: 'flex', gap: 0.3, ml: 1 }}>
            {m.isPrevention && <Chip label="P" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#dbeafe', color: '#1e40af', minWidth: 20 }} />}
            {m.isDetection && <Chip label="D" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#ffedd5', color: '#9a3412', minWidth: 20 }} />}
            {m.isReaction && <Chip label="R" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#fce7f3', color: '#9f1239', minWidth: 20 }} />}
        </Box>
    );

    if (loading || libraryLoading) {
        return <div className="flex justify-center items-center p-8"><CircularProgress /></div>;
    }

    const hasEventSpecific = !!eventMeasureCategories;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <Typography variant="h4" component="h1" fontWeight={700}>Bezpečnostní opatření</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Vyberte opatření, která zavedete. Aktivní opatření se promítnou do checklistu, briefingů a výstupních dokumentů.
                    </Typography>
                </div>
                <SaveStatusIndicator status={saveStatus} />
            </div>

            {/* Statistiky */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} color="primary.main">{stats.active}</Typography>
                    <Typography variant="caption" color="text.secondary">Aktivních opatření</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} color="text.secondary">{stats.total}</Typography>
                    <Typography variant="caption" color="text.secondary">Celkem dostupných</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} sx={{ color: stats.risksWithFullCoverage === stats.totalRisks ? '#16a34a' : '#ea580c' }}>
                        {stats.risksWithFullCoverage}/{stats.totalRisks}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Rizik s plným P/D/R</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                    <LinearProgress
                        variant="determinate"
                        value={stats.total > 0 ? (stats.active / stats.total) * 100 : 0}
                        sx={{ height: 8, borderRadius: 4, mb: 1, mt: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                        {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% pokrytí
                    </Typography>
                </Paper>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                    {hasEventSpecific && <Tab label="Opatření pro typ akce" icon={<Shield sx={{ fontSize: 18 }} />} iconPosition="start" />}
                    <Tab label="Generická opatření (knihovna)" icon={<Shield sx={{ fontSize: 18 }} />} iconPosition="start" />
                    <Tab label={`Pokrytí rizik (${stats.risksWithFullCoverage}/${stats.totalRisks})`} />
                </Tabs>
            </Box>

            {/* ═══ TAB 0: Event-specific measures (kategoricky) ═══ */}
            {hasEventSpecific && tabValue === 0 && (
                <div className="space-y-4">
                    <Box sx={{ p: 2, backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <Shield sx={{ color: '#2563eb', mt: 0.3 }} />
                        <Box>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1e40af' }}>
                                Opatření specifická pro typ akce
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#1e40af' }}>
                                Tato opatření jsou navržena přímo pro váš typ akce. Zaškrtnutím je aktivujete pro celý projekt.
                                Automaticky se propíší do checklistu a výstupních dokumentů.
                            </Typography>
                        </Box>
                    </Box>

                    {eventMeasureCategories.map((cat) => {
                        const isExpanded = expandedCategories[cat.id] !== false; // default expanded
                        const activeInCat = cat.measures.filter(m => selectedMeasures[m.text]).length;
                        const totalInCat = cat.measures.length;
                        const allActive = activeInCat === totalInCat;

                        return (
                            <Paper key={cat.id} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${cat.color}30` }}>
                                {/* Category header */}
                                <Box
                                    onClick={() => toggleCategory(cat.id)}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                        px: 2.5, py: 1.5,
                                        backgroundColor: `${cat.color}08`,
                                        borderBottom: isExpanded ? `1px solid ${cat.color}20` : 'none',
                                        cursor: 'pointer',
                                        '&:hover': { backgroundColor: `${cat.color}12` },
                                        transition: 'background-color 0.15s',
                                    }}
                                >
                                    <Box sx={{ color: cat.color, display: 'flex' }}>
                                        {categoryIcons[cat.icon] || <Shield />}
                                    </Box>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ flex: 1, color: '#1e293b' }}>
                                        {cat.title}
                                    </Typography>
                                    <Chip
                                        label={`${activeInCat}/${totalInCat}`}
                                        size="small"
                                        sx={{
                                            fontWeight: 700, fontSize: '0.75rem',
                                            backgroundColor: allActive ? '#dcfce7' : activeInCat > 0 ? '#fef3c7' : '#f1f5f9',
                                            color: allActive ? '#166534' : activeInCat > 0 ? '#92400e' : '#64748b',
                                        }}
                                    />
                                    <ExpandMore sx={{
                                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s',
                                        color: '#94a3b8',
                                    }} />
                                </Box>

                                {/* Measures list */}
                                <Collapse in={isExpanded}>
                                    <Box sx={{ p: 0 }}>
                                        {cat.measures.map((m, idx) => {
                                            const isActive = selectedMeasures[m.text] || false;
                                            const riskCount = (m.applicableRisks || []).length;
                                            return (
                                                <Box
                                                    key={m.id}
                                                    onClick={() => handleMeasureToggle(m.text)}
                                                    sx={{
                                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                                        px: 2.5, py: 1.2,
                                                        cursor: 'pointer',
                                                        borderBottom: idx < cat.measures.length - 1 ? '1px solid #f1f5f9' : 'none',
                                                        backgroundColor: isActive ? `${cat.color}06` : 'transparent',
                                                        '&:hover': { backgroundColor: isActive ? `${cat.color}10` : '#f8fafc' },
                                                        transition: 'background-color 0.1s',
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={isActive}
                                                        onChange={() => {}}
                                                        size="small"
                                                        sx={{ p: 0, color: cat.color, '&.Mui-checked': { color: cat.color } }}
                                                    />
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={isActive ? 600 : 400} sx={{ color: isActive ? '#0f172a' : '#475569' }}>
                                                            {m.text}
                                                        </Typography>
                                                        {isActive && (
                                                            <>
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                                    {(m.applicableRisks || []).map((rn, ri) => (
                                                                        <Chip key={ri} label={rn.length > 45 ? rn.substring(0, 42) + '...' : rn}
                                                                            size="small"
                                                                            sx={{ height: 18, fontSize: '0.6rem', backgroundColor: '#f1f5f9', color: '#64748b' }}
                                                                        />
                                                                    ))}
                                                                </Box>
                                                                <MeasureIntegrationInfo measureText={m.text} />
                                                            </>
                                                        )}
                                                    </Box>
                                                    {renderPDRChips(m)}
                                                    <Chip label={`${riskCount} rizik`} size="small"
                                                        sx={{ height: 20, fontSize: '0.65rem', backgroundColor: '#f1f5f9', color: '#64748b', minWidth: 50 }}
                                                    />
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Collapse>
                            </Paper>
                        );
                    })}
                </div>
            )}

            {/* ═══ TAB: Generická opatření ═══ */}
            {tabValue === (hasEventSpecific ? 1 : 0) && (
                <div className="space-y-4">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Univerzální knihovna opatření z vaší osobní nebo globální šablony. Tato opatření lze použít pro jakýkoliv typ akce.
                    </Typography>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {['prevence', 'detekce', 'reakce'].map((category) => {
                            const measures = measuresLibrary[category] || [];
                            if (measures.length === 0) return null;
                            const colors = {
                                prevence: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', header: '#2563eb' },
                                detekce: { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', header: '#ea580c' },
                                reakce: { bg: '#fdf2f8', border: '#fbcfe8', text: '#9f1239', header: '#e11d48' },
                            };
                            const c = colors[category];
                            const activeCount = measures.filter(m => selectedMeasures[m.name || m.text]).length;

                            return (
                                <Paper key={category} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${c.border}` }}>
                                    <Box sx={{ px: 2.5, py: 1.5, backgroundColor: c.bg, borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: c.header, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                                            {category}
                                        </Typography>
                                        <Chip label={`${activeCount}/${measures.length}`} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem', backgroundColor: c.bg, color: c.text }} />
                                    </Box>
                                    <Box sx={{ p: 1 }}>
                                        <FormGroup>
                                            {measures.map(measure => {
                                                const key = measure.name || measure.text;
                                                return (
                                                    <FormControlLabel
                                                        key={measure.id}
                                                        control={
                                                            <Checkbox
                                                                checked={selectedMeasures[key] || false}
                                                                onChange={() => handleMeasureToggle(key)}
                                                                size="small"
                                                                sx={{ color: c.header, '&.Mui-checked': { color: c.header } }}
                                                            />
                                                        }
                                                        label={<Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.3 }}>{key}</Typography>}
                                                        sx={{ mx: 0, py: 0.3, px: 1, borderRadius: 1, '&:hover': { backgroundColor: '#f8fafc' }, alignItems: 'flex-start' }}
                                                    />
                                                );
                                            })}
                                        </FormGroup>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══ TAB: Pokrytí rizik ═══ */}
            {tabValue === (hasEventSpecific ? 2 : 1) && (
                <div className="space-y-3">
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Přehled pokrytí každého rizika opatřeními v kategoriích Prevence (P), Detekce (D) a Reakce (R).
                        Kliknutím na riziko zobrazíte/skryjete relevantní opatření.
                    </Typography>

                    {checkedRisks.length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}>
                            <Typography color="text.secondary">
                                Zatím nejsou přidána žádná rizika. Přejděte na Analýzu rizik a přidejte hrozby.
                            </Typography>
                        </Paper>
                    ) : (
                        checkedRisks.map(risk => {
                            const isExpanded = expandedCategories[`risk-${risk.id}`];
                            const relevantMeasures = allMeasuresFlat.filter(m =>
                                !m.applicableRisks || m.applicableRisks.length === 0 || m.applicableRisks.includes(risk.name)
                            );
                            const activeMeasures = relevantMeasures.filter(m => selectedMeasures[m.text || m.name]);

                            return (
                                <Paper key={risk.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                                    <Box
                                        onClick={() => toggleCategory(`risk-${risk.id}`)}
                                        sx={{
                                            display: 'flex', alignItems: 'center', gap: 2,
                                            px: 2.5, py: 1.5, cursor: 'pointer',
                                            backgroundColor: isExpanded ? '#f8fafc' : 'white',
                                            '&:hover': { backgroundColor: '#f8fafc' },
                                        }}
                                    >
                                        <Typography variant="body1" fontWeight={600} sx={{ flex: 1, color: '#1e293b' }}>
                                            {risk.name}
                                        </Typography>
                                        <Chip label={`${activeMeasures.length}/${relevantMeasures.length}`}
                                            size="small"
                                            sx={{ fontWeight: 700, fontSize: '0.7rem', backgroundColor: '#f1f5f9', color: '#64748b' }}
                                        />
                                        <CoverageIndicator risk={risk} selectedMeasures={selectedMeasures} allMeasuresFlat={allMeasuresFlat} />
                                        <ExpandMore sx={{
                                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                                            transition: 'transform 0.2s', color: '#94a3b8',
                                        }} />
                                    </Box>
                                    <Collapse in={isExpanded}>
                                        <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid #e2e8f0' }}>
                                            {relevantMeasures.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {['P', 'D', 'R'].map(type => {
                                                        const label = type === 'P' ? 'Prevence' : type === 'D' ? 'Detekce' : 'Reakce';
                                                        const color = type === 'P' ? '#2563eb' : type === 'D' ? '#ea580c' : '#e11d48';
                                                        const typeMeasures = relevantMeasures.filter(m =>
                                                            type === 'P' ? m.isPrevention : type === 'D' ? m.isDetection : m.isReaction
                                                        );
                                                        return (
                                                            <Box key={type}>
                                                                <Typography variant="caption" fontWeight={700} sx={{ color, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                                                                    {label}
                                                                </Typography>
                                                                {typeMeasures.length > 0 ? typeMeasures.map(m => {
                                                                    const key = m.text || m.name;
                                                                    return (
                                                                        <FormControlLabel
                                                                            key={m.id}
                                                                            control={
                                                                                <Checkbox
                                                                                    checked={selectedMeasures[key] || false}
                                                                                    onChange={() => handleMeasureToggle(key)}
                                                                                    size="small"
                                                                                    sx={{ color, '&.Mui-checked': { color } }}
                                                                                />
                                                                            }
                                                                            label={<Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.3 }}>{key}</Typography>}
                                                                            sx={{ display: 'flex', mx: 0, py: 0.2, alignItems: 'flex-start' }}
                                                                        />
                                                                    );
                                                                }) : (
                                                                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                                        Žádná dostupná opatření
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                                                    Pro toto riziko nejsou definována žádná opatření.
                                                </Typography>
                                            )}
                                        </Box>
                                    </Collapse>
                                </Paper>
                            );
                        })
                    )}
                </div>
            )}

            {/* Přehled vybraných opatření */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mt: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                    Souhrn aktivních opatření ({Object.keys(selectedMeasures).filter(k => selectedMeasures[k]).length})
                </Typography>
                {Object.keys(selectedMeasures).filter(k => selectedMeasures[k]).length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {Object.keys(selectedMeasures).filter(k => selectedMeasures[k]).map(m => (
                            <Chip key={m} label={m} size="small" variant="outlined"
                                onDelete={() => handleMeasureToggle(m)}
                                sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                            />
                        ))}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Zatím nebyla vybrána žádná opatření.
                    </Typography>
                )}
            </Paper>
        </div>
    );
}

export default ProjectMeasures;
