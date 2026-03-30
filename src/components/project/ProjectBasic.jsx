import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { TextField, Button, Checkbox, FormControlLabel, FormGroup, IconButton, CircularProgress, Chip, Typography, FormControl, InputLabel, Select, MenuItem, Box, Paper } from '@mui/material';
import { AddCircleOutline, RemoveCircleOutline, CloudDone } from '@mui/icons-material';
import FileUploadDropzone from './FileUploadDropzone';

// --- Datová struktura pro týmy (nyní slouží jako VÝCHOZÍ hodnota) ---
const defaultTeamCategories = [
    {
        title: '📋 Hlavní organizační složky',
        teams: ['Vedení akce', 'Produkční tým', 'Realizační tým', 'Technický tým', 'Bezpečnostní služba', 'Zdravotnická služba', 'Požární dohled', 'Sportovní organizace závodu']
    },
    {
        title: '👥 Smluvní a podpůrné skupiny',
        teams: ['Stánkoví prodejci', 'Dodavatelé (technika, stavby, sanita)', 'Úklidová služba', 'Dopravní koordinátoři', 'Dobrovolníci / brigádníci', 'Složky IZS (Policie, HZS, ZZS)']
    },
    {
        title: '🎤 Komunikační a návštěvnický servis',
        teams: ['Tým zákaznické podpory', 'Tiskový a mediální tým (PR)', 'Moderátoři / speakři']
    },
    {
        title: '🎭 Programová složka',
        teams: ['Umělci / sportovci / vystupující', 'Manažeři vystupujících / jejich týmy']
    },
    {
        title: '🧭 Další důležité skupiny',
        teams: ['Místní úřady / povolovací orgány', 'Partneři a sponzoři', 'Návštěvníci se zvláštními potřebami']
    }
];

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
                setFormData(serverData);
                latestDataRef.current = serverData;
                if (saveStatus === 'Načteno') setSaveStatus('Uloženo');
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
        const { name, value } = e.target;
        updateFormData(prev => ({
            ...prev,
            dates: prev.dates.map((item, i) => i === index ? { ...item, [name]: value } : item)
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
                <h2 className="text-xl font-semibold border-b pb-3 mb-6">Termíny a místa konání</h2>
                <div className="space-y-4">
                    {formData?.dates.map((item, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <TextField label={`Datum akce ${index + 1}`} name="date" type="date" value={item.date} onChange={(e) => handleDateChange(index, e)} InputLabelProps={{ shrink: true }} variant="outlined" className="flex-1" />
                            <TextField label={`Místo konání ${index + 1}`} name="location" value={item.location} onChange={(e) => handleDateChange(index, e)} variant="outlined" className="flex-1" />
                            <IconButton onClick={() => removeDateRow(index)} color="secondary" disabled={formData.dates.length <= 1}><RemoveCircleOutline /></IconButton>
                        </div>
                    ))}
                    <Button startIcon={<AddCircleOutline />} onClick={addDateRow}>Přidat další termín</Button>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold border-b pb-3 mb-6">Týmy podílející se na akci</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                    {teams.map((category, categoryIndex) => (
                        <div key={category.title}>
                            <Typography variant="h6" component="h3" className="font-semibold mb-2">{category.title}</Typography>
                            <FormGroup>
                                {category.teams.map((team, teamIndex) => (
                                    <div key={teamIndex} className="flex items-center -ml-3">
                                        <Checkbox
                                            checked={formData?.involvedTeams?.[team] || false}
                                            onChange={() => handleTeamToggle(team)}
                                        />
                                        <TextField
                                            value={team}
                                            onChange={(e) => handleTeamNameChange(categoryIndex, teamIndex, e.target.value)}
                                            variant="standard"
                                            fullWidth
                                            sx={{ flexGrow: 1 }}
                                        />
                                        <IconButton size="small" onClick={() => handleRemoveTeam(categoryIndex, teamIndex)}>
                                            <RemoveCircleOutline fontSize="small" />
                                        </IconButton>
                                    </div>
                                ))}
                                <Button
                                    size="small"
                                    startIcon={<AddCircleOutline />}
                                    onClick={() => handleAddNewTeam(categoryIndex)}
                                    sx={{ mt: 1, justifyContent: 'flex-start' }}
                                >
                                    Přidat tým
                                </Button>
                            </FormGroup>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default ProjectBasic;