// src/lib/risk/index.js
/**
 * Jádro výpočtu rizika (P x D), validace a mapování na pásma.
 * Vše bez UI, čisté funkce -> snadné testování a jednotná logika napříč appkou.
 */

export const DEFAULT_SCALE = { min: 1, max: 5 }; // integer 1..5
export const DEFAULT_BANDS = [
  { id: "low",    label: "Nízké",    min: 1,  max: 6 },   // 1–6
  { id: "medium", label: "Střední",  min: 7,  max: 12 },  // 7–12
  { id: "high",   label: "Vysoké",   min: 13, max: 20 },  // 13–20
  { id: "critical", label: "Kritické", min: 21, max: 25 } // 21–25
];

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
 * Vypočítá skóre rizika.
 * @param {{prob:number, impact:number, scale?:{min:number,max:number}}} p
 * @returns {{score:number, prob:number, impact:number}}
 */
export function scoreRisk({ prob, impact, scale = DEFAULT_SCALE }) {
  validateScale(scale);
  const p = clampToScale(prob, scale);
  const d = clampToScale(impact, scale);
  return { score: p * d, prob: p, impact: d };
}

/**
 * Určí pásmo rizika podle skóre a tabulky pásem.
 * @param {number} score
 * @param {Array<{id:string,label:string,min:number,max:number}>} bands
 * @returns {{id:string,label:string,min:number,max:number}|null}
 */
export function toBand(score, bands = DEFAULT_BANDS) {
  for (const b of bands) {
    if (score >= b.min && score <= b.max) return b;
  }
  return null;
}

/**
 * Vytvoří P×D matici (např. pro vizualizaci).
 * rows: dopad (impact), cols: pravděpodobnost (prob)
 * cell: {prob, impact, score, bandId}
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
