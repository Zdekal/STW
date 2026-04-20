import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
    Typography, Box, TextField, CircularProgress, Chip, Button, IconButton, Paper, Avatar, Tooltip,
    Radio, RadioGroup, FormControlLabel,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Menu, MenuItem, Alert
} from '@mui/material';
import { CloudDone, AddCircleOutline, Close, Person, Phone, Email, PhoneAndroid, Badge, LocationOn, FileDownload } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { availableTemplates } from '../../config/templates/czechTour2024';

const defaultStaffMembers = [
    { id: uuidv4(), ktRole: "Předseda KT", description: "Reprezentuje tým navenek, má rozhodující slovo.", name: "", eventFunction: "", phone: "", crisisPhone: "", email: "", isDefault: true },
    { id: uuidv4(), ktRole: "Krizový manažer", description: "Řídí koordinační tým, zodpovídá za agendu bezpečnosti.", name: "", eventFunction: "", phone: "", crisisPhone: "", email: "", isDefault: true },
    { id: uuidv4(), ktRole: "Sportovní koordinátor", description: "Koordinace se sportovní/programovou částí akce.", name: "", eventFunction: "", phone: "", crisisPhone: "", email: "", isDefault: true },
    { id: uuidv4(), ktRole: "Koordinátor s IZS", description: "Komunikace s Integrovaným záchranným systémem a státními orgány.", name: "", eventFunction: "", phone: "", crisisPhone: "", email: "", isDefault: true },
    { id: uuidv4(), ktRole: "Tým bezpečnosti", description: "Bezpečnost objektu/trasy, koordinace s SBS a IZS na místě.", name: "", eventFunction: "", phone: "", crisisPhone: "", email: "", isDefault: true },
    { id: uuidv4(), ktRole: "Interní komunikace", description: "Komunikace s vlastními lidmi – zaměstnanci, pořadateli, dobrovolníky.", name: "", eventFunction: "", phone: "", crisisPhone: "", email: "", isDefault: true },
    { id: uuidv4(), ktRole: "Externí komunikace (PR)", description: "Komunikace s médii a veřejností, tiskový mluvčí.", name: "", eventFunction: "", phone: "", crisisPhone: "", email: "", isDefault: true },
    { id: uuidv4(), ktRole: "Zdravotně-psychologická pomoc", description: "Okamžitá psychologická intervence, sledování raněných.", name: "", eventFunction: "", phone: "", crisisPhone: "", email: "", isDefault: true },
    { id: uuidv4(), ktRole: "Logistika a IT", description: "Vybavení KC, technika, hesla, weby, jídlo, přeprava.", name: "", eventFunction: "", phone: "", crisisPhone: "", email: "", isDefault: true },
    { id: uuidv4(), ktRole: "Koordinátor v místě incidentu", description: "Zůstává na místě incidentu a podává zprávy do KC.", name: "", eventFunction: "", phone: "", crisisPhone: "", email: "", isDefault: true },
    { id: uuidv4(), ktRole: "Zapisovatel", description: "Zaznamenává klíčové informace a rozhodnutí v KC.", name: "Ad hoc", eventFunction: "", phone: "", crisisPhone: "", email: "", isDefault: true },
];

// Aliasy starších názvů pozic → kanonický název v defaultStaffMembers.
// Používá se pro deduplikaci a párování při importu šablony.
const ktRoleAliases = {
    'Předseda': 'Předseda KT',
    'Manažer krizového týmu': 'Krizový manažer',
    'Krizový manažer koordinačního týmu': 'Krizový manažer',
    'Sport. koordinátor': 'Sportovní koordinátor',
    'Sportovní': 'Sportovní koordinátor',
    'Koord. s IZS': 'Koordinátor s IZS',
    'IZS': 'Koordinátor s IZS',
    'Bezpečnost': 'Tým bezpečnosti',
    'Interní': 'Interní komunikace',
    'Externí': 'Externí komunikace (PR)',
    'PR': 'Externí komunikace (PR)',
    'Komunikace (PR)': 'Externí komunikace (PR)',
    'Zdravotně-psych. pomoc': 'Zdravotně-psychologická pomoc',
    'Logistika': 'Logistika a IT',
    'IT': 'Logistika a IT',
    'Koord. v místě': 'Koordinátor v místě incidentu',
};

const canonicalKtRole = (role) => {
    if (!role) return '';
    return ktRoleAliases[role.trim()] || role.trim();
};

// Migrate old format (role field) to new format (ktRole field) + canonicalize role names.
function migrateMembers(members) {
    return members.map(m => ({
        ...m,
        ktRole: canonicalKtRole(m.ktRole || m.role || ''),
        eventFunction: m.eventFunction || '',
        crisisPhone: m.crisisPhone || '',
    }));
}

// Odstraní duplicitní pozice (stejný kanonický ktRole) – ponechá tu, která má nejvíc vyplněných polí.
function dedupeMembers(members) {
    const byRole = new Map();
    for (const m of members) {
        const role = canonicalKtRole(m.ktRole);
        const fillScore = ['name', 'eventFunction', 'phone', 'crisisPhone', 'email']
            .filter(k => (m[k] || '').toString().trim().length > 0).length;
        const existing = byRole.get(role);
        if (!existing || fillScore > existing._score) {
            byRole.set(role, { ...m, ktRole: role, _score: fillScore });
        }
    }
    return Array.from(byRole.values()).map(({ _score, ...rest }) => rest);
}

const SaveStatusIndicator = ({ status }) => {
    if (status === 'Uloženo') return <Chip icon={<CloudDone />} label="Všechny změny uloženy" size="small" />;
    if (status === 'Ukládám...') return <Chip icon={<CircularProgress size={16} />} label="Ukládám..." size="small" variant="outlined" />;
    return null;
};

const roleColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

function ProjectTeam() {
    const { id: projectId } = useParams();
    const [plan, setPlan] = useState(null);
    const [projectRisks, setProjectRisks] = useState([]);
    const [projectDates, setProjectDates] = useState([]);
    const [projectMeta, setProjectMeta] = useState({});
    const [riskProcedures, setRiskProcedures] = useState({});
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('Načteno');
    const userEdited = React.useRef(false);

    useEffect(() => {
        if (!projectId) return;

        const loadPlan = (data) => {
            setProjectRisks(data.customRisks || data.risks || []);
            setRiskProcedures(data.riskProcedures || {});
            setProjectDates(data.dates || []);
            setProjectMeta({
                organizer: data.organizer || '',
                officialName: data.officialName || '',
                audienceSize: data.audienceSize || '',
                author: data.author || '',
            });

            const defaults = {
                staffMembers: defaultStaffMembers,
                activationMethod: "V případě závažného incidentu si členové koordinačního týmu volají navzájem. Dále je zřízena WhatsApp skupina pro rychlé sdílení informací.",
                activationAuthority: "Koordinační plán může aktivovat Předseda KT, Krizový manažer nebo Koordinátor s IZS.",
                incidentTriggers: { automatic: [], manual: [] },
                coordinationCenters: [],
                roleTasks: {},
                commProtocol: {},
                pcrHzsInfo: {},
            };
            if (data.crisisStaffPlan) {
                const sp = data.crisisStaffPlan;
                const raw = migrateMembers(sp.staffMembers || defaults.staffMembers);
                const deduped = dedupeMembers(raw);
                // Pokud dedup/canonicalizace něco změnily, označ stav pro uložení.
                if (deduped.length !== raw.length || deduped.some((m, i) => m.ktRole !== raw[i]?.ktRole)) {
                    userEdited.current = true;
                }
                setPlan({
                    staffMembers: deduped,
                    activationMethod: sp.activationMethod || defaults.activationMethod,
                    activationAuthority: sp.activationAuthority || defaults.activationAuthority,
                    incidentTriggers: sp.incidentTriggers || defaults.incidentTriggers,
                    coordinationCenters: sp.coordinationCenters || defaults.coordinationCenters,
                    roleTasks: sp.roleTasks || {},
                    commProtocol: sp.commProtocol || {},
                    pcrHzsInfo: sp.pcrHzsInfo || {},
                });
            } else {
                setPlan(defaults);
            }
        };

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects }) => {
                const lp = listProjects().find(p => p.id === projectId);
                if (lp) loadPlan(lp);
                setLoading(false);
            });
            return;
        }

        if (!db) {
            setPlan({ staffMembers: defaultStaffMembers, activationMethod: '', activationAuthority: '', incidentTriggers: { automatic: [], manual: [] }, coordinationCenters: [], roleTasks: {}, commProtocol: {}, pcrHzsInfo: {} });
            setLoading(false);
            return;
        }

        const unsubscribe = onSnapshot(doc(db, 'projects', projectId), (docSnap) => {
            if (docSnap.metadata.hasPendingWrites) return;
            if (docSnap.exists()) loadPlan(docSnap.data());
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    // Derive unique locations from project dates
    const uniqueLocations = useMemo(() => {
        const locs = projectDates.map(d => d.location).filter(Boolean);
        return [...new Set(locs)];
    }, [projectDates]);

    // Auto-sync coordination centers with locations if user hasn't manually set them
    useEffect(() => {
        if (!plan || loading || uniqueLocations.length === 0) return;
        if (plan.coordinationCenters.length > 0) return; // already set

        const centers = uniqueLocations.map((loc, i) => ({
            id: uuidv4(),
            locationName: loc,
            primaryLocation: '',
            secondaryLocation: '',
        }));
        setPlan(prev => ({ ...prev, coordinationCenters: centers }));
    }, [uniqueLocations, loading]);

    const triggerableRisks = useMemo(() => {
        return projectRisks.filter(risk => riskProcedures[risk.id]?.activateCoordTeam === true);
    }, [projectRisks, riskProcedures]);

    // Odvozené hodnoty pro sekci 6 (Základní údaje pro PČR a HZS) ze Základních údajů o akci.
    // Pokud uživatel pole vyplní ručně, jeho hodnota má vždy přednost. Pole bez zdroje zůstávají prázdná.
    const derivedPcrHzs = useMemo(() => {
        const out = {};
        if (!plan) return out;

        if (projectMeta.organizer) out.orgName = projectMeta.organizer;
        if (projectMeta.audienceSize) out.expectedPersons = String(projectMeta.audienceSize);

        const uniqLocs = [...new Set((projectDates || []).map(d => d.location).filter(Boolean))];
        if (uniqLocs.length) out.eventAddress = uniqLocs.join('; ');

        // Primární kontaktní osoba pro IZS: Krizový manažer → Předseda KT → Koord. s IZS
        const primary = ['Krizový manažer', 'Předseda KT', 'Koordinátor s IZS']
            .map(role => plan.staffMembers.find(m => canonicalKtRole(m.ktRole) === role && (m.name || '').trim()))
            .find(Boolean);
        if (primary?.name) {
            out.contactPerson = primary.eventFunction
                ? `${primary.name} (${primary.eventFunction})`
                : primary.name;
        }
        if (primary?.phone) out.contactPhone = primary.phone;

        return out;
    }, [plan, projectMeta, projectDates]);

    const saveData = useCallback(async (dataToSave) => {
        if (!dataToSave || !projectId) return;

        // Also save staffMembers in the old 'role' field for backward compat with ProjectContacts
        const normalized = {
            ...dataToSave,
            staffMembers: dataToSave.staffMembers.map(m => ({ ...m, role: m.ktRole })),
        };

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects, updateProject }) => {
                const existing = listProjects().find(p => p.id === projectId);
                if (existing) {
                    updateProject({ ...existing, crisisStaffPlan: normalized });
                    setSaveStatus('Uloženo');
                }
            });
            return;
        }

        if (!db) return;
        try {
            await updateDoc(doc(db, 'projects', projectId), { crisisStaffPlan: normalized, lastEdited: serverTimestamp() });
            setSaveStatus('Uloženo');
        } catch (error) { console.error("Chyba při ukládání:", error); }
    }, [projectId]);

    useEffect(() => {
        if (!userEdited.current || loading || !plan) return;
        setSaveStatus('Ukládám...');
        const handler = setTimeout(() => {
            saveData(plan);
            userEdited.current = false;
        }, 2000);
        return () => clearTimeout(handler);
    }, [plan, loading, saveData]);

    const handlePlanChange = (field, value) => {
        userEdited.current = true;
        setPlan(prev => ({ ...prev, [field]: value }));
    };

    const handleMemberChange = (id, field, value) => {
        userEdited.current = true;
        setPlan(prev => ({
            ...prev,
            staffMembers: prev.staffMembers.map(m => m.id === id ? { ...m, [field]: value } : m),
        }));
    };

    const handleAddMember = () => {
        userEdited.current = true;
        setPlan(prev => ({
            ...prev,
            staffMembers: [...prev.staffMembers, { id: uuidv4(), ktRole: 'Nová pozice', description: '', name: '', eventFunction: '', phone: '', crisisPhone: '', email: '', isDefault: false }],
        }));
    };

    const handleRemoveMember = (id) => {
        userEdited.current = true;
        setPlan(prev => ({ ...prev, staffMembers: prev.staffMembers.filter(m => m.id !== id) }));
    };

    const handleTriggerChange = (riskId, activationType) => {
        userEdited.current = true;
        const newTriggers = {
            automatic: [...(plan.incidentTriggers.automatic || [])].filter(id => id !== riskId),
            manual: [...(plan.incidentTriggers.manual || [])].filter(id => id !== riskId),
        };
        if (activationType === 'automatic') newTriggers.automatic.push(riskId);
        else if (activationType === 'manual') newTriggers.manual.push(riskId);
        handlePlanChange('incidentTriggers', newTriggers);
    };

    const handleCenterChange = (id, field, value) => {
        userEdited.current = true;
        setPlan(prev => ({
            ...prev,
            coordinationCenters: prev.coordinationCenters.map(c => c.id === id ? { ...c, [field]: value } : c),
        }));
    };

    const handleAddCenter = () => {
        userEdited.current = true;
        setPlan(prev => ({
            ...prev,
            coordinationCenters: [...prev.coordinationCenters, { id: uuidv4(), locationName: '', primaryLocation: '', secondaryLocation: '' }],
        }));
    };

    const handleRemoveCenter = (id) => {
        userEdited.current = true;
        setPlan(prev => ({ ...prev, coordinationCenters: prev.coordinationCenters.filter(c => c.id !== id) }));
    };

    // === Import šablony ===
    const [templateMenuAnchor, setTemplateMenuAnchor] = useState(null);
    const [templateToConfirm, setTemplateToConfirm] = useState(null);
    const [importResult, setImportResult] = useState(null);

    const handleOpenTemplateMenu = (e) => setTemplateMenuAnchor(e.currentTarget);
    const handleCloseTemplateMenu = () => setTemplateMenuAnchor(null);

    const handlePickTemplate = (tpl) => {
        setTemplateMenuAnchor(null);
        setTemplateToConfirm(tpl);
    };

    const applyTemplate = (tpl) => {
        setPlan(prev => {
            // Merge staff members by canonical ktRole: template overwrites matching roles,
            // new roles get appended, existing roles not in template are kept.
            const existingByRole = new Map(prev.staffMembers.map(m => [canonicalKtRole(m.ktRole), m]));
            const mergedStaff = [];
            const consumedRoles = new Set();

            for (const tplMember of tpl.staffMembers) {
                const canonRole = canonicalKtRole(tplMember.ktRole);
                const existing = existingByRole.get(canonRole);
                mergedStaff.push({
                    ...existing,
                    ...tplMember,
                    ktRole: canonRole,
                    id: existing?.id || uuidv4(),
                    isDefault: existing?.isDefault ?? true,
                });
                consumedRoles.add(canonRole);
            }
            for (const existing of prev.staffMembers) {
                if (!consumedRoles.has(canonicalKtRole(existing.ktRole))) mergedStaff.push(existing);
            }

            // Map incident trigger names → existing project risk IDs
            const risksByName = new Map(projectRisks.map(r => [r.name, r.id]));
            const automaticIds = (tpl.incidentTriggerNames?.automatic || [])
                .map(n => risksByName.get(n)).filter(Boolean);
            const manualIds = (tpl.incidentTriggerNames?.manual || [])
                .map(n => risksByName.get(n)).filter(Boolean);

            // Map per-role tasks onto the merged member IDs
            const newRoleTasks = { ...(prev.roleTasks || {}) };
            for (const m of mergedStaff) {
                const tplTask = tpl.roleTasksByRole?.[m.ktRole];
                if (tplTask) newRoleTasks[m.id] = tplTask;
            }

            const matchedAuto = automaticIds.length;
            const matchedManual = manualIds.length;
            const unmatched = [
                ...(tpl.incidentTriggerNames?.automatic || []).filter(n => !risksByName.has(n)),
                ...(tpl.incidentTriggerNames?.manual || []).filter(n => !risksByName.has(n)),
            ];

            setImportResult({
                templateLabel: tpl.label,
                staffCount: tpl.staffMembers.length,
                matchedAuto,
                matchedManual,
                unmatched,
            });

            return {
                ...prev,
                staffMembers: mergedStaff,
                activationMethod: tpl.activationMethod || prev.activationMethod,
                activationAuthority: tpl.activationAuthority || prev.activationAuthority,
                incidentTriggers: { automatic: automaticIds, manual: manualIds },
                roleTasks: newRoleTasks,
            };
        });
        userEdited.current = true;
        setTemplateToConfirm(null);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading || !plan) {
        return <Box className="flex justify-center items-center p-8"><CircularProgress /></Box>;
    }

    return (
        <Box className="space-y-8">
            <Box className="flex justify-between items-start">
                <Box>
                    <Typography variant="h4" component="h1" className="font-bold text-gray-800">Koordinační plán</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Definice koordinačního týmu, center a pravidel aktivace. Data se automaticky promítnou do dokumentu Koordinační plán.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Tooltip title="Předvyplnit plán ze vzorové šablony (např. Czech Tour 2024). Existující hodnoty se přepíší.">
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<FileDownload sx={{ fontSize: 18 }} />}
                            onClick={handleOpenTemplateMenu}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                            Importovat šablonu
                        </Button>
                    </Tooltip>
                    <Menu
                        anchorEl={templateMenuAnchor}
                        open={Boolean(templateMenuAnchor)}
                        onClose={handleCloseTemplateMenu}
                    >
                        {availableTemplates.map(tpl => (
                            <MenuItem key={tpl.templateId} onClick={() => handlePickTemplate(tpl)}>
                                <Box>
                                    <Typography variant="body2" fontWeight={600}>{tpl.label}</Typography>
                                    <Typography variant="caption" color="text.secondary">{tpl.description}</Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Menu>
                    <SaveStatusIndicator status={saveStatus} />
                </Box>
            </Box>

            {/* === Import confirm dialog === */}
            <Dialog open={Boolean(templateToConfirm)} onClose={() => setTemplateToConfirm(null)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Importovat šablonu?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Šablona <strong>{templateToConfirm?.label}</strong> přepíše následující části plánu:
                    </DialogContentText>
                    <Box component="ul" sx={{ pl: 3, m: 0, color: 'text.secondary', fontSize: '0.9rem' }}>
                        <li>Jména, funkce a telefony v koordinačním týmu (přiřazené podle pozic)</li>
                        <li>Způsob svolání koordinačního týmu a kdo může aktivovat plán</li>
                        <li>Spouštěče incidentů (automatické / na rozhodnutí) – mapováno na rizika v projektu podle názvu</li>
                        <li>Úkoly pro jednotlivé pozice v KT</li>
                    </Box>
                    <Alert severity="info" sx={{ mt: 2, fontSize: '0.85rem' }}>
                        Nedotčeno zůstane: koordinační centra, komunikační protokol, údaje pro PČR/HZS a doplňkové pozice, které šablona neuvádí.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setTemplateToConfirm(null)}>Zrušit</Button>
                    <Button variant="contained" onClick={() => applyTemplate(templateToConfirm)}>Importovat</Button>
                </DialogActions>
            </Dialog>

            {/* === Import result snackbar-like alert === */}
            {importResult && (
                <Alert
                    severity="success"
                    onClose={() => setImportResult(null)}
                    sx={{ borderRadius: 2 }}
                >
                    <Typography variant="body2" fontWeight={600}>
                        Šablona „{importResult.templateLabel}" importována.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                        {importResult.staffCount} pozic v KT, {importResult.matchedAuto} automatických spouštěčů a {importResult.matchedManual} manuálních spouštěčů namapováno na rizika v projektu.
                    </Typography>
                    {importResult.unmatched.length > 0 && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#b45309' }}>
                            Nenamapováno (rizika nejsou v projektu): {importResult.unmatched.join(', ')}
                        </Typography>
                    )}
                </Alert>
            )}

            {/* === 1. Koordinační tým === */}
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, backgroundColor: '#f0f4ff', borderBottom: '1px solid #dbeafe' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#1e40af' }}>
                        1. Složení koordinačního týmu
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Kontaktní údaje se automaticky synchronizují se stránkou Týmy a kontakty.
                    </Typography>
                </Box>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {plan.staffMembers.map((member, idx) => (
                        <Paper
                            key={member.id}
                            variant="outlined"
                            sx={{
                                p: 2, borderRadius: 2.5, borderColor: '#e2e8f0',
                                '&:hover': { borderColor: '#cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
                                transition: 'all 0.15s',
                            }}
                        >
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                <Avatar sx={{
                                    width: 40, height: 40,
                                    backgroundColor: roleColors[idx % roleColors.length],
                                    fontSize: '0.85rem', fontWeight: 700, mt: 0.5,
                                }}>
                                    {getInitials(member.name)}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Chip
                                            label={member.ktRole}
                                            size="small"
                                            sx={{
                                                backgroundColor: roleColors[idx % roleColors.length] + '18',
                                                color: roleColors[idx % roleColors.length],
                                                fontWeight: 600, fontSize: '0.75rem', borderRadius: 1.5,
                                            }}
                                        />
                                        {member.description && (
                                            <Typography variant="caption" color="text.secondary">{member.description}</Typography>
                                        )}
                                        <Box sx={{ flex: 1 }} />
                                        <Tooltip title="Odstranit pozici">
                                            <IconButton size="small" onClick={() => handleRemoveMember(member.id)} sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: '#ef4444' } }}>
                                                <Close sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr 1fr' }, gap: 1.5 }}>
                                        <TextField
                                            placeholder="Jméno a příjmení"
                                            value={member.name || ''}
                                            onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                                            variant="outlined" size="small"
                                            InputProps={{ startAdornment: <Person sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />, sx: { borderRadius: 2, fontSize: '0.85rem' } }}
                                        />
                                        <TextField
                                            placeholder="Funkce na akci"
                                            value={member.eventFunction || ''}
                                            onChange={(e) => handleMemberChange(member.id, 'eventFunction', e.target.value)}
                                            variant="outlined" size="small"
                                            InputProps={{ startAdornment: <Badge sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />, sx: { borderRadius: 2, fontSize: '0.85rem' } }}
                                        />
                                        <TextField
                                            placeholder="Telefon"
                                            value={member.phone || ''}
                                            onChange={(e) => handleMemberChange(member.id, 'phone', e.target.value)}
                                            variant="outlined" size="small"
                                            InputProps={{ startAdornment: <Phone sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />, sx: { borderRadius: 2, fontSize: '0.85rem' } }}
                                        />
                                        <TextField
                                            placeholder="Krizový mobil"
                                            value={member.crisisPhone || ''}
                                            onChange={(e) => handleMemberChange(member.id, 'crisisPhone', e.target.value)}
                                            variant="outlined" size="small"
                                            InputProps={{ startAdornment: <PhoneAndroid sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />, sx: { borderRadius: 2, fontSize: '0.85rem' } }}
                                        />
                                        <TextField
                                            placeholder="E-mail"
                                            value={member.email || ''}
                                            onChange={(e) => handleMemberChange(member.id, 'email', e.target.value)}
                                            variant="outlined" size="small"
                                            InputProps={{ startAdornment: <Email sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />, sx: { borderRadius: 2, fontSize: '0.85rem' } }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
                    <Button
                        startIcon={<AddCircleOutline sx={{ fontSize: 18 }} />}
                        onClick={handleAddMember}
                        sx={{ alignSelf: 'flex-start', textTransform: 'none', color: '#94a3b8', '&:hover': { color: '#3b82f6' } }}
                    >
                        Přidat člena / pozici
                    </Button>
                </Box>
            </Paper>

            {/* === 2. Koordinační centra === */}
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#166534' }}>
                        2. Koordinační centra
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {uniqueLocations.length > 1
                            ? `Pro ${uniqueLocations.length} různých lokalit z harmonogramu definujte koordinační centra.`
                            : 'Určete primární a záložní koordinační centrum pro vaši akci.'
                        }
                    </Typography>
                </Box>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {plan.coordinationCenters.length === 0 && uniqueLocations.length === 0 && (
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, borderStyle: 'dashed', textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                Zadejte lokality v harmonogramu (Základní údaje) nebo přidejte centrum ručně.
                            </Typography>
                        </Paper>
                    )}
                    {plan.coordinationCenters.map((center, idx) => (
                        <Paper key={center.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: '#d1fae5' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                <LocationOn sx={{ color: '#16a34a', fontSize: 20 }} />
                                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#166534' }}>
                                    {center.locationName || `Centrum ${idx + 1}`}
                                </Typography>
                                <Box sx={{ flex: 1 }} />
                                <IconButton size="small" onClick={() => handleRemoveCenter(center.id)} sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: '#ef4444' } }}>
                                    <Close sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
                                <TextField
                                    label="Lokalita / etapa"
                                    value={center.locationName || center.stage || ''}
                                    onChange={(e) => handleCenterChange(center.id, 'locationName', e.target.value)}
                                    variant="outlined" size="small"
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />
                                <TextField
                                    label="Primární KC (adresa, popis)"
                                    value={center.primaryLocation || ''}
                                    onChange={(e) => handleCenterChange(center.id, 'primaryLocation', e.target.value)}
                                    variant="outlined" size="small"
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />
                                <TextField
                                    label="Záložní KC (adresa, popis)"
                                    value={center.secondaryLocation || ''}
                                    onChange={(e) => handleCenterChange(center.id, 'secondaryLocation', e.target.value)}
                                    variant="outlined" size="small"
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />
                            </Box>
                        </Paper>
                    ))}
                    <Button
                        startIcon={<AddCircleOutline sx={{ fontSize: 18 }} />}
                        onClick={handleAddCenter}
                        sx={{ alignSelf: 'flex-start', textTransform: 'none', color: '#94a3b8', '&:hover': { color: '#16a34a' } }}
                    >
                        Přidat koordinační centrum
                    </Button>
                </Box>
            </Paper>

            {/* === 3. Aktivace koordinačního plánu === */}
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, backgroundColor: '#fef3c7', borderBottom: '1px solid #fde68a' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#92400e' }}>
                        3. Aktivace koordinačního plánu
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Definujte způsob svolání týmu, kdo může plán aktivovat a jaké incidenty vedou k aktivaci.
                    </Typography>
                </Box>
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: '#334155' }}>
                            Způsob svolání koordinačního týmu
                        </Typography>
                        <TextField
                            multiline rows={3} fullWidth variant="outlined"
                            placeholder="Např. členové si volají navzájem, WhatsApp skupina, SMS brána..."
                            value={plan.activationMethod || ''}
                            onChange={(e) => handlePlanChange('activationMethod', e.target.value)}
                            InputProps={{ sx: { borderRadius: 2 } }}
                        />
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: '#334155' }}>
                            Kdo může koordinační plán aktivovat?
                        </Typography>
                        <TextField
                            multiline rows={2} fullWidth variant="outlined"
                            placeholder="Např. Předseda KT, Manažer krizového týmu, Koordinátor s IZS..."
                            value={plan.activationAuthority || ''}
                            onChange={(e) => handlePlanChange('activationAuthority', e.target.value)}
                            InputProps={{ sx: { borderRadius: 2 } }}
                        />
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5, color: '#334155' }}>
                            Incidenty vedoucí k aktivaci
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Pro každý incident zvolte, zda se koordinační plán aktivuje automaticky (vždy), nebo o aktivaci rozhoduje oprávněná osoba.
                        </Typography>

                        {projectRisks.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {projectRisks.map((risk) => {
                                    const automatic = (plan.incidentTriggers.automatic || []).includes(risk.id);
                                    const manual = (plan.incidentTriggers.manual || []).includes(risk.id);
                                    let currentValue = 'none';
                                    if (automatic) currentValue = 'automatic';
                                    if (manual) currentValue = 'manual';

                                    return (
                                        <Paper key={risk.id} variant="outlined" sx={{
                                            px: 2, py: 1, borderRadius: 2,
                                            borderColor: currentValue !== 'none' ? '#fde68a' : '#e2e8f0',
                                            backgroundColor: currentValue !== 'none' ? '#fffbeb' : '#fff',
                                            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                                        }}>
                                            <Typography variant="body2" sx={{ flex: 1, minWidth: 200, fontWeight: 500 }}>
                                                {risk.name}
                                            </Typography>
                                            <RadioGroup
                                                row value={currentValue}
                                                onChange={(e) => handleTriggerChange(risk.id, e.target.value)}
                                                sx={{ gap: 0 }}
                                            >
                                                <FormControlLabel value="none" control={<Radio size="small" />} label={<Typography variant="body2">Neaktivuje</Typography>} />
                                                <FormControlLabel value="automatic" control={<Radio size="small" />} label={<Typography variant="body2">Automaticky</Typography>} />
                                                <FormControlLabel value="manual" control={<Radio size="small" />} label={<Typography variant="body2">Na rozhodnutí</Typography>} />
                                            </RadioGroup>
                                        </Paper>
                                    );
                                })}
                            </Box>
                        ) : (
                            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2.5, borderStyle: 'dashed', textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    Nejprve přidejte rizika v sekci "Zvažovaná rizika".
                                </Typography>
                            </Paper>
                        )}
                    </Box>
                </Box>
            </Paper>

            {/* === 4. Úkoly členů KT === */}
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, backgroundColor: '#faf5ff', borderBottom: '1px solid #e9d5ff' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#6b21a8' }}>
                        4. Úkoly členů koordinačního týmu
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Pro každou pozici definujte konkrétní kroky a odpovědnosti při aktivaci KP.
                    </Typography>
                </Box>
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {plan.staffMembers.map((member, idx) => (
                        <Paper key={member.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: '#f3e8ff' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Chip
                                    label={member.ktRole}
                                    size="small"
                                    sx={{
                                        backgroundColor: roleColors[idx % roleColors.length] + '18',
                                        color: roleColors[idx % roleColors.length],
                                        fontWeight: 600, fontSize: '0.75rem', borderRadius: 1.5,
                                    }}
                                />
                                {member.name && (
                                    <Typography variant="caption" color="text.secondary">{member.name}</Typography>
                                )}
                            </Box>
                            <TextField
                                multiline rows={3} fullWidth variant="outlined"
                                placeholder={`Kroky a odpovědnosti pro pozici "${member.ktRole}" při aktivaci KP...\nNapř.:\n1. Dostavit se do KC do 30 minut\n2. Převzít komunikaci s...`}
                                value={(plan.roleTasks || {})[member.id] || ''}
                                onChange={(e) => {
                                    userEdited.current = true;
                                    setPlan(prev => ({ ...prev, roleTasks: { ...prev.roleTasks, [member.id]: e.target.value } }));
                                }}
                                InputProps={{ sx: { borderRadius: 2, fontSize: '0.85rem' } }}
                            />
                        </Paper>
                    ))}
                </Box>
            </Paper>

            {/* === 5. Komunikační protokol === */}
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, backgroundColor: '#ecfdf5', borderBottom: '1px solid #a7f3d0' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#065f46' }}>
                        5. Komunikační protokol
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Matice 2×2: kdo s kým komunikuje, jakými kanály, kdo koordinuje a jaká je šablona první zprávy.
                    </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                        {[
                            { key: 'internalIncoming', title: 'Vnitřní příchozí', desc: 'Od vlastních lidí → do KT', color: '#3b82f6' },
                            { key: 'internalOutgoing', title: 'Vnitřní odchozí', desc: 'Z KT → vlastním lidem', color: '#8b5cf6' },
                            { key: 'externalIncoming', title: 'Vnější příchozí', desc: 'Od IZS, médií, veřejnosti → do KT', color: '#06b6d4' },
                            { key: 'externalOutgoing', title: 'Vnější odchozí', desc: 'Z KT → médiím, veřejnosti, úřadům', color: '#f59e0b' },
                        ].map(cat => {
                            const data = (plan.commProtocol || {})[cat.key] || {};
                            const updateProto = (field, value) => {
                                userEdited.current = true;
                                setPlan(prev => ({
                                    ...prev,
                                    commProtocol: {
                                        ...prev.commProtocol,
                                        [cat.key]: { ...(prev.commProtocol?.[cat.key] || {}), [field]: value },
                                    }
                                }));
                            };
                            return (
                                <Paper key={cat.key} variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: cat.color + '30' }}>
                                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: cat.color, mb: 0.5 }}>
                                        {cat.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                                        {cat.desc}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                        <TextField label="Partneři / skupiny" size="small" fullWidth variant="outlined"
                                            placeholder="Např. pořadatelé, úsekáři, vedení..."
                                            value={data.partners || ''} onChange={(e) => updateProto('partners', e.target.value)}
                                            InputProps={{ sx: { borderRadius: 2, fontSize: '0.85rem' } }} />
                                        <TextField label="Komunikační kanály" size="small" fullWidth variant="outlined"
                                            placeholder="Např. vysílačky, WhatsApp, SMS..."
                                            value={data.channels || ''} onChange={(e) => updateProto('channels', e.target.value)}
                                            InputProps={{ sx: { borderRadius: 2, fontSize: '0.85rem' } }} />
                                        <TextField label="Koordinátor v KT" size="small" fullWidth variant="outlined"
                                            placeholder="Kdo z KT tuto komunikaci řídí?"
                                            value={data.coordinator || ''} onChange={(e) => updateProto('coordinator', e.target.value)}
                                            InputProps={{ sx: { borderRadius: 2, fontSize: '0.85rem' } }} />
                                        <TextField label="Šablona první zprávy" size="small" fullWidth variant="outlined" multiline rows={2}
                                            placeholder="Text první zprávy, která bude odeslána..."
                                            value={data.firstMessage || ''} onChange={(e) => updateProto('firstMessage', e.target.value)}
                                            InputProps={{ sx: { borderRadius: 2, fontSize: '0.85rem' } }} />
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Box>
                </Box>
            </Paper>

            {/* === 6. Tabulka pro PČR a HZS === */}
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#991b1b' }}>
                        6. Základní údaje pro PČR a HZS
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Formulář se základními údaji o organizaci a akci, který může být předán složkám IZS.
                    </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                        {[
                            { key: 'orgName', label: 'Název organizace' },
                            { key: 'orgAddress', label: 'Adresa sídla organizace' },
                            { key: 'eventAddress', label: 'Adresa konání akce' },
                            { key: 'contactPerson', label: 'Kontaktní osoba pro IZS' },
                            { key: 'contactPhone', label: 'Telefon kontaktní osoby' },
                            { key: 'expectedPersons', label: 'Očekávaný maximální počet osob' },
                            { key: 'securityLevel', label: 'Úroveň bezpečnostní připravenosti' },
                            { key: 'cooperationIZS', label: 'Forma spolupráce s IZS' },
                        ].map(f => {
                            const stored = (plan.pcrHzsInfo || {})[f.key];
                            const hasStored = stored !== undefined && stored !== null && stored !== '';
                            const displayed = hasStored ? stored : (derivedPcrHzs[f.key] || '');
                            const isDerived = !hasStored && Boolean(derivedPcrHzs[f.key]);
                            return (
                                <TextField
                                    key={f.key}
                                    label={f.label}
                                    fullWidth variant="outlined" size="small"
                                    value={displayed}
                                    onChange={(e) => {
                                        userEdited.current = true;
                                        setPlan(prev => ({
                                            ...prev,
                                            pcrHzsInfo: { ...(prev.pcrHzsInfo || {}), [f.key]: e.target.value },
                                        }));
                                    }}
                                    helperText={isDerived ? 'Automaticky převzato ze Základních údajů – můžete přepsat' : undefined}
                                    FormHelperTextProps={{ sx: { fontSize: '0.7rem', color: '#64748b', mt: 0.25 } }}
                                    InputProps={{ sx: { borderRadius: 2 } }}
                                />
                            );
                        })}
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
}

export default ProjectTeam;
