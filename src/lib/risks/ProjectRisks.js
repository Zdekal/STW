// src/components/project/ProjectRisks.js
import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
// Nativní matice
import RiskScoringDialog from "../../components/project/RiskScoringDialog";
import RiskMatrix from "../../components/object/RiskMatrix";
import { Chip, Accordion, AccordionSummary, AccordionDetails, Checkbox, FormControlLabel, FormGroup, Typography } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// Volitelně: pokud máš utilitu na DOCX, odkomentuj/import přizpůsob.
// (Soubor u tebe je v src/components/ExportUtils.js)
// eslint-disable-next-line
// import { exportRisksToDocx } from "../ExportUtils";
import { outdoorRisks } from "../../config/eventTypesRisks";

/* ========================================================================== */
/*                             Pomocné util funkce                            */
/* ========================================================================== */

// Lokální export do CSV (fallback, funguje bez dalších závislostí)
function exportRisksToCSV(filename, rows) {
  if (!rows?.length) return;
  const header = [
    "id",
    "name",
    "probability",
    "impact",
    "score",
    "bandId",
    "bandLabel",
  ];
  const esc = (v) =>
    `"${String(v ?? "").replaceAll('"', '""').replaceAll("\n", " ")}"`;
  const data = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.name,
        r.probability,
        r.impact,
        r.score,
        r.bandId,
        r.bandLabel,
      ]
        .map(esc)
        .join(",")
    ),
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

// Bezpečný pokus o DOCX export; když není k dispozici utilita, spadne do CSV
async function safeExportDocxOrCsv(rows) {
  try {
    // Pokud používáš vlastní utilitu na DOCX, odkomentuj import výše a řádek níže:
    // await exportRisksToDocx(rows);
    // return;
    throw new Error("DOCX util is not wired; using CSV fallback.");
  } catch {
    exportRisksToCSV("project_risks", rows);
  }
}

/* ========================================================================== */
/*                                  Komponenta                                */
/* ========================================================================== */

export default function ProjectRisks({
  risks = [],
  environmentType = "kombinovaná",
  projectType = "akce",
  showMatrix = true,
  onCreateRisk, // (optional) callback({name, description, probability, impact})
  onUpdateRisk, // (optional) callback(id, {name, description, probability, impact})
  onDeleteRisk, // (optional) callback(id)
  locationSpecifics = "",
  timingSpecifics = "",
  onUpdateSpecifics
}) {
  // Ovládání UI
  const isOutdoor = environmentType === 'venkovní' || environmentType === 'vnější';
  const [q, setQ] = useState("");
  const [bandFilter, setBandFilter] = useState("all");
  const [sortKey, setSortKey] = useState("scoreDesc");
  const [openAdd, setOpenAdd] = useState(false);
  const [editingRisk, setEditingRisk] = useState(null); // Uchovává objekt upraveného rizika (name, P, D)
  const [scoringRisk, setScoringRisk] = useState(null); // Pro detailní výpočet P/D
  const [draft, setDraft] = useState({
    name: "",
    probability: 3,
    impact: 3,
  });

  const [locText, setLocText] = useState(locationSpecifics || '');
  const [timeText, setTimeText] = useState(timingSpecifics || '');

  React.useEffect(() => { setLocText(locationSpecifics || ''); }, [locationSpecifics]);
  React.useEffect(() => { setTimeText(timingSpecifics || ''); }, [timingSpecifics]);

  const handleLocBlur = () => { if (onUpdateSpecifics && locText !== locationSpecifics) onUpdateSpecifics('locationSpecifics', locText); };
  const handleTimeBlur = () => { if (onUpdateSpecifics && timeText !== timingSpecifics) onUpdateSpecifics('timingSpecifics', timeText); };

  // Přepočet rizik pomocí nativní škály pro P (max 21) a D (max 28)
  const enriched = useMemo(() => {
    return Array.isArray(risks) ? risks
      .filter(r => r && typeof r === 'object' && !r.$$typeof)
      .map((r) => {
        // Nativní výpočet celkových P a D, fallback na 3 a 3
        const pTotal =
          (Number(r.availability) || 1) +
          (Number(r.occurrence) || 1) +
          (Number(r.complexity) || 1);
        const dTotal =
          (Number(r.lifeAndHealth) || 1) +
          (isOutdoor ? 0 : (Number(r.facility) || 1)) +
          (Number(r.financial) || 1) +
          (Number(r.community) || 1);

        const score = pTotal * dTotal;

        return {
          ...r,
          probability: pTotal,
          impact: dTotal,
          score,
        };
      }) : [];
  }, [risks, isOutdoor]);

  // Vyhledávání + filtrování podle pásma
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return enriched.filter((r) => {
      const passText =
        !qq ||
        (r.name || "").toLowerCase().includes(qq);
      return passText;
    });
  }, [enriched, q]);

  // Řazení
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortKey) {
      case "scoreDesc":
        arr.sort((a, b) => b.score - a.score);
        break;
      case "scoreAsc":
        arr.sort((a, b) => a.score - b.score);
        break;
      case "nameAsc":
        arr.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        break;
      case "nameDesc":
        arr.sort((a, b) => String(b.name).localeCompare(String(a.name)));
        break;
      default:
        break;
    }
    return arr;
  }, [filtered, sortKey]);

  // Matice P×D - z ThreatAnalysis se čerpá nativně přes komponentu
  const matrix = useMemo(() => null, []);

  // Odeslání nového rizika
  async function handleCreateRisk(e) {
    e?.preventDefault?.();
    if (onCreateRisk) {
      await onCreateRisk({
        name: draft.name?.trim(),
        probability: 3,
        impact: 4,
        availability: 1,
        occurrence: 1,
        complexity: 1,
        lifeAndHealth: 1,
        facility: 1,
        financial: 1,
        community: 1,
      });
    }
    setOpenAdd(false);
    setDraft({ name: "" }); // reset
  }

  // Uložení detailů (přejmenování ap.)
  async function handleSaveEdit(e) {
    e?.preventDefault?.();
    if (onUpdateRisk && editingRisk) {
      await onUpdateRisk(editingRisk.id, {
        name: editingRisk.name?.trim(),
        // Ponecháváme stávající P/D, mění se v Hodnocení rizik (subfaktorech)
      });
    }
    setEditingRisk(null);
    setEditingRisk(null);
  }

  // Přímá editace subfaktoru z tabulky
  async function handleSubfactorChange(risk, field, value) {
    if (onUpdateRisk) {
      await onUpdateRisk(risk.id, {
        [field]: Number(value)
      });
    }
  }

  return (
    <div className="p-4 space-y-8">
      {/* Hlavička */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Rizika projektu</h2>
          <p className="text-sm opacity-70">
            Škála (P: 3–21, D: 4–28)
          </p>
        </div>

        {/* Ovládací panel */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            type="search"
            placeholder="Hledat riziko…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm md:w-64"
          />

          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={bandFilter}
            onChange={(e) => setBandFilter(e.target.value)}
            title="Filtrovat podle pásma"
          >
            <option value="all">Všechna pásma</option>
            <option value="low">Nízké</option>
            <option value="medium">Střední</option>
            <option value="high">Vysoké</option>
            <option value="critical">Kritické</option>
          </select>

          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            title="Řazení"
          >
            <option value="scoreDesc">Podle skóre ↓</option>
            <option value="scoreAsc">Podle skóre ↑</option>
            <option value="nameAsc">Název A–Z</option>
            <option value="nameDesc">Název Z–A</option>
          </select>

          <button
            onClick={() => safeExportDocxOrCsv(sorted)}
            className="rounded-lg border px-3 py-2 text-sm"
            title="Export rizik (DOCX/CSV)"
          >
            Export
          </button>

          <button
            onClick={() => setOpenAdd(true)}
            className="rounded-lg bg-black text-white px-3 py-2 text-sm"
          >
            + Přidat riziko
          </button>
        </div>
      </header>

      {/* 0. Specifika lokality a načasování */}
      <div className="bg-white rounded-xl shadow-sm border p-5 mt-4">
        <Typography variant="h6" className="font-bold text-gray-800 mb-2">Specifické podmínky projektu</Typography>
        <Typography variant="body2" className="text-gray-500 mb-5">
          Popište konkrétní místa a časy, které představují zvýšené riziko. Tyto poznámky se propisují do bezpečnostní dokumentace k projektu.
        </Typography>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-1">Specifika lokality (Místa)</Typography>
                <textarea
                    className="w-full border rounded-lg p-3 text-sm min-h-[100px] focus:ring focus:ring-blue-100 outline-none"
                    placeholder="Např.: Zadní vchod u parku, stísněný prostor před pódiem, úzký koridor u toalet..."
                    value={locText}
                    onChange={(e) => setLocText(e.target.value)}
                    onBlur={handleLocBlur}
                />
            </div>
            <div>
                <Typography variant="subtitle2" className="font-semibold text-gray-700 mb-1">Specifika načasování (Harmonogram)</Typography>
                <textarea
                    className="w-full border rounded-lg p-3 text-sm min-h-[100px] focus:ring focus:ring-blue-100 outline-none"
                    placeholder="Např.: Příjezd VIP ve 14:00, stmívání okolo 19:30, hromadný odchod účastníků ve 22:00..."
                    value={timeText}
                    onChange={(e) => setTimeText(e.target.value)}
                    onBlur={handleTimeBlur}
                />
            </div>
        </div>
      </div>

      {/* 1. Zvažovaná rizika - Seznam */}
      <div className="bg-white rounded-xl shadow-sm border p-5 mt-4">
        <Typography variant="h6" className="font-bold text-gray-800 mb-2">Zvažovaná rizika</Typography>
        <Typography variant="body2" className="text-gray-500 mb-4">
          Zaškrtnutím nebo odškrtnutím spravujete rizika aktivní v tomto projektu. Zrušením zaškrtnutí dojde k okamžitému odstranění rizika z analýzy projektu. Pro přidání nového rizika použijte tlačítko "+ Přidat riziko" vpravo nahoře.
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
              control={
                <Checkbox
                  checked={true}
                  onChange={() => onDeleteRisk && onDeleteRisk(r.id)}
                  color="primary"
                  size="small"
                />
              }
              label={<span className="font-medium text-gray-700 text-sm">{r.name || r.id}</span>}
            />
          ))}
          {sorted.length === 0 && (
            <div className="text-gray-400 text-sm italic">Žádná rizika zatím nebyla přidána.</div>
          )}
        </FormGroup>
      </div>

      {/* 2. Matice P × D ze sekce Object (Graf Analýzy Ohroženosti) */}
      {showMatrix && enriched && enriched.length > 0 && (
        <section className="bg-white rounded-xl shadow-sm border p-5 mt-4">
          <Typography variant="h6" className="font-bold text-gray-800 mb-1">Analýza ohroženosti</Typography>
          <Typography variant="body2" className="text-gray-500 mb-4">
            Vizuální interpretace rozdělení rizik dle pravděpodobnosti (P) a dopadu (D). Čím více vpravo nahoře, tím je riziko kritičtější.
          </Typography>
          <RiskMatrix threats={enriched} />
        </section>
      )}

      {/* 3. Bodovací Tabulka rizik (Accordion) */}
      <Accordion className="mt-4 shadow-sm border rounded-xl before:hidden" disableGutters>
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
                                   let chipColor = "default";
                                   let sx = { height: 18, fontSize: '0.65rem' };
                                   if (tag.includes("Základní")) { sx.backgroundColor = "transparent"; sx.border = "1px solid #bfdbfe"; sx.color = "#1e40af"; }
                                   else if (tag.includes("Prostředí")) { sx.backgroundColor = "transparent"; sx.border = "1px solid #bbf7d0"; sx.color = "#166534"; }
                                   else if (tag.includes("zranitelnosti") || tag.includes("Zranitelnosti")) { sx.backgroundColor = "transparent"; sx.border = "1px solid #fed7aa"; sx.color = "#9a3412"; }
                                   
                                   return <Chip key={idx} label={tag} size="small" sx={sx} />;
                              })}
                          </div>
                      )}
                    </td>
                    {/* P subfactors */}
                    <td className="px-1 py-2 text-center">
                      <select value={r.availability || 1} onChange={(e) => handleSubfactorChange(r, 'availability', e.target.value)} className="border-gray-200 text-gray-600 rounded px-1 py-1 w-12 text-center shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                        {[1, 2, 3, 4, 5, 6, 7].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-2 text-center">
                      <select value={r.occurrence || 1} onChange={(e) => handleSubfactorChange(r, 'occurrence', e.target.value)} className="border-gray-200 text-gray-600 rounded px-1 py-1 w-12 text-center shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                        {[1, 2, 3, 4, 5, 6, 7].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-2 text-center">
                      <select value={r.complexity || 1} onChange={(e) => handleSubfactorChange(r, 'complexity', e.target.value)} className="border-gray-200 text-gray-600 rounded px-1 py-1 w-12 text-center shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                        {[1, 2, 3, 4, 5, 6, 7].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 font-bold text-center border-l border-r border-blue-50 bg-blue-50/20 text-blue-900 tabular-nums">{r.probability}</td>

                    {/* D subfactors */}
                    <td className="px-1 py-2 text-center">
                      <select value={r.lifeAndHealth || 1} onChange={(e) => handleSubfactorChange(r, 'lifeAndHealth', e.target.value)} className="border-gray-200 text-gray-600 rounded px-1 py-1 w-12 text-center shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                        {[1, 2, 3, 4, 5, 6, 7].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-2 text-center">
                      {isOutdoor ? (
                        <span className="text-gray-400 font-medium cursor-not-allowed" title="Nevyplňuje se u venkovních akcí">—</span>
                      ) : (
                        <select value={r.facility || 1} onChange={(e) => handleSubfactorChange(r, 'facility', e.target.value)} className="border-gray-200 text-gray-600 rounded px-1 py-1 w-12 text-center shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                          {[1, 2, 3, 4, 5, 6, 7].map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-1 py-2 text-center">
                      <select value={r.financial || 1} onChange={(e) => handleSubfactorChange(r, 'financial', e.target.value)} className="border-gray-200 text-gray-600 rounded px-1 py-1 w-12 text-center shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                        {[1, 2, 3, 4, 5, 6, 7].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-2 text-center">
                      <select value={r.community || 1} onChange={(e) => handleSubfactorChange(r, 'community', e.target.value)} className="border-gray-200 text-gray-600 rounded px-1 py-1 w-12 text-center shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                        {[1, 2, 3, 4, 5, 6, 7].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2 font-bold text-center border-l border-r border-orange-50 bg-orange-50/20 text-orange-900 tabular-nums">{r.impact}</td>

                    {/* Score */}
                    <td className="px-3 py-2 font-black tabular-nums text-gray-900 text-center text-sm">{r.score}</td>

                    {/* Akce */}
                    <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => setEditingRisk(r)} className="text-indigo-600 hover:text-indigo-800 font-medium py-1 px-2 rounded hover:bg-indigo-50 transition-colors" title="Přejmenovat riziko">
                        Přejmenovat
                      </button>
                      <button onClick={() => onDeleteRisk && onDeleteRisk(r.id)} className="text-red-500 hover:text-red-700 font-medium py-1 px-2 rounded hover:bg-red-50 transition-colors" title="Odstranit z projektu">
                        Odstranit
                      </button>
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

      {/* Detailní hodnocení rizika (subfaktory) */}
      {scoringRisk && (
        <RiskScoringDialog
          open={!!scoringRisk}
          onClose={() => setScoringRisk(null)}
          risk={scoringRisk}
          onSave={(id, newScores) => {
            if (onUpdateRisk) {
              onUpdateRisk(id, { ...scoringRisk, ...newScores });
            }
          }}
        />
      )}
    </div>
  );
}

ProjectRisks.propTypes = {
  risks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string, // může generovat backend
      name: PropTypes.string,
      probability: PropTypes.number.isRequired,
      impact: PropTypes.number.isRequired,
    })
  ),
  scale: PropTypes.shape({
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
  }),
  bands: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      min: PropTypes.number.isRequired,
      max: PropTypes.number.isRequired,
    })
  ),
  showMatrix: PropTypes.bool,
  onCreateRisk: PropTypes.func,
  onUpdateRisk: PropTypes.func,
  onDeleteRisk: PropTypes.func,
};

/* ========================================================================== */
/*                              UI Pomocné prvky                              */
/* ========================================================================== */

function AddRiskDialog({ draft, onClose, onChange, onSubmit, title = "Přidat riziko" }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">{title}</h4>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm border"
            onClick={onClose}
          >
            Zavřít
          </button>
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
          <button
            type="button"
            className="rounded-lg border px-3 py-2 text-sm"
            onClick={onClose}
          >
            Zrušit
          </button>
          <button
            type="submit"
            className="rounded-lg bg-black text-white px-3 py-2 text-sm"
          >
            Vytvořit (a následně Hodnotit)
          </button>
        </div>
      </form>
    </div>
  );
}

AddRiskDialog.propTypes = {
  draft: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
