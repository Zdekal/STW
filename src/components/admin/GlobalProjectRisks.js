import React, { useState, useEffect, useMemo } from "react";
import {
    Box, Typography, Paper, Button, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Select, MenuItem, Tabs, Tab, TextField, IconButton, Tooltip, Chip,
    Accordion, AccordionSummary, AccordionDetails, FormControl, InputLabel
} from "@mui/material";
import {
    Save as SaveIcon, Add as AddIcon, Delete as DeleteIcon,
    ExpandMore as ExpandMoreIcon, AddCircle as AddCircleIcon,
    FilterList as FilterIcon
} from "@mui/icons-material";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { defaultProjectRisksValues } from "../../config/defaultProjectRisks";
import { generateDefaultVulnerabilities } from "../../config/defaultVulnerabilities";
import { toBand, SUBFACTOR_BANDS } from "../../lib/risks";
import { v4 as uuidv4 } from "uuid";

const EVENT_TYPE_LABELS = {
    "shromáždění": "Shromáždění",
    "etapovy_cyklisticky_zavod": "Cyklistický závod",
    "detsky_den_firmy": "Dětský den",
    "konference_prednaska": "Konference",
    "hudebni_akce": "Hudební akce",
    "sportovni_akce": "Sportovní akce",
    "ostatni_akce": "Ostatní",
};

const ENV_TYPE_LABELS = {
    "venkovní": "Venkovní",
    "vnitřní": "Vnitřní",
    "kombinovaná": "Kombinovaná",
};

const GlobalProjectRisks = () => {
    const [tabValue, setTabValue] = useState(0);
    const [risks, setRisks] = useState([]);
    const [vulnerabilities, setVulnerabilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [filterEventType, setFilterEventType] = useState("");
    const [filterEnvType, setFilterEnvType] = useState("");

    useEffect(() => { fetchGlobalData(); }, []);

    const fetchGlobalData = async () => {
        setLoading(true);
        setError("");
        try {
            if (!db) {
                setRisks([...defaultProjectRisksValues]);
                setVulnerabilities(generateDefaultVulnerabilities());
                setLoading(false);
                return;
            }

            const risksRef = doc(db, "settings", "globalProjectRisks");
            const risksSnap = await getDoc(risksRef);
            if (risksSnap.exists() && risksSnap.data().risks?.length > 0) {
                const loaded = risksSnap.data().risks.map((r, i) => ({
                    ...r,
                    id: r.id || `risk-${String(i + 1).padStart(3, '0')}`
                }));
                setRisks(loaded);
            } else {
                setRisks([...defaultProjectRisksValues]);
            }

            const vulnsRef = doc(db, "settings", "globalVulnerabilities");
            const vulnsSnap = await getDoc(vulnsRef);
            let loadedVulns = [];
            if (vulnsSnap.exists() && vulnsSnap.data().vulnerabilities?.length > 0) {
                loadedVulns = vulnsSnap.data().vulnerabilities;
            }
            const needsRegen = loadedVulns.length === 0 || loadedVulns.some(v => v.modifiers && !v.targets);
            setVulnerabilities(needsRegen ? generateDefaultVulnerabilities() : loadedVulns);
        } catch (err) {
            console.error("Chyba při stahování globálních dat:", err);
            setError("Nepodařilo se načíst globální hodnoty.");
            setRisks([...defaultProjectRisksValues]);
            setVulnerabilities(generateDefaultVulnerabilities());
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess("");
        setError("");
        try {
            if (!db) { setSuccess("Lokální simulace uložení."); setSaving(false); return; }
            await setDoc(doc(db, "settings", "globalProjectRisks"), { risks, updatedAt: new Date().toISOString() }, { merge: true });
            await setDoc(doc(db, "settings", "globalVulnerabilities"), { vulnerabilities, updatedAt: new Date().toISOString() }, { merge: true });
            setSuccess("Změny úspěšně uloženy.");
        } catch (err) {
            console.error("Chyba při ukládání:", err);
            setError("Nepodařilo se uložit změny.");
        } finally { setSaving(false); }
    };

    const handleSubfactorChange = (riskId, field, value) => {
        setRisks(prev => prev.map(r => r.id === riskId ? { ...r, [field]: Number(value) } : r));
        setSuccess("");
    };

    const filteredRisks = useMemo(() => {
        return risks.filter(r => {
            if (filterEventType && r.eventTypes && !r.eventTypes.includes(filterEventType)) return false;
            if (filterEnvType && r.environments && !r.environments.includes(filterEnvType)) return false;
            return true;
        });
    }, [risks, filterEventType, filterEnvType]);

    // --- Vulnerability handlers ---
    const handleAddVulnerability = () => {
        setVulnerabilities(prev => [...prev, { id: `vuln-${uuidv4()}`, name: "Nová zranitelnost", targets: [] }]);
        setSuccess("");
    };
    const handleVulnNameChange = (vulnIndex, newName) => {
        setVulnerabilities(prev => prev.map((v, i) => i === vulnIndex ? { ...v, name: newName } : v));
        setSuccess("");
    };
    const handleDeleteVulnerability = (vulnIndex) => {
        if (!window.confirm("Opravdu smazat zranitelnost a všechna její pravidla?")) return;
        setVulnerabilities(prev => prev.filter((_, i) => i !== vulnIndex));
        setSuccess("");
    };
    const handleAddVulnTarget = (vulnIndex) => {
        setVulnerabilities(prev => prev.map((v, i) => {
            if (i !== vulnIndex) return v;
            return { ...v, targets: [...(v.targets || []), { id: `tgt-${uuidv4()}`, riskName: risks.length > 0 ? risks[0].name : "", modifiers: { availability: 0, occurrence: 0, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 0 } }] };
        }));
        setSuccess("");
    };
    const handleVulnTargetChange = (vulnIndex, targetIdx, field, value) => {
        setVulnerabilities(prev => prev.map((v, i) => {
            if (i !== vulnIndex) return v;
            const newTargets = [...v.targets];
            if (field === "riskName") {
                newTargets[targetIdx] = { ...newTargets[targetIdx], riskName: value };
            } else {
                newTargets[targetIdx] = { ...newTargets[targetIdx], modifiers: { ...newTargets[targetIdx].modifiers, [field]: Number(value) } };
            }
            return { ...v, targets: newTargets };
        }));
        setSuccess("");
    };
    const handleDeleteVulnTarget = (vulnIndex, targetIdx) => {
        setVulnerabilities(prev => prev.map((v, i) => {
            if (i !== vulnIndex) return v;
            return { ...v, targets: v.targets.filter((_, ti) => ti !== targetIdx) };
        }));
        setSuccess("");
    };

    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}><CircularProgress /></Box>;

    const renderSelect = (value, onChange, min = 1, max = 7, allowNegative = false) => (
        <Select
            value={value} onChange={(e) => onChange(e.target.value)}
            variant="standard" disableUnderline
            sx={{ width: "60px", height: "36px", backgroundColor: "#f9fafb", borderRadius: "6px", textAlign: "center", fontWeight: "bold", fontSize: "0.9rem", "& .MuiSelect-select": { padding: "4px" } }}
        >
            {allowNegative
                ? [-3, -2, -1, 0, 1, 2, 3].map(n => <MenuItem key={n} value={n}>{n > 0 ? `+${n}` : n}</MenuItem>)
                : Array.from({ length: max - min + 1 }, (_, i) => min + i).map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)
            }
        </Select>
    );

    return (
        <Box sx={{ maxWidth: 1400, mx: "auto", pb: 6 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3, alignItems: "center", flexWrap: "wrap", gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Globální nastavení analýzy ohroženosti</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                        Správa výchozích <b>rizik</b>, <b>zranitelností akce</b> a jejich vzájemného vlivu na výpočet ohroženosti.
                    </Typography>
                </Box>
                <Button variant="contained" color="primary"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    onClick={handleSave} disabled={saving} sx={{ height: 48, px: 4, borderRadius: 2 }}>
                    {saving ? "Ukládám..." : "Uložit vše"}
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                    <Tab label={`Výchozí Rizika (${risks.length})`} />
                    <Tab label={`Zranitelnosti (${vulnerabilities.length})`} />
                </Tabs>
            </Box>

            {/* ═══ TAB 0: Výchozí Rizika ═══ */}
            {tabValue === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                        <FilterIcon color="action" />
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Typ akce</InputLabel>
                            <Select value={filterEventType} onChange={(e) => setFilterEventType(e.target.value)} label="Typ akce">
                                <MenuItem value="">Všechny typy</MenuItem>
                                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <InputLabel>Prostředí</InputLabel>
                            <Select value={filterEnvType} onChange={(e) => setFilterEnvType(e.target.value)} label="Prostředí">
                                <MenuItem value="">Všechna</MenuItem>
                                {Object.entries(ENV_TYPE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Typography variant="body2" color="text.secondary">
                            Zobrazeno {filteredRisks.length} z {risks.length} rizik
                        </Typography>
                    </Box>

                    <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflowX: 'auto' }}>
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', width: '4%', fontSize: '0.75rem' }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', width: '22%' }}>Riziko</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Dost.</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Výskyt</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Slož.</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '2px solid #e2e8f0', color: '#1e40af' }}>P</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Životy</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Objekt</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Finance</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Společ.</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '2px solid #e2e8f0', color: '#b91c1c' }}>D</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Skóre</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Pásmo</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRisks.map((risk) => {
                                    const pTotal = (risk.availability || 1) + (risk.occurrence || 1) + (risk.complexity || 1);
                                    const dTotal = (risk.lifeAndHealth || 1) + (risk.facility || 1) + (risk.financial || 1) + (risk.community || 1);
                                    const score = pTotal * dTotal;
                                    const band = toBand(score, SUBFACTOR_BANDS);
                                    return (
                                        <TableRow key={risk.id} hover>
                                            <TableCell><Typography variant="caption" color="text.secondary">{risk.id}</Typography></TableCell>
                                            <TableCell><Typography variant="body2" fontWeight="bold">{risk.name}</Typography></TableCell>
                                            <TableCell align="center">{renderSelect(risk.availability || 1, (v) => handleSubfactorChange(risk.id, "availability", v))}</TableCell>
                                            <TableCell align="center">{renderSelect(risk.occurrence || 1, (v) => handleSubfactorChange(risk.id, "occurrence", v))}</TableCell>
                                            <TableCell align="center">{renderSelect(risk.complexity || 1, (v) => handleSubfactorChange(risk.id, "complexity", v))}</TableCell>
                                            <TableCell align="center" sx={{ borderRight: '2px solid #f1f5f9', fontWeight: 'bold', color: '#1e40af', backgroundColor: '#eff6ff' }}>{pTotal}</TableCell>
                                            <TableCell align="center">{renderSelect(risk.lifeAndHealth || 1, (v) => handleSubfactorChange(risk.id, "lifeAndHealth", v))}</TableCell>
                                            <TableCell align="center">{renderSelect(risk.facility || 1, (v) => handleSubfactorChange(risk.id, "facility", v))}</TableCell>
                                            <TableCell align="center">{renderSelect(risk.financial || 1, (v) => handleSubfactorChange(risk.id, "financial", v))}</TableCell>
                                            <TableCell align="center">{renderSelect(risk.community || 1, (v) => handleSubfactorChange(risk.id, "community", v))}</TableCell>
                                            <TableCell align="center" sx={{ borderRight: '2px solid #f1f5f9', fontWeight: 'bold', color: '#b91c1c', backgroundColor: '#fef2f2' }}>{dTotal}</TableCell>
                                            <TableCell align="center"><Typography variant="subtitle2" fontWeight="bold">{score}</Typography></TableCell>
                                            <TableCell align="center">
                                                {band && <Chip label={band.label} size="small" sx={{ backgroundColor: band.color, color: '#fff', fontWeight: 'bold', fontSize: '0.7rem' }} />}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* ═══ TAB 1: Zranitelnosti ═══ */}
            {tabValue === 1 && (
                <Box>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Každá zranitelnost definuje, <b>jaká rizika</b> ovlivňuje a <b>jak moc</b> (modifikátory -3 až +3).
                        Uživatel ve svém projektu zaškrtne příslušné zranitelnosti a modifikátory se automaticky aplikují na výpočet.
                    </Alert>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                        {vulnerabilities.map((vuln, vulnIndex) => {
                            // Přehled ovlivněných rizik pro tuto zranitelnost
                            const affectedSummary = (vuln.targets || []).map(t => {
                                const mods = Object.entries(t.modifiers || {}).filter(([, v]) => v !== 0);
                                const totalMod = mods.reduce((s, [, v]) => s + v, 0);
                                return { riskName: t.riskName, totalMod, details: mods.map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`).join(', ') };
                            });

                            return (
                                <Accordion key={vuln.id} variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: '#f8fafc', '&.Mui-expanded': { borderBottom: '1px solid #e2e8f0' } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', flexWrap: 'wrap' }}>
                                            <Typography variant="subtitle1" fontWeight="bold" sx={{ flexShrink: 0 }}>
                                                {vuln.name || 'Nepojmenovaná'}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, flexGrow: 1 }}>
                                                {affectedSummary.map((ar, i) => (
                                                    <Tooltip key={i} title={ar.details || 'Žádné modifikátory'}>
                                                        <Chip size="small"
                                                            label={`${ar.riskName?.substring(0, 35)}${ar.riskName?.length > 35 ? '…' : ''} (${ar.totalMod > 0 ? '+' : ''}${ar.totalMod})`}
                                                            sx={{
                                                                backgroundColor: ar.totalMod > 0 ? '#fef2f2' : ar.totalMod < 0 ? '#f0fdf4' : '#f9fafb',
                                                                border: '1px solid',
                                                                borderColor: ar.totalMod > 0 ? '#fca5a5' : ar.totalMod < 0 ? '#86efac' : '#e5e7eb',
                                                                fontSize: '0.7rem', cursor: 'default'
                                                            }}
                                                        />
                                                    </Tooltip>
                                                ))}
                                                {affectedSummary.length === 0 && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>Žádná ovlivněná rizika</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                                            <TextField label="Název zranitelnosti" fullWidth value={vuln.name}
                                                onChange={(e) => handleVulnNameChange(vulnIndex, e.target.value)} />
                                            <Button color="error" variant="outlined" onClick={() => handleDeleteVulnerability(vulnIndex)} sx={{ flexShrink: 0 }}>
                                                Smazat
                                            </Button>
                                        </Box>

                                        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>Ovlivněná rizika</Typography>

                                        {(vuln.targets?.length > 0) ? (
                                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                                <Table size="small">
                                                    <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                                                        <TableRow>
                                                            <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Cílové riziko</TableCell>
                                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Dost.</TableCell>
                                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Výskyt</TableCell>
                                                            <TableCell align="center" sx={{ fontWeight: 'bold', borderRight: '2px solid #e2e8f0' }}>Slož.</TableCell>
                                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Životy</TableCell>
                                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Objekt</TableCell>
                                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Finance</TableCell>
                                                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Společ.</TableCell>
                                                            <TableCell align="center" sx={{ fontWeight: 'bold', width: '50px' }}></TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {vuln.targets.map((tgt, targetIdx) => (
                                                            <TableRow key={tgt.id || targetIdx} hover>
                                                                <TableCell>
                                                                    <Select fullWidth size="small" value={tgt.riskName}
                                                                        onChange={(e) => handleVulnTargetChange(vulnIndex, targetIdx, "riskName", e.target.value)}>
                                                                        {risks.map(r => <MenuItem key={r.id || r.name} value={r.name}>{r.name}</MenuItem>)}
                                                                    </Select>
                                                                </TableCell>
                                                                <TableCell align="center">{renderSelect(tgt.modifiers?.availability || 0, (v) => handleVulnTargetChange(vulnIndex, targetIdx, "availability", v), -3, 3, true)}</TableCell>
                                                                <TableCell align="center">{renderSelect(tgt.modifiers?.occurrence || 0, (v) => handleVulnTargetChange(vulnIndex, targetIdx, "occurrence", v), -3, 3, true)}</TableCell>
                                                                <TableCell align="center" sx={{ borderRight: '2px solid #e2e8f0' }}>{renderSelect(tgt.modifiers?.complexity || 0, (v) => handleVulnTargetChange(vulnIndex, targetIdx, "complexity", v), -3, 3, true)}</TableCell>
                                                                <TableCell align="center">{renderSelect(tgt.modifiers?.lifeAndHealth || 0, (v) => handleVulnTargetChange(vulnIndex, targetIdx, "lifeAndHealth", v), -3, 3, true)}</TableCell>
                                                                <TableCell align="center">{renderSelect(tgt.modifiers?.facility || 0, (v) => handleVulnTargetChange(vulnIndex, targetIdx, "facility", v), -3, 3, true)}</TableCell>
                                                                <TableCell align="center">{renderSelect(tgt.modifiers?.financial || 0, (v) => handleVulnTargetChange(vulnIndex, targetIdx, "financial", v), -3, 3, true)}</TableCell>
                                                                <TableCell align="center">{renderSelect(tgt.modifiers?.community || 0, (v) => handleVulnTargetChange(vulnIndex, targetIdx, "community", v), -3, 3, true)}</TableCell>
                                                                <TableCell align="center">
                                                                    <IconButton color="error" size="small" onClick={() => handleDeleteVulnTarget(vulnIndex, targetIdx)}>
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        ) : (
                                            <Alert severity="info" sx={{ mb: 2 }}>Zatím nejsou vybrána žádná zasažená rizika.</Alert>
                                        )}

                                        <Button size="small" startIcon={<AddCircleIcon />} variant="outlined" onClick={() => handleAddVulnTarget(vulnIndex)}>
                                            Přidat pravidlo
                                        </Button>
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}

                        {vulnerabilities.length === 0 && (
                            <Typography sx={{ py: 3, color: 'text.secondary', fontStyle: 'italic', textAlign: 'center' }}>
                                Zatím nejsou definovány žádné zranitelnosti.
                            </Typography>
                        )}
                    </Box>

                    <Button startIcon={<AddIcon />} variant="contained" color="secondary" onClick={handleAddVulnerability}>
                        Vytvořit novou zranitelnost
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default GlobalProjectRisks;
