// src/lib/risks/index.js
/**
 * Jádro výpočtu rizika (P x D), validace a mapování na pásma.
 * Vše bez UI, čisté funkce -> snadné testování a jednotná logika napříč appkou.
 */

// ── Původní 1-5 stupnice (zpětná kompatibilita) ──────────────────────────
export const DEFAULT_SCALE = { min: 1, max: 5 }; // integer 1..5
export const DEFAULT_BANDS = [
  { id: "low",    label: "Nízké",    min: 1,  max: 6,  color: "#22c55e" },
  { id: "medium", label: "Střední",  min: 7,  max: 12, color: "#eab308" },
  { id: "high",   label: "Vysoké",   min: 13, max: 20, color: "#f97316" },
  { id: "critical", label: "Kritické", min: 21, max: 25, color: "#ef4444" }
];

// ── Nová subfaktorová stupnice 1-7 ──────────────────────────────────────
export const SUBFACTOR_SCALE = { min: 1, max: 7 };

// Pásma pro součin sum subfaktorů: P_sum(3-21) × D_sum(4-28) → rozsah 12-588
export const SUBFACTOR_BANDS = [
  { id: "low",      label: "Nízké",    min: 12,  max: 100, color: "#22c55e" },
  { id: "medium",   label: "Střední",  min: 101, max: 220, color: "#eab308" },
  { id: "high",     label: "Vysoké",   min: 221, max: 400, color: "#f97316" },
  { id: "critical", label: "Kritické", min: 401, max: 588, color: "#ef4444" }
];

export const PROBABILITY_KEYS = ["availability", "occurrence", "complexity"];
export const IMPACT_KEYS = ["lifeAndHealth", "facility", "financial", "community"];

// ── Utility funkce ──────────────────────────────────────────────────────

export function clampToScale(value, scale = DEFAULT_SCALE) {
  const v = Number(value);
  return Math.min(scale.max, Math.max(scale.min, Math.round(v)));
}

export function validateScale(scale = DEFAULT_SCALE) {
  if (!scale || typeof scale.min !== "number" || typeof scale.max !== "number") {
    throw new Error("Invalid scale object. Expected { min:number, max:number }.");
  }
  if (scale.min >= scale.max) {
    throw new Error("Scale.min must be < scale.max.");
  }
  return true;
}

/**
 * Vypočítá skóre rizika (jednoduchý P × D).
 */
export function scoreRisk({ prob, impact, scale = DEFAULT_SCALE }) {
  validateScale(scale);
  const p = clampToScale(prob, scale);
  const d = clampToScale(impact, scale);
  return { score: p * d, prob: p, impact: d };
}

/**
 * Určí pásmo rizika podle skóre a tabulky pásem.
 */
export function toBand(score, bands = DEFAULT_BANDS) {
  for (const b of bands) {
    if (score >= b.min && score <= b.max) return b;
  }
  return null;
}

/**
 * Vytvoří P×D matici (jednoduchá 5×5).
 */
export function makeMatrix(scale = DEFAULT_SCALE, bands = DEFAULT_BANDS) {
  validateScale(scale);
  const rows = [];
  for (let impact = scale.max; impact >= scale.min; impact--) {
    const row = [];
    for (let prob = scale.min; prob <= scale.max; prob++) {
      const { score } = scoreRisk({ prob, impact, scale });
      const band = toBand(score, bands);
      row.push({ prob, impact, score, bandId: band?.id || null });
    }
    rows.push(row);
  }
  return rows;
}

// ── Subfaktorový systém ──────────────────────────────────────────────────

/**
 * Aplikuje modifikátory zranitelností na riziko.
 * @param {Object} risk - Riziko se subfaktory (availability, occurrence, ...)
 * @param {string[]} activeVulnIds - ID aktivních zranitelností projektu
 * @param {Object[]} vulnerabilities - Pole zranitelností s targets
 * @returns {Object} Riziko s upravenými subfaktory
 */
export function applyModifiers(risk, activeVulnIds = [], vulnerabilities = []) {
  if (!activeVulnIds.length || !vulnerabilities.length) return { ...risk };

  const modified = { ...risk };

  for (const vuln of vulnerabilities) {
    if (!activeVulnIds.includes(vuln.id)) continue;
    if (!vuln.targets) continue;

    for (const target of vuln.targets) {
      // Match by riskName or by riskId
      const matches = target.riskId
        ? target.riskId === risk.id
        : target.riskName === risk.name;
      if (!matches) continue;

      const mods = target.modifiers || {};
      for (const key of [...PROBABILITY_KEYS, ...IMPACT_KEYS]) {
        if (mods[key]) {
          modified[key] = clampToScale(
            (modified[key] || 1) + mods[key],
            SUBFACTOR_SCALE
          );
        }
      }
    }
  }

  return modified;
}

/**
 * Vypočítá finální skóre rizika ze subfaktorů.
 * P_sum = availability + occurrence + complexity
 * D_sum = lifeAndHealth + facility + financial + community
 * Score = P_sum × D_sum
 *
 * @param {Object} risk - Riziko se subfaktory
 * @param {Object} options
 * @param {string[]} options.activeVulnIds - Aktivní zranitelnosti
 * @param {Object[]} options.vulnerabilities - Zranitelnosti s targets
 * @param {boolean} options.hideFacility - Pro venkovní akce bez budov (vynechá facility)
 * @returns {{ pSum, dSum, score, band, modified }}
 */
export function computeFinalScore(risk, { activeVulnIds = [], vulnerabilities = [], hideFacility = false } = {}) {
  const modified = applyModifiers(risk, activeVulnIds, vulnerabilities);

  const pSum = PROBABILITY_KEYS.reduce((sum, k) => sum + (modified[k] || 1), 0);

  const dKeys = hideFacility ? IMPACT_KEYS.filter(k => k !== "facility") : IMPACT_KEYS;
  const dSum = dKeys.reduce((sum, k) => sum + (modified[k] || 1), 0);

  const score = pSum * dSum;
  const band = toBand(score, SUBFACTOR_BANDS);

  return { pSum, dSum, score, band, modified };
}

/**
 * Vrací pole rizik relevantních pro daný typ akce a prostředí,
 * s aplikovanými modifikátory a finálním skóre.
 */
export function computeProjectRisks(allRisks, { eventType, environmentType, activeVulnIds = [], vulnerabilities = [], hideFacility = false } = {}) {
  return allRisks
    .filter(risk => {
      if (eventType && risk.eventTypes && !risk.eventTypes.includes(eventType)) return false;
      if (environmentType && risk.environments && !risk.environments.includes(environmentType)) return false;
      return true;
    })
    .map(risk => {
      const result = computeFinalScore(risk, { activeVulnIds, vulnerabilities, hideFacility });
      return { ...risk, ...result };
    })
    .sort((a, b) => b.score - a.score);
}
