// src/lib/risks/ProjectRisks.js
import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import RiskMatrix from "../../components/object/RiskMatrix";
import {
  Chip, Accordion, AccordionSummary, AccordionDetails,
  Checkbox, FormControlLabel, FormGroup, Typography,
  Tabs, Tab, Box, Switch, Tooltip, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Paper
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PlaceIcon from '@mui/icons-material/Place';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { outdoorRisks } from "../../config/eventTypesRisks";

/* ========================================================================== */
/*                             Pomocné util funkce                            */
/* ========================================================================== */

function exportRisksToCSV(filename, rows) {
  if (!rows?.length) return;
  const header = ["id", "name", "probability", "impact", "score", "bandId", "bandLabel"];
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""').replaceAll("\n", " ")}"`;
  const data = [
    header.join(","),
    ...rows.map((r) => [r.id, r.name, r.probability, r.impact, r.score, r.bandId, r.bandLabel].map(esc).join(","))
  ].join("\n");
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function safeExportDocxOrCsv(rows) {
  try {
    throw new Error("DOCX util is not wired; using CSV fallback.");
  } catch {
    exportRisksToCSV("project_risks", rows);
  }
}

/* ========================================================================== */
/*                           Vulnerability Panel                              */
/* ========================================================================== */

function VulnerabilityPanel({
  globalVulnerabilities = [],
  activeVulnerabilities = [],
  onToggleVulnerability,
  risks = []
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <Typography variant="h6" className="font-bold text-gray-800 mb-2">
          Zranitelnosti projektu
        </Typography>
        <Typography variant="body2" className="text-gray-500 mb-4">
          Zaškrtnuté zranitelnosti automaticky ovlivňují subfaktory příslušných rizik.
          Každá zranitelnost mění hodnocení konkrétních rizik podle definovaných modifikátorů.
        </Typography>

        {globalVulnerabilities.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 4, textAlign: 'center' }}>
            Žádné zranitelnosti nejsou definovány. Správce je může vytvořit v administraci.
          </Typography>
        ) : (
          <div className="space-y-2">
            {globalVulnerabilities.map((vuln) => {
              const isActive = activeVulnerabilities.includes(vuln.id);
              const affectedRisks = (vuln.targets || []).map(t => {
                const mods = Object.entries(t.modifiers || {}).filter(([, v]) => v !== 0);
                const totalMod = mods.reduce((s, [, v]) => s + v, 0);
                return { riskName: t.riskName, totalMod };
              }).filter(ar => ar.totalMod !== 0);

              return (
                <Accordion
                  key={vuln.id}
                  variant="outlined"
                  sx={{
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' },
                    border: isActive ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                    backgroundColor: isActive ? '#eff6ff' : '#fff',
                    transition: 'all 0.2s',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ '&.Mui-expanded': { borderBottom: '1px solid #e2e8f0' } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Switch
                        checked={isActive}
                        onChange={() => onToggleVulnerability(vuln.id)}
                        onClick={(e) => e.stopPropagation()}
                        color="primary"
                        size="small"
                      />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {vuln.name}
                        </Typography>
                        {vuln.description && (
                          <Typography variant="caption" color="text.secondary">
                            {vuln.description}
                          </Typography>
                        )}
                      </Box>
                      {isActive && affectedRisks.length > 0 && (
                        <Chip
                          size="small"
                          label={`${affectedRisks.length} rizik ovlivněno`}
                          sx={{ backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                      Ovlivněná rizika
                    </Typography>
                    {affectedRisks.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {affectedRisks.map((ar, i) => (
                          <Tooltip key={i} title={ar.riskName}>
                            <Chip
                              size="small"
                              label={`${ar.riskName?.substring(0, 35)}${ar.riskName?.length > 35 ? '…' : ''} (${ar.totalMod > 0 ? '+' : ''}${ar.totalMod})`}
                              sx={{
                                backgroundColor: ar.totalMod > 0 ? '#fef2f2' : '#f0fdf4',
                                border: '1px solid',
                                borderColor: ar.totalMod > 0 ? '#fca5a5' : '#86efac',
                                fontSize: '0.7rem',
                                cursor: 'default',
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Tato zranitelnost nemá definované modifikátory rizik.
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========================================================================== */
/*                     Location / Timing Checkbox Panel                       */
/* ========================================================================== */

const SUBFACTOR_LABELS = {
  availability: 'Atraktivita',
  occurrence: 'Výskyt',
  complexity: 'Složitost',
  lifeAndHealth: 'Dopad na životy',
  facility: 'Dopad na techniku',
  financial: 'Dopad na finance',
  community: 'Dopad na společenství',
};

function LocationTimingPanel({
  locationTimingConfig,
  activeLocationTimings = [],
  onToggleLocationTiming,
  customLocationTimings = [],
  onAddCustomLocationTiming,
  onRemoveCustomLocationTiming,
  risks = [],
  isOutdoor = false,
  locationTimingImpact = [],
}) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addType, setAddType] = useState('location');
  const [addName, setAddName] = useState('');
  const [addModifiers, setAddModifiers] = useState([]);

  const allLocations = [
    ...(locationTimingConfig?.locations || []),
    ...customLocationTimings.filter(c => c.type === 'location'),
  ];
  const allTimings = [
    ...(locationTimingConfig?.timings || []),
    ...customLocationTimings.filter(c => c.type === 'timing'),
  ];

  const handleOpenAddDialog = (type) => {
    setAddType(type);
    setAddName('');
    setAddModifiers([]);
    setAddDialogOpen(true);
  };

  const handleAddModifierRow = () => {
    setAddModifiers(prev => [...prev, { riskName: '', availability: 0, occurrence: 0, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 0 }]);
  };

  const handleModifierChange = (index, field, value) => {
    setAddModifiers(prev => prev.map((m, i) => i === index ? { ...m, [field]: field === 'riskName' ? value : Number(value) } : m));
  };

  const handleRemoveModifierRow = (index) => {
    setAddModifiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitCustom = () => {
    if (!addName.trim()) return;
    const targets = addModifiers
      .filter(m => m.riskName)
      .map(m => ({
        riskName: m.riskName,
        modifiers: {
          availability: m.availability || 0,
          occurrence: m.occurrence || 0,
          complexity: m.complexity || 0,
          lifeAndHealth: m.lifeAndHealth || 0,
          facility: m.facility || 0,
          financial: m.financial || 0,
          community: m.community || 0,
        }
      }))
      .filter(t => Object.values(t.modifiers).some(v => v !== 0));

    onAddCustomLocationTiming({
      id: `custom-${addType}-${Date.now()}`,
      name: addName.trim(),
      type: addType,
      targets,
    });
    setAddDialogOpen(false);
  };

  const renderImpactBar = (item, maxAbsImpact) => {
    if (!maxAbsImpact) return null;
    const width = Math.abs(item.totalImpact) / maxAbsImpact * 100;
    const isPositive = item.totalImpact > 0;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <Box sx={{
          height: 6, borderRadius: 3,
          width: `${Math.max(width, 4)}%`,
          backgroundColor: isPositive ? '#ef4444' : '#22c55e',
          transition: 'width 0.3s',
        }} />
        <Typography variant="caption" sx={{ color: isPositive ? '#dc2626' : '#16a34a', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {isPositive ? '+' : ''}{item.totalImpact}
        </Typography>
      </Box>
    );
  };

  const maxAbsImpact = locationTimingImpact.length > 0
    ? Math.max(...locationTimingImpact.map(i => Math.abs(i.totalImpact)), 1)
    : 1;

  const renderSection = (title, icon, items, type, color) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ color }}>{title}</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1.5 }}>
        {items.map((item) => {
          const isActive = activeLocationTimings.includes(item.id);
          const isCustom = item.id.startsWith('custom-');
          const impact = locationTimingImpact.find(i => i.id === item.id);
          const modTargetCount = (item.targets || []).filter(t => t.modifiers && !t.notApplicable).length;
          const naCount = (item.targets || []).filter(t => t.notApplicable).length;

          return (
            <Paper
              key={item.id}
              variant="outlined"
              sx={{
                p: 1.5, borderRadius: 2,
                border: isActive ? `2px solid ${color}` : '1px solid #e5e7eb',
                backgroundColor: isActive ? `${color}08` : '#fff',
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': { borderColor: color, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
              }}
              onClick={() => onToggleLocationTiming(item.id)}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Checkbox
                  checked={isActive}
                  size="small"
                  sx={{ p: 0, mt: 0.2, color, '&.Mui-checked': { color } }}
                  onChange={() => {}}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{item.name}</Typography>
                    {isCustom && (
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onRemoveCustomLocationTiming(item.id); }}
                        sx={{ p: 0.3, ml: 'auto' }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                      </IconButton>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    {modTargetCount > 0 && (
                      <Chip size="small" label={`${modTargetCount} rizik`} sx={{ height: 18, fontSize: '0.65rem', backgroundColor: '#dbeafe', color: '#1e40af' }} />
                    )}
                    {naCount > 0 && (
                      <Chip size="small" label={`${naCount} N/A`} sx={{ height: 18, fontSize: '0.65rem', backgroundColor: '#f1f5f9', color: '#64748b' }} />
                    )}
                  </Box>
                  {isActive && impact && renderImpactBar(impact, maxAbsImpact)}
                </Box>
              </Box>
            </Paper>
          );
        })}
        {/* Přidat vlastní */}
        <Paper
          variant="outlined"
          sx={{
            p: 1.5, borderRadius: 2, border: '1px dashed #cbd5e1',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', '&:hover': { borderColor: color, backgroundColor: `${color}05` },
            minHeight: 56,
          }}
          onClick={() => handleOpenAddDialog(type)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8' }}>
            <AddIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>Vlastní {type === 'location' ? 'lokalizace' : 'načasování'}</Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <Typography variant="h6" className="font-bold text-gray-800 mb-1">Specifikace lokalizace a načasování rizik</Typography>
        <Typography variant="body2" className="text-gray-500 mb-4">
          Zaškrtnutí lokalizace nebo načasování automaticky upraví bodové hodnocení subfaktorů u příslušných rizik.
          Hodnoty vycházejí z matice vlivu pro daný typ akce. Můžete také přidat vlastní lokalizaci či načasování
          a ručně určit, která rizika a subfaktory ovlivní.
        </Typography>

        {renderSection('Lokalizace', <PlaceIcon sx={{ color: '#2563eb' }} />, allLocations, 'location', '#2563eb')}
        {renderSection('Načasování', <ScheduleIcon sx={{ color: '#7c3aed' }} />, allTimings, 'timing', '#7c3aed')}

        {/* Vizualizace vlivu */}
        {locationTimingImpact.length > 0 && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5, color: '#334155' }}>
              Vliv aktivních lokalizací a načasování na celkovou ohroženost
            </Typography>
            {locationTimingImpact.map(item => (
              <Box key={item.id} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {item.type === 'location'
                    ? <PlaceIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                    : <ScheduleIcon sx={{ fontSize: 16, color: '#7c3aed' }} />
                  }
                  <Typography variant="body2" fontWeight={500} sx={{ minWidth: 160 }}>{item.name}</Typography>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      height: 10, borderRadius: 5,
                      width: `${Math.max(Math.abs(item.totalImpact) / maxAbsImpact * 100, 3)}%`,
                      backgroundColor: item.totalImpact > 0 ? '#ef4444' : item.totalImpact < 0 ? '#22c55e' : '#94a3b8',
                      transition: 'width 0.3s',
                    }} />
                    <Typography variant="body2" fontWeight={700} sx={{
                      color: item.totalImpact > 0 ? '#dc2626' : item.totalImpact < 0 ? '#16a34a' : '#64748b',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.totalImpact > 0 ? '+' : ''}{item.totalImpact} bodů
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
            {(() => {
              const sorted = [...locationTimingImpact].sort((a, b) => b.totalImpact - a.totalImpact);
              const highest = sorted[0];
              if (highest && highest.totalImpact > 0) {
                return (
                  <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#fef2f2', borderRadius: 1.5, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon sx={{ color: '#dc2626', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#991b1b' }}>
                      <strong>Nejrizikovější {highest.type === 'location' ? 'lokalizace' : 'načasování'}:</strong> {highest.name} (+{highest.totalImpact} bodů k celkové ohroženosti)
                    </Typography>
                  </Box>
                );
              }
              return null;
            })()}
          </Box>
        )}
      </div>

      {/* Dialog pro přidání vlastní lokalizace/načasování */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Přidat vlastní {addType === 'location' ? 'lokalizaci' : 'načasování'}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth label={addType === 'location' ? 'Název lokalizace' : 'Název načasování'}
            value={addName} onChange={(e) => setAddName(e.target.value)}
            placeholder={addType === 'location' ? 'Např. VIP zóna, parkovací plocha...' : 'Např. před startem, obědová přestávka...'}
            sx={{ mb: 3, mt: 1 }}
          />

          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
            Vliv na hodnocení rizik (volitelné)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Určete, která rizika a o kolik bodů se změní jejich subfaktory.
            Kladné hodnoty zvyšují, záporné snižují. Rozsah: -3 až +3.
          </Typography>

          {addModifiers.map((mod, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <TextField
                  select fullWidth size="small" label="Riziko"
                  value={mod.riskName} onChange={(e) => handleModifierChange(idx, 'riskName', e.target.value)}
                  SelectProps={{ native: true }}
                >
                  <option value="">-- Vyberte riziko --</option>
                  {risks.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </TextField>
                <IconButton size="small" onClick={() => handleRemoveModifierRow(idx)} sx={{ color: '#ef4444' }}>
                  <DeleteOutlineIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1 }}>
                {Object.entries(SUBFACTOR_LABELS).map(([key, label]) => (
                  <TextField
                    key={key} size="small" type="number" label={label}
                    value={mod[key] || 0}
                    onChange={(e) => handleModifierChange(idx, key, e.target.value)}
                    inputProps={{ min: -3, max: 3, step: 1 }}
                  />
                ))}
              </Box>
            </Paper>
          ))}

          <Button startIcon={<AddIcon />} onClick={handleAddModifierRow} size="small" sx={{ mt: 1 }}>
            Přidat ovlivněné riziko
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Zrušit</Button>
          <Button variant="contained" onClick={handleSubmitCustom} disabled={!addName.trim()}>
            Přidat
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/* ========================================================================== */
/*                                  Komponenta                                */
/* ========================================================================== */

export default function ProjectRisks({
  risks = [],
  environmentType = "kombinovaná",
  projectType = "akce",
  showMatrix = true,
  onCreateRisk,
  onUpdateRisk,
  onDeleteRisk,
  locationSpecifics = "",
  timingSpecifics = "",
  onUpdateSpecifics,
  // Vulnerability props
  globalVulnerabilities = [],
  activeVulnerabilities = [],
  onToggleVulnerability,
  // Location / timing props
  locationTimingConfig = null,
  activeLocationTimings = [],
  onToggleLocationTiming,
  customLocationTimings = [],
  onAddCustomLocationTiming,
  onRemoveCustomLocationTiming,
  locationTimingImpact = [],
}) {
  const isOutdoor = environmentType === 'venkovní' || environmentType === 'vnější';
  const [q, setQ] = useState("");
  const [bandFilter, setBandFilter] = useState("all");
  const [sortKey, setSortKey] = useState("scoreDesc");
  const [openAdd, setOpenAdd] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null);
  const [draft, setDraft] = useState({ name: "", probability: 3, impact: 3 });
  const [tabValue, setTabValue] = useState(0);

  const enriched = useMemo(() => {
    return Array.isArray(risks) ? risks
      .filter(r => r && typeof r === 'object' && !r.$$typeof)
      .map((r) => {
        const pTotal = (Number(r.availability) || 1) + (Number(r.occurrence) || 1) + (Number(r.complexity) || 1);
        const dTotal = (Number(r.lifeAndHealth) || 1) + (isOutdoor ? 0 : (Number(r.facility) || 1)) + (Number(r.financial) || 1) + (Number(r.community) || 1);
        return { ...r, probability: pTotal, impact: dTotal, score: pTotal * dTotal };
      }) : [];
  }, [risks, isOutdoor]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return enriched.filter((r) => !qq || (r.name || "").toLowerCase().includes(qq));
  }, [enriched, q]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortKey) {
      case "scoreDesc": arr.sort((a, b) => b.score - a.score); break;
      case "scoreAsc": arr.sort((a, b) => a.score - b.score); break;
      case "nameAsc": arr.sort((a, b) => String(a.name).localeCompare(String(b.name))); break;
      case "nameDesc": arr.sort((a, b) => String(b.name).localeCompare(String(a.name))); break;
      default: break;
    }
    return arr;
  }, [filtered, sortKey]);

  async function handleCreateRisk(e) {
    e?.preventDefault?.();
    if (onCreateRisk) {
      await onCreateRisk({
        name: draft.name?.trim(),
        probability: 3, impact: 4,
        availability: 1, occurrence: 1, complexity: 1,
        lifeAndHealth: 1, facility: 1, financial: 1, community: 1,
      });
    }
    setOpenAdd(false);
    setDraft({ name: "" });
  }

  async function handleSaveEdit(e) {
    e?.preventDefault?.();
    if (onUpdateRisk && editingRisk) {
      await onUpdateRisk(editingRisk.id, { name: editingRisk.name?.trim() });
    }
    setEditingRisk(null);
  }

  async function handleSubfactorChange(risk, field, value) {
    if (onUpdateRisk) {
      await onUpdateRisk(risk.id, { [field]: Number(value) });
    }
  }

  // Count active vulnerabilities for tab label
  const activeVulnCount = activeVulnerabilities.length;
  const totalVulnCount = globalVulnerabilities.length;

  return (
    <div className="p-4 space-y-6">
      {/* Hlavička */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Analýza ohroženosti</h2>
          <p className="text-sm opacity-70">Škála (P: 3–21, D: {isOutdoor ? '3–21' : '4–28'})</p>
        </div>
        {tabValue === 0 && (
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              type="search"
              placeholder="Hledat riziko…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm md:w-64"
            />
            <select className="rounded-lg border px-3 py-2 text-sm" value={bandFilter} onChange={(e) => setBandFilter(e.target.value)} title="Filtrovat podle pásma">
              <option value="all">Všechna pásma</option>
              <option value="low">Nízké</option>
              <option value="medium">Střední</option>
              <option value="high">Vysoké</option>
              <option value="critical">Kritické</option>
            </select>
            <select className="rounded-lg border px-3 py-2 text-sm" value={sortKey} onChange={(e) => setSortKey(e.target.value)} title="Řazení">
              <option value="scoreDesc">Podle skóre ↓</option>
              <option value="scoreAsc">Podle skóre ↑</option>
              <option value="nameAsc">Název A–Z</option>
              <option value="nameDesc">Název Z–A</option>
            </select>
            <button onClick={() => safeExportDocxOrCsv(sorted)} className="rounded-lg border px-3 py-2 text-sm" title="Export rizik (DOCX/CSV)">Export</button>
            <button onClick={() => setOpenAdd(true)} className="rounded-lg bg-black text-white px-3 py-2 text-sm">+ Přidat riziko</button>
          </div>
        )}
      </header>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label={`Rizika (${enriched.length})`} />
          <Tab label={`Zranitelnosti akce (${activeVulnCount}/${totalVulnCount})`} />
        </Tabs>
      </Box>

      {/* ═══ TAB 0: Rizika ═══ */}
      {tabValue === 0 && (
        <>
          {/* Specifikace lokalizace a načasování rizik */}
          {locationTimingConfig ? (
            <LocationTimingPanel
              locationTimingConfig={locationTimingConfig}
              activeLocationTimings={activeLocationTimings}
              onToggleLocationTiming={onToggleLocationTiming}
              customLocationTimings={customLocationTimings}
              onAddCustomLocationTiming={onAddCustomLocationTiming}
              onRemoveCustomLocationTiming={onRemoveCustomLocationTiming}
              risks={enriched}
              isOutdoor={isOutdoor}
              locationTimingImpact={locationTimingImpact}
            />
          ) : (
            /* Fallback: textarea pro typy akcí bez předdefinované matice */
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <Typography variant="h6" className="font-bold text-gray-800 mb-2">Specifikace lokalizace a načasování rizik</Typography>
              <Typography variant="body2" className="text-gray-500 mb-5">
                Popište konkrétní místa a časy, které představují zvýšené riziko.
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-1">Specifika lokality (Místa)</Typography>
                  <textarea
                    className="w-full border rounded-lg p-3 text-sm min-h-[100px] focus:ring focus:ring-blue-100 outline-none"
                    placeholder="Např.: Zadní vchod u parku, stísněný prostor před pódiem..."
                    value={locationSpecifics || ''} onChange={(e) => onUpdateSpecifics && onUpdateSpecifics('locationSpecifics', e.target.value)}
                  />
                </div>
                <div>
                  <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-1">Specifika načasování (Harmonogram)</Typography>
                  <textarea
                    className="w-full border rounded-lg p-3 text-sm min-h-[100px] focus:ring focus:ring-blue-100 outline-none"
                    placeholder="Např.: Příjezd VIP ve 14:00, stmívání okolo 19:30..."
                    value={timingSpecifics || ''} onChange={(e) => onUpdateSpecifics && onUpdateSpecifics('timingSpecifics', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upozornění na dopad na techniku */}
          {isOutdoor && (
            <Box sx={{ p: 2, backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <WarningAmberIcon sx={{ color: '#d97706', mt: 0.3 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#92400e', mb: 0.5 }}>
                  Dopad incidentu na techniku a objekt
                </Typography>
                <Typography variant="body2" sx={{ color: '#78350f' }}>
                  Při hodnocení dopadu na techniku a objekt u venkovních akcí pracujeme s verzí, že objekt (budova,
                  sportoviště) je ve vlastnictví soukromého subjektu, který ponese dopad na budovu sám.
                  Pořadatel akce proto řeší pouze dopad na vlastní techniku (nikoli na budovu/objekt).
                  Z tohoto důvodu je subfaktor „Technika/Objekt“ u venkovních akcí vynechán z výpočtu dopadu.
                </Typography>
              </Box>
            </Box>
          )}

          {/* Zvažovaná rizika */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <Typography variant="h6" className="font-bold text-gray-800 mb-2">Zvažovaná rizika</Typography>
            <Typography variant="body2" className="text-gray-500 mb-4">
              Zaškrtnutím nebo odškrtnutím spravujete rizika aktivní v tomto projektu.
            </Typography>

            {isOutdoor && sorted.some(r => outdoorRisks.includes(r.name)) && (
              <>
                <Typography variant="subtitle2" className="text-emerald-700 font-bold mb-2 uppercase tracking-wider text-xs bg-emerald-50 inline-block px-2 py-1 rounded">
                  Specifická rizika pro venkovní / kombinované prostředí
                </Typography>
                <FormGroup sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1, mb: 4 }}>
                  {sorted.filter(r => outdoorRisks.includes(r.name)).map(r => (
                    <FormControlLabel
                      key={r.id}
                      control={<Checkbox checked={true} onChange={() => onDeleteRisk && onDeleteRisk(r.id)} color="success" size="small" />}
                      label={<span className="font-medium text-gray-700 text-sm">{r.name || r.id}</span>}
                    />
                  ))}
                </FormGroup>
              </>
            )}

            <Typography variant="subtitle2" className="text-indigo-700 font-bold mb-2 uppercase tracking-wider text-xs bg-indigo-50 inline-block px-2 py-1 rounded">
              {isOutdoor ? "Rizika specifikovaná typem akce a ostatní" : "Specifická rizika projektu"}
            </Typography>
            <FormGroup sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 1 }}>
              {sorted.filter(r => !(isOutdoor && outdoorRisks.includes(r.name))).map(r => (
                <FormControlLabel
                  key={r.id}
                  control={<Checkbox checked={true} onChange={() => onDeleteRisk && onDeleteRisk(r.id)} color="primary" size="small" />}
                  label={<span className="font-medium text-gray-700 text-sm">{r.name || r.id}</span>}
                />
              ))}
              {sorted.length === 0 && (
                <div className="text-gray-400 text-sm italic">Žádná rizika zatím nebyla přidána.</div>
              )}
            </FormGroup>
          </div>

          {/* Matice P × D */}
          {showMatrix && enriched.length > 0 && (
            <section className="bg-white rounded-xl shadow-sm border p-5">
              <Typography variant="h6" className="font-bold text-gray-800 mb-1">Analýza ohroženosti</Typography>
              <Typography variant="body2" className="text-gray-500 mb-4">
                Vizuální interpretace rozdělení rizik dle pravděpodobnosti (P) a dopadu (D).
              </Typography>
              <RiskMatrix threats={enriched} />
            </section>
          )}

          {/* Bodovací Tabulka */}
          <Accordion className="shadow-sm border rounded-xl before:hidden" disableGutters>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} className="bg-slate-50/50 hover:bg-slate-50 transition-colors border-b rounded-t-xl">
              <Typography className="font-semibold text-gray-800">
                Tabulka hodnocení ohroženosti (pokročilá modifikace bodů)
              </Typography>
            </AccordionSummary>
            <AccordionDetails className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-white border-b">
                    <tr>
                      <th className="px-3 py-3 font-medium text-left text-gray-500 uppercase tracking-wider">Riziko</th>
                      <th className="px-1 py-3 font-medium text-center text-gray-500 uppercase tracking-wider" title="Dostupnost">Dost.</th>
                      <th className="px-1 py-3 font-medium text-center text-gray-500 uppercase tracking-wider" title="Výskyt">Výskyt</th>
                      <th className="px-1 py-3 font-medium text-center text-gray-500 uppercase tracking-wider" title="Složitost">Slož.</th>
                      <th className="px-3 py-3 font-bold text-center border-r border-l border-blue-100 bg-blue-50/50 text-blue-800">P</th>
                      <th className="px-1 py-3 font-medium text-center text-gray-500 uppercase tracking-wider" title="Životy a zdraví">Životy</th>
                      <th className="px-1 py-3 font-medium text-center text-gray-500 uppercase tracking-wider" title={projectType === "objekt" ? "Objekt" : "Technika"}>{projectType === "objekt" ? "Objekt" : "Technika"}</th>
                      <th className="px-1 py-3 font-medium text-center text-gray-500 uppercase tracking-wider" title="Finance">Finance</th>
                      <th className="px-1 py-3 font-medium text-center text-gray-500 uppercase tracking-wider" title="Společenství">Společ.</th>
                      <th className="px-3 py-3 font-bold text-center border-r border-l border-orange-100 bg-orange-50/50 text-orange-800">D</th>
                      <th className="px-3 py-3 font-bold text-center text-gray-800">Skóre</th>
                      <th className="px-3 py-3 font-medium text-right text-gray-500 uppercase tracking-wider">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {sorted.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-3 py-3 font-medium text-gray-800 break-words max-w-[200px]">
                          <div>{r.name || r.id}</div>
                          {r.tags && r.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5 align-middle">
                              {r.tags.map((tag, idx) => {
                                let sx = { height: 18, fontSize: '0.65rem' };
                                if (tag.includes("Základní")) { sx.backgroundColor = "transparent"; sx.border = "1px solid #bfdbfe"; sx.color = "#1e40af"; }
                                else if (tag.includes("Prostředí")) { sx.backgroundColor = "transparent"; sx.border = "1px solid #bbf7d0"; sx.color = "#166534"; }
                                else if (tag.includes("zranitelnosti") || tag.includes("Zranitelnosti") || tag.includes("specifik") || tag.includes("Modifikováno") || tag.includes("Přidáno")) {
                                  sx.backgroundColor = "transparent"; sx.border = "1px solid #fed7aa"; sx.color = "#9a3412";
                                }
                                else if (tag.includes("Časovka")) { sx.backgroundColor = "transparent"; sx.border = "1px solid #c4b5fd"; sx.color = "#5b21b6"; }
                                else if (tag.includes("Lokalizace") || tag.includes("Načasování")) {
                                  sx.backgroundColor = "transparent"; sx.border = "1px solid #a5b4fc"; sx.color = "#4338ca";
                                }
                                return <Chip key={idx} label={tag} size="small" sx={sx} />;
                              })}
                            </div>
                          )}
                        </td>
                        {['availability', 'occurrence', 'complexity'].map(field => {
                          const base = r._base?.[field];
                          const current = r[field] || 1;
                          const diff = base != null ? current - base : 0;
                          return (
                            <td key={field} className="px-1 py-2 text-center relative">
                              <select value={current} onChange={(e) => handleSubfactorChange(r, field, e.target.value)} className="border-gray-200 text-gray-600 rounded px-1 py-1 w-12 text-center shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                                {[1,2,3,4,5,6,7].map(v => <option key={v} value={v}>{v}</option>)}
                              </select>
                              {diff !== 0 && (
                                <span title={`Modifikováno: ${diff > 0 ? '+' : ''}${diff} (základ: ${base})`} style={{ position: 'absolute', top: 2, right: 2, fontSize: 9, fontWeight: 700, lineHeight: 1, color: diff > 0 ? '#dc2626' : '#16a34a' }}>
                                  {diff > 0 ? '▲' : '▼'}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 font-bold text-center border-l border-r border-blue-50 bg-blue-50/20 text-blue-900 tabular-nums">{r.probability}</td>
                        {['lifeAndHealth', 'facility', 'financial', 'community'].map(field => {
                          if (field === 'facility' && isOutdoor) {
                            return (
                              <td key={field} className="px-1 py-2 text-center">
                                <span className="text-gray-400 font-medium cursor-not-allowed" title="Nevyplňuje se u venkovních akcí">—</span>
                              </td>
                            );
                          }
                          const base = r._base?.[field];
                          const current = r[field] || 1;
                          const diff = base != null ? current - base : 0;
                          return (
                            <td key={field} className="px-1 py-2 text-center relative">
                              <select value={current} onChange={(e) => handleSubfactorChange(r, field, e.target.value)} className="border-gray-200 text-gray-600 rounded px-1 py-1 w-12 text-center shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                                {[1,2,3,4,5,6,7].map(v => <option key={v} value={v}>{v}</option>)}
                              </select>
                              {diff !== 0 && (
                                <span title={`Modifikováno: ${diff > 0 ? '+' : ''}${diff} (základ: ${base})`} style={{ position: 'absolute', top: 2, right: 2, fontSize: 9, fontWeight: 700, lineHeight: 1, color: diff > 0 ? '#dc2626' : '#16a34a' }}>
                                  {diff > 0 ? '▲' : '▼'}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 font-bold text-center border-l border-r border-orange-50 bg-orange-50/20 text-orange-900 tabular-nums">{r.impact}</td>
                        <td className="px-3 py-2 font-black tabular-nums text-gray-900 text-center text-sm">{r.score}</td>
                        <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => setEditingRisk(r)} className="text-indigo-600 hover:text-indigo-800 font-medium py-1 px-2 rounded hover:bg-indigo-50 transition-colors" title="Přejmenovat riziko">Přejmenovat</button>
                          <button onClick={() => onDeleteRisk && onDeleteRisk(r.id)} className="text-red-500 hover:text-red-700 font-medium py-1 px-2 rounded hover:bg-red-50 transition-colors" title="Odstranit z projektu">Odstranit</button>
                        </td>
                      </tr>
                    ))}
                    {sorted.length === 0 && (
                      <tr>
                        <td colSpan={12} className="px-4 py-8 text-center text-gray-400 italic">
                          Tabulka hodnocení je prázdná. Přidejte nebo aktivujte nějaká rizika.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </AccordionDetails>
          </Accordion>
        </>
      )}

      {/* ═══ TAB 1: Zranitelnosti ═══ */}
      {tabValue === 1 && (
        <VulnerabilityPanel
          globalVulnerabilities={globalVulnerabilities}
          activeVulnerabilities={activeVulnerabilities}
          onToggleVulnerability={onToggleVulnerability}
          risks={enriched}
        />
      )}

      {/* Dialog pro přidání rizika */}
      {openAdd && (
        <AddRiskDialog
          draft={draft}
          onClose={() => setOpenAdd(false)}
          onChange={setDraft}
          onSubmit={handleCreateRisk}
        />
      )}

      {/* Dialog pro úpravu rizika */}
      {editingRisk && (
        <AddRiskDialog
          draft={editingRisk}
          onClose={() => setEditingRisk(null)}
          onChange={setEditingRisk}
          onSubmit={handleSaveEdit}
          title="Upravit riziko"
        />
      )}

    </div>
  );
}

ProjectRisks.propTypes = {
  risks: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    probability: PropTypes.number,
    impact: PropTypes.number,
  })),
  showMatrix: PropTypes.bool,
  onCreateRisk: PropTypes.func,
  onUpdateRisk: PropTypes.func,
  onDeleteRisk: PropTypes.func,
  globalVulnerabilities: PropTypes.array,
  activeVulnerabilities: PropTypes.array,
  onToggleVulnerability: PropTypes.func,
  locationTimingConfig: PropTypes.object,
  activeLocationTimings: PropTypes.array,
  onToggleLocationTiming: PropTypes.func,
  customLocationTimings: PropTypes.array,
  onAddCustomLocationTiming: PropTypes.func,
  onRemoveCustomLocationTiming: PropTypes.func,
  locationTimingImpact: PropTypes.array,
};

/* ========================================================================== */
/*                              UI Pomocné prvky                              */
/* ========================================================================== */

function AddRiskDialog({ draft, onClose, onChange, onSubmit, title = "Přidat riziko" }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">{title}</h4>
          <button type="button" className="rounded-md px-2 py-1 text-sm border" onClick={onClose}>Zavřít</button>
        </div>
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span>Název rizika</span>
            <input
              className="rounded-lg border px-3 py-2"
              value={draft.name || ""}
              onChange={(e) => onChange({ ...draft, name: e.target.value })}
              placeholder="Např. Požár ve stánkové zóně"
              required
            />
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={onClose}>Zrušit</button>
          <button type="submit" className="rounded-lg bg-black text-white px-3 py-2 text-sm">Vytvořit (a následně Hodnotit)</button>
        </div>
      </form>
    </div>
  );
}

AddRiskDialog.propTypes = {
  draft: PropTypes.shape({ name: PropTypes.string }).isRequired,
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
