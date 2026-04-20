// src/components/project/ProjectContacts.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
    Typography, Box, TextField, CircularProgress, Chip, Paper, Divider, Avatar
} from '@mui/material';
import { CloudDone, Person, Phone, Email, Badge } from '@mui/icons-material';

const SaveStatusIndicator = ({ status }) => {
    if (status === 'Uloženo') return <Chip icon={<CloudDone />} label="Všechny změny uloženy" size="small" />;
    if (status === 'Ukládám...') return <Chip icon={<CircularProgress size={16} />} label="Ukládám..." size="small" variant="outlined" />;
    return null;
};

function ProjectContacts() {
    const { id: projectId } = useParams();
    const [involvedTeams, setInvolvedTeams] = useState({});
    const [teamContacts, setTeamContacts] = useState({});
    const [staffMembers, setStaffMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('Načteno');
    const userEditedContacts = React.useRef(false);

    useEffect(() => {
        if (!projectId) return;

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects }) => {
                const lp = listProjects().find(p => p.id === projectId);
                if (lp) {
                    setInvolvedTeams(lp.involvedTeams || {});
                    setTeamContacts(lp.teamContacts || {});
                    setStaffMembers(lp.crisisStaffPlan?.staffMembers || []);
                }
                setLoading(false);
            });
            return;
        }

        if (!db) { setLoading(false); return; }

        const unsubscribe = onSnapshot(doc(db, 'projects', projectId), (docSnap) => {
            if (docSnap.metadata.hasPendingWrites) return;
            if (docSnap.exists()) {
                const data = docSnap.data();
                setInvolvedTeams(data.involvedTeams || {});
                setTeamContacts(data.teamContacts || {});
                setStaffMembers(data.crisisStaffPlan?.staffMembers || []);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    const saveTeamContacts = useCallback(async (newContacts) => {
        if (!projectId) return;

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects, updateProject }) => {
                const existing = listProjects().find(p => p.id === projectId);
                if (existing) {
                    updateProject({ ...existing, teamContacts: newContacts });
                    setSaveStatus('Uloženo');
                }
            });
            return;
        }

        if (!db) return;
        try {
            await updateDoc(doc(db, 'projects', projectId), { teamContacts: newContacts, lastEdited: serverTimestamp() });
            setSaveStatus('Uloženo');
        } catch (e) { console.error("Chyba při ukládání kontaktů:", e); }
    }, [projectId]);

    const saveStaffMembers = useCallback(async (newMembers) => {
        if (!projectId) return;

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects, updateProject }) => {
                const existing = listProjects().find(p => p.id === projectId);
                if (existing) {
                    const plan = existing.crisisStaffPlan || {};
                    updateProject({ ...existing, crisisStaffPlan: { ...plan, staffMembers: newMembers } });
                    setSaveStatus('Uloženo');
                }
            });
            return;
        }

        if (!db) return;
        try {
            const projectRef = doc(db, 'projects', projectId);
            // Read existing plan to not overwrite other fields
            await updateDoc(projectRef, { 'crisisStaffPlan.staffMembers': newMembers, lastEdited: serverTimestamp() });
            setSaveStatus('Uloženo');
        } catch (e) { console.error("Chyba při ukládání členů KT:", e); }
    }, [projectId]);

    // Debounced save for team contacts — only when user actually edited
    useEffect(() => {
        if (!userEditedContacts.current || loading) return;
        setSaveStatus('Ukládám...');
        const handler = setTimeout(() => {
            saveTeamContacts(teamContacts);
            userEditedContacts.current = false;
        }, 1500);
        return () => clearTimeout(handler);
    }, [teamContacts, loading, saveTeamContacts]);

    const handleContactChange = (teamName, field, value) => {
        userEditedContacts.current = true;
        setTeamContacts(prev => ({
            ...prev,
            [teamName]: { ...(prev[teamName] || {}), [field]: value }
        }));
    };

    const handleStaffChange = (id, field, value) => {
        const updated = staffMembers.map(m => m.id === id ? { ...m, [field]: value } : m);
        setStaffMembers(updated);
        setSaveStatus('Ukládám...');
        // Debounce save for staff
        clearTimeout(window._staffSaveTimeout);
        window._staffSaveTimeout = setTimeout(() => saveStaffMembers(updated), 1500);
    };

    if (loading) return <Box className="flex justify-center items-center p-8"><CircularProgress /></Box>;

    const activeTeams = Object.entries(involvedTeams).filter(([, v]) => v).map(([name]) => name);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    const roleColors = [
        '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'
    ];

    return (
        <Box className="space-y-8">
            <Box className="flex justify-between items-start">
                <Box>
                    <Typography variant="h4" component="h1" className="font-bold text-gray-800">
                        Týmy a kontakty
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Kontaktní údaje vybraných týmů a členů koordinačního týmu. Změny v koordinačním týmu se automaticky promítnou do sekce Koordinační plán.
                    </Typography>
                </Box>
                <SaveStatusIndicator status={saveStatus} />
            </Box>

            {/* Koordinační tým */}
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, backgroundColor: '#f0f4ff', borderBottom: '1px solid #dbeafe' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#1e40af' }}>
                        Koordinační tým
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Členové koordinačního týmu. Data jsou sdílena se sekcí "Koordinační plán".
                    </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                    {staffMembers.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {staffMembers.map((member, idx) => (
                                <Paper
                                    key={member.id}
                                    variant="outlined"
                                    sx={{
                                        p: 2, borderRadius: 2.5,
                                        borderColor: '#e2e8f0',
                                        '&:hover': { borderColor: '#cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                        <Avatar sx={{
                                            width: 40, height: 40,
                                            backgroundColor: roleColors[idx % roleColors.length],
                                            fontSize: '0.85rem', fontWeight: 700,
                                            mt: 0.5
                                        }}>
                                            {getInitials(member.name)}
                                        </Avatar>
                                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip
                                                    label={member.role}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: roleColors[idx % roleColors.length] + '18',
                                                        color: roleColors[idx % roleColors.length],
                                                        fontWeight: 600, fontSize: '0.75rem',
                                                        borderRadius: 1.5,
                                                    }}
                                                />
                                                {member.description && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {member.description}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
                                                <TextField
                                                    placeholder="Jméno a příjmení"
                                                    value={member.name || ''}
                                                    onChange={(e) => handleStaffChange(member.id, 'name', e.target.value)}
                                                    variant="outlined"
                                                    size="small"
                                                    InputProps={{
                                                        startAdornment: <Person sx={{ fontSize: 18, color: '#94a3b8', mr: 0.5 }} />,
                                                        sx: { borderRadius: 2, fontSize: '0.875rem' }
                                                    }}
                                                />
                                                <TextField
                                                    placeholder="Telefon"
                                                    value={member.phone || ''}
                                                    onChange={(e) => handleStaffChange(member.id, 'phone', e.target.value)}
                                                    variant="outlined"
                                                    size="small"
                                                    InputProps={{
                                                        startAdornment: <Phone sx={{ fontSize: 18, color: '#94a3b8', mr: 0.5 }} />,
                                                        sx: { borderRadius: 2, fontSize: '0.875rem' }
                                                    }}
                                                />
                                                <TextField
                                                    placeholder="E-mail"
                                                    value={member.email || ''}
                                                    onChange={(e) => handleStaffChange(member.id, 'email', e.target.value)}
                                                    variant="outlined"
                                                    size="small"
                                                    InputProps={{
                                                        startAdornment: <Email sx={{ fontSize: 18, color: '#94a3b8', mr: 0.5 }} />,
                                                        sx: { borderRadius: 2, fontSize: '0.875rem' }
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4, fontStyle: 'italic' }}>
                            Koordinační tým zatím nebyl nastaven. Přejděte do sekce "Koordinační plán" pro inicializaci.
                        </Typography>
                    )}
                </Box>
            </Paper>

            {/* Kontakty vybraných týmů */}
            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ px: 3, py: 2, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#334155' }}>
                        Kontakty zapojených týmů
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Kontaktní osoby pro týmy vybrané v Základních údajích. Slouží jako kontaktovník v příloze dokumentů.
                    </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                    {activeTeams.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {activeTeams.map((teamName) => {
                                const contact = teamContacts[teamName] || {};
                                const hasSomeData = contact.contactName || contact.phone || contact.email;
                                return (
                                    <Paper
                                        key={teamName}
                                        variant="outlined"
                                        sx={{
                                            px: 2.5, py: 1.5, borderRadius: 2.5,
                                            borderColor: hasSomeData ? '#bfdbfe' : '#e2e8f0',
                                            backgroundColor: hasSomeData ? '#fafcff' : '#fff',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                                            <Typography
                                                variant="subtitle2"
                                                fontWeight={600}
                                                sx={{ minWidth: 200, color: '#334155' }}
                                            >
                                                {teamName}
                                            </Typography>
                                            <TextField
                                                placeholder="Kontaktní osoba"
                                                value={contact.contactName || ''}
                                                onChange={(e) => handleContactChange(teamName, 'contactName', e.target.value)}
                                                variant="outlined"
                                                size="small"
                                                sx={{ flex: 1, minWidth: 150 }}
                                                InputProps={{
                                                    startAdornment: <Person sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />,
                                                    sx: { borderRadius: 2, fontSize: '0.85rem' }
                                                }}
                                            />
                                            <TextField
                                                placeholder="Telefon"
                                                value={contact.phone || ''}
                                                onChange={(e) => handleContactChange(teamName, 'phone', e.target.value)}
                                                variant="outlined"
                                                size="small"
                                                sx={{ width: 160 }}
                                                InputProps={{
                                                    startAdornment: <Phone sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />,
                                                    sx: { borderRadius: 2, fontSize: '0.85rem' }
                                                }}
                                            />
                                            <TextField
                                                placeholder="E-mail"
                                                value={contact.email || ''}
                                                onChange={(e) => handleContactChange(teamName, 'email', e.target.value)}
                                                variant="outlined"
                                                size="small"
                                                sx={{ flex: 1, minWidth: 180 }}
                                                InputProps={{
                                                    startAdornment: <Email sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />,
                                                    sx: { borderRadius: 2, fontSize: '0.85rem' }
                                                }}
                                            />
                                        </Box>
                                    </Paper>
                                );
                            })}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4, fontStyle: 'italic' }}>
                            V Základních údajích zatím nebyly vybrány žádné týmy.
                        </Typography>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}

export default ProjectContacts;
