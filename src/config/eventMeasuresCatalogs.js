// src/config/eventMeasuresCatalogs.js
// ============================================================================
//  KATALOGY BEZPEČNOSTNÍCH OPATŘENÍ PRO JEDNOTLIVÉ TYPY AKCÍ
// ============================================================================
//
// Tento soubor je **centrálním místem** pro doplňování opatření pro nové typy
// akcí. Stačí doplnit skeleton dole (nebo přidat nový) a aplikace je začne
// nabízet v sekci "Bezpečnostní opatření" pro projekty daného typu.
//
// JAK PŘIDAT OPATŘENÍ:
// --------------------
// 1) Najdi níže skeleton pro typ akce (např. `konferencePrednaskaMeasures`).
// 2) Do `measures:` pole přidej nový objekt podle vzoru:
//    {
//      id: 'konf-01',                         // jedinečný ID napříč katalogem
//      text: 'Krátký název opatření',         // zobrazí se v checkboxu
//      isPrevention: true,                    // P — prevence (omezuje vznik)
//      isDetection: false,                    // D — detekce (včas zjistí)
//      isReaction: true,                      // R — reakce (omezuje dopad)
//      applicableRisks: [                     // rizika, pro která má smysl
//        'Přesný název rizika',               // viz defaultProjectRisks.js!
//      ],
//    }
//
// ❗ DŮLEŽITÉ: Názvy rizik v `applicableRisks` MUSÍ přesně odpovídat hodnotám
//    `name` v `src/config/defaultProjectRisks.js`. Jinak matchovací logika
//    v ProjectMeasures selže a opatření se nezobrazí pro správná rizika.
//
// JAK PŘIDAT NOVÝ TYP AKCE:
// --------------------------
// 1) Vytvoř nový export s kategoriemi (viz pattern níže).
// 2) Registruj ho ve `measuresByEventType` na konci tohoto souboru pod
//    klíčem, který odpovídá hodnotě `eventType` z wizardu
//    (viz ProjectWizard.js — konstanty jako `konference_prednaska`).
//
// ============================================================================

import { measureCategories as cyclingCategories } from './cyclingRaceMeasures';

// ---------------------------------------------------------------------------
//  SKELETONY – DOPLŇ ZDE DATA
// ---------------------------------------------------------------------------

/**
 * Konference / přednáška
 * Vnitřní akce, typicky 50–500 osob, access control, AV/IT, VIP řečníci.
 */
export const konferencePrednaskaMeasures = [
    {
        id: 'konf-cat-access',
        title: 'Access control a registrace',
        icon: 'Gavel',
        color: '#3b82f6',
        measures: [
            // PŘÍKLAD – smaž a doplň vlastní:
            // {
            //     id: 'konf-01',
            //     text: 'Akreditační systém s fotografií na visačce',
            //     isPrevention: true, isDetection: true, isReaction: false,
            //     applicableRisks: ['Nepřátelské narušení akce / demonstrace / blokáda'],
            // },
        ],
    },
    {
        id: 'konf-cat-av',
        title: 'AV / IT infrastruktura',
        icon: 'Headset',
        color: '#8b5cf6',
        measures: [
            // TODO doplnit
        ],
    },
    {
        id: 'konf-cat-vip',
        title: 'VIP a řečníci',
        icon: 'Shield',
        color: '#ef4444',
        measures: [
            // TODO doplnit
        ],
    },
    {
        id: 'konf-cat-evacuation',
        title: 'Evakuace a požární bezpečnost',
        icon: 'WarningAmber',
        color: '#f59e0b',
        measures: [
            // TODO doplnit
        ],
    },
];

/**
 * Hudební akce (koncert, festival)
 * Venkovní nebo vnitřní, vysoká koncentrace osob, alkohol, noc, pyrotechnika.
 */
export const hudebniAkceMeasures = [
    {
        id: 'hud-cat-crowd',
        title: 'Crowd management a bariéry',
        icon: 'Groups',
        color: '#ef4444',
        measures: [
            // TODO doplnit
        ],
    },
    {
        id: 'hud-cat-stage',
        title: 'Pódium a technologie',
        icon: 'Engineering',
        color: '#f59e0b',
        measures: [
            // TODO doplnit
        ],
    },
    {
        id: 'hud-cat-medical',
        title: 'Zdravotnická služba',
        icon: 'LocalHospital',
        color: '#22c55e',
        measures: [
            // TODO doplnit
        ],
    },
    {
        id: 'hud-cat-alcohol',
        title: 'Alkohol a návykové látky',
        icon: 'WarningAmber',
        color: '#8b5cf6',
        measures: [
            // TODO doplnit
        ],
    },
    {
        id: 'hud-cat-fire',
        title: 'Požární bezpečnost a pyrotechnika',
        icon: 'WarningAmber',
        color: '#dc2626',
        measures: [
            // TODO doplnit
        ],
    },
];

/**
 * Dětský den firmy
 * Venkovní/kombinovaná, rodiny s dětmi, hrací atrakce, nízká rizikovost.
 */
export const detskyDenFirmyMeasures = [
    {
        id: 'dd-cat-kids',
        title: 'Ochrana dětí',
        icon: 'Shield',
        color: '#22c55e',
        measures: [
            // TODO doplnit – např. identifikační náramky, ztracené dítě postup,
            // behaviorální detekce, dohled rodičů, zóna pro nejmenší…
        ],
    },
    {
        id: 'dd-cat-attractions',
        title: 'Atrakce a hry',
        icon: 'Engineering',
        color: '#f59e0b',
        measures: [
            // TODO doplnit – revize atrakcí, pojištění, věkové limity…
        ],
    },
    {
        id: 'dd-cat-medical',
        title: 'Zdravotní dohled',
        icon: 'LocalHospital',
        color: '#ef4444',
        measures: [
            // TODO doplnit
        ],
    },
];

/**
 * Sportovní akce (jiná než cyklistický závod)
 * Běh, fotbal, turnaj apod.
 */
export const sportovniAkceMeasures = [
    {
        id: 'sport-cat-track',
        title: 'Trať / hrací plocha',
        icon: 'Route',
        color: '#dc2626',
        measures: [
            // TODO doplnit
        ],
    },
    {
        id: 'sport-cat-fans',
        title: 'Fanoušci a sektory',
        icon: 'Groups',
        color: '#ef4444',
        measures: [
            // TODO doplnit
        ],
    },
    {
        id: 'sport-cat-medical',
        title: 'Zdravotnická služba',
        icon: 'LocalHospital',
        color: '#22c55e',
        measures: [
            // TODO doplnit
        ],
    },
];

/**
 * Shromáždění (demonstrace, pochod)
 * Veřejný prostor, možnost střetu, politická/kontroverzní témata.
 */
export const shromazdeniMeasures = [
    {
        id: 'shr-cat-route',
        title: 'Trasa pochodu a stanoviště',
        icon: 'Route',
        color: '#dc2626',
        measures: [
            // TODO doplnit
        ],
    },
    {
        id: 'shr-cat-conflict',
        title: 'Deeskalace a konfliktní skupiny',
        icon: 'Shield',
        color: '#f59e0b',
        measures: [
            // TODO doplnit – AKT, pořadatelská služba, odděleni protistrany…
        ],
    },
    {
        id: 'shr-cat-media',
        title: 'Komunikace a média',
        icon: 'Headset',
        color: '#8b5cf6',
        measures: [
            // TODO doplnit
        ],
    },
];

/**
 * Ostatní akce / generický fallback – používá se, když není specifický katalog.
 * Nezaplňovat – pro volbu "ostatní" se použije knihovna opatření z securityData.js.
 */
export const ostatniAkceMeasures = null;

// ---------------------------------------------------------------------------
//  REGISTRACE – SJEDNOCENÁ TABULKA LOOKUP
// ---------------------------------------------------------------------------

/**
 * Mapování eventType (hodnota z wizardu) → pole kategorií s opatřeními.
 * Pokud je pro daný typ `null` nebo není klíč přítomen, použije se pouze
 * výchozí knihovna z `securityData.js`.
 */
export const measuresByEventType = {
    etapovy_cyklisticky_zavod: cyclingCategories,
    konference_prednaska: konferencePrednaskaMeasures,
    hudebni_akce: hudebniAkceMeasures,
    detsky_den_firmy: detskyDenFirmyMeasures,
    sportovni_akce: sportovniAkceMeasures,
    shromáždění: shromazdeniMeasures,
    ostatni_akce: ostatniAkceMeasures,
};

/**
 * Vrátí strukturovaná opatření pro daný typ akce, nebo null pokud katalog
 * neexistuje nebo je prázdný (všechny kategorie bez opatření).
 */
export function getMeasuresForEventType(eventType) {
    const cats = measuresByEventType[eventType];
    if (!cats) return null;
    // pokud jsou všechny kategorie prázdné, považuj za neexistující katalog
    const hasAny = cats.some(c => (c.measures || []).length > 0);
    return hasAny ? cats : null;
}

/**
 * Flat pole všech opatření napříč všemi katalogy – pro agregované pohledy
 * (coverage indikátor apod.). Pouze z kategorií, co mají opatření.
 */
export const allEventMeasuresFlat = Object.entries(measuresByEventType)
    .filter(([, cats]) => Array.isArray(cats))
    .flatMap(([eventType, cats]) =>
        cats.flatMap(cat =>
            (cat.measures || []).map(m => ({
                ...m,
                eventType,
                categoryId: cat.id,
                categoryTitle: cat.title,
                categoryColor: cat.color,
            }))
        )
    );
