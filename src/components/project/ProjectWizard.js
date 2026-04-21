// src/components/project/ProjectWizard.js
import React, { useState, useEffect } from 'react';
import {
    TextField, Button, FormControl, InputLabel, Select, MenuItem,
    Box, Typography, IconButton, Stepper, Step, StepLabel,
    Checkbox, FormControlLabel, FormGroup, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    RadioGroup, Radio, Tooltip
} from '@mui/material';
import { Close, HelpOutline } from '@mui/icons-material';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { generateDefaultVulnerabilities } from '../../config/defaultVulnerabilities';

const STEPS = ['Základní údaje', 'Prostředí a typ', 'Specifika akce'];

// Nápověda "proč se ptáme" – přidává kontext k výběru proměnných, které zásadně
// mění navrhovaná opatření.
const HELP = {
    name: 'Slouží jako identifikátor projektu v aplikaci a v názvu vygenerovaných dokumentů.',
    audience: 'Počet osob spouští prahová opatření: ≥200 → požární dozor, ≥1000 → notifikace PČR. Ovlivňuje i crowd management.',
    environment: 'Venkovní a vnitřní akce mají zcela odlišná rizika i opatření (evakuační cesty vs. sledování počasí). Kombinovaná = část pod střechou a část venku.',
    eventType: 'Typ akce určuje výchozí sadu rizik a nabídku opatření. Lze kdykoli změnit v detailu projektu.',
    duration: 'Délka mění logistiku, směny, počet briefingů, pre-event walk-through. Etapová = vícedenní s přesunem mezi lokalitami (cyklistický závod).',
    controlRoom: 'Velín / koordinační centrum umožňuje centralizovat monitoring, komunikaci a dispečink. Ovlivňuje postupy pro krizové řízení.',
    accessEntries: 'Jeden vchod znamená tvrdý hrdlový bod (riziko tlačenice). Více vchodů = jednodušší evakuace, ale složitější access control.',
    accessTurnstiles: 'Turnikety umožňují přesné počítání osob a rovnoměrný průtok. Bez turniketů je nutná jiná forma kontroly kapacity.',
    accessBagCheck: 'Kontrola zavazadel spouští opatření pro prostor kontroly, vyškolený personál a úschovu zakázaných předmětů.',
    accessTicketing: 'Registrovaný vstup (vstupenky, akreditace) umožňuje behaviorální detekci a rychlejší vyšetřování incidentů.',
    vulnerabilities: 'Specifika akce upraví pravděpodobnost a dopad jednotlivých rizik – výběr ovlivní celkové skóre v analýze ohroženosti.',
};

// Varianta jednoduchého ? ikonkového tooltipu vedle labelu.
function HelpIcon({ text }) {
    return (
        <Tooltip title={text} arrow placement="top">
            <HelpOutline sx={{ fontSize: 16, color: '#94a3b8', ml: 0.5, cursor: 'help', verticalAlign: 'middle' }} />
        </Tooltip>
    );
}

// Otázka "access model" (vstupy) – samostatné boolean checkboxy.
const ACCESS_OPTIONS = [
    { key: 'singleEntry', label: 'Jeden hlavní vstup', help: HELP.accessEntries },
    { key: 'multipleEntries', label: 'Více vstupů / východů', help: HELP.accessEntries },
    { key: 'turnstiles', label: 'Turnikety / počítání osob', help: HELP.accessTurnstiles },
    { key: 'bagCheck', label: 'Kontrola zavazadel', help: HELP.accessBagCheck },
    { key: 'ticketing', label: 'Vstupenky / registrace / akreditace', help: HELP.accessTicketing },
];

const DURATION_OPTIONS = [
    { value: 'jednodenni', label: 'Jednodenní' },
    { value: 'vikend', label: 'Víkend (2–3 dny)' },
    { value: 'tyden', label: 'Týden či déle' },
    { value: 'etapova', label: 'Etapová (přesuny mezi lokalitami)' },
];

export default function ProjectWizard({ selectedProjectType, onComplete, onCancel }) {
    const [activeStep, setActiveStep] = useState(0);
    const [name, setName] = useState('');
    const [audienceSize, setAudienceSize] = useState('');
    const [environmentType, setEnvironmentType] = useState('');
    const [eventType, setEventType] = useState('');
    const [duration, setDuration] = useState('');
    const [hasControlRoom, setHasControlRoom] = useState(false);
    const [accessModel, setAccessModel] = useState({
        singleEntry: false,
        multipleEntries: false,
        turnstiles: false,
        bagCheck: false,
        ticketing: false,
    });
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
        onComplete({
            name,
            audienceSize,
            environmentType,
            eventType,
            duration,
            hasControlRoom,
            accessModel,
            selectedVulnerabilities,
        });
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

    const toggleAccess = (key) => {
        setAccessModel(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const typeLabels = {
        event: 'Nová akce',
        objekt: 'Nový objekt',
        kampus: 'Nový kampus',
        cyklozavod: 'Nový cyklistický závod',
    };

    // Control room má smysl hlavně pro vnitřní / kombinovaná a pro velké venkovní.
    const showControlRoomQuestion = environmentType === 'vnitřní' || environmentType === 'kombinovaná' || (parseInt(audienceSize, 10) || 0) >= 1000;

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
                        <Box>
                            <TextField
                                label={<span>Název projektu <HelpIcon text={HELP.name} /></span>}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                fullWidth
                                autoFocus
                            />
                        </Box>
                        <TextField
                            label={<span>Očekávaný počet osob <HelpIcon text={HELP.audience} /></span>}
                            type="number"
                            value={audienceSize}
                            onChange={(e) => setAudienceSize(e.target.value)}
                            fullWidth
                        />
                    </Box>
                )}

                {/* Step 2: Prostředí, typ, délka, control room */}
                {activeStep === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Prostředí</InputLabel>
                            <Select
                                value={environmentType}
                                onChange={(e) => setEnvironmentType(e.target.value)}
                                label="Prostředí"
                                endAdornment={<Box sx={{ mr: 3 }}><HelpIcon text={HELP.environment} /></Box>}
                            >
                                <MenuItem value=""><em>-- Vyberte --</em></MenuItem>
                                <MenuItem value="venkovní">Venkovní</MenuItem>
                                <MenuItem value="vnitřní">Vnitřní</MenuItem>
                                <MenuItem value="kombinovaná">Kombinovaná</MenuItem>
                            </Select>
                        </FormControl>

                        {(selectedProjectType === 'event' || selectedProjectType === 'cyklozavod') && (
                            <FormControl fullWidth>
                                <InputLabel>Typ akce</InputLabel>
                                <Select
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value)}
                                    label="Typ akce"
                                    endAdornment={<Box sx={{ mr: 3 }}><HelpIcon text={HELP.eventType} /></Box>}
                                >
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

                        {/* Délka akce */}
                        <FormControl component="fieldset">
                            <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                                Délka akce <HelpIcon text={HELP.duration} />
                            </Typography>
                            <RadioGroup
                                row
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                sx={{ gap: 1, flexWrap: 'wrap' }}
                            >
                                {DURATION_OPTIONS.map(opt => (
                                    <FormControlLabel
                                        key={opt.value}
                                        value={opt.value}
                                        control={<Radio size="small" />}
                                        label={opt.label}
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>

                        {/* Control room */}
                        {showControlRoomQuestion && (
                            <Paper variant="outlined" sx={{ p: 2, borderColor: hasControlRoom ? '#93c5fd' : '#e5e7eb', backgroundColor: hasControlRoom ? '#eff6ff' : '#fff' }}>
                                <FormControlLabel
                                    control={<Checkbox checked={hasControlRoom} onChange={(e) => setHasControlRoom(e.target.checked)} />}
                                    label={
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
                                                K dispozici je velín / koordinační centrum <HelpIcon text={HELP.controlRoom} />
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Centralizovaný prostor pro monitoring, rádiovou komunikaci a dispečink.
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </Paper>
                        )}
                    </Box>
                )}

                {/* Step 3: Specifika – access model + zranitelnosti */}
                {activeStep === 2 && (
                    <Box>
                        {/* Access model */}
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            Model vstupu / kontroly <HelpIcon text="Způsob, jakým návštěvníci vstupují a jsou kontrolováni. Přímo mění checklist pro access control." />
                        </Typography>
                        <FormGroup sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            {ACCESS_OPTIONS.map(opt => (
                                <FormControlLabel
                                    key={opt.key}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={accessModel[opt.key]}
                                            onChange={() => toggleAccess(opt.key)}
                                        />
                                    }
                                    label={<span>{opt.label} <HelpIcon text={opt.help} /></span>}
                                />
                            ))}
                        </FormGroup>

                        {/* Zranitelnosti */}
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            Zranitelnosti akce <HelpIcon text={HELP.vulnerabilities} />
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Vyberte specifika, která se týkají vaší akce. Nastavení lze změnit i později.
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
