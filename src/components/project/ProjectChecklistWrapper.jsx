import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import {
    Typography, Checkbox, FormGroup, Box, CircularProgress, Alert,
    TextField, Button, IconButton, Select, MenuItem, FormControl, Chip
} from '@mui/material';
import { DeleteOutline, AddCircleOutline, PersonOutline, EventOutlined } from '@mui/icons-material';
import { checklistMeasuresMapping } from '../../config/checklistMeasuresMapping';

const ProjectChecklist = ({ projectId: propProjectId, audienceSize: propAudienceSize }) => {
    const { id: routeProjectId } = useParams();
    const projectId = propProjectId || routeProjectId;
    const [projectData, setProjectData] = useState(null);
    const [autoChecklist, setAutoChecklist] = useState([]);
    const [customItems, setCustomItems] = useState([]);
    const [taskState, setTaskState] = useState({}); // { [id]: { checked, assignee, dueDate } }
    const [newCustomItemText, setNewCustomItemText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- 1. Live load projektu ---
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
                            setTaskState(lp.checklistTaskState || {});
                        }
                    });
                    return;
                }

                if (!db) return;
                const docRef = doc(db, 'projects', projectId);
                import('firebase/firestore').then(({ onSnapshot }) => {
                    unsubscribe = onSnapshot(docRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            setProjectData(data);
                            setCustomItems(data.customChecklistItems || []);
                            setTaskState(data.checklistTaskState || {});
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
        return () => { if (unsubscribe) unsubscribe(); };
    }, [projectId]);

    // --- 2. Generování auto-checklistu podle pravidel ---
    useEffect(() => {
        if (!projectData) return;

        const newChecklist = [];
        const pushItem = (id, label, explanation, phase = 'Přípravná fáze') => {
            newChecklist.push({ id, label, explanation, phase });
        };

        const audience = parseInt(projectData.audienceSize, 10) || 0;
        const env = (projectData.environmentType || '').toLowerCase();
        const eventType = (projectData.eventType || '').toLowerCase();

        const risks = projectData.customRisks || projectData.risks || [];
        const hasRisk = (keyword) => risks.some(r => {
            const riskName = typeof r === 'string' ? r : (r?.name || '');
            return riskName.toLowerCase().includes(keyword.toLowerCase());
        });

        // --- THRESHOLDS ---
        if (audience >= 200) {
            pushItem('fire_doc_consult', 'Zajistit a nahlásit požární dozor', 'Pro akce nad 200 účastníků je nutné zajišťovat požární asistenci dle vyhlášky.', 'Přípravná fáze');
            pushItem('medical_aid', 'Objednat a nasmlouvat zdravotnickou službu', 'Pro větší akce zajistěte smluvní dozor záchranné služby (ZZS) nebo Červeného kříže.', 'Přípravná fáze');
        }
        if (audience >= 1000) {
            pushItem('police_notify', 'Ohlásit pořádání akce Policii ČR', 'Při velkém počtu se doporučuje preventivně komunikovat plánovaný harmonogram PČR.', 'Přípravná fáze');
        }

        // --- ENVIRONMENT ---
        if (env === 'vnitřní' || env === 'kombinovaná') {
            pushItem('escape_routes', 'Zkontrolovat volné únikové cesty a značení', 'Před akcí všechny evakuační východy musí být odemčené (na panikové kování) a bez překážek.', 'Těsně před akcí');
            pushItem('max_capacity', 'Ověřit max. kolaudační kapacitu s majitelem', 'Počet návštěvníků nesmí překročit oficiální požární zprávu objektu.', 'Přípravná fáze');
        }
        if (env === 'venkovní' || env === 'kombinovaná') {
            pushItem('weather_plan', 'Ustavit osobu pro sledování nepřízně počasí', 'Sledovat radary (vítr, bouřky) a ustanovit limity, kdy se ruší stage / stahuje technika.', 'Přípravná fáze');
        }

        // --- RIZIKA ---
        if (hasRisk('alkohol') || hasRisk('opil')) {
            pushItem('security_bars', 'Posílená ostraha (Security) u pivních stanů', 'Riziko opilých návštěvníků vyžaduje tvrdší dozor barů a rychlejší odklízení skla.', 'Realizační fáze');
        }
        if (hasRisk('agresivit') || hasRisk('aktiv') || eventType === 'shromáždění') {
            pushItem('anticonflict', 'Vyžádat přítomnost Antikonfliktního týmu (AKT)', 'Specifické vyhrocené situace vyžadují specializované deeskalační profíky z řad PČR.', 'Přípravná fáze');
        }
        if (hasRisk('panika') || hasRisk('tlačenice')) {
            pushItem('crowd_management', 'Zavést crowd-management opatření u vstupů', 'Cik-cak koridory, počítadla a turnikety k rozbití vlny návštěvníků na vstupech.', 'Přípravná fáze');
        }

        // --- ACCESS MODEL ---
        const accessModel = projectData.accessModel || {};
        if (accessModel.singleEntry) {
            pushItem('access_single_capacity', 'Spočítat max. propustnost jediného vstupu a naplánovat otevření s rezervou', 'Jeden vchod je úzké hrdlo. Modelovat průtok osob/min a nechat dost času před začátkem akce.', 'Přípravná fáze');
        }
        if (accessModel.multipleEntries) {
            pushItem('access_multi_signage', 'Zajistit navigaci a značení k jednotlivým vstupům', 'Aby se dav rozptýlil rovnoměrně, musí být vstupy vidět a označené (tabule, směrovky, personál).', 'Těsně před akcí');
            pushItem('access_multi_comms', 'Koordinace mezi vstupy – rádiové kanály a signály pro uzavření', 'Pokud je jeden vstup přetížený nebo se řeší incident, musí se dav přesměrovat na ostatní.', 'Přípravná fáze');
        }
        if (accessModel.turnstiles) {
            pushItem('access_turnstiles_test', 'Otestovat turnikety / počítadla a kalibrovat s kapacitou', 'Pre-event test, ověření napojení na systém monitoringu kapacity a postup při výpadku.', 'Těsně před akcí');
        }
        if (accessModel.bagCheck) {
            pushItem('access_bag_setup', 'Připravit prostor a personál pro kontrolu zavazadel', 'Stoly, bezpečnostní přepážky, úschova zakázaných předmětů, briefing personálu.', 'Těsně před akcí');
            pushItem('access_bag_signage', 'Cedulky se seznamem zakázaných předmětů před kontrolou', 'Snižuje konflikty a zrychluje průchod, pokud lidé vědí dopředu, co nebrat.', 'Přípravná fáze');
        }
        if (accessModel.ticketing) {
            pushItem('access_ticket_system', 'Zajistit ticketing / akreditační systém a záložní offline režim', 'V případě výpadku sítě musí být způsob, jak pustit návštěvníky dovnitř.', 'Přípravná fáze');
        }

        // --- DURATION ---
        const duration = (projectData.duration || '').toLowerCase();
        if (duration === 'vikend' || duration === 'tyden' || duration === 'etapova') {
            pushItem('duration_shifts', 'Naplánovat směny personálu s odpočinkem a střídáním', 'Vícedenní akce vyžaduje rotaci klíčových pozic (velín, security), aby nedošlo k únavě a chybám.', 'Přípravná fáze');
            pushItem('duration_morning_walk', 'Ranní kontrola areálu (pre-event walk-through) pro každý den', 'Přes noc se mění podmínky – každé ráno projít checklist.', 'Realizační fáze');
        }
        if (duration === 'etapova') {
            pushItem('duration_stage_handover', 'Předávací protokol mezi etapami / lokalitami', 'Předat stav, incidenty, kontakty, zbytkové zásoby.', 'Realizační fáze');
        }

        // --- CONTROL ROOM ---
        if (projectData.hasControlRoom) {
            pushItem('controlroom_setup', 'Připravit velín – rozmístění monitorů, rádií, kontaktního listu', 'Velín je centrem rozhodování – musí mít všechny kanály, mapy a kontakty fyzicky po ruce.', 'Těsně před akcí');
            pushItem('controlroom_staffing', 'Určit směny a zástupy operátorů velínu', 'Velín nesmí být ani minutu neobsazen – zajistit striktní rozpis směn a přestávek.', 'Přípravná fáze');
        }

        // --- TÝMY BRIEFING ---
        const involvedTeamsObj = projectData.involvedTeams || {};
        const activeTeams = Object.keys(involvedTeamsObj).filter(team => involvedTeamsObj[team]);
        const hasTeamMatch = (keywords) => activeTeams.some(team => {
            const lt = team.toLowerCase();
            return keywords.some(kw => lt.includes(kw.toLowerCase()));
        });

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
            pushItem('briefing_categories', `Briefing aktivních kategorií účastníků (${categoriesForBriefing.join(', ')})`, 'Nezapomeňte uspořádat společný nebo oddělený briefing pro všechny tyto zapojené skupiny.', 'Těsně před akcí');
        }
        if (isStankari) {
            pushItem('stankari_komunikace', 'Urči osobu zodpovědnou za komunikaci se stánkaři.', 'Ať si připraví aktuální kontaktovník na stánkaře pro případ krizových situací.', 'Přípravná fáze');
        }

        // --- ČASOVKA ---
        const dates = projectData.dates || [];
        const hasTimeTrial = dates.some(d => d.isTimeTrial);
        if (hasTimeTrial && eventType === 'etapovy_cyklisticky_zavod') {
            pushItem('tt_risky_spots', 'Pro časovku identifikuj riziková místa kolize s chodci a vozidly', 'Při časovce je zvýšené riziko kolize na výjezdech z parkovišť OC a benzínových stanic.', 'Přípravná fáze');
            pushItem('tt_briefing_poradatele', 'Briefing pořadatelů – Upozornit na rizika kolize při časovce', 'V rámci briefingu zdůraznit specifická rizika časovky.', 'Těsně před akcí');
        }

        // --- BEZPEČNOSTNÍ OPATŘENÍ (POUZE S KONKRÉTNÍM MAPOVÁNÍM) ---
        const selectedMeasuresObj = projectData.selectedMeasures || projectData.measures || {};
        Object.keys(selectedMeasuresObj).forEach(measureName => {
            if (selectedMeasuresObj[measureName] && checklistMeasuresMapping[measureName]) {
                checklistMeasuresMapping[measureName].forEach(task => {
                    pushItem(task.id, task.label, task.explanation, task.phase || 'Přípravná fáze');
                });
            }
        });

        setAutoChecklist(newChecklist);
        setLoading(false);
    }, [projectData]);

    // --- 3. Tým pro assignee dropdown ---
    const teamMembers = useMemo(() => {
        const members = [];
        const ct = projectData?.coordinationTeam || [];
        ct.forEach(m => m?.name && members.push({ name: m.name, role: m.roleInTeam || m.function || '' }));
        const contacts = projectData?.contacts || [];
        contacts.forEach(c => c?.name && members.push({ name: c.name, role: c.role || '' }));
        // dedupe podle jména
        const seen = new Set();
        return members.filter(m => {
            if (seen.has(m.name)) return false;
            seen.add(m.name);
            return true;
        });
    }, [projectData]);

    // --- 4. Ukládání stavu ---
    const persistTaskState = useCallback(async (nextState) => {
        if (!projectId) return;
        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects, updateProject }) => {
                const existing = listProjects().find(p => p.id === projectId) || {};
                updateProject({ ...existing, checklistTaskState: nextState });
            });
            return;
        }
        if (!db) return;
        try {
            await updateDoc(doc(db, 'projects', projectId), { checklistTaskState: nextState });
        } catch (err) {
            console.error("Chyba při ukládání stavu úkolu:", err);
        }
    }, [projectId]);

    const updateTaskField = (id, field, value) => {
        const next = {
            ...taskState,
            [id]: { ...(taskState[id] || {}), [field]: value },
        };
        setTaskState(next);
        persistTaskState(next);
    };

    const getTaskState = (id) => taskState[id] || { checked: false, assignee: '', dueDate: '' };

    // --- 5. Vlastní úkoly ---
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
            await updateDoc(doc(db, 'projects', projectId), { customChecklistItems: items });
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
            isCustom: true,
        };
        const updated = [...customItems, newItem];
        setCustomItems(updated);
        setNewCustomItemText('');
        saveCustomItems(updated);
    };

    const handleRemoveCustomItem = (id) => {
        const updated = customItems.filter(item => item.id !== id);
        setCustomItems(updated);
        saveCustomItems(updated);
        // případně pročistit stav
        if (taskState[id]) {
            const next = { ...taskState };
            delete next[id];
            setTaskState(next);
            persistTaskState(next);
        }
    };

    if (loading) return <Box className="flex justify-center p-8"><CircularProgress /></Box>;
    if (error) return <Alert severity="error" className="m-4">{error}</Alert>;

    const phasesOrder = ['Přípravná fáze', 'Těsně před akcí', 'Realizační fáze', 'Fáze po akci'];
    const groupedAuto = phasesOrder.reduce((acc, phase) => {
        acc[phase] = autoChecklist.filter(item => item.phase === phase);
        return acc;
    }, {});

    // --- 6. Task Row ---
    const TaskRow = ({ item, onDelete }) => {
        const st = getTaskState(item.id);
        return (
            <Box
                sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: st.checked ? 'success.light' : 'divider',
                    boxShadow: '0 2px 4px -2px rgb(0 0 0 / 0.05)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <Checkbox
                        checked={!!st.checked}
                        onChange={() => updateTaskField(item.id, 'checked', !st.checked)}
                        color={st.checked ? 'success' : 'primary'}
                        sx={{ mt: -0.5 }}
                    />
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: 600,
                                color: st.checked ? 'text.disabled' : 'text.primary',
                                textDecoration: st.checked ? 'line-through' : 'none',
                            }}
                        >
                            {item.label}
                        </Typography>
                        {item.explanation && (
                            <Typography variant="body2" sx={{ color: st.checked ? 'text.disabled' : 'text.secondary', lineHeight: 1.5, mt: 0.5 }}>
                                {item.explanation}
                            </Typography>
                        )}

                        {/* Assignee + DueDate */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <Select
                                    value={st.assignee || ''}
                                    displayEmpty
                                    onChange={(e) => updateTaskField(item.id, 'assignee', e.target.value)}
                                    renderValue={(val) => (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <PersonOutline sx={{ fontSize: 16, color: '#94a3b8' }} />
                                            <Typography variant="caption" sx={{ color: val ? 'text.primary' : 'text.secondary' }}>
                                                {val || 'Nepřiřazeno'}
                                            </Typography>
                                        </Box>
                                    )}
                                    sx={{ fontSize: '0.8rem', height: 32 }}
                                >
                                    <MenuItem value=""><em>Nepřiřazeno</em></MenuItem>
                                    {teamMembers.map(m => (
                                        <MenuItem key={m.name} value={m.name}>
                                            {m.name}{m.role ? ` (${m.role})` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                size="small"
                                type="date"
                                value={st.dueDate || ''}
                                onChange={(e) => updateTaskField(item.id, 'dueDate', e.target.value)}
                                InputProps={{
                                    startAdornment: <EventOutlined sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />,
                                }}
                                sx={{ width: 175, '& input': { fontSize: '0.8rem', py: 0.75 } }}
                            />

                            {st.checked && (
                                <Chip size="small" label="Hotovo" color="success" sx={{ height: 22, fontSize: '0.7rem' }} />
                            )}
                        </Box>
                    </Box>
                    {onDelete && (
                        <IconButton size="small" color="error" onClick={onDelete} title="Odstranit">
                            <DeleteOutline fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </Box>
        );
    };

    return (
        <section className="my-12">
            <h2 className="text-2xl font-bold border-b-2 pb-3 mb-8 text-slate-800">Harmonogram a Úkoly</h2>

            {autoChecklist.length === 0 && customItems.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    Pro tento projekt aktuálně nejsou žádné specifické doporučené úkoly.
                </Typography>
            ) : (
                <Box>
                    {phasesOrder.map(phase => {
                        const items = groupedAuto[phase];
                        if (!items || items.length === 0) return null;
                        return (
                            <Box key={phase} sx={{ mb: 6 }}>
                                <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: 'bold' }}>
                                    {phase}
                                </Typography>
                                <FormGroup sx={{ gap: 2 }}>
                                    {items.map(item => (
                                        <TaskRow key={item.id} item={item} />
                                    ))}
                                </FormGroup>
                            </Box>
                        );
                    })}

                    {customItems.length > 0 && (
                        <Box sx={{ mb: 6 }}>
                            <Typography variant="h6" sx={{ mb: 3, color: 'secondary.main', fontWeight: 'bold' }}>
                                Vlastní úkoly
                            </Typography>
                            <FormGroup sx={{ gap: 2 }}>
                                {customItems.map(item => (
                                    <TaskRow
                                        key={item.id}
                                        item={item}
                                        onDelete={() => handleRemoveCustomItem(item.id)}
                                    />
                                ))}
                            </FormGroup>
                        </Box>
                    )}
                </Box>
            )}

            {/* Přidání vlastního úkolu */}
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
