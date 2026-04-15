// src/config/defaultVulnerabilities.js
// Výchozí zranitelnosti akce s definovanými modifikátory subfaktorů pro cílová rizika.

/**
 * Generuje výchozí zranitelnosti.
 * Každá zranitelnost má targets: pole cílových rizik, kde modifiers mění subfaktory (-3 až +3).
 * @returns {Object[]} Pole zranitelností
 */
export function generateDefaultVulnerabilities() {
    return [
        {
            id: "vuln-live-broadcast",
            name: "Přímý přenos akce",
            description: "Akce je přenášena živě (TV, stream). Zvyšuje motivaci útočníků a společenský dopad.",
            targets: [
                { id: "tgt-lb-1", riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 1, community: 2 } },
                { id: "tgt-lb-2", riskName: "Anonymní výhružka (hrozba závažným násilím / výbuchem)", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 1, community: 1 } },
                { id: "tgt-lb-3", riskName: "Útok chladnou zbraní", modifiers: { availability: 0, occurrence: 0, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 1, community: 2 } },
                { id: "tgt-lb-4", riskName: "Střelba", modifiers: { availability: 0, occurrence: 0, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 1, community: 2 } },
                { id: "tgt-lb-5", riskName: "Rasistické / diskriminační projevy a incidenty", modifiers: { availability: 1, occurrence: 0, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 2 } },
                { id: "tgt-lb-6", riskName: "Kybernetický útok na AV/IT infrastrukturu", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 2, community: 1 } },
            ]
        },
        {
            id: "vuln-vip-attendance",
            name: "Účast VIP / politických osobností",
            description: "Přítomnost známých osobností nebo politiků zvyšuje bezpečnostní rizika.",
            targets: [
                { id: "tgt-vip-1", riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 2, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 1, community: 2 } },
                { id: "tgt-vip-2", riskName: "Anonymní výhružka (hrozba závažným násilím / výbuchem)", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 1, community: 1 } },
                { id: "tgt-vip-3", riskName: "Útok chladnou zbraní", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 1, facility: 0, financial: 1, community: 2 } },
                { id: "tgt-vip-4", riskName: "Střelba", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 1, facility: 0, financial: 1, community: 2 } },
                { id: "tgt-vip-5", riskName: "Uložení výbušniny", modifiers: { availability: 1, occurrence: 0, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 1, community: 2 } },
                { id: "tgt-vip-6", riskName: "Střety skupin (hooligans, politika)", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 1 } },
            ]
        },
        {
            id: "vuln-alcohol",
            name: "Prodej a konzumace alkoholu",
            description: "Dostupnost alkoholu zvyšuje pravděpodobnost konfliktů a zdravotních problémů.",
            targets: [
                { id: "tgt-alc-1", riskName: "Verbální konflikt", modifiers: { availability: 1, occurrence: 2, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 1 } },
                { id: "tgt-alc-2", riskName: "Rvačka / výtržnosti / obtěžování", modifiers: { availability: 1, occurrence: 2, complexity: 0, lifeAndHealth: 1, facility: 0, financial: 0, community: 1 } },
                { id: "tgt-alc-3", riskName: "Závažný vandalismus", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 1, financial: 1, community: 1 } },
                { id: "tgt-alc-4", riskName: "Zdravotní problémy", modifiers: { availability: 0, occurrence: 1, complexity: 0, lifeAndHealth: 1, facility: 0, financial: 0, community: 0 } },
                { id: "tgt-alc-5", riskName: "Nelegální použití pyrotechniky", modifiers: { availability: 0, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 1 } },
                { id: "tgt-alc-6", riskName: "Davová panika a nekontrolovaný pohyb lidí", modifiers: { availability: 0, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 0 } },
            ]
        },
        {
            id: "vuln-night-event",
            name: "Noční akce (po setmění)",
            description: "Omezená viditelnost ztěžuje dohled a zvyšuje riziko incidentů.",
            targets: [
                { id: "tgt-night-1", riskName: "Rvačka / výtržnosti / obtěžování", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 0 } },
                { id: "tgt-night-2", riskName: "Distribuce návykových látek", modifiers: { availability: 1, occurrence: 1, complexity: 1, lifeAndHealth: 0, facility: 0, financial: 0, community: 0 } },
                { id: "tgt-night-3", riskName: "Ztráta dítěte", modifiers: { availability: 0, occurrence: 1, complexity: 0, lifeAndHealth: 1, facility: 0, financial: 0, community: 1 } },
                { id: "tgt-night-4", riskName: "Závažný vandalismus", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 1, financial: 0, community: 0 } },
                { id: "tgt-night-5", riskName: "Sabotáž techniky", modifiers: { availability: 1, occurrence: 1, complexity: 1, lifeAndHealth: 0, facility: 0, financial: 0, community: 0 } },
            ]
        },
        {
            id: "vuln-large-crowd",
            name: "Vysoká koncentrace osob (nad 5 000)",
            description: "Velké množství lidí na omezeném prostoru zvyšuje riziko davových incidentů.",
            targets: [
                { id: "tgt-crowd-1", riskName: "Davová panika a nekontrolovaný pohyb lidí", modifiers: { availability: 1, occurrence: 2, complexity: 0, lifeAndHealth: 2, facility: 0, financial: 1, community: 2 } },
                { id: "tgt-crowd-2", riskName: "Větší počet zraněných osob (různými vlivy)", modifiers: { availability: 0, occurrence: 1, complexity: 0, lifeAndHealth: 1, facility: 0, financial: 1, community: 1 } },
                { id: "tgt-crowd-3", riskName: "Kolaps bariér / zábran mezi sektory", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 1, facility: 1, financial: 1, community: 1 } },
                { id: "tgt-crowd-4", riskName: "Selhání evakuace (zablokované únikové cesty)", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 2, facility: 0, financial: 1, community: 2 } },
                { id: "tgt-crowd-5", riskName: "Zdravotní problémy", modifiers: { availability: 0, occurrence: 1, complexity: 0, lifeAndHealth: 1, facility: 0, financial: 0, community: 0 } },
            ]
        },
        {
            id: "vuln-controversial-topic",
            name: "Kontroverzní téma / polarizující obsah",
            description: "Politicky nebo společensky citlivé téma akce zvyšuje riziko protestů a konfliktů.",
            targets: [
                { id: "tgt-contr-1", riskName: "Nepřátelské narušení akce / demonstrace / blokáda", modifiers: { availability: 2, occurrence: 2, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 1, community: 2 } },
                { id: "tgt-contr-2", riskName: "Verbální konflikt", modifiers: { availability: 1, occurrence: 2, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 1 } },
                { id: "tgt-contr-3", riskName: "Rvačka / výtržnosti / obtěžování", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 1 } },
                { id: "tgt-contr-4", riskName: "Střety skupin (hooligans, politika)", modifiers: { availability: 2, occurrence: 2, complexity: 0, lifeAndHealth: 1, facility: 0, financial: 0, community: 2 } },
                { id: "tgt-contr-5", riskName: "Rasistické / diskriminační projevy a incidenty", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 2 } },
            ]
        },
        {
            id: "vuln-pyrotechnics",
            name: "Používání pyrotechniky / ohňostroj",
            description: "Plánované použití pyrotechniky zvyšuje riziko požáru a zranění.",
            targets: [
                { id: "tgt-pyro-1", riskName: "Požár (stánky, dekorace, technické zázemí)", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 1, facility: 1, financial: 1, community: 0 } },
                { id: "tgt-pyro-2", riskName: "Nelegální použití pyrotechniky", modifiers: { availability: 1, occurrence: 1, complexity: 0, lifeAndHealth: 1, facility: 0, financial: 0, community: 0 } },
                { id: "tgt-pyro-3", riskName: "Žhářství", modifiers: { availability: 1, occurrence: 0, complexity: 0, lifeAndHealth: 0, facility: 1, financial: 1, community: 0 } },
                { id: "tgt-pyro-4", riskName: "Davová panika a nekontrolovaný pohyb lidí", modifiers: { availability: 0, occurrence: 1, complexity: 0, lifeAndHealth: 0, facility: 0, financial: 0, community: 0 } },
            ]
        },
    ];
}
