// src/config/checklistMeasuresMapping.js
// Mapování bezpečnostních opatření na konkrétní úkoly v checklistu.

export const checklistMeasuresMapping = {
    'Kontrola vstupujících osob': [
        { id: 'measure_vstup_check', label: 'Zajistit personál pro kontrolu vstupenek / akreditací', explanation: 'Přiřadit zodpovědnou osobu a tým pro kontrolu na vstupu.', phase: 'Přípravná fáze' },
        { id: 'measure_vstup_briefing', label: 'Briefing vstupního personálu', explanation: 'Provedení instruktáže o pravidlech kontroly a postupech při odmítnutí vstupu.', phase: 'Těsně před akcí' },
    ],
    'Kontrola zavazadel': [
        { id: 'measure_bags_setup', label: 'Připravit prostor pro kontrolu zavazadel', explanation: 'Zajistit stoly, bezpečnostní přepážky a kontejnery pro zakázané předměty.', phase: 'Těsně před akcí' },
    ],
    'Monitoring prostor CCTV': [
        { id: 'measure_cctv_test', label: 'Otestovat funkčnost kamer a záznamového systému', explanation: 'Před akcí ověřit záběr kamer, nahrávání a spojení s velínem.', phase: 'Těsně před akcí' },
    ],
    'Monitoring počasí': [
        { id: 'measure_weather_person', label: 'Určit osobu zodpovědnou za monitoring počasí', explanation: 'Osoba bude průběžně sledovat radarové snímky a předpovědi.', phase: 'Přípravná fáze' },
    ],
    'Přítomnost fyzické ostrahy': [
        { id: 'measure_security_contract', label: 'Nasmlouvat bezpečnostní agenturu', explanation: 'Zajistit smlouvu s licencovanou bezpečnostní agenturou pro fyzickou ostrahu.', phase: 'Přípravná fáze' },
        { id: 'measure_security_briefing', label: 'Briefing ostrahy před akcí', explanation: 'Provedení instruktáže bezpečnostního personálu o rozmístění, postupech a komunikaci.', phase: 'Těsně před akcí' },
    ],
    'Zdravotnická služba': [
        { id: 'measure_medical_contract', label: 'Nasmlouvat zdravotnickou službu', explanation: 'Zajistit smlouvu se zdravotnickou službou nebo Červeným křížem.', phase: 'Přípravná fáze' },
        { id: 'measure_medical_position', label: 'Určit stanoviště zdravotnické služby', explanation: 'Vybrat vhodné místo pro zdravotnické stanoviště s dobrým přístupem.', phase: 'Přípravná fáze' },
    ],
    'Nastavení procedury evakuace': [
        { id: 'measure_evac_plan', label: 'Vypracovat evakuační plán', explanation: 'Připravit písemný evakuační plán s únikovými cestami a shromaždišti.', phase: 'Přípravná fáze' },
        { id: 'measure_evac_drill', label: 'Proškolit klíčový personál na evakuaci', explanation: 'Seznámit vedení a ostrahu s evakuačním plánem a jejich rolemi.', phase: 'Těsně před akcí' },
    ],
    'Příprava krizového týmu': [
        { id: 'measure_crisis_team', label: 'Sestavit krizový tým a rozdělit role', explanation: 'Jmenovat členy krizového týmu a přidělit odpovědnosti.', phase: 'Přípravná fáze' },
    ],
    'Použití zábran proti nájezdu': [
        { id: 'measure_barriers', label: 'Zajistit a rozmístit protinárazové zábrany', explanation: 'Objednat a umístit betonové bloky nebo jiné zábrany na přístupových komunikacích.', phase: 'Těsně před akcí' },
    ],
    'Vymezení prostoru pomocí oplocenek': [
        { id: 'measure_fencing', label: 'Zajistit a postavit oplocenky', explanation: 'Objednat mobilní oplocení a ohraničit prostor akce.', phase: 'Těsně před akcí' },
    ],
};
