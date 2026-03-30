import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Typography, Checkbox, FormControlLabel, FormGroup, Box, CircularProgress, Alert, TextField, Button, IconButton } from '@mui/material';
import { DeleteOutline, AddCircleOutline } from '@mui/icons-material';
import { checklistMeasuresMapping } from '../../config/checklistMeasuresMapping';

const ProjectChecklist = ({ projectId: propProjectId, audienceSize: propAudienceSize }) => {
    const { id: routeProjectId } = useParams();
    const projectId = propProjectId || routeProjectId;
    const [projectData, setProjectData] = useState(null);
    const [checklistItems, setChecklistItems] = useState([]);
    const [customItems, setCustomItems] = useState([]);
    const [newCustomItemText, setNewCustomItemText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. NAČTENÍ KOMPLETNÍCH DAT PROJEKTU
    useEffect(() => {
        let unsubscribe = null;

        const fetchProjectContext = async () => {
            if (!projectId) return;
            try {
                if (projectId.startsWith('local-')) {
                    import('../../services/localStore').then(({ listProjects }) => {
                        const lp = listProjects().find(p => p.id === projectId);
                        if (lp) {
                            setProjectData(lp);
                            setCustomItems(lp.customChecklistItems || []);
                        }
                    });
                    // Pro LocalStore případně polling nebo vlastní event system (zde zatím necháváme takto pro zjednodušení)
                    return;
                }

                if (!db) return;
                const docRef = doc(db, 'projects', projectId);

                // Změna na onSnapshot pro live update:
                import('firebase/firestore').then(({ onSnapshot }) => {
                    unsubscribe = onSnapshot(docRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            setProjectData(data);
                            setCustomItems(data.customChecklistItems || []);
                        } else {
                            setError('Projekt nebyl nalezen.');
                        }
                    }, (err) => {
                        console.error("Chyba při stahování kontextu:", err);
                        setError('Chyba při načítání dat projektu');
                    });
                });

            } catch (err) {
                console.error("Chyba při stahování kontextu:", err);
                setError('Chyba při inicializaci listeneru projektu');
            }
        };

        fetchProjectContext();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [projectId]);

    // 2. KDYŽ-TAK LOGIKA (Vyhodnocení kontextu)
    useEffect(() => {
        if (!projectData) return;

        const newChecklist = [];
        const pushItem = (id, label, explanation, phase = 'Přípravná fáze') => {
            newChecklist.push({ id, label, explanation, phase, checked: false });
        };

        const audience = parseInt(projectData.audienceSize, 10) || 0;
        const env = (projectData.environmentType || '').toLowerCase();
        const eventType = (projectData.eventType || '').toLowerCase();

        // Získáme pole customRisks (nezkopírované z library, ale z dokumentu pokud existují)
        // nebo z klasických risks.
        const risks = projectData.customRisks || projectData.risks || [];
        const hasRisk = (keyword) => risks.some(r => {
            const riskName = typeof r === 'string' ? r : (r?.name || '');
            return riskName.toLowerCase().includes(keyword.toLowerCase());
        });

        // --- PRAVIDLA KDYŽ-TAK ---

        // KDYŽ účastníci > 200 TAK
        if (audience >= 200) {
            pushItem('fire_doc_consult', 'Zajistit a nahlásit požární dozor', 'Pro akce nad 200 účastníků je nutné zajišťovat požární asistenci dle vyhlášky.', 'Přípravná fáze');
            pushItem('medical_aid', 'Objednat a nasmlouvat zdravotnickou službu', 'Pro větší akce zajistěte smluvní dozor záchranné služby (ZZS) nebo Červeného kříže.', 'Přípravná fáze');
        }

        // KDYŽ účastníci > 1000 TAK
        if (audience >= 1000) {
            pushItem('police_notify', 'Ohlásit pořádání akce Policii ČR', 'Při velkém počtu se doporučuje preventivně komunikovat plánovaný harmonogram PČR.', 'Přípravná fáze');
        }

        // KDYŽ vnitřní akce TAK
        if (env === 'vnitřní' || env === 'kombinovaná') {
            pushItem('escape_routes', 'Zkontrolovat volné únikové cesty a značení', 'Před akcí všechny evakuační východy musí být odemčené (na panikové kování) a bez překážek.', 'Těsně před akcí');
            pushItem('max_capacity', 'Ověřit max. kolaudační kapacitu s majitelem', 'Počet návštěvníků nesmí překročit oficiální požární zprávu objektu.', 'Přípravná fáze');
        }

        // KDYŽ venkovní akce TAK
        if (env === 'venkovní' || env === 'kombinovaná') {
            pushItem('weather_plan', 'Ustavit osobu pro sledování nepřízně počasí', 'Sledovat radary (vítr, bouřky) a ustanovit limity, kdy se ruší stage / stahuje technika.', 'Přípravná fáze');
        }

        // KDYŽ existuje riziko spojené s "alkohol" TAK
        if (hasRisk('alkohol') || hasRisk('opil')) {
            pushItem('security_bars', 'Posílená ostraha (Security) u pivních stanů', 'Riziko opilých návštěvníků vyžaduje tvrdší dozor barů a rychlejší odklízení skla.', 'Realizační fáze');
        }

        // KDYŽ existuje riziko spojené s "agresivita" nebo "demonstrace" TAK
        if (hasRisk('agresivit') || hasRisk('aktiv') || eventType === 'shromáždění') {
            pushItem('anticonflict', 'Vyžádat přítomnost Antikonfliktního týmu (AKT)', 'Specifické vyhrocené situace vyžadují specializované deeskalační profíky z řad PČR.', 'Přípravná fáze');
        }

        // KDYŽ existuje jakékoli uložení ohledně kolapsů davu / tlačenice ze securityData / metodiky
        if (hasRisk('panika') || hasRisk('tlačenice')) {
            pushItem('crowd_management', 'Zavést crowd-management opatření u vstupů', 'Cik-cak koridory, počítadla a turnikety k rozbití vlny návštěvníků na vstupech.', 'Přípravná fáze');
        }

        // --- NOVÁ PRAVIDLA PRO KATEGORIE ÚČASTNÍKŮ (napojené z tabulky Základní Údaje) ---
        const involvedTeamsObj = projectData.involvedTeams || {};
        const activeTeams = Object.keys(involvedTeamsObj).filter(team => involvedTeamsObj[team]);

        const hasTeamMatch = (keywords) => {
            return activeTeams.some(team => {
                const lowerTeam = team.toLowerCase();
                return keywords.some(kw => lowerTeam.includes(kw.toLowerCase()));
            });
        };

        const categoriesForBriefing = [];
        const isStankari = hasTeamMatch(['stánk', 'prodej']);
        if (isStankari) categoriesForBriefing.push('Stánkaři/Prodejci');
        if (hasTeamMatch(['umělc', 'interpret', 'vystupuj'])) categoriesForBriefing.push('Umělci/Interpreti');
        if (hasTeamMatch(['závod', 'sporto'])) categoriesForBriefing.push('Závodníci/Sportovci');
        if (hasTeamMatch(['produkč', 'techni'])) categoriesForBriefing.push('Produkční/Technický tým');
        if (hasTeamMatch(['security', 'bezpečnos', 'ostrah'])) categoriesForBriefing.push('Security/Ostraha');
        if (hasTeamMatch(['pořadatel', 'realizač', 'dobrovol'])) categoriesForBriefing.push('Pořadatelé/Realizace');
        if (hasTeamMatch(['vedení', 'manažer', 'management'])) categoriesForBriefing.push('Management akce');

        if (categoriesForBriefing.length > 0) {
            pushItem('briefing_categories', `Briefing aktivních kategorií účastníků (${categoriesForBriefing.join(', ')})`, 'Nezapomeňte uspořádat společný nebo oddělený briefing pro všechny tyto zapojené skupiny uvedené v Základních údajích.', 'Těsně před akcí');
        }

        if (isStankari) {
            pushItem('stankari_komunikace', 'Urči osobu zodpovědnou za komunikaci se stánkaři.', 'Ať si připraví aktuální kontaktovník na stánkaře pro případ krizových situací.', 'Přípravná fáze');
        }

        // --- PRAVIDLA PODLE BEZPEČNOSTNÍCH OPATŘENÍ ---
        const selectedMeasuresObj = projectData.selectedMeasures || projectData.measures || {};

        Object.keys(selectedMeasuresObj).forEach(measureName => {
            if (selectedMeasuresObj[measureName]) {
                if (checklistMeasuresMapping[measureName]) {
                    checklistMeasuresMapping[measureName].forEach(task => {
                        pushItem(task.id, task.label, task.explanation, task.phase || 'Přípravná fáze');
                    });
                } else {
                    // Dynamicky generovaný úkol pro vlastní/nová opatření bez definovaného mapování
                    pushItem(
                        'dynamic_measure_' + btoa(unescape(encodeURIComponent(measureName))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10),
                        `Implementovat opatření: ${measureName}`,
                        'Toto bezpečnostní opatření bylo vybráno pro některá identifikovaná rizika a je nutné jej zajistit pro zdárný průběh akce/provozu.',
                        'Přípravná fáze'
                    );
                }
            }
        });

        setChecklistItems(prev => {
            return newChecklist.map(newItem => {
                const existing = prev.find(p => p.id === newItem.id);
                if (existing) {
                    return { ...newItem, checked: existing.checked };
                }
                return newItem;
            });
        });
        setLoading(false);
    }, [projectData]);

    const handleChecklistItemToggle = (id) => {
        setChecklistItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            )
        );
    };

    const saveCustomItems = async (items) => {
        if (!projectId) return;

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects, updateProject }) => {
                const existing = listProjects().find(p => p.id === projectId) || {};
                updateProject({ ...existing, customChecklistItems: items });
            });
            return;
        }

        if (!db) return;
        try {
            const docRef = doc(db, 'projects', projectId);
            await updateDoc(docRef, { customChecklistItems: items });
        } catch (err) {
            console.error("Chyba při ukládání vlastních úkolů:", err);
        }
    };

    const handleAddCustomItem = () => {
        if (!newCustomItemText.trim()) return;

        const newItem = {
            id: 'custom_' + Date.now(),
            label: newCustomItemText,
            explanation: '',
            checked: false,
            isCustom: true
        };

        const updatedCustomItems = [...customItems, newItem];
        setCustomItems(updatedCustomItems);
        setNewCustomItemText('');
        saveCustomItems(updatedCustomItems);
    };

    const handleCustomItemToggle = (id) => {
        const updatedCustomItems = customItems.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        );
        setCustomItems(updatedCustomItems);
        saveCustomItems(updatedCustomItems);
    };

    const handleRemoveCustomItem = (id) => {
        const updatedCustomItems = customItems.filter(item => item.id !== id);
        setCustomItems(updatedCustomItems);
        saveCustomItems(updatedCustomItems);
    };

    if (loading) return <Box className="flex justify-center p-8"><CircularProgress /></Box>;
    if (error) return <Alert severity="error" className="m-4">{error}</Alert>;

    const phasesOrder = ['Přípravná fáze', 'Těsně před akcí', 'Realizační fáze', 'Fáze po akci'];

    // Group items by phase
    const groupedItems = phasesOrder.reduce((acc, phase) => {
        acc[phase] = checklistItems.filter(item => item.phase === phase);
        return acc;
    }, {});

    return (
        <section className="my-12">
            <h2 className="text-2xl font-bold border-b-2 pb-3 mb-8 text-slate-800">Harmonogram a Úkoly</h2>

            {checklistItems.length === 0 && customItems.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    Pro tento projekt aktuálně nejsou žádné specifické doporučené úkoly.
                </Typography>
            ) : (
                <Box>
                    {phasesOrder.map(phase => {
                        const itemsInPhase = groupedItems[phase];
                        if (itemsInPhase && itemsInPhase.length > 0) {
                            return (
                                <Box key={phase} sx={{ mb: 6 }}>
                                    <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
                                        {phase}
                                    </Typography>
                                    <FormGroup sx={{ gap: 2 }}>
                                        {itemsInPhase.map((item) => (
                                            <Box
                                                key={item.id}
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    bgcolor: 'background.paper',
                                                    border: '1px solid',
                                                    borderColor: item.checked ? 'success.light' : 'divider',
                                                    boxShadow: '0 2px 4px -2px rgb(0 0 0 / 0.05)',
                                                    transition: 'all 0.2s ease-in-out',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                                        borderColor: item.checked ? 'success.main' : 'primary.light',
                                                    }
                                                }}
                                            >
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={item.checked}
                                                            onChange={() => handleChecklistItemToggle(item.id)}
                                                            color={item.checked ? "success" : "primary"}
                                                        />
                                                    }
                                                    label={
                                                        <Typography
                                                            variant="body1"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: item.checked ? 'text.disabled' : 'text.primary',
                                                                textDecoration: item.checked ? 'line-through' : 'none',
                                                                transition: 'color 0.2s',
                                                            }}
                                                        >
                                                            {item.label}
                                                        </Typography>
                                                    }
                                                    sx={{ mb: 0, width: '100%' }}
                                                />
                                                {item.explanation && (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            ml: 4,
                                                            color: item.checked ? 'text.disabled' : 'text.secondary',
                                                            transition: 'color 0.2s',
                                                            lineHeight: 1.5
                                                        }}
                                                    >
                                                        {item.explanation}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ))}
                                    </FormGroup>
                                </Box>
                            );
                        }
                        return null;
                    })}

                    {customItems.length > 0 && (
                        <Box sx={{ mb: 6 }}>
                            <Typography variant="h6" sx={{ mb: 3, color: 'secondary.main', fontWeight: 'bold' }}>
                                Vlastní úkoly
                            </Typography>
                            <FormGroup sx={{ gap: 2 }}>
                                {customItems.map((item) => (
                                    <Box
                                        key={item.id}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            bgcolor: 'background.paper',
                                            border: '1px solid',
                                            borderColor: item.checked ? 'success.light' : 'divider',
                                            boxShadow: '0 2px 4px -2px rgb(0 0 0 / 0.05)',
                                            transition: 'all 0.2s ease-in-out',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            justifyContent: 'space-between',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                                borderColor: item.checked ? 'success.main' : 'secondary.light',
                                                '& .delete-btn': { opacity: 1 }
                                            }
                                        }}
                                    >
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={item.checked}
                                                    onChange={() => handleCustomItemToggle(item.id)}
                                                    color={item.checked ? "success" : "secondary"}
                                                />
                                            }
                                            label={
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: item.checked ? 'text.disabled' : 'text.primary',
                                                        textDecoration: item.checked ? 'line-through' : 'none',
                                                    }}
                                                >
                                                    {item.label}
                                                </Typography>
                                            }
                                            sx={{ mb: 0, flexGrow: 1 }}
                                        />
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveCustomItem(item.id)}
                                            className="delete-btn"
                                            sx={{ opacity: 0, transition: 'opacity 0.2s', mt: 0.5 }}
                                            title="Odstranit vlastní položku"
                                        >
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </FormGroup>
                        </Box>
                    )}
                </Box>
            )}

            {/* Přidání vlastní položky */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Přidat vlastní úkol..."
                    value={newCustomItemText}
                    onChange={(e) => setNewCustomItemText(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomItem();
                        }
                    }}
                    sx={{ width: '100%', maxWidth: 400 }}
                />
                <Button
                    variant="contained"
                    startIcon={<AddCircleOutline />}
                    onClick={handleAddCustomItem}
                    disabled={!newCustomItemText.trim()}
                >
                    Přidat úkol
                </Button>
            </Box>
        </section>
    );
};

export default ProjectChecklist;
