import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { TextField, Button, Checkbox, FormControlLabel, FormGroup, IconButton, CircularProgress, Chip, Typography, FormControl, InputLabel, Select, MenuItem, Box, Paper, Collapse } from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline, CloudDone, Schedule, ExpandMore, DeleteOutline, Business, Handshake, Campaign, EmojiEvents, Groups, Close } from '@mui/icons-material';
import FileUploadDropzone from './FileUploadDropzone';

// --- Datová struktura pro týmy (nyní slouží jako VÝCHOZÍ hodnota) ---
const defaultTeamCategories = [
    {
        title: 'Hlavní organizační složky',
        icon: 'Business',
        teams: ['Vedení akce', 'Produkční tým', 'Technický tým', 'Bezpečnostní služba (SBS)', 'Zdravotnická služba', 'Pořadatelé na trati', 'Úsekáři / vedoucí úseků', 'Velitel trati']
    },
    {
        title: 'Smluvní a podpůrné skupiny',
        icon: 'Handshake',
        teams: ['Stánkoví prodejci', 'Dodavatelé (technika, stavby, sanita)', 'Catering / občerstvení', 'Úklidová služba', 'Dopravní koordinátoři', 'Dobrovolníci / brigádníci', 'Složky IZS (Policie, HZS, ZZS)']
    },
    {
        title: 'Komunikace a média',
        icon: 'Campaign',
        teams: ['Tiskový a mediální tým (PR)', 'Moderátoři / speakři']
    },
    {
        title: 'Sportovní a programová složka',
        icon: 'EmojiEvents',
        teams: ['Sportovní organizace závodu', 'Závodníci / sportovci', 'Manažeři týmů / doprovod']
    },
    {
        title: 'Další důležité skupiny',
        icon: 'Groups',
        teams: ['Místní úřady / povolovací orgány', 'Partneři a sponzoři']
    }
];

const categoryIcons = {
    Business: <Business />,
    Handshake: <Handshake />,
    Campaign: <Campaign />,
    EmojiEvents: <EmojiEvents />,
    Groups: <Groups />,
};

// Komponenta pro zobrazení stavu ukládání (beze změny)
const SaveStatusIndicator = ({ status }) => {
    if (status === 'Uloženo') return <Chip icon={<CloudDone />} label="Všechny změny uloženy" size="small" />;
    if (status === 'Ukládám...') return <Chip icon={<CircularProgress size={16} />} label="Ukládám..." size="small" variant="outlined" />;
    if (status === 'Chyba') return <Chip label="Chyba při ukládání" color="error" size="small" />;
    return null;
};


function ProjectBasic() {
    const { id: projectId } = useParams();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState(null);
    // --- NOVÝ STAV: Drží dynamickou strukturu týmů ---
    const [teams, setTeams] = useState(defaultTeamCategories);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('Načteno');

    const [collaborators, setCollaborators] = useState([]);
    const [globalVulnerabilities, setGlobalVulnerabilities] = useState([]);
    const [metaLoading, setMetaLoading] = useState(true);

    const latestDataRef = useRef(null);

    // Stav rozbalení detailního harmonogramu - v useRef, aby auto-save neovlivnil rozbalení
    const [expandedSchedules, setExpandedSchedules] = useState({});

    const toggleSchedule = useCallback((index) => {
        setExpandedSchedules(prev => ({ ...prev, [index]: !prev[index] }));
    }, []);

    // Funkce pro manipulaci s časovými bloky v harmonogramu dne
    const handleScheduleBlockChange = useCallback((dateIndex, blockIndex, field, value) => {
        updateFormData(prev => ({
            ...prev,
            dates: prev.dates.map((item, i) => {
                if (i !== dateIndex) return item;
                const blocks = [...(item.scheduleBlocks || [])];
                blocks[blockIndex] = { ...blocks[blockIndex], [field]: value };
                return { ...item, scheduleBlocks: blocks };
            })
        }));
    }, []);

    const addScheduleBlock = useCallback((dateIndex) => {
        updateFormData(prev => ({
            ...prev,
            dates: prev.dates.map((item, i) => {
                if (i !== dateIndex) return item;
                const blocks = [...(item.scheduleBlocks || [])];
                blocks.push({ timeFrom: '', timeTo: '', description: '' });
                return { ...item, scheduleBlocks: blocks };
            })
        }));
        // Automaticky rozbal harmonogram při přidání bloku
        setExpandedSchedules(prev => ({ ...prev, [dateIndex]: true }));
    }, []);

    const removeScheduleBlock = useCallback((dateIndex, blockIndex) => {
        updateFormData(prev => ({
            ...prev,
            dates: prev.dates.map((item, i) => {
                if (i !== dateIndex) return item;
                const blocks = (item.scheduleBlocks || []).filter((_, bi) => bi !== blockIndex);
                return { ...item, scheduleBlocks: blocks };
            })
        }));
    }, []);

    // --- Načtení globálních zranitelností ---
    useEffect(() => {
        const fetchVulns = async () => {
             if (!db) return;
             try {
                 const vulnsRef = doc(db, "settings", "globalVulnerabilities");
                 const snap = await getDoc(vulnsRef);
                 if (snap.exists() && snap.data().vulnerabilities) {
                     setGlobalVulnerabilities(snap.data().vulnerabilities);
                 }
             } catch (e) { console.error("Chyba při stahování zranitelností:", e); }
        };
        fetchVulns();
    }, []);

    // --- UPRAVENO: Načtení dat projektu z Firestore nebo localStore ---
    useEffect(() => {
        if (!projectId) return;

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects }) => {
                const lp = listProjects().find(p => p.id === projectId);
                if (lp) {
                    setTeams(lp.projectTeamStructure || defaultTeamCategories);
                    const localData = {
                        name: lp.name || '',
                        officialName: lp.officialName || '',
                        organizer: lp.organizer || '',
                        audienceSize: lp.audienceSize || '',
                        environmentType: lp.environmentType || '',
                        eventType: lp.eventType || '',
                        eventTypeOther: lp.eventTypeOther || '',
                        hasControlRoom: lp.hasControlRoom || false,
                        involvedTeams: lp.involvedTeams || {},
                        dates: lp.dates && lp.dates.length > 0 ? lp.dates : [{ date: '', location: '' }],
                        ownerId: lp.ownerId,
                        members: lp.members || [],
                        author: lp.author || 'Lokální Uživatel',
                        projectTeamStructure: lp.projectTeamStructure || defaultTeamCategories,
                        documents: lp.documents || [],
                        selectedVulnerabilities: lp.selectedVulnerabilities || [],
                    };
                    setFormData(localData);
                    latestDataRef.current = localData;
                    if (saveStatus === 'Načteno') setSaveStatus('Uloženo');
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

        const projectRef = doc(db, 'projects', projectId);
        const unsubscribe = onSnapshot(projectRef, (docSnap) => {
            if (docSnap.metadata.hasPendingWrites) return;
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTeams(data.projectTeamStructure || defaultTeamCategories);
                const serverData = {
                    name: data.name || '',
                    officialName: data.officialName || '',
                    organizer: data.organizer || '',
                    audienceSize: data.audienceSize || '',
                    environmentType: data.environmentType || '',
                    eventType: data.eventType || '',
                    eventTypeOther: data.eventTypeOther || '',
                    hasControlRoom: data.hasControlRoom || false,
                    involvedTeams: data.involvedTeams || {},
                    dates: data.dates && data.dates.length > 0 ? data.dates : [{ date: '', location: '' }],
                    ownerId: data.ownerId,
                    members: data.members || [],
                    author: data.author || '',
                    projectTeamStructure: data.projectTeamStructure || defaultTeamCategories,
                    documents: data.documents || [],
                    selectedVulnerabilities: data.selectedVulnerabilities || [],
                };
                // Nepřepisuj lokální data, pokud uživatel právě edituje (neuložené změny)
                setSaveStatus(prev => {
                    if (prev === 'Ukládám...') {
                        // Máme neuložené lokální změny – nenahrazuj formData ze serveru,
                        // jinak ztratíme lokální editace (např. datum)
                        return prev;
                    }
                    setFormData(serverData);
                    latestDataRef.current = serverData;
                    if (prev === 'Načteno') return 'Uloženo';
                    return prev;
                });
            } else {
                console.error("Projekt nenalezen!");
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    // Načtení metadat (beze změny)
    useEffect(() => {
        const fetchMetaInfo = async () => {
            if (!formData) return;
            setMetaLoading(true);

            if (projectId.startsWith('local-') || !db) {
                setMetaLoading(false);
                return;
            }

            if (!formData.author && formData.ownerId) {
                try {
                    const ownerDocSnap = await getDoc(doc(db, 'users', formData.ownerId));
                    if (ownerDocSnap.exists()) {
                        updateFormData(prev => ({ ...prev, author: ownerDocSnap.data().email }));
                    }
                } catch (e) { console.error("Failed to fetch author email:", e); }
            }
            if (formData.members && formData.members.length > 1) {
                try {
                    const collaboratorPromises = formData.members
                        .filter(id => id !== formData.ownerId)
                        .map(id => getDoc(doc(db, 'users', id)));

                    const collaboratorDocs = await Promise.all(collaboratorPromises);
                    const collaboratorData = collaboratorDocs
                        .map(doc => doc.exists() ? doc.data().email : null)
                        .filter(email => email);
                    setCollaborators(collaboratorData);
                } catch (e) {
                    console.error("Failed to fetch collaborator emails:", e);
                    setCollaborators(['Chyba při načítání spolupracovníků.']);
                }
            } else {
                setCollaborators([]);
            }
            setMetaLoading(false);
        };
        fetchMetaInfo();
    }, [formData?.ownerId, formData?.members?.length]);

    // Automatické ukládání
    useEffect(() => {
        if (!formData || saveStatus !== 'Ukládám...') return;
        const handler = setTimeout(async () => {
            if (!latestDataRef.current) return;
            try {
                if (projectId.startsWith('local-')) {
                    import('../../services/localStore').then(({ listProjects, updateProject }) => {
                        const existing = listProjects().find(p => p.id === projectId) || {};
                        updateProject({ ...existing, ...latestDataRef.current });
                        setSaveStatus('Uloženo');
                    });
                    return;
                }

                if (!db) return;
                const projectRef = doc(db, 'projects', projectId);
                await setDoc(projectRef, { ...latestDataRef.current, lastEdited: serverTimestamp() }, { merge: true });
                setSaveStatus('Uloženo');
            } catch (error) {
                console.error("Chyba při automatickém ukládání: ", error);
                setSaveStatus('Chyba');
            }
        }, 1500);
        return () => clearTimeout(handler);
    }, [formData, projectId, saveStatus]);

    // Uložení při opuštění stránky
    useEffect(() => {
        const saveOnExit = async () => {
            if (saveStatus === 'Ukládám...' && latestDataRef.current) {
                if (projectId.startsWith('local-')) {
                    import('../../services/localStore').then(({ listProjects, updateProject }) => {
                        const existing = listProjects().find(p => p.id === projectId) || {};
                        updateProject({ ...existing, ...latestDataRef.current });
                    });
                    return;
                }

                if (!db) return;
                const projectRef = doc(db, 'projects', projectId);
                await setDoc(projectRef, { ...latestDataRef.current, lastEdited: serverTimestamp() }, { merge: true });
            }
        };
        window.addEventListener('beforeunload', saveOnExit);
        return () => {
            window.removeEventListener('beforeunload', saveOnExit);
            saveOnExit();
        };
    }, [saveStatus, projectId]);

    // Aktualizace stavu (beze změny)
    const updateFormData = (updater) => {
        setFormData(prevData => {
            const newData = typeof updater === 'function' ? updater(prevData) : updater;
            latestDataRef.current = newData;
            return newData;
        });
        setSaveStatus('Ukládám...');
    };

    // --- NOVÉ FUNKCE pro manipulaci se strukturou týmů ---
    const handleTeamNameChange = (categoryIndex, teamIndex, newName) => {
        const newTeams = teams.map((category, cIndex) => {
            if (cIndex !== categoryIndex) return category;
            return {
                ...category,
                teams: category.teams.map((team, tIndex) => tIndex === teamIndex ? newName : team)
            };
        });
        setTeams(newTeams);
        // Zároveň aktualizujeme i hlavní stav pro uložení
        updateFormData(prev => ({ ...prev, projectTeamStructure: newTeams }));
    };

    const handleAddNewTeam = (categoryIndex) => {
        const newTeams = teams.map((category, cIndex) => {
            if (cIndex !== categoryIndex) return category;
            return { ...category, teams: [...category.teams, 'Nový tým'] }; // Přidá nový tým s defaultním názvem
        });
        setTeams(newTeams);
        updateFormData(prev => ({ ...prev, projectTeamStructure: newTeams }));
    };

    const handleRemoveTeam = (categoryIndex, teamIndex) => {
        const newTeams = teams.map((category, cIndex) => {
            if (cIndex !== categoryIndex) return category;
            return { ...category, teams: category.teams.filter((_, tIndex) => tIndex !== teamIndex) };
        });
        setTeams(newTeams);
        updateFormData(prev => ({ ...prev, projectTeamStructure: newTeams }));
    };


    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        updateFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleTeamToggle = (teamName) => {
        updateFormData(prev => ({
            ...prev,
            involvedTeams: {
                ...prev.involvedTeams,
                [teamName]: !prev.involvedTeams?.[teamName]
            }
        }));
    };

    const handleVulnerabilityToggle = (vulnId) => {
        updateFormData(prev => {
            const selected = prev.selectedVulnerabilities || [];
            if (selected.includes(vulnId)) {
                return { ...prev, selectedVulnerabilities: selected.filter(id => id !== vulnId) };
            } else {
                return { ...prev, selectedVulnerabilities: [...selected, vulnId] };
            }
        });
    };

    const handleDateChange = (index, e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        updateFormData(prev => ({
            ...prev,
            dates: prev.dates.map((item, i) => i === index ? { ...item, [name]: val } : item)
        }));
    };

    const addDateRow = () => {
        updateFormData(prev => ({ ...prev, dates: [...prev.dates, { date: '', location: '' }] }));
    };

    const removeDateRow = (index) => {
        updateFormData(prev => {
            if (prev.dates.length <= 1) return prev;
            return { ...prev, dates: prev.dates.filter((_, i) => i !== index) };
        });
    };

    if (loading) return <div className="flex justify-center items-center p-8"><CircularProgress /></div>;

    const handleFilesChange = (newDocumentsArray) => {
        updateFormData(prev => ({ ...prev, documents: newDocumentsArray }));
    };

    // --- ZCELA PŘEPRACOVANÉ JSX pro sekci Týmů ---
    return (
        <div className="space-y-10">
            <div className="flex justify-between items-start">
                <h1 className="text-3xl font-bold">Základní údaje o projektu</h1>
                <SaveStatusIndicator status={saveStatus} />
            </div>

            <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                <Typography variant="h6" gutterBottom>O projektu</Typography>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                        label="Název projektu (interní)"
                        name="name"
                        value={formData?.name || ''}
                        onChange={handleInputChange}
                        variant="filled"
                        fullWidth
                    />
                    <TextField
                        label="Autor projektu"
                        name="author"
                        value={metaLoading ? 'Načítání...' : formData?.author || ''}
                        onChange={handleInputChange}
                        variant="filled"
                        fullWidth
                    />
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Spolupracovníci</Typography>
                        {metaLoading ? <CircularProgress size={20} /> : (
                            collaborators.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {collaborators.map((email, i) => <Chip key={i} label={email} size="small" />)}
                                </Box>
                            ) : (
                                <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>Projekt není sdílen.</Typography>
                            )
                        )}
                    </Box>
                </div>
            </Paper>

            <section>
                <h2 className="text-xl font-semibold border-b pb-3 mb-6">Základní informace o akci</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TextField label="Oficiální název akce" name="officialName" value={formData?.officialName || ''} onChange={handleInputChange} variant="outlined" fullWidth />
                    <TextField label="Hlavní organizátor" name="organizer" value={formData?.organizer || ''} onChange={handleInputChange} variant="outlined" fullWidth />
                    <TextField label="Očekávaný nejvyšší počet osob v jeden moment" name="audienceSize" type="number" value={formData?.audienceSize || ''} onChange={handleInputChange} variant="outlined" fullWidth />
                    <FormControl fullWidth variant="outlined">
                        <InputLabel>Prostředí akce</InputLabel>
                        <Select name="environmentType" value={formData?.environmentType || ''} onChange={handleInputChange} label="Prostředí akce">
                            <MenuItem value=""><em>-- Vyberte --</em></MenuItem>
                            <MenuItem value="venkovní">Venkovní akce</MenuItem>
                            <MenuItem value="vnitřní">Vnitřní akce</MenuItem>
                            <MenuItem value="kombinovaná">Kombinovaná akce</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth variant="outlined">
                        <InputLabel>Typ akce</InputLabel>
                        <Select name="eventType" value={formData?.eventType || ''} onChange={handleInputChange} label="Typ akce">
                            <MenuItem value=""><em>-- Vyberte --</em></MenuItem>
                            <MenuItem value="shromáždění">Shromáždění</MenuItem>
                            <MenuItem value="etapovy_cyklisticky_zavod">Etapový cyklistický závod</MenuItem>
                            <MenuItem value="detsky_den_firmy">Dětský den firmy</MenuItem>
                            <MenuItem value="konference_prednaska">Konference / přednáška</MenuItem>
                            <MenuItem value="hudebni_akce">Hudební akce</MenuItem>
                            <MenuItem value="sportovni_akce">Sportovní akce</MenuItem>
                            <MenuItem value="ostatni_akce">Ostatní akce</MenuItem>
                        </Select>
                    </FormControl>

                    {formData?.eventType === 'ostatni_akce' && (
                        <TextField
                            label="Specifikujte typ akce" name="eventTypeOther" value={formData?.eventTypeOther || ''} onChange={handleInputChange}
                            variant="outlined" fullWidth className="md:col-span-2"
                        />
                    )}

                    <Box className="md:col-span-2 mt-2">
                        <FormControlLabel
                            control={<Checkbox checked={formData?.hasControlRoom || false} onChange={handleInputChange} name="hasControlRoom" />}
                            label="Bude na akci Control Room / Velín v průběhu celé akce?"
                        />
                    </Box>
                </div>
            </section>

            {globalVulnerabilities.length > 0 && (
                <section>
                    <h2 className="text-xl font-semibold border-b pb-3 mb-6">Specifika akce</h2>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Zaškrtněte specifika, která se vztahují na vaši akci. Na základě vybraných specifik se automaticky upraví hodnoty v analýze rizik.
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {globalVulnerabilities.map(vuln => (
                            <FormControlLabel
                                key={vuln.id}
                                control={
                                    <Checkbox
                                        checked={(formData?.selectedVulnerabilities || []).includes(vuln.id)}
                                        onChange={() => handleVulnerabilityToggle(vuln.id)}
                                    />
                                }
                                label={vuln.name}
                            />
                        ))}
                    </div>
                </section>
            )}

            <section>
                <h2 className="text-xl font-semibold border-b pb-3 mb-6">Dokumenty a podklady akce</h2>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Nahrajte harmonogram, PDF prezentace, tiskové zprávy, nebo jiné důležité dokumenty k události.
                    Materiály budou následně využity AI pro inteligentní bezpečnostní audit.
                </Typography>
                <FileUploadDropzone
                    projectId={projectId}
                    existingFiles={formData?.documents || []}
                    onFilesChange={handleFilesChange}
                />
            </section>

            <section>
                <h2 className="text-xl font-semibold border-b pb-3 mb-6">Termíny, místa a harmonogram</h2>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Zadejte dny konání akce. U každého dne můžete volitelně rozbalit detailní harmonogram s časovými bloky.
                </Typography>
                <div className="space-y-6">
                    {formData?.dates.map((item, index) => {
                        const blocks = item.scheduleBlocks || [];
                        const isExpanded = expandedSchedules[index] || false;
                        return (
                            <Paper key={index} variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                                <div className="flex items-center gap-4">
                                    <TextField label={`Datum ${index + 1}`} name="date" type="date" value={item.date} onChange={(e) => handleDateChange(index, e)} InputLabelProps={{ shrink: true }} variant="outlined" sx={{ minWidth: 160 }} />
                                    <TextField label="Místo konání" name="location" value={item.location || ''} onChange={(e) => handleDateChange(index, e)} variant="outlined" className="flex-1" />
                                    <TextField label="Popis dne (nepovinné)" name="description" value={item.description || ''} onChange={(e) => handleDateChange(index, e)} variant="outlined" className="flex-1" />
                                    {formData?.eventType === 'etapovy_cyklisticky_zavod' && (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={item.isTimeTrial || false}
                                                    onChange={(e) => handleDateChange(index, { target: { name: 'isTimeTrial', value: e.target.checked, type: 'checkbox', checked: e.target.checked } })}
                                                />
                                            }
                                            label="Časovka"
                                            sx={{ whiteSpace: 'nowrap' }}
                                        />
                                    )}
                                    <IconButton onClick={() => removeDateRow(index)} color="secondary" disabled={formData.dates.length <= 1} size="small"><DeleteOutline fontSize="small" /></IconButton>
                                </div>

                                {/* Detailní harmonogram dne */}
                                <Box sx={{ mt: 1.5 }}>
                                    <Button
                                        size="small"
                                        startIcon={<Schedule fontSize="small" />}
                                        endIcon={<ExpandMore sx={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
                                        onClick={() => toggleSchedule(index)}
                                        sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 500 }}
                                    >
                                        Detailní harmonogram dne
                                        {blocks.length > 0 && (
                                            <Chip label={`${blocks.length} bloků`} size="small" sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} />
                                        )}
                                    </Button>

                                    <Collapse in={isExpanded}>
                                        <Box sx={{ mt: 1.5, pl: 1, borderLeft: '3px solid #e0e0e0', ml: 1 }}>
                                            {blocks.map((block, blockIndex) => (
                                                <div key={blockIndex} className="flex items-center gap-2 mb-2">
                                                    <TextField
                                                        label="Od"
                                                        type="time"
                                                        value={block.timeFrom || ''}
                                                        onChange={(e) => handleScheduleBlockChange(index, blockIndex, 'timeFrom', e.target.value)}
                                                        InputLabelProps={{ shrink: true }}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ width: 110 }}
                                                    />
                                                    <TextField
                                                        label="Do"
                                                        type="time"
                                                        value={block.timeTo || ''}
                                                        onChange={(e) => handleScheduleBlockChange(index, blockIndex, 'timeTo', e.target.value)}
                                                        InputLabelProps={{ shrink: true }}
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ width: 110 }}
                                                    />
                                                    <TextField
                                                        label="Popis aktivity"
                                                        value={block.description || ''}
                                                        onChange={(e) => handleScheduleBlockChange(index, blockIndex, 'description', e.target.value)}
                                                        variant="outlined"
                                                        size="small"
                                                        className="flex-1"
                                                    />
                                                    <IconButton size="small" onClick={() => removeScheduleBlock(index, blockIndex)} color="secondary">
                                                        <RemoveCircleOutline fontSize="small" />
                                                    </IconButton>
                                                </div>
                                            ))}
                                            <Button size="small" startIcon={<AddCircleOutline />} onClick={() => addScheduleBlock(index)} sx={{ mt: 0.5 }}>
                                                Přidat časový blok
                                            </Button>
                                        </Box>
                                    </Collapse>
                                </Box>
                            </Paper>
                        );
                    })}
                    <Button startIcon={<AddCircleOutline />} onClick={addDateRow}>Přidat další termín</Button>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold border-b pb-3 mb-6">Týmy podílející se na akci</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((category, categoryIndex) => (
                        <Paper
                            key={category.title}
                            variant="outlined"
                            sx={{ borderRadius: 3, overflow: 'hidden' }}
                        >
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                px: 2.5, py: 1.5,
                                backgroundColor: '#f8fafc',
                                borderBottom: '1px solid #e2e8f0',
                            }}>
                                <Box sx={{ color: '#64748b', display: 'flex' }}>
                                    {categoryIcons[category.icon] || <Groups />}
                                </Box>
                                <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#334155' }}>
                                    {category.title}
                                </Typography>
                            </Box>
                            <Box sx={{ px: 1.5, py: 1 }}>
                                {category.teams.map((team, teamIndex) => {
                                    const isActive = formData?.involvedTeams?.[team] || false;
                                    return (
                                        <Box
                                            key={teamIndex}
                                            onClick={() => handleTeamToggle(team)}
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: 1,
                                                px: 1.5, py: 0.75, mx: 0, my: 0.5,
                                                borderRadius: 2,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                                backgroundColor: isActive ? '#eff6ff' : 'transparent',
                                                border: '1px solid',
                                                borderColor: isActive ? '#bfdbfe' : 'transparent',
                                                '&:hover': {
                                                    backgroundColor: isActive ? '#dbeafe' : '#f1f5f9',
                                                },
                                            }}
                                        >
                                            <Box sx={{
                                                width: 20, height: 20, borderRadius: '6px',
                                                border: '2px solid',
                                                borderColor: isActive ? '#3b82f6' : '#cbd5e1',
                                                backgroundColor: isActive ? '#3b82f6' : '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.15s ease',
                                                flexShrink: 0,
                                            }}>
                                                {isActive && (
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                )}
                                            </Box>
                                            <TextField
                                                value={team}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleTeamNameChange(categoryIndex, teamIndex, e.target.value);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                variant="standard"
                                                fullWidth
                                                InputProps={{
                                                    disableUnderline: true,
                                                    sx: { fontSize: '0.875rem', color: isActive ? '#1e40af' : '#475569' }
                                                }}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); handleRemoveTeam(categoryIndex, teamIndex); }}
                                                sx={{ opacity: 0.3, '&:hover': { opacity: 1, color: '#ef4444' }, p: 0.5 }}
                                            >
                                                <Close sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Box>
                                    );
                                })}
                                <Button
                                    size="small"
                                    startIcon={<AddCircleOutline sx={{ fontSize: 18 }} />}
                                    onClick={() => handleAddNewTeam(categoryIndex)}
                                    sx={{
                                        mt: 0.5, mb: 0.5, ml: 1,
                                        textTransform: 'none',
                                        color: '#94a3b8',
                                        fontSize: '0.8rem',
                                        '&:hover': { color: '#3b82f6', backgroundColor: 'transparent' }
                                    }}
                                >
                                    Přidat tým
                                </Button>
                            </Box>
                        </Paper>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default ProjectBasic;