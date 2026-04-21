// src/components/project/ProjectOutputDocuments.js
// Výstupní dokumenty – přehled všech dokumentů, Review & Edit s inline editorem.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import {
    Box, Typography, Paper, Button, CircularProgress, Alert,
    Chip, LinearProgress, Divider, Collapse, IconButton, TextField, Stack,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Assessment as AssessmentIcon,
    Shield as ShieldIcon,
    Groups as GroupsIcon,
    CheckCircle as CheckCircleIcon,
    RadioButtonUnchecked as EmptyIcon,
    RemoveCircleOutline as PartialIcon,
    Edit as EditIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    ContactMail as ContactMailIcon,
    Checklist as ChecklistIcon,
    InfoOutlined,
} from '@mui/icons-material';
import { getDocumentTemplates } from '../../config/documentTemplates';
import { generateDocument, getChapterStatuses } from '../../lib/documentGenerator';

const iconMap = {
    Assessment: AssessmentIcon,
    Shield: ShieldIcon,
    Groups: GroupsIcon,
    ContactMail: ContactMailIcon,
    Checklist: ChecklistIcon,
};

const statusConfig = {
    filled: { icon: CheckCircleIcon, color: '#22c55e', label: 'Vyplněno', chipColor: 'success' },
    partial: { icon: PartialIcon, color: '#eab308', label: 'Částečně', chipColor: 'warning' },
    empty: { icon: EmptyIcon, color: '#d1d5db', label: 'K doplnění', chipColor: 'default' },
    manual: { icon: EditIcon, color: '#93c5fd', label: 'Ruční', chipColor: 'info' },
};

// ────────────────────────────────────────────────────────────────
// Karta dokumentu
// ────────────────────────────────────────────────────────────────
function DocumentCard({ template, project }) {
    const [expanded, setExpanded] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const IconComponent = iconMap[template.icon] || AssessmentIcon;
    const statuses = getChapterStatuses(template, project);

    const filledCount = statuses.filter(s => s.status === 'filled').length;
    const totalAuto = statuses.filter(s => s.status !== 'manual').length;
    const progress = totalAuto > 0 ? Math.round((filledCount / totalAuto) * 100) : 0;

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await generateDocument(template, project);
        } catch (err) {
            console.error('Chyba při generování dokumentu:', err);
        }
        setDownloading(false);
    };

    return (
        <Paper
            elevation={0}
            sx={{
                border: '1px solid #e5e7eb',
                borderRadius: 3,
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
            }}
        >
            <Box sx={{ height: 4, backgroundColor: template.color }} />

            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Box sx={{
                        width: 48, height: 48, borderRadius: 2,
                        backgroundColor: `${template.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <IconComponent sx={{ color: template.color, fontSize: 28 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight="bold">{template.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{template.description}</Typography>
                    </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Naplněnost automatických dat</Typography>
                        <Typography variant="caption" fontWeight="bold" color="text.secondary">
                            {filledCount}/{totalAuto} kapitol
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 6, borderRadius: 3,
                            backgroundColor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': { backgroundColor: template.color, borderRadius: 3 },
                        }}
                    />
                </Box>

                <Button
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    sx={{ color: 'text.secondary', textTransform: 'none', mb: 1 }}
                >
                    {expanded ? 'Skrýt kapitoly' : 'Zobrazit kapitoly'}
                </Button>

                <Collapse in={expanded}>
                    <Box sx={{ mt: 1, mb: 2 }}>
                        {statuses.map((ch) => {
                            const cfg = statusConfig[ch.status] || statusConfig.empty;
                            const StatusIcon = cfg.icon;
                            return (
                                <Box
                                    key={ch.number}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                        py: 1, px: 1,
                                        borderBottom: '1px solid #f3f4f6',
                                        '&:last-child': { borderBottom: 'none' },
                                    }}
                                >
                                    <StatusIcon sx={{ color: cfg.color, fontSize: 20 }} />
                                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                                        <b>{ch.number}.</b> {ch.title}
                                    </Typography>
                                    <Chip
                                        label={cfg.label}
                                        size="small"
                                        color={cfg.chipColor}
                                        variant="outlined"
                                        sx={{ fontSize: '0.65rem', height: 22 }}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                </Collapse>

                <Divider sx={{ my: 1 }} />

                <Button
                    variant="contained"
                    startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                    onClick={handleDownload}
                    disabled={downloading}
                    fullWidth
                    sx={{
                        mt: 1,
                        backgroundColor: template.color,
                        '&:hover': { backgroundColor: template.color, filter: 'brightness(0.9)' },
                        textTransform: 'none',
                        fontWeight: 'bold',
                        borderRadius: 2,
                    }}
                >
                    {downloading ? 'Generuji...' : 'Stáhnout .docx'}
                </Button>
            </Box>
        </Paper>
    );
}

// ────────────────────────────────────────────────────────────────
// Review & Edit — kompaktní shrnutí + inline editor
// ────────────────────────────────────────────────────────────────
function ReviewSummary({ project, templates }) {
    const risksCount = (project.customRisks || []).length;
    const measuresCount = Object.values(project.selectedMeasures || project.measures || {}).filter(Boolean).length;
    const teamCount = (project.crisisStaffPlan?.staffMembers || []).filter(m => m.name).length;
    const tasksState = project.checklistTaskState || {};
    const totalTasks = Object.keys(tasksState).length;
    const doneTasks = Object.values(tasksState).filter(s => s.checked).length;
    const assignedTasks = Object.values(tasksState).filter(s => s.assignee).length;

    const items = [
        { label: 'Rizika', value: risksCount, hint: risksCount === 0 ? 'Přidej rizika v sekci Rizika' : '', to: '../risks' },
        { label: 'Vybraná opatření', value: measuresCount, hint: measuresCount === 0 ? 'Vyber opatření v sekci Bezpečnostní opatření' : '', to: '../measures' },
        { label: 'Členové KT', value: teamCount, hint: teamCount === 0 ? 'Doplň tým v sekci Koordinační plán' : '', to: '../plan' },
        { label: 'Úkoly (hotovo/celkem)', value: `${doneTasks}/${totalTasks}`, hint: totalTasks > 0 && assignedTasks === 0 ? 'Žádný úkol zatím nemá přiřazenou osobu' : '', to: '../checklist' },
    ];

    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                Kompaktní přehled projektu
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} divider={<Divider orientation="vertical" flexItem />}>
                {items.map(it => (
                    <Box key={it.label} sx={{ flex: 1, minWidth: 120 }}>
                        <Typography variant="caption" color="text.secondary">{it.label}</Typography>
                        <Typography variant="h6" fontWeight="bold">{it.value}</Typography>
                        {it.hint && (
                            <Typography variant="caption" sx={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <InfoOutlined sx={{ fontSize: 14 }} />
                                {it.hint}
                            </Typography>
                        )}
                    </Box>
                ))}
            </Stack>
        </Paper>
    );
}

function InlineChapterEditor({ projectId, template, chapter, manualChapters, onSave }) {
    const key = `${template.id}/${chapter.number}`;
    const [value, setValue] = useState(manualChapters[key] || '');
    const [status, setStatus] = useState('idle'); // idle | dirty | saving | saved

    useEffect(() => {
        // Pokud přijde externí aktualizace (jiný klient), promítni jen když uživatel needituje.
        if (status === 'idle' || status === 'saved') {
            setValue(manualChapters[key] || '');
        }
    }, [manualChapters, key, status]);

    const handleChange = (e) => {
        setValue(e.target.value);
        setStatus('dirty');
    };

    const handleBlur = async () => {
        if (status !== 'dirty') return;
        setStatus('saving');
        await onSave(key, value);
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 1500);
    };

    return (
        <Box sx={{ mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="body2" fontWeight="bold">
                    {chapter.number}. {chapter.title}
                </Typography>
                <Chip label={template.title} size="small" sx={{ fontSize: '0.65rem', height: 20, backgroundColor: `${template.color}20`, color: template.color }} />
                {status === 'saving' && <Chip label="Ukládám..." size="small" sx={{ fontSize: '0.65rem', height: 20 }} />}
                {status === 'saved' && <Chip label="Uloženo" size="small" color="success" sx={{ fontSize: '0.65rem', height: 20 }} />}
            </Box>
            {chapter.description && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                    {chapter.description}
                </Typography>
            )}
            <TextField
                multiline
                minRows={3}
                maxRows={12}
                fullWidth
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Napište text této kapitoly. Pokud zůstane prázdné, použijí se v dokumentu vodicí otázky."
                sx={{ '& textarea': { fontSize: '0.875rem', lineHeight: 1.5 } }}
            />
        </Box>
    );
}

function ManualChaptersEditor({ projectId, project, templates }) {
    const [expanded, setExpanded] = useState(false);
    const manualChapters = project.manualChapters || {};

    const allManual = useMemo(() => {
        const out = [];
        templates.forEach(t => {
            t.chapters.forEach(ch => {
                if (ch.dataKey === 'manual') out.push({ template: t, chapter: ch });
                if (ch.subchapters) {
                    ch.subchapters.forEach(sub => {
                        if (sub.dataKey === 'manual') out.push({ template: t, chapter: sub });
                    });
                }
            });
        });
        return out;
    }, [templates]);

    const saveChapter = useCallback(async (key, value) => {
        if (!projectId) return;
        const next = { ...manualChapters, [key]: value };
        // smaž prázdné
        if (!value || !value.trim()) delete next[key];

        if (projectId.startsWith('local-')) {
            const { listProjects, updateProject } = await import('../../services/localStore');
            const existing = listProjects().find(p => p.id === projectId) || {};
            updateProject({ ...existing, manualChapters: next });
            return;
        }
        if (!db) return;
        try {
            await updateDoc(doc(db, 'projects', projectId), { manualChapters: next });
        } catch (err) {
            console.error('Chyba při ukládání ruční kapitoly:', err);
        }
    }, [projectId, manualChapters]);

    if (allManual.length === 0) return null;

    const filledCount = allManual.filter(({ template, chapter }) => {
        const key = `${template.id}/${chapter.number}`;
        const v = manualChapters[key];
        return v && v.trim();
    }).length;

    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 3 }}>
            <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                onClick={() => setExpanded(!expanded)}
            >
                <EditIcon sx={{ color: '#3b82f6' }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Ruční kapitoly</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {filledCount}/{allManual.length} kapitol doplněno. Co zde napíšeš, se propíše do všech dokumentů při stahování.
                    </Typography>
                </Box>
                <IconButton size="small">{expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
            </Box>

            <Collapse in={expanded}>
                <Divider sx={{ my: 2 }} />
                {allManual.map(({ template, chapter }) => (
                    <InlineChapterEditor
                        key={`${template.id}/${chapter.number}`}
                        projectId={projectId}
                        template={template}
                        chapter={chapter}
                        manualChapters={manualChapters}
                        onSave={saveChapter}
                    />
                ))}
            </Collapse>
        </Paper>
    );
}

// ────────────────────────────────────────────────────────────────
// Hlavní komponenta
// ────────────────────────────────────────────────────────────────
export default function ProjectOutputDocuments() {
    const { id: projectId } = useParams();
    const { currentUser } = useAuth();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!projectId) { setLoading(false); return; }

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects }) => {
                const lp = listProjects().find(p => p.id === projectId);
                if (lp) setProject(lp);
                else setError('Projekt nebyl nalezen.');
                setLoading(false);
            });
            return;
        }

        if (!db) { setLoading(false); setError('Databáze není dostupná.'); return; }

        const unsub = onSnapshot(doc(db, 'projects', projectId), (snap) => {
            if (snap.exists()) setProject({ id: snap.id, ...snap.data() });
            else setError('Projekt nebyl nalezen.');
            setLoading(false);
        }, () => { setError('Chyba při načítání.'); setLoading(false); });

        return () => unsub();
    }, [projectId, currentUser]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    if (!project) return null;

    const templates = getDocumentTemplates(project.projectType);

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight="bold">Výstupní dokumenty</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Dokumenty se automaticky naplní daty z ostatních sekcí projektu. Projděte si přehled níže, doplňte ruční kapitoly a stáhněte.
                </Typography>
            </Box>

            {/* 1. Review & Edit – kompaktní přehled */}
            <ReviewSummary project={project} templates={templates} />

            {/* 2. Inline editor ručních kapitol */}
            <ManualChaptersEditor projectId={projectId} project={project} templates={templates} />

            {/* 3. Karty dokumentů */}
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                gap: 3,
            }}>
                {templates.map(template => (
                    <DocumentCard key={template.id} template={template} project={project} />
                ))}
            </Box>

            <Alert severity="info" sx={{ mt: 4, borderRadius: 2 }}>
                <Typography variant="body2">
                    <b>Tip:</b> Čím více sekcí projektu vyplníte (rizika, opatření, tým), tím úplnější budou dokumenty.
                    Ruční kapitoly doplňte v editoru výše – obsah se automaticky promítne do všech stažených dokumentů.
                </Typography>
            </Alert>
        </Box>
    );
}
