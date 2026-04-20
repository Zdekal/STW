// src/components/project/ProjectOutputDocuments.js
// Výstupní dokumenty – přehled 3 dokumentů s předepsanými kapitolami a stavem naplněnosti.

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import {
    Box, Typography, Paper, Button, CircularProgress, Alert,
    Chip, LinearProgress, Divider, Collapse, IconButton
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
} from '@mui/icons-material';
import { getDocumentTemplates } from '../../config/documentTemplates';
import { generateDocument, getChapterStatuses } from '../../lib/documentGenerator';

const iconMap = {
    Assessment: AssessmentIcon,
    Shield: ShieldIcon,
    Groups: GroupsIcon,
};

const statusConfig = {
    filled: { icon: CheckCircleIcon, color: '#22c55e', label: 'Vyplněno', chipColor: 'success' },
    partial: { icon: PartialIcon, color: '#eab308', label: 'Částečně', chipColor: 'warning' },
    empty: { icon: EmptyIcon, color: '#d1d5db', label: 'K doplnění', chipColor: 'default' },
    manual: { icon: EditIcon, color: '#93c5fd', label: 'Ruční', chipColor: 'info' },
};

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
            {/* Header bar */}
            <Box sx={{ height: 4, backgroundColor: template.color }} />

            <Box sx={{ p: 3 }}>
                {/* Title row */}
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

                {/* Progress */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                            Naplněnost automatických dat
                        </Typography>
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

                {/* Chapter list toggle */}
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

                {/* Download button */}
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
                    Dokumenty se automaticky naplní daty z ostatních sekcí projektu. Stáhněte je jako Word (.docx) a doplňte kapitoly označené jako "Ruční".
                </Typography>
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 3,
            }}>
                {templates.map(template => (
                    <DocumentCard key={template.id} template={template} project={project} />
                ))}
            </Box>

            <Alert severity="info" sx={{ mt: 4, borderRadius: 2 }}>
                <Typography variant="body2">
                    <b>Tip:</b> Čím více sekcí projektu vyplníte, tím úplnější budou vygenerované dokumenty.
                    Kapitoly označené jako "Ruční" jsou specifické pro váš projekt a je třeba je doplnit ve staženém Wordu.
                </Typography>
            </Alert>
        </Box>
    );
}
