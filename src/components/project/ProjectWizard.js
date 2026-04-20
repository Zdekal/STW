// src/components/project/ProjectWizard.js
import React, { useState, useEffect } from 'react';
import {
    TextField, Button, FormControl, InputLabel, Select, MenuItem,
    Box, Typography, IconButton, Stepper, Step, StepLabel,
    Checkbox, FormControlLabel, FormGroup, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { generateDefaultVulnerabilities } from '../../config/defaultVulnerabilities';

const STEPS = ['Základní údaje', 'Prostředí a typ', 'Specifika akce'];

export default function ProjectWizard({ selectedProjectType, onComplete, onCancel }) {
    const [activeStep, setActiveStep] = useState(0);
    const [name, setName] = useState('');
    const [audienceSize, setAudienceSize] = useState('');
    const [environmentType, setEnvironmentType] = useState('');
    const [eventType, setEventType] = useState('');
    const [selectedVulnerabilities, setSelectedVulnerabilities] = useState([]);
    const [globalVulnerabilities, setGlobalVulnerabilities] = useState([]);

    useEffect(() => {
        const fetchVulns = async () => {
            try {
                if (db) {
                    const snap = await getDoc(doc(db, "settings", "globalVulnerabilities"));
                    if (snap.exists() && snap.data().vulnerabilities?.length > 0) {
                        setGlobalVulnerabilities(snap.data().vulnerabilities);
                        return;
                    }
                }
            } catch (e) {
                console.error("Chyba při načítání zranitelností:", e);
            }
            setGlobalVulnerabilities(generateDefaultVulnerabilities());
        };
        fetchVulns();
    }, []);

    const handleSubmit = () => {
        if (!name.trim()) return;
        onComplete({ name, audienceSize, environmentType, eventType, selectedVulnerabilities });
    };

    const handleNext = () => {
        if (activeStep === 0 && !name.trim()) return;
        if (activeStep === STEPS.length - 1) {
            handleSubmit();
        } else {
            setActiveStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    const toggleVulnerability = (vulnId) => {
        setSelectedVulnerabilities(prev =>
            prev.includes(vulnId) ? prev.filter(id => id !== vulnId) : [...prev, vulnId]
        );
    };

    const typeLabels = {
        event: 'Nová akce',
        objekt: 'Nový objekt',
        kampus: 'Nový kampus',
        cyklozavod: 'Nový cyklistický závod',
    };

    return (
        <Dialog
            open
            onClose={onCancel}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, minHeight: 420 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                <Typography variant="h5" fontWeight="bold">{typeLabels[selectedProjectType] || 'Nový projekt'}</Typography>
                <IconButton onClick={onCancel} size="small"><Close /></IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 3 }}>
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                    {STEPS.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {/* Step 1: Základní údaje */}
                {activeStep === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Název projektu"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            fullWidth
                            autoFocus
                        />
                        <TextField
                            label="Očekávaný počet osob"
                            type="number"
                            value={audienceSize}
                            onChange={(e) => setAudienceSize(e.target.value)}
                            fullWidth
                        />
                    </Box>
                )}

                {/* Step 2: Prostředí a typ */}
                {activeStep === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Prostředí</InputLabel>
                            <Select value={environmentType} onChange={(e) => setEnvironmentType(e.target.value)} label="Prostředí">
                                <MenuItem value=""><em>-- Vyberte --</em></MenuItem>
                                <MenuItem value="venkovní">Venkovní</MenuItem>
                                <MenuItem value="vnitřní">Vnitřní</MenuItem>
                                <MenuItem value="kombinovaná">Kombinovaná</MenuItem>
                            </Select>
                        </FormControl>
                        {(selectedProjectType === 'event' || selectedProjectType === 'cyklozavod') && (
                            <FormControl fullWidth>
                                <InputLabel>Typ akce</InputLabel>
                                <Select value={eventType} onChange={(e) => setEventType(e.target.value)} label="Typ akce">
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
                        )}
                    </Box>
                )}

                {/* Step 3: Specifika akce (zranitelnosti) */}
                {activeStep === 2 && (
                    <Box>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            Vyberte specifika, která se týkají vaší akce. Na základě výběru se automaticky upraví analýza rizik.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Tato nastavení můžete kdykoli změnit později v záložce "Zranitelnosti akce".
                        </Typography>

                        {globalVulnerabilities.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                                Žádná specifika nejsou definována.
                            </Typography>
                        ) : (
                            <FormGroup sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {globalVulnerabilities.map((vuln) => {
                                    const isChecked = selectedVulnerabilities.includes(vuln.id);
                                    const affectedCount = (vuln.targets || []).length;
                                    return (
                                        <Paper
                                            key={vuln.id}
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                borderColor: isChecked ? '#93c5fd' : '#e5e7eb',
                                                backgroundColor: isChecked ? '#eff6ff' : '#fff',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => toggleVulnerability(vuln.id)}
                                        >
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onChange={() => toggleVulnerability(vuln.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        color="primary"
                                                    />
                                                }
                                                label={
                                                    <Box>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {vuln.name}
                                                        </Typography>
                                                        {vuln.description && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {vuln.description}
                                                            </Typography>
                                                        )}
                                                        {affectedCount > 0 && (
                                                            <Chip
                                                                size="small"
                                                                label={`Ovlivňuje ${affectedCount} rizik`}
                                                                sx={{ mt: 0.5, fontSize: '0.7rem', backgroundColor: '#f1f5f9' }}
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
                                            />
                                        </Paper>
                                    );
                                })}
                            </FormGroup>
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                {activeStep > 0 && (
                    <Button variant="outlined" onClick={handleBack}>Zpět</Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button variant="outlined" onClick={onCancel}>Zrušit</Button>
                <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={activeStep === 0 && !name.trim()}
                >
                    {activeStep === STEPS.length - 1 ? 'Vytvořit projekt' : 'Další'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
