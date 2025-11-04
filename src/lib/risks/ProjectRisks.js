// src/components/project/ProjectRisks.js
import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  scoreRisk,
  toBand,
  makeMatrix,
  DEFAULT_SCALE,
  DEFAULT_BANDS,
} from "../risks";

// Volitelně: pokud máš utilitu na DOCX, odkomentuj/import přizpůsob.
// (Soubor u tebe je v src/components/ExportUtils.js)
// eslint-disable-next-line
// import { exportRisksToDocx } from "../ExportUtils";

/* ========================================================================== */
/*                             Pomocné util funkce                            */
/* ========================================================================== */

// Lokální export do CSV (fallback, funguje bez dalších závislostí)
function exportRisksToCSV(filename, rows) {
  if (!rows?.length) return;
  const header = [
    "id",
    "name",
    "description",
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
        r.description,
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
  scale = DEFAULT_SCALE,
  bands = DEFAULT_BANDS,
  showMatrix = true,
  onCreateRisk, // (optional) callback({name, description, probability, impact})
}) {
  // Ovládání UI
  const [q, setQ] = useState("");
  const [bandFilter, setBandFilter] = useState("all");
  const [sortKey, setSortKey] = useState("scoreDesc");
  const [openAdd, setOpenAdd] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    probability: 3,
    impact: 3,
  });

  // Přepočet rizik pomocí jednotného jádra
  const enriched = useMemo(() => {
    return (risks || []).map((r) => {
      const { score, prob, impact } = scoreRisk({
        prob: r.probability,
        impact: r.impact,
        scale,
      });
      const band = toBand(score, bands);
      return {
        ...r,
        probability: prob,
        impact,
        score,
        bandId: band?.id || null,
        bandLabel: band?.label || null,
      };
    });
  }, [risks, scale, bands]);

  // Vyhledávání + filtrování podle pásma
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return enriched.filter((r) => {
      const passText =
        !qq ||
        (r.name || "").toLowerCase().includes(qq) ||
        (r.description || "").toLowerCase().includes(qq);
      const passBand =
        bandFilter === "all" ? true : (r.bandId || "") === bandFilter;
      return passText && passBand;
    });
  }, [enriched, q, bandFilter]);

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

  // Matice P×D (vizuální přehled)
  const matrix = useMemo(() => {
    return showMatrix ? makeMatrix(scale, bands) : null;
  }, [showMatrix, scale, bands]);

  // Odeslání nového rizika (deleguje se na parent, jinak jen zavře dialog)
  async function handleCreateRisk(e) {
    e?.preventDefault?.();
    if (onCreateRisk) {
      await onCreateRisk({
        name: draft.name?.trim(),
        description: draft.description?.trim(),
        probability: Number(draft.probability),
        impact: Number(draft.impact),
      });
    }
    setOpenAdd(false);
    setDraft({ name: "", description: "", probability: 3, impact: 3 });
  }

  return (
    <div className="p-4 space-y-8">
      {/* Hlavička */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Rizika projektu</h2>
          <p className="text-sm opacity-70">
            Škála {scale.min}–{scale.max}
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

      {/* Tabulka rizik */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Riziko</th>
              <th className="px-4 py-3 font-medium">Popis</th>
              <th className="px-4 py-3 font-medium">P</th>
              <th className="px-4 py-3 font-medium">D</th>
              <th className="px-4 py-3 font-medium">Skóre</th>
              <th className="px-4 py-3 font-medium">Pásmo</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 font-medium">{r.name || r.id}</td>
                <td className="px-4 py-3">
                  <span className="opacity-80">
                    {r.description || "—"}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">{r.probability}</td>
                <td className="px-4 py-3 tabular-nums">{r.impact}</td>
                <td className="px-4 py-3 font-semibold tabular-nums">{r.score}</td>
                <td className="px-4 py-3">
                  <BandBadge bandId={r.bandId} bandLabel={r.bandLabel} />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center opacity-70">
                  Nic nenalezeno. Uprav filtr nebo přidej nové riziko.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Volitelně: Matice P × D */}
      {showMatrix && matrix && (
        <section>
          <h3 className="text-lg font-medium mb-3">Matice rizik (P × D)</h3>
          <RiskMatrixGrid matrix={matrix} />
        </section>
      )}

      {/* Dialog pro přidání rizika */}
      {openAdd && (
        <AddRiskDialog
          draft={draft}
          scale={scale}
          onClose={() => setOpenAdd(false)}
          onChange={setDraft}
          onSubmit={handleCreateRisk}
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
      description: PropTypes.string,
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
};

/* ========================================================================== */
/*                              UI Pomocné prvky                              */
/* ========================================================================== */

function BandBadge({ bandId, bandLabel }) {
  const base =
    "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium";
  const palette =
    bandId === "critical"
      ? "bg-red-100 text-red-700"
      : bandId === "high"
      ? "bg-orange-100 text-orange-700"
      : bandId === "medium"
      ? "bg-yellow-100 text-yellow-800"
      : bandId === "low"
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-700";

  return <span className={`${base} ${palette}`}>{bandLabel || "—"}</span>;
}

BandBadge.propTypes = {
  bandId: PropTypes.string,
  bandLabel: PropTypes.string,
};

function RiskMatrixGrid({ matrix }) {
  // matrix: 2D pole buněk { prob, impact, score, bandId }
  return (
    <div className="inline-block border rounded-lg overflow-hidden">
      <table className="border-collapse">
        <tbody>
          {matrix.map((row, rIdx) => (
            <tr key={`r-${rIdx}`}>
              {row.map((cell, cIdx) => (
                <td
                  key={`c-${cIdx}`}
                  className={`w-12 h-12 text-center align-middle border
                    ${cell.bandId === "critical" ? "bg-red-200" :
                      cell.bandId === "high" ? "bg-orange-200" :
                      cell.bandId === "medium" ? "bg-yellow-200" :
                      cell.bandId === "low" ? "bg-green-200" : "bg-gray-100"}`}
                  title={`P:${cell.prob} D:${cell.impact} = ${cell.score}`}
                >
                  <span className="text-xs font-semibold">{cell.score}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

RiskMatrixGrid.propTypes = {
  matrix: PropTypes.arrayOf(PropTypes.array).isRequired,
};

function AddRiskDialog({ draft, scale, onClose, onChange, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Přidat riziko</h4>
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
              value={draft.name}
              onChange={(e) => onChange({ ...draft, name: e.target.value })}
              placeholder="Např. Požár ve stánkové zóně"
              required
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span>Popis</span>
            <textarea
              className="rounded-lg border px-3 py-2"
              value={draft.description}
              onChange={(e) =>
                onChange({ ...draft, description: e.target.value })
              }
              placeholder="Stručný popis situace, kontext, předpoklady…"
              rows={3}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span>Pravděpodobnost (P)</span>
              <input
                type="number"
                min={scale.min}
                max={scale.max}
                className="rounded-lg border px-3 py-2"
                value={draft.probability}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    probability: Number(e.target.value),
                  })
                }
                required
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span>Dopad (D)</span>
              <input
                type="number"
                min={scale.min}
                max={scale.max}
                className="rounded-lg border px-3 py-2"
                value={draft.impact}
                onChange={(e) =>
                  onChange({
                    ...draft,
                    impact: Number(e.target.value),
                  })
                }
                required
              />
            </label>
          </div>
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
            Uložit
          </button>
        </div>
      </form>
    </div>
  );
}

AddRiskDialog.propTypes = {
  draft: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    probability: PropTypes.number,
    impact: PropTypes.number,
  }).isRequired,
  scale: PropTypes.shape({
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
