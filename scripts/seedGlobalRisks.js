#!/usr/bin/env node
/**
 * Seed skript pro nahrání výchozích globálních rizik a zranitelností do Firestore.
 *
 * Použití:
 *   node scripts/seedGlobalRisks.js
 *
 * Přepíše dokumenty:
 *   - settings/globalProjectRisks
 *   - settings/globalVulnerabilities
 */

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// Inicializace Firebase Admin
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
let app;
try {
    const serviceAccount = require(serviceAccountPath);
    app = initializeApp({ credential: cert(serviceAccount) });
} catch {
    // Fallback: pokud běží v prostředí s GOOGLE_APPLICATION_CREDENTIALS
    app = initializeApp();
}

const db = getFirestore(app);

// ── Rizika (kopie defaultProjectRisksValues s ID) ──────────────────────
const risks = [
    { id: "risk-001", name: "Nepřátelské narušení akce / demonstrace / blokáda", availability: 6, occurrence: 4, complexity: 6, lifeAndHealth: 2, facility: 2, financial: 3, community: 4, environments: ["venkovní","vnitřní","kombinovaná"], eventTypes: ["shromáždění","etapovy_cyklisticky_zavod","konference_prednaska","hudebni_akce","sportovni_akce","ostatni_akce"] },
    { id: "risk-002", name: "Anonymní výhružka (hrozba závažným násilím / výbuchem)", availability: 7, occurrence: 5, complexity: 7, lifeAndHealth: 1, facility: 3, financial: 4, community: 4, environments: ["venkovní","vnitřní","kombinovaná"], eventTypes: ["shromáždění","etapovy_cyklisticky_zavod","detsky_den_firmy","konference_prednaska","hudebni_akce","sportovni_akce","ostatni_akce"] },
    { id: "risk-003", name: "Verbální konflikt", availability: 7, occurrence: 6, complexity: 7, lifeAndHealth: 1, facility: 3, financial: 2, community: 3, environments: ["venkovní","vnitřní","kombinovaná"], eventTypes: ["shromáždění","etapovy_cyklisticky_zavod","detsky_den_firmy","konference_prednaska","hudebni_akce","sportovni_akce","ostatni_akce"] },
    { id: "risk-004", name: "Rvačka / výtržnosti / obtěžování", availability: 7, occurrence: 6, complexity: 7, lifeAndHealth: 1, facility: 3, financial: 2, community: 3, environments: ["venkovní","vnitřní","kombinovaná"], eventTypes: ["shromáždění","etapovy_cyklisticky_zavod","konference_prednaska","hudebni_akce","sportovni_akce","ostatni_akce"] },
    { id: "risk-005", name: "Útok chladnou zbraní", availability: 4, occurrence: 2, complexity: 6, lifeAndHealth: 7, facility: 2, financial: 4, community: 7, environments: ["venkovní","vnitřní","kombinovaná"], eventTypes: ["shromáždění","etapovy_cyklisticky_zavod","detsky_den_firmy","konference_prednaska","hudebni_akce","sportovni_akce","ostatni_akce"] },
    { id: "risk-006", name: "Střelba", availability: 2, occurrence: 2, complexity: 3, lifeAndHealth: 7, facility: 2, financial: 4, community: 7, environments: ["venkovní","vnitřní","kombinovaná"], eventTypes: ["shromáždění","etapovy_cyklisticky_zavod","detsky_den_firmy","konference_prednaska","hudebni_akce","sportovni_akce","ostatni_akce"] },
    { id: "risk-007", name: "Žhářství", availability: 5, occurrence: 3, complexity: 6, lifeAndHealth: 4, facility: 6, financial: 5, community: 5, environments: ["venkovní","vnitřní","kombinovaná"], eventTypes: ["shromáždění","detsky_den_firmy","konference_prednaska","hudebni_akce","sportovni_akce","ostatni_akce"] },
    { id: "risk-008", name: "Uložení výbušniny", availability: 2, occurrence: 1, complexity: 2, lifeAndHealth: 7, facility: 6, financial: 6, community: 7, environments: ["venkovní","vnitřní","kombinovaná"], eventTypes: ["shromáždění","etapovy_cyklisticky_zavod","detsky_den_firmy","konference_prednaska","hudebni_akce","sportovni_akce","ostatni_akce"] },
    { id: "risk-009", name: "Výbuch", availability: 2, occurrence: 1, complexity: 2, lifeAndHealth: 7, facility: 6, financial: 6, community: 7, environments: ["venkovní","vnitřní","kombinovaná"], eventTypes: ["shromáždění","etapovy_cyklisticky_zavod","detsky_den_firmy","konference_prednaska","hudebni_akce","sportovni_akce","ostatni_akce"] },
    { id: "risk-010", name: "Závažný vandalismus", availability: 7, occurrence: 6, complexity: 7, lifeAndHealth: 1, facility: 3, financial: 2, community: 3, environments: ["venkovní","vnitřní","kombinovaná"], eventTypes: ["shromáždění","etapovy_cyklisticky_zavod","konference_prednaska","hudebni_akce","sportovni_akce","ostatni_akce"] },
];

// ── Zranitelnosti ──────────────────────────────────────────────────────
const vulnerabilities = [
    { id: `vuln-${uuidv4()}`, name: "Vodní akce / Blízká vodní plocha", targets: [{ id: `tgt-${uuidv4()}`, riskName: "Utonutí / pád do vody", modifiers: { availability: 0, occurrence: 3, complexity: 0, lifeAndHealth: 3, facility: 0, financial: 0, community: 0 } }] },
    { id: `vuln-${uuidv4()}`, name: "Propanbutanové láhve", targets: [
        { id: `tgt-${uuidv4()}`, riskName: "Výbuch", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 1, facility: 2, financial: 0, community: 0 } },
        { id: `tgt-${uuidv4()}`, riskName: "Požár (stánky, dekorace, technické zázemí)", modifiers: { availability: 1, occurrence: 0, complexity: 0, lifeAndHealth: 1, facility: 2, financial: 0, community: 0 } }
    ]},
    { id: `vuln-${uuidv4()}`, name: "Pyrotechnika / práce s ohněm", targets: [
        { id: `tgt-${uuidv4()}`, riskName: "Nelegální použití pyrotechniky", modifiers: { availability: 0, occurrence: 2, complexity: 0, lifeAndHealth: 1, facility: 0, financial: 0, community: 0 } },
        { id: `tgt-${uuidv4()}`, riskName: "Žhářství", modifiers: { availability: 1, occurrence: 0, complexity: 0, lifeAndHealth: 0, facility: 1, financial: 0, community: 0 } }
    ]},
    { id: `vuln-${uuidv4()}`, name: "Kontroverzní tématika či symbolika", targets: [
        { id: `tgt-${uuidv4()}`, riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 1, occurrence: 2, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 2 } },
        { id: `tgt-${uuidv4()}`, riskName: "Verbální konflikt", modifiers: { availability: 0, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 1 } }
    ]},
    { id: `vuln-${uuidv4()}`, name: "Akce v nedostupných místech (odlehlé hory, lesy)", targets: [{ id: `tgt-${uuidv4()}`, riskName: "Omezená / obtížná dostupnost ZZS (terén, vzdálenost)", modifiers: { availability: 0, occurrence: 3, complexity: 0, lifeAndHealth: 2, facility: 0, financial: 0, community: 0 } }] },
    { id: `vuln-${uuidv4()}`, name: "Nelze využít evakuační rozhlas", targets: [
        { id: `tgt-${uuidv4()}`, riskName: "Davová panika a nekontrolovaný pohyb lidí", modifiers: { availability: 0, occurrence: 1, complexity: 0, lifeAndHealth: 2, facility: 0, financial: 0, community: 0 } },
        { id: `tgt-${uuidv4()}`, riskName: "Selhání evakuace (zablokované únikové cesty)", modifiers: { availability: 0, occurrence: 2, complexity: 0, lifeAndHealth: 2, facility: 0, financial: 0, community: 0 } }
    ]},
    { id: `vuln-${uuidv4()}`, name: "Přímý přenos akce", targets: [
        { id: `tgt-${uuidv4()}`, riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 2, occurrence: 0, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 1, community: 3 } },
        { id: `tgt-${uuidv4()}`, riskName: "Výbuch", modifiers: { availability: 1, occurrence: 0, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 2 } },
        { id: `tgt-${uuidv4()}`, riskName: "Střelba", modifiers: { availability: 1, occurrence: 0, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 2 } }
    ]},
];

async function seed() {
    console.log("Seedování globálních rizik a zranitelností...\n");

    // Uložit rizika
    await db.doc("settings/globalProjectRisks").set({
        risks,
        updatedAt: new Date().toISOString(),
        seededAt: new Date().toISOString()
    });
    console.log(`  Uloženo ${risks.length} rizik do settings/globalProjectRisks`);
    console.log("  (Pro kompletní seznam 44 rizik použijte admin rozhraní nebo importujte defaultProjectRisks.js)\n");

    // Uložit zranitelnosti
    await db.doc("settings/globalVulnerabilities").set({
        vulnerabilities,
        updatedAt: new Date().toISOString(),
        seededAt: new Date().toISOString()
    });
    console.log(`  Uloženo ${vulnerabilities.length} zranitelností do settings/globalVulnerabilities\n`);

    console.log("Seed dokončen.");
    process.exit(0);
}

seed().catch(err => {
    console.error("Chyba při seedování:", err);
    process.exit(1);
});
