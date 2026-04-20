// src/config/measureIntegrations.js
// Provázanost bezpečnostních opatření s dalšími částmi aplikace.
// Klíč = přesný text opatření z cyclingRaceMeasures.js
//
// Pole:
//   crisisProcedure  – text, který se přidá ke VŠEM krizovým postupům (na závěr)
//   coordinationRole – popis agendy v koordinačním týmu
//   contactRequired  – kontakt(y), které je třeba doplnit do kontaktovníku
//   documentNote     – poznámka pro výstupní dokumenty (bezpečnostní plán)

export const measureIntegrations = {
  // === A) BEZPEČNOST NA TRATI ===

  'Zajištění a kontrola trati před startem (sweep) a během závodu': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Stanovit proceduru v případě zachycení záměrného poškození trati či narušení závodu. Zejména informování pelotonu, ředitele závodu, PR týmu a Policie.\nSweep probíhá nejen před startem, ale i během závodu (průběžná kontrola dalších úseků).',
    documentNote: null,
  },

  'Rozmístění pořadatelů a úsekářů na trase': {
    crisisProcedure: 'Zvážit informování pořadatelů a úsekářů (přes jejich vedoucího) o incidentu a správném postupu, pokud by se jinde opakoval.',
    coordinationRole: 'V koordinačním týmu někdo musí řešit agendu pořadatelů a úsekářů.',
    contactRequired: null,
    checklistExtra: 'Včasné dojednání dostatečného množství pořadatelů po trati.\nBriefing postupů pro různé situace a incidenty a vybavení pro různé počasí.',
    documentNote: null,
  },

  'Motocyklový doprovod pelotonu (moto marshals)': {
    crisisProcedure: 'Zvážit informování moto marshalů (přes jejich vedoucího) o incidentu a správném postupu, pokud by se jinde opakoval.',
    coordinationRole: 'V koordinačním týmu někdo musí řešit agendu moto marshalů.',
    contactRequired: 'Doplnit kontakt na vedoucího moto marshalů a vedoucího pořadatele, který má moto marshaly na zodpovědnost v koordinačním týmu.',
    checklistExtra: null,
    documentNote: null,
  },

  'Doprovodná vozidla s materiálem a mechanikou': {
    crisisProcedure: 'Zvážit informování doprovodných vozidel (přes jejich vedoucího) o incidentu a správném postupu, pokud by se jinde opakoval.',
    coordinationRole: 'V koordinačním týmu někdo musí řešit agendu doprovodných vozidel.',
    contactRequired: null,
    checklistExtra: null,
    documentNote: null,
  },

  'Uzavírky silnic a řízení dopravy (DIO)': {
    crisisProcedure: null,
    coordinationRole: 'Jednou z agend koordinačního týmu je management dopravy v koordinaci s IZS.',
    contactRequired: 'Doplnit kontakt na vedoucího pořadatele akce, který má jednání o uzavírkách na zodpovědnost v koordinačním týmu.',
    checklistExtra: 'Včasná příprava uzavírek a jednání s úřady.',
    documentNote: null,
  },

  // === B) ZDRAVOTNÍ ZABEZPEČENÍ ===

  'Zdravotnická služba v pelotonu (lékař v autě)': {
    crisisProcedure: null,
    coordinationRole: 'V koordinačním týmu někdo musí řešit agendu zdravotnické služby.',
    contactRequired: 'Doplnit kontakt na vedoucího zdravotní služby a vedoucího pořadatele, který má toto na zodpovědnost v koordinačním týmu.',
    checklistExtra: 'Dojednání zdravotnické služby, případně sanitek.',
    documentNote: null,
  },

  // === C) METEOROLOGICKÁ OPATŘENÍ ===

  'Monitoring počasí a meteorologický výstražný systém': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: 'Kontakt osoby, která má na starosti monitoring počasí.',
    checklistExtra: 'Určení osoby zodpovědné za průběžný monitoring počasí.',
    documentNote: null,
  },

  'Procedura pozastavení/zkrácení/zrušení etapy': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Příprava procedury pro přerušení / ukončení, včetně přesných textací hlášení.\nBriefing personálu, který spustí hlášení pro účastníky.',
    documentNote: null,
  },

  'Zajištění přístřešků pro diváky a personál': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Včasné objednání.',
    documentNote: null,
  },

  // === D) BEZPEČNOST DIVÁKŮ ===

  'Fyzická ostraha start/cíl a fan zón': {
    crisisProcedure: 'Přivolat ostrahu, která řeší incident. Ostatní pořadatelé pomáhají izolovat incident v bezpečné vzdálenosti.',
    coordinationRole: 'V koordinačním týmu někdo musí řešit agendu bezpečnostního týmu.',
    contactRequired: 'Kontakt na vedoucího fyzické ostrahy.',
    checklistExtra: 'Včasné objednání dostatečného množství ostrahy.\nZajištění prohlídky prostor, ujasnění úkolů a postupů.',
    documentNote: null,
  },

  'Vymezení diváckých zón a záchytných bariér': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Včasné objednání dostatečného množství bariér.\nAlokování dostatečného množství osob na instalaci a deinstalaci.',
    documentNote: null,
  },

  'Kontrola vstupujících osob do VIP/zázemí': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Zpracovat plán postupů při kontrole osob, zavazadel a vozidel. A to pro rutinu, nestandardní situace a krizové situace.\nVčas naplánovat s týmem zajišťujícím kontrolu osob jejich zaškolení.\nProškolit personál v kontrole vstupu a vjezdu.',
    documentNote: null,
  },

  'Informační cedule a pokyny pro diváky': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Včasná příprava informačních cedulí a jejich dostatečné rozmístění.',
    documentNote: null,
  },

  'Procedura evakuace start/cíl/fan zóny': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'V součinnosti s požárně odborně způsobilou osobou definovat postup evakuace z veřejných prostor.\nDefinovat texty a osobu, která je bude návštěvníkům prezentovat.',
    documentNote: null,
  },

  'Sběrné místo pro ztracené děti': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Stanovení dostatečně srozumitelného místa, kam se mohou obrátit ztracené děti a rodiče (meeting point).',
    documentNote: 'Do bezpečnostního plánu dopsat určení místa pro vyzvednutí ztracených dětí.',
  },

  // === E) DOPRAVA A LOGISTIKA ===

  'Alternativní objízdné trasy a informace pro veřejnost': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Definovat objízdné trasy.',
    documentNote: null,
  },

  // === F) KOMUNIKACE A KOORDINACE ===

  'Radiová komunikační síť (velín - úsekáři - moto)': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Nastavit komunikační skupiny (WhatsApp / Radio).',
    documentNote: null,
  },

  'Spolupráce s Policií ČR a IZS': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Včas informovat Policii ČR o připravované akci.',
    documentNote: null,
  },

  'Briefing bezpečnostního personálu před každou etapou': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Určení hodiny a místa pro briefing bezpečnostního týmu.',
    documentNote: null,
  },

  // === G) TECHNICKÁ OPATŘENÍ ===

  'Hasicí přístroje a protipožární hlídky': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Stanovení požárních hlídek a jejich odborné proškolení.\nZajištění hasicích přístrojů dle doporučení požární OZO.',
    documentNote: null,
  },

  // === H) PRÁVNÍ A ORGANIZAČNÍ ===

  'Ohlašovací povinnosti a povolení (obec, PČR, doprava)': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Včasné ohlášení akce na samosprávní úřady.',
    documentNote: null,
  },

  'Vydání a zveřejnění návštěvního řádu': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Zpracování návštěvního řádu a jeho zveřejnění.',
    documentNote: null,
  },

  'Směrnice výkonu ostrahy (SBS)': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Zpracování směrnic pro tým ostrahy.',
    documentNote: null,
  },

  'Zpracování dokumentace požární ochrany (PO)': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Včasné oslovení požární OZO a zpracování požární dokumentace.',
    documentNote: null,
  },

  'Stanovení požárně bezpečnostního řešení pro dočasné stavby': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Včasné oslovení požární OZO a zpracování požárních posouzení a opatření.',
    documentNote: null,
  },

  'Zajištění požárních hlídek a preventistů PO': {
    crisisProcedure: null,
    coordinationRole: null,
    contactRequired: null,
    checklistExtra: 'Včasné oslovení požární OZO a zpracování požárních posouzení a opatření.',
    documentNote: null,
  },
};

/**
 * Pro aktivní opatření vrátí seznam textů, které se přidají do krizových postupů
 * jako univerzální závěrečný bod u VŠECH incidentů.
 */
export function getCrisisProcedureAdditions(selectedMeasures) {
  const additions = [];
  for (const [measureText, integration] of Object.entries(measureIntegrations)) {
    if (selectedMeasures[measureText] && integration.crisisProcedure) {
      additions.push({
        measureText,
        text: integration.crisisProcedure,
      });
    }
  }
  return additions;
}

/**
 * Pro aktivní opatření vrátí seznam rolí/agend potřebných v koordinačním týmu.
 */
export function getCoordinationRoles(selectedMeasures) {
  const roles = [];
  for (const [measureText, integration] of Object.entries(measureIntegrations)) {
    if (selectedMeasures[measureText] && integration.coordinationRole) {
      roles.push({
        measureText,
        text: integration.coordinationRole,
      });
    }
  }
  return roles;
}

/**
 * Pro aktivní opatření vrátí seznam kontaktů, které je potřeba doplnit.
 */
export function getRequiredContacts(selectedMeasures) {
  const contacts = [];
  for (const [measureText, integration] of Object.entries(measureIntegrations)) {
    if (selectedMeasures[measureText] && integration.contactRequired) {
      contacts.push({
        measureText,
        text: integration.contactRequired,
      });
    }
  }
  return contacts;
}

/**
 * Pro aktivní opatření vrátí poznámky pro výstupní dokumenty.
 */
export function getDocumentNotes(selectedMeasures) {
  const notes = [];
  for (const [measureText, integration] of Object.entries(measureIntegrations)) {
    if (selectedMeasures[measureText] && integration.documentNote) {
      notes.push({
        measureText,
        text: integration.documentNote,
      });
    }
  }
  return notes;
}

/**
 * Pro aktivní opatření vrátí extra checklist poznámky (nad rámec checklistMeasuresMapping).
 */
export function getChecklistExtras(selectedMeasures) {
  const extras = [];
  for (const [measureText, integration] of Object.entries(measureIntegrations)) {
    if (selectedMeasures[measureText] && integration.checklistExtra) {
      extras.push({
        measureText,
        text: integration.checklistExtra,
      });
    }
  }
  return extras;
}
