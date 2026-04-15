// src/config/locationTimingData.js
// Konfigurace lokalizací a načasování pro různé typy akcí.
// Každá lokalizace/načasování má targets: pole rizik s modifikátory subfaktorů.
// notApplicable: true = riziko pro tuto kombinaci není relevantní (N/A).
// Modifikátory mají stejný formát jako zranitelnosti: {availability, occurrence, complexity, lifeAndHealth, facility, financial, community}

/**
 * Lokalizace a načasování pro typ akce: Etapový cyklistický závod
 */
export const cyclingRaceLocationTiming = {
    locations: [
        {
            id: "loc-podium",
            name: "U pódia",
            targets: [
                { riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 2, community: 2 } },
                { riskName: "Anonymní výhružka (hrozba závažným násilím / výbuchem)", notApplicable: true },
                { riskName: "Verbální konflikt", modifiers: { availability: 2, community: 2 } },
                { riskName: "Rvačka / výtržnosti / obtěžování", modifiers: { availability: 2, community: 2 } },
                { riskName: "Útok chladnou zbraní", modifiers: { availability: 2, community: 2 } },
                { riskName: "Střelba", modifiers: { availability: 2, community: 2 } },
                { riskName: "Uložení výbušniny", modifiers: { availability: 2, complexity: -1, community: 2, facility: 1 } },
                { riskName: "Výbuch", modifiers: { availability: 2, complexity: -1, community: 2, facility: 1 } },
                { riskName: "Závažný vandalismus", modifiers: { availability: 2, community: 2 } },
                { riskName: "Sabotáž techniky", modifiers: { availability: 1 } },
                { riskName: "Nelegální použití pyrotechniky", notApplicable: true },
                { riskName: "Najetí vozidlem do davu", notApplicable: true },
                { riskName: "Srážka / hromadný pád závodníků", notApplicable: true },
                { riskName: "Vběhnutí diváka nebo zvířete na trať", notApplicable: true },
                { riskName: "Sabotáž trati (hřebíky, olej, překážky, natažený drát)", notApplicable: true },
                { riskName: "Ztráta dítěte", notApplicable: true },
                { riskName: "Omezená / obtížná dostupnost ZZS (terén, vzdálenost)", notApplicable: true },
                { riskName: "Požární poplach (skutečný i falešný)", notApplicable: true },
            ]
        },
        {
            id: "loc-fanzone",
            name: "Fan zóna",
            targets: [
                { riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 1, community: 1 } },
                { riskName: "Anonymní výhružka (hrozba závažným násilím / výbuchem)", notApplicable: true },
                { riskName: "Verbální konflikt", modifiers: { availability: 1, community: 1 } },
                { riskName: "Rvačka / výtržnosti / obtěžování", modifiers: { availability: 1, community: 1 } },
                { riskName: "Útok chladnou zbraní", modifiers: { availability: 1, community: 1 } },
                { riskName: "Střelba", modifiers: { availability: 1, community: 1 } },
                { riskName: "Uložení výbušniny", modifiers: { availability: 1, community: 1 } },
                { riskName: "Výbuch", modifiers: { availability: 1, community: 1 } },
                { riskName: "Závažný vandalismus", modifiers: { availability: 1, community: 1 } },
                { riskName: "Davová panika a nekontrolovaný pohyb lidí", modifiers: { availability: 1 } },
                { riskName: "Větší počet zraněných osob (různými vlivy)", modifiers: { availability: 1 } },
                { riskName: "Srážka / hromadný pád závodníků", notApplicable: true },
                { riskName: "Vběhnutí diváka nebo zvířete na trať", notApplicable: true },
                { riskName: "Sabotáž trati (hřebíky, olej, překážky, natažený drát)", notApplicable: true },
                { riskName: "Vhazování předmětů na trať", notApplicable: true },
                { riskName: "Invaze diváků na trať", notApplicable: true },
                { riskName: "Omezená / obtížná dostupnost ZZS (terén, vzdálenost)", notApplicable: true },
                { riskName: "Úpal, úžeh / Podchlazení", modifiers: { lifeAndHealth: 1 } },
                { riskName: "Zdravotní problémy", modifiers: { availability: 1 } },
                { riskName: "Požární poplach (skutečný i falešný)", notApplicable: true },
            ]
        },
        {
            id: "loc-finish",
            name: "Cílová rovinka",
            targets: [
                { riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 2, community: 2 } },
                { riskName: "Anonymní výhružka (hrozba závažným násilím / výbuchem)", notApplicable: true },
                { riskName: "Verbální konflikt", modifiers: { availability: 1, community: 1 } },
                { riskName: "Rvačka / výtržnosti / obtěžování", modifiers: { availability: 1, community: 1 } },
                { riskName: "Útok chladnou zbraní", modifiers: { availability: 1, community: 1 } },
                { riskName: "Střelba", modifiers: { availability: 1, community: 1 } },
                { riskName: "Uložení výbušniny", modifiers: { availability: 2, complexity: -1, community: 2 } },
                { riskName: "Výbuch", modifiers: { availability: 2, complexity: -1, community: 2 } },
                { riskName: "Závažný vandalismus", modifiers: { availability: 1, community: 1 } },
                { riskName: "Nelegální použití pyrotechniky", modifiers: { availability: 1 } },
                { riskName: "Ztráta dítěte", notApplicable: true },
                { riskName: "Omezená / obtížná dostupnost ZZS (terén, vzdálenost)", notApplicable: true },
                { riskName: "Požární poplach (skutečný i falešný)", notApplicable: true },
            ]
        },
        {
            id: "loc-route",
            name: "Po trase závodu",
            targets: [
                { riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 2, complexity: 1, community: 1 } },
                { riskName: "Anonymní výhružka (hrozba závažným násilím / výbuchem)", notApplicable: true },
                { riskName: "Verbální konflikt", modifiers: { availability: -1, community: -1 } },
                { riskName: "Rvačka / výtržnosti / obtěžování", modifiers: { availability: -1, community: -1 } },
                { riskName: "Útok chladnou zbraní", modifiers: { availability: -1, community: -1 } },
                { riskName: "Střelba", modifiers: { availability: -1, community: -1 } },
                { riskName: "Uložení výbušniny", modifiers: { availability: -2, community: -1 } },
                { riskName: "Výbuch", modifiers: { availability: -2, community: -1 } },
                { riskName: "Závažný vandalismus", modifiers: { availability: -1, community: -1 } },
                { riskName: "Ztráta dítěte", notApplicable: true },
                { riskName: "Požární poplach (skutečný i falešný)", notApplicable: true },
            ]
        },
        {
            id: "loc-hotel",
            name: "V hotelu",
            targets: [
                { riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 1, complexity: -1, community: 1 } },
                { riskName: "Verbální konflikt", modifiers: { availability: -1, community: -1 } },
                { riskName: "Rvačka / výtržnosti / obtěžování", modifiers: { availability: -1, community: -1 } },
                { riskName: "Útok chladnou zbraní", modifiers: { availability: -1, community: -1 } },
                { riskName: "Střelba", modifiers: { availability: -1, community: -1 } },
                { riskName: "Uložení výbušniny", modifiers: { availability: -1, community: -1 } },
                { riskName: "Výbuch", modifiers: { availability: -1, community: -1 } },
                { riskName: "Závažný vandalismus", modifiers: { availability: -1, community: -1 } },
                { riskName: "Nelegální použití pyrotechniky", notApplicable: true },
                { riskName: "Najetí vozidlem do davu", notApplicable: true },
                { riskName: "Extrémní vítr / bouřka", notApplicable: true },
                { riskName: "Přívalové srážky / lokální záplava", notApplicable: true },
                { riskName: "Úder blesku", notApplicable: true },
                { riskName: "Extrémní teplota", notApplicable: true },
                { riskName: "Větší počet zraněných osob (různými vlivy)", modifiers: { availability: 1 } },
                { riskName: "Srážka / hromadný pád závodníků", notApplicable: true },
                { riskName: "Vběhnutí diváka nebo zvířete na trať", notApplicable: true },
                { riskName: "Sabotáž trati (hřebíky, olej, překážky, natažený drát)", notApplicable: true },
                { riskName: "Ztráta dítěte", notApplicable: true },
                { riskName: "Pád / zřícení pódia, stage, stanu nebo jiné konstrukce", notApplicable: true },
                { riskName: "Elektrotechnická závada (zkrat, požár kabeláže)", notApplicable: true },
                { riskName: "Vhazování předmětů na trať", notApplicable: true },
                { riskName: "Invaze diváků na trať", notApplicable: true },
                { riskName: "Kolaps bariér / zábran mezi sektory", notApplicable: true },
                { riskName: "Padající stromy / velké větve při větru", notApplicable: true },
                { riskName: "Omezená / obtížná dostupnost ZZS (terén, vzdálenost)", notApplicable: true },
                { riskName: "Úpal, úžeh / Podchlazení", notApplicable: true },
            ]
        },
        {
            id: "loc-service",
            name: "Servisní zázemí týmů",
            targets: [
                { riskName: "Verbální konflikt", modifiers: { availability: -1, community: -1 } },
                { riskName: "Rvačka / výtržnosti / obtěžování", modifiers: { availability: -1, community: -1 } },
                { riskName: "Útok chladnou zbraní", modifiers: { availability: -1, community: -1 } },
                { riskName: "Střelba", modifiers: { availability: -1, community: -1 } },
                { riskName: "Uložení výbušniny", modifiers: { availability: -2, complexity: -1, community: -1 } },
                { riskName: "Výbuch", modifiers: { availability: -2, complexity: -1, community: -1 } },
                { riskName: "Závažný vandalismus", modifiers: { availability: -1, community: -1 } },
                { riskName: "Sabotáž techniky", modifiers: { availability: 1 } },
                { riskName: "Nelegální použití pyrotechniky", notApplicable: true },
                { riskName: "Srážka / hromadný pád závodníků", notApplicable: true },
                { riskName: "Ztráta dítěte", notApplicable: true },
                { riskName: "Pád / zřícení pódia, stage, stanu nebo jiné konstrukce", notApplicable: true },
                { riskName: "Elektrotechnická závada (zkrat, požár kabeláže)", notApplicable: true },
                { riskName: "Kolaps bariér / zábran mezi sektory", notApplicable: true },
                { riskName: "Omezená / obtížná dostupnost ZZS (terén, vzdálenost)", notApplicable: true },
                { riskName: "Úpal, úžeh / Podchlazení", notApplicable: true },
                { riskName: "Požární poplach (skutečný i falešný)", notApplicable: true },
            ]
        },
    ],
    timings: [
        {
            id: "time-during",
            name: "Během závodu",
            targets: [
                { riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 1 } },
            ]
        },
        {
            id: "time-startfinish",
            name: "Start/cíl",
            targets: [
                { riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 1, community: 1 } },
                { riskName: "Anonymní výhružka (hrozba závažným násilím / výbuchem)", notApplicable: true },
                { riskName: "Verbální konflikt", modifiers: { community: 1 } },
                { riskName: "Rvačka / výtržnosti / obtěžování", modifiers: { community: 1 } },
                { riskName: "Útok chladnou zbraní", modifiers: { community: 1 } },
                { riskName: "Střelba", modifiers: { community: 1 } },
                { riskName: "Uložení výbušniny", modifiers: { community: 1, lifeAndHealth: 2 } },
                { riskName: "Výbuch", modifiers: { community: 1, lifeAndHealth: 2 } },
                { riskName: "Závažný vandalismus", modifiers: { community: 1 } },
                { riskName: "Nelegální použití pyrotechniky", modifiers: { availability: 2 } },
                { riskName: "Omezená / obtížná dostupnost ZZS (terén, vzdálenost)", notApplicable: true },
                { riskName: "Požární poplach (skutečný i falešný)", notApplicable: true },
            ]
        },
        {
            id: "time-ceremony",
            name: "Vyhlašování na pódiu",
            targets: [
                { riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 1, community: 1 } },
                { riskName: "Anonymní výhružka (hrozba závažným násilím / výbuchem)", notApplicable: true },
                { riskName: "Verbální konflikt", modifiers: { community: 1 } },
                { riskName: "Rvačka / výtržnosti / obtěžování", modifiers: { community: 1 } },
                { riskName: "Útok chladnou zbraní", modifiers: { community: 1 } },
                { riskName: "Střelba", modifiers: { community: 1 } },
                { riskName: "Uložení výbušniny", modifiers: { community: 1, lifeAndHealth: 2 } },
                { riskName: "Výbuch", modifiers: { community: 1, lifeAndHealth: 2 } },
                { riskName: "Závažný vandalismus", modifiers: { community: 1 } },
                { riskName: "Sabotáž techniky", modifiers: { availability: 1, community: 1 } },
                { riskName: "Nelegální použití pyrotechniky", modifiers: { availability: 1 } },
                { riskName: "Davová panika a nekontrolovaný pohyb lidí", modifiers: { availability: 1, lifeAndHealth: 2, community: 2 } },
                { riskName: "Srážka / hromadný pád závodníků", notApplicable: true },
                { riskName: "Vběhnutí diváka nebo zvířete na trať", notApplicable: true },
                { riskName: "Sabotáž trati (hřebíky, olej, překážky, natažený drát)", notApplicable: true },
                { riskName: "Vhazování předmětů na trať", notApplicable: true },
                { riskName: "Invaze diváků na trať", notApplicable: true },
                { riskName: "Rasistické / diskriminační projevy a incidenty", modifiers: { community: 1 } },
                { riskName: "Omezená / obtížná dostupnost ZZS (terén, vzdálenost)", notApplicable: true },
                { riskName: "Požární poplach (skutečný i falešný)", notApplicable: true },
            ]
        },
        {
            id: "time-night",
            name: "Noc",
            targets: [
                { riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: -1, community: -1 } },
                { riskName: "Anonymní výhružka (hrozba závažným násilím / výbuchem)", notApplicable: true },
                { riskName: "Verbální konflikt", modifiers: { availability: -1, community: -1 } },
                { riskName: "Rvačka / výtržnosti / obtěžování", modifiers: { availability: -1, community: -1 } },
                { riskName: "Útok chladnou zbraní", modifiers: { availability: -1, community: -1 } },
                { riskName: "Střelba", modifiers: { availability: -1, community: -1 } },
                { riskName: "Uložení výbušniny", modifiers: { availability: -1, community: -1 } },
                { riskName: "Výbuch", modifiers: { availability: -1, community: -1 } },
                { riskName: "Závažný vandalismus", modifiers: { availability: -1, community: -1 } },
                { riskName: "Nelegální použití pyrotechniky", notApplicable: true },
                { riskName: "Najetí vozidlem do davu", notApplicable: true },
                { riskName: "Extrémní vítr / bouřka", notApplicable: true },
                { riskName: "Přívalové srážky / lokální záplava", notApplicable: true },
                { riskName: "Úder blesku", notApplicable: true },
                { riskName: "Extrémní teplota", notApplicable: true },
                { riskName: "Dopravní kolaps dopravy v okolí akce", notApplicable: true },
                { riskName: "Srážka / hromadný pád závodníků", notApplicable: true },
                { riskName: "Vběhnutí diváka nebo zvířete na trať", notApplicable: true },
                { riskName: "Sabotáž trati (hřebíky, olej, překážky, natažený drát)", notApplicable: true },
                { riskName: "Ztráta dítěte", notApplicable: true },
                { riskName: "Vhazování předmětů na trať", notApplicable: true },
                { riskName: "Invaze diváků na trať", notApplicable: true },
                { riskName: "Kolaps bariér / zábran mezi sektory", notApplicable: true },
                { riskName: "Padající stromy / velké větve při větru", notApplicable: true },
                { riskName: "Omezená / obtížná dostupnost ZZS (terén, vzdálenost)", notApplicable: true },
                { riskName: "Úpal, úžeh / Podchlazení", notApplicable: true },
            ]
        },
    ]
};

/**
 * Mapa typů akcí na jejich konfiguraci lokalizací a načasování.
 * Pro přidání dalšího typu akce stačí vytvořit nový objekt se stejnou strukturou
 * a přidat ho do tohoto mapování.
 */
export const locationTimingByEventType = {
    etapovy_cyklisticky_zavod: cyclingRaceLocationTiming,
    // Další typy akcí budou přidány zde:
    // hudebni_akce: musicEventLocationTiming,
    // sportovni_akce: sportsEventLocationTiming,
};

/**
 * Vrátí konfiguraci lokalizací a načasování pro daný typ akce.
 * @param {string} eventType
 * @returns {{ locations: Array, timings: Array } | null}
 */
export function getLocationTimingConfig(eventType) {
    return locationTimingByEventType[eventType] || null;
}

/**
 * Převede aktivní lokalizace/načasování na formát kompatibilní s applyModifiers.
 * Každá aktivní lokalizace/načasování se chová jako "virtuální zranitelnost".
 * @param {string[]} activeIds - ID aktivních lokalizací a načasování
 * @param {Object} config - Konfigurace z getLocationTimingConfig
 * @param {Object[]} customItems - Vlastní lokalizace/načasování definované uživatelem
 * @returns {Object[]} Pole pseudo-zranitelností pro applyModifiers
 */
export function locationTimingToVulnerabilities(activeIds = [], config = null, customItems = []) {
    if (!activeIds.length) return [];
    const result = [];
    const allItems = [];

    if (config) {
        allItems.push(...(config.locations || []), ...(config.timings || []));
    }
    allItems.push(...customItems);

    for (const item of allItems) {
        if (!activeIds.includes(item.id)) continue;
        // Filtrovat pouze targets s modifiers (ne N/A)
        const validTargets = (item.targets || [])
            .filter(t => t.modifiers && !t.notApplicable)
            .map(t => ({
                riskName: t.riskName,
                modifiers: t.modifiers
            }));

        if (validTargets.length > 0) {
            result.push({
                id: item.id,
                name: item.name,
                targets: validTargets
            });
        }
    }
    return result;
}

/**
 * Spočítá celkový vliv lokalizace/načasování na všechna rizika.
 * Vrátí setříděné pole [{id, name, type, totalImpact}] od nejvyššího dopadu.
 * @param {string[]} activeIds
 * @param {Object} config
 * @param {Object[]} risks - Aktuální rizika projektu
 * @param {boolean} isOutdoor
 * @returns {Object[]}
 */
export function computeLocationTimingImpact(activeIds = [], config = null, risks = [], isOutdoor = false) {
    if (!config) return [];

    const allItems = [
        ...(config.locations || []).map(l => ({ ...l, type: 'location' })),
        ...(config.timings || []).map(t => ({ ...t, type: 'timing' })),
    ];

    return allItems
        .filter(item => activeIds.includes(item.id))
        .map(item => {
            let totalImpact = 0;
            const applicableRisks = [];

            for (const target of (item.targets || [])) {
                if (target.notApplicable) continue;
                if (!target.modifiers) continue;

                // Zkontroluj, zda riziko existuje v projektu
                const risk = risks.find(r => r.name === target.riskName);
                if (!risk) continue;

                const mods = target.modifiers;
                const pMod = (mods.availability || 0) + (mods.occurrence || 0) + (mods.complexity || 0);
                const dMod = (mods.lifeAndHealth || 0) + (isOutdoor ? 0 : (mods.facility || 0)) + (mods.financial || 0) + (mods.community || 0);

                // Odhad vlivu na skóre: přibližně pMod * avgD + dMod * avgP
                const pSum = (Number(risk.availability) || 1) + (Number(risk.occurrence) || 1) + (Number(risk.complexity) || 1);
                const dSum = (Number(risk.lifeAndHealth) || 1) + (isOutdoor ? 0 : (Number(risk.facility) || 1)) + (Number(risk.financial) || 1) + (Number(risk.community) || 1);
                const basScore = pSum * dSum;
                const newScore = (pSum + pMod) * (dSum + dMod);
                const scoreDiff = newScore - basScore;

                totalImpact += scoreDiff;
                applicableRisks.push({ riskName: target.riskName, scoreDiff });
            }

            return {
                id: item.id,
                name: item.name,
                type: item.type,
                totalImpact,
                applicableRisks
            };
        })
        .sort((a, b) => b.totalImpact - a.totalImpact);
}
