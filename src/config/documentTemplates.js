// src/config/documentTemplates.js
// Šablony výstupních dokumentů – definice kapitol a mapování na data projektu.
// Každá kapitola má `dataKey` určující, odkud se data automaticky naplní.

/**
 * dataKey hodnoty:
 * - 'basicInfo'               → jméno, organizátor, datum, místo, kapacita
 * - 'risks'                   → seznam rizik se skóre
 * - 'riskMatrix'              → tabulka hodnocení ohroženosti (P×D)
 * - 'riskSummary'             → shrnutí analýzy (auto-generované)
 * - 'threatSources'           → identifikace zdrojů nebezpečí
 * - 'locationTimingSpecifics' → specifika míst a časů
 * - 'vulnerabilities'         → zranitelnosti akce
 * - 'measures'                → bezpečnostní opatření
 * - 'procedures'              → krizové postupy
 * - 'team'                    → koordinační tým (složení, KC, aktivace)
 * - 'communication'           → krizová komunikace
 * - 'checklist'               → kontrolní seznam
 * - 'contacts'                → kontaktovník (KT + zapojené týmy)
 * - 'kpIntro'                 → FIXNÍ: úvod KP, právní rámec
 * - 'kpDefinitions'           → FIXNÍ: definice pojmů
 * - 'kpActivation'            → aktivace KP (způsob svolání, oprávnění, incidenty)
 * - 'kpTeamComposition'       → složení KT s rolemi a kontakty
 * - 'kpRoleTasks'             → úkoly per pozice v KT
 * - 'kpPhases'                → FIXNÍ+MIX: 4 fáze postupu
 * - 'kpCoordCenter'           → koordinační centra + FIXNÍ checklist vybavení
 * - 'kpCommProtocol'          → komunikační protokol (matice 2×2)
 * - 'kpPcrHzs'                → tabulka pro PČR a HZS
 * - 'kpOnepager'              → onepager pro KT (shrnutí na 1 stranu)
 * - 'onepagerOrganizer'       → onepager pro pořadatele (info + harmonogram + úkoly + kontakty)
 * - 'auditIntro'              → úvod pre-event auditu
 * - 'auditChecklist'          → kontrolní body pro pre-event walk-through
 * - 'manual'                  → ručně vyplní uživatel (v aplikaci nebo ve Wordu)
 */

export const documentTemplates = {
    analyza: {
        id: 'analyza',
        title: 'Analýza ohroženosti',
        subtitle: 'měkkého cíle',
        icon: 'Assessment',
        description: 'Identifikace a hodnocení bezpečnostních rizik projektu podle metodiky MV ČR.',
        color: '#ef4444',
        chapters: [
            { number: '1', title: 'Základní informace k akci', dataKey: 'basicInfo', description: 'Název, organizátor, termíny, místa konání, kapacita.' },
            { number: '2', title: 'Shrnutí analýzy', dataKey: 'riskSummary', description: 'Metodika hodnocení, přehled prioritních incidentů, celkové zhodnocení.' },
            { number: '3', title: 'Identifikace relevantních zdrojů nebezpečí', dataKey: 'threatSources', description: 'Zdroje ohrožení, způsoby provedení útoku, specifické okolnosti.' },
            { number: '4', title: 'Zranitelnosti akce', dataKey: 'vulnerabilities', description: 'Specifické faktory zvyšující ohrožení (VIP, alkohol, noční akce atd.).' },
            { number: '5', title: 'Specifikace míst a časů zvýšeného rizika', dataKey: 'locationTimingSpecifics', description: 'Riziková místa a časové úseky se zvýšeným ohrožením.' },
            { number: '6', title: 'Analýza ohroženosti – hodnocení rizik', dataKey: 'riskMatrix', description: 'Tabulka hodnocení subfaktorů pravděpodobnosti a dopadu.' },
        ]
    },
    plan: {
        id: 'plan',
        title: 'Bezpečnostní plán',
        subtitle: 'měkkého cíle',
        icon: 'Shield',
        description: 'Doporučení bezpečnostních opatření a krizové postupy.',
        color: '#3b82f6',
        chapters: [
            { number: '1', title: 'Základní informace k akci', dataKey: 'basicInfo', description: 'Název, organizátor, termíny, místa konání.' },
            {
                number: '2', title: 'Doporučení bezpečnostních opatření', dataKey: 'measures',
                description: 'Vybraná opatření: pro pořadatele, personál a ostatní.',
                subchapters: [
                    { number: '2.1', title: 'Doporučení pro pořadatele', dataKey: 'measures' },
                    { number: '2.2', title: 'Doporučení pro personál / úsekáře', dataKey: 'manual' },
                    { number: '2.3', title: 'Ostatní doporučení', dataKey: 'manual' },
                ]
            },
            { number: '3', title: 'Kontrolní seznam (Checklist)', dataKey: 'checklist', description: 'Seznam úkolů k ověření před, během a po akci.' },
            { number: '4', title: 'Krizové postupy', dataKey: 'procedures', description: 'Postupy pro reakci na identifikovaná rizika.' },
            { number: '5', title: 'Příloha – Kontaktovník', dataKey: 'contacts', description: 'Kontakty koordinačního týmu a zapojených složek.' },
        ]
    },
    koordinace: {
        id: 'koordinace',
        title: 'Koordinační plán',
        subtitle: 'měkkého cíle',
        icon: 'Groups',
        description: 'Organizace koordinačního týmu, aktivace plánu a postupy při incidentech podle metodiky MV ČR.',
        color: '#8b5cf6',
        chapters: [
            { number: '1', title: 'Základní informace k akci', dataKey: 'basicInfo', description: 'Název, organizátor, termíny, místa konání.' },
            { number: '2', title: 'Úvod a právní rámec', dataKey: 'kpIntro', description: 'Účel KP, kontext, právní vymezení. (Fixní metodický text)' },
            { number: '3', title: 'Vymezení pojmů', dataKey: 'kpDefinitions', description: 'Definice: závažná situace, koordinační tým, koordinační centrum. (Fixní)' },
            { number: '4', title: 'Seznam potenciálních incidentů', dataKey: 'risks', description: 'Přehled identifikovaných rizik vyžadujících koordinaci.' },
            { number: '5', title: 'Koordinační tým', dataKey: 'kpTeamComposition', description: 'Složení KT: jméno, funkce na akci, role v KT, kontakty.' },
            { number: '5a', title: 'Onepager pro koordinační tým', dataKey: 'kpOnepager', description: 'Stručné shrnutí na jednu stranu: tým, aktivace, kanály, incidenty.' },
            { number: '6', title: 'Úkoly členů koordinačního týmu', dataKey: 'kpRoleTasks', description: 'Konkrétní odpovědnosti a kroky pro každou pozici v KT.' },
            { number: '7', title: 'Aktivace koordinačního plánu', dataKey: 'kpActivation', description: 'Kdo a jak aktivuje, automatické vs. diskreční spouštěče.' },
            { number: '8', title: 'Fáze postupu a priority', dataKey: 'kpPhases', description: 'Fáze 1–4: od okamžité reakce po dlouhodobé řízení.' },
            { number: '9', title: 'Koordinační centrum', dataKey: 'kpCoordCenter', description: 'Lokace KC, požadavky, vybavení.' },
            { number: '10', title: 'Postupy pro jednotlivé incidenty', dataKey: 'procedures', description: 'Operační karty – podrobné postupy reakce.' },
            { number: '11', title: 'Komunikační protokol', dataKey: 'kpCommProtocol', description: 'Matice vnitřní/vnější komunikace, kanály, koordinátoři, šablony zpráv.' },
            { number: '12', title: 'Krizová komunikace', dataKey: 'communication', description: 'Komunikační strategie, mediální postupy, mluvčí.' },
            {
                number: '13', title: 'Přílohy', dataKey: 'manual',
                description: 'Kontaktovník, vybavení KC, tabulka PČR/HZS, mapy.',
                subchapters: [
                    { number: '13.1', title: 'Kontaktovník', dataKey: 'contacts' },
                    { number: '13.2', title: 'Vybavení koordinačního centra', dataKey: 'kpCoordCenter' },
                    { number: '13.3', title: 'Tabulka pro PČR a HZS', dataKey: 'kpPcrHzs' },
                    { number: '13.4', title: 'Předpřipravené tiskové zprávy', dataKey: 'communication' },
                    { number: '13.5', title: 'Mapy lokality', dataKey: 'manual' },
                ]
            },
        ]
    },
    onepager: {
        id: 'onepager',
        title: 'Onepager pro pořadatele',
        subtitle: 'stručné shrnutí na 1–2 strany',
        icon: 'ContactMail',
        description: 'Rychlý přehled pro pořadatele: základní info, harmonogram, briefing, úkoly na pozici, vybavení a kontakty.',
        color: '#0ea5e9',
        chapters: [
            { number: '1', title: 'Základní informace o akci', dataKey: 'basicInfo', description: 'Název, místo, datum, kapacita, organizátor.' },
            { number: '2', title: 'Harmonogram', dataKey: 'onepagerOrganizer', description: 'Klíčové časy: příchod personálu, otevření, hlavní body, konec.', subKey: 'schedule' },
            { number: '3', title: 'Briefing před akcí', dataKey: 'onepagerOrganizer', description: 'Kde, kdy, kdo a co se na briefingu probere.', subKey: 'briefing' },
            { number: '4', title: 'Úkoly na pozici', dataKey: 'onepagerOrganizer', description: 'Konkrétní úkoly vybrané z checklistu a přiřazené k rolím.', subKey: 'positionTasks' },
            { number: '5', title: 'Vybavení s sebou', dataKey: 'onepagerOrganizer', description: 'Co si pořadatel musí přinést (vysílačka, reflexní vesta, ID).', subKey: 'equipment' },
            { number: '6', title: 'Hlavní kontakty', dataKey: 'onepagerOrganizer', description: 'Velín, security, zdravotníci, IZS – čísla vždy po ruce.', subKey: 'contacts' },
            { number: '7', title: 'Hlavní postupy při incidentech', dataKey: 'onepagerOrganizer', description: 'Kartičky "Co dělat, když…" pro nejpravděpodobnější incidenty.', subKey: 'incidents' },
        ],
    },
    audit: {
        id: 'audit',
        title: 'Pre-event audit / walk-through',
        subtitle: 'kontrola ráno v den konání',
        icon: 'Checklist',
        description: 'Strukturovaný seznam pro ranní obchůzku areálu – co zkontrolovat, než se otevře.',
        color: '#16a34a',
        chapters: [
            { number: '1', title: 'Základní informace', dataKey: 'basicInfo', description: 'Název akce, datum, odpovědná osoba za audit.' },
            { number: '2', title: 'Úvod a použití', dataKey: 'auditIntro', description: 'Kdo, kdy a jak audit provádí. (Fixní metodický text)' },
            { number: '3', title: 'Perimetr a přístupy', dataKey: 'auditChecklist', description: 'Oplocení, vstupy, východy, značení, zábrany.', subKey: 'perimeter' },
            { number: '4', title: 'Evakuační cesty a zázemí', dataKey: 'auditChecklist', description: 'Únikové cesty průchodné, hasicí přístroje, AED.', subKey: 'safety' },
            { number: '5', title: 'Technologie a napájení', dataKey: 'auditChecklist', description: 'Kamery, rádia, napájení, záložní zdroje, AV/IT.', subKey: 'tech' },
            { number: '6', title: 'Pódium, stavby, konstrukce', dataKey: 'auditChecklist', description: 'Vizuální kontrola pódia, stanů, oplocení, pevnost spojů.', subKey: 'structures' },
            { number: '7', title: 'Zdravotní a hygienické zázemí', dataKey: 'auditChecklist', description: 'Stanoviště ZZS, toalety, pitná voda, odpad.', subKey: 'medical' },
            { number: '8', title: 'Personál a briefing', dataKey: 'auditChecklist', description: 'Kontrola rozpisu směn, vizuálu, kontaktních listů.', subKey: 'staff' },
            { number: '9', title: 'Venkovní podmínky', dataKey: 'auditChecklist', description: 'Počasí, vítr, viditelnost, stav terénu.', subKey: 'outdoor' },
            { number: '10', title: 'Zápis a nalezené nedostatky', dataKey: 'manual', description: 'Ručně: co bylo nalezeno, kdo řeší, do kdy.' },
        ],
    },
};

/**
 * Vrátí šablony dokumentů relevantní pro daný typ projektu.
 */
export function getDocumentTemplates(projectType) {
    return Object.values(documentTemplates);
}
