// src/config/cyclingRaceMeasures.js
// Kompletní matice bezpečnostních opatření pro etapový cyklistický závod.
// Názvy rizik MUSÍ přesně odpovídat hodnotám v defaultProjectRisks.js.

export const measureCategories = [
  {
    id: 'track-safety',
    title: 'Bezpečnost na trati',
    icon: 'Route',
    color: '#dc2626',
    measures: [
      {
        id: 'cycling-01',
        text: 'Zajištění a kontrola trati před startem (sweep) a během závodu',
        isPrevention: true, isDetection: true, isReaction: false,
        applicableRisks: [
          'Sabotáž trati (hřebíky, olej, překážky, natažený drát)',
          'Uložení výbušniny',
          'Padající stromy / velké větve při větru',
          'Vběhnutí diváka nebo zvířete na trať',
        ],
      },
      {
        id: 'cycling-02',
        text: 'Zabezpečení trati záchytnými sítěmi a bariérami',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Vběhnutí diváka nebo zvířete na trať',
          'Srážka / hromadný pád závodníků',
          'Invaze diváků na hrací plochu / trať',
          'Kolaps bariér / zábran mezi sektory',
        ],
      },
      {
        id: 'cycling-03',
        text: 'Rozmístění pořadatelů a úsekářů na trase',
        isPrevention: true, isDetection: true, isReaction: true,
        applicableRisks: [
          'Vběhnutí diváka nebo zvířete na trať',
          'Sabotáž trati (hřebíky, olej, překážky, natažený drát)',
          'Vhazování předmětů na hrací plochu / trať',
          'Invaze diváků na hrací plochu / trať',
          'Davová panika a nekontrolovaný pohyb lidí',
        ],
      },
      {
        id: 'cycling-04',
        text: 'Motocyklový doprovod pelotonu (moto marshals)',
        isPrevention: false, isDetection: true, isReaction: true,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Vběhnutí diváka nebo zvířete na trať',
          'Sabotáž trati (hřebíky, olej, překážky, natažený drát)',
        ],
      },
      {
        id: 'cycling-05',
        text: 'Doprovodná vozidla s materiálem a mechanikou',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Sabotáž techniky',
        ],
      },
      {
        id: 'cycling-06',
        text: 'Nastavení pravidel pro karavanu a doprovod',
        isPrevention: true, isDetection: false, isReaction: false,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Dopravní kolaps dopravy v okolí akce',
          'Najetí vozidlem do davu',
        ],
      },
      {
        id: 'cycling-07',
        text: 'Uzavírky silnic a řízení dopravy (DIO)',
        isPrevention: true, isDetection: false, isReaction: false,
        applicableRisks: [
          'Dopravní kolaps dopravy v okolí akce',
          'Najetí vozidlem do davu',
          'Vběhnutí diváka nebo zvířete na trať',
        ],
      },
      {
        id: 'cycling-08',
        text: 'Helikoptéra / živý přenos z trati',
        isPrevention: false, isDetection: true, isReaction: true,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Sabotáž trati (hřebíky, olej, překážky, natažený drát)',
          'Vběhnutí diváka nebo zvířete na trať',
        ],
      },
      {
        id: 'cycling-09',
        text: 'GPS sledování závodníků a vozidel',
        isPrevention: false, isDetection: true, isReaction: true,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Omezená / obtížná dostupnost ZZS (terén, vzdálenost)',
        ],
      },
      {
        id: 'cycling-10',
        text: 'Stanovení neutrálního úseku (po pádu, bouřka)',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Extrémní vítr / bouřka',
          'Přívalové srážky / lokální záplava',
        ],
      },
    ],
  },
  {
    id: 'medical',
    title: 'Zdravotní zabezpečení na trase',
    icon: 'LocalHospital',
    color: '#e11d48',
    measures: [
      {
        id: 'cycling-11',
        text: 'Zdravotnická služba v pelotonu (lékař v autě)',
        isPrevention: false, isDetection: true, isReaction: true,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Zdravotní problémy',
          'Úpal, úžeh / Podchlazení',
        ],
      },
      {
        id: 'cycling-12',
        text: 'Stacionární zdravotnické stanoviště (start/cíl/úseky)',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Větší počet zraněných osob (různými vlivy)',
          'Zdravotní problémy',
          'Extrémní teplota',
          'Úpal, úžeh / Podchlazení',
        ],
      },
      {
        id: 'cycling-13',
        text: 'Záchranná sanitka sledující závod',
        isPrevention: false, isDetection: false, isReaction: true,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Větší počet zraněných osob (různými vlivy)',
          'Omezená / obtížná dostupnost ZZS (terén, vzdálenost)',
        ],
      },
      {
        id: 'cycling-14',
        text: 'Plán přednemocniční péče a traumatologický plán',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Větší počet zraněných osob (různými vlivy)',
          'Davová panika a nekontrolovaný pohyb lidí',
        ],
      },
      {
        id: 'cycling-15',
        text: 'Zajištění přístupu ZZS na celou trasu',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Omezená / obtížná dostupnost ZZS (terén, vzdálenost)',
          'Srážka / hromadný pád závodníků',
        ],
      },
      {
        id: 'cycling-16',
        text: 'Pitný režim a chladicí/ohřívací zóny',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Extrémní teplota',
          'Úpal, úžeh / Podchlazení',
          'Zdravotní problémy',
        ],
      },
      {
        id: 'cycling-17',
        text: 'Defibrilátory (AED) na klíčových místech trasy',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Zdravotní problémy',
          'Větší počet zraněných osob (různými vlivy)',
          'Úder blesku',
        ],
      },
    ],
  },
  {
    id: 'weather',
    title: 'Meteorologická opatření',
    icon: 'Thunderstorm',
    color: '#0284c7',
    measures: [
      {
        id: 'cycling-18',
        text: 'Monitoring počasí a meteorologický výstražný systém',
        isPrevention: false, isDetection: true, isReaction: false,
        applicableRisks: [
          'Extrémní vítr / bouřka',
          'Přívalové srážky / lokální záplava',
          'Úder blesku',
          'Extrémní teplota',
          'Úpal, úžeh / Podchlazení',
        ],
      },
      {
        id: 'cycling-19',
        text: 'Procedura pozastavení/zkrácení/zrušení etapy',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Extrémní vítr / bouřka',
          'Přívalové srážky / lokální záplava',
          'Úder blesku',
          'Extrémní teplota',
        ],
      },
      {
        id: 'cycling-20',
        text: 'Kontrola stromů a konstrukcí podél trati',
        isPrevention: true, isDetection: true, isReaction: false,
        applicableRisks: [
          'Padající stromy / velké větve při větru',
          'Pád / zřícení pódia, stage, stanu nebo jiné konstrukce',
          'Extrémní vítr / bouřka',
        ],
      },
      {
        id: 'cycling-21',
        text: 'Zajištění přístřešků pro diváky a personál',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Extrémní vítr / bouřka',
          'Přívalové srážky / lokální záplava',
          'Úder blesku',
          'Extrémní teplota',
        ],
      },
    ],
  },
  {
    id: 'spectator-safety',
    title: 'Bezpečnost diváků a veřejných zón',
    icon: 'Groups',
    color: '#7c3aed',
    measures: [
      {
        id: 'cycling-22',
        text: 'Fyzická ostraha start/cíl a fan zón',
        isPrevention: true, isDetection: true, isReaction: true,
        applicableRisks: [
          'Rvačka / výtržnosti / obtěžování',
          'Útok chladnou zbraní',
          'Závažný vandalismus',
          'Davová panika a nekontrolovaný pohyb lidí',
          'Nepřátelské narušení akce / demonstrace / blokáda',
        ],
      },
      {
        id: 'cycling-23',
        text: 'Použití zábran proti nájezdu vozidlem (HVM)',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Najetí vozidlem do davu',
          'Nepřátelské narušení akce / demonstrace / blokáda',
        ],
      },
      {
        id: 'cycling-24',
        text: 'Vymezení diváckých zón a záchytných bariér',
        isPrevention: true, isDetection: false, isReaction: false,
        applicableRisks: [
          'Davová panika a nekontrolovaný pohyb lidí',
          'Vběhnutí diváka nebo zvířete na trať',
          'Invaze diváků na hrací plochu / trať',
          'Kolaps bariér / zábran mezi sektory',
        ],
      },
      {
        id: 'cycling-25',
        text: 'Kontrola vstupujících osob do VIP/zázemí',
        isPrevention: true, isDetection: true, isReaction: false,
        applicableRisks: [
          'Útok chladnou zbraní',
          'Střelba',
          'Uložení výbušniny',
          'Sabotáž techniky',
        ],
      },
      {
        id: 'cycling-26',
        text: 'CCTV monitoring start/cíl/fan zóny',
        isPrevention: true, isDetection: true, isReaction: true,
        applicableRisks: [
          'Závažný vandalismus',
          'Rvačka / výtržnosti / obtěžování',
          'Davová panika a nekontrolovaný pohyb lidí',
          'Vhazování předmětů na hrací plochu / trať',
          'Nelegální použití pyrotechniky',
        ],
      },
      {
        id: 'cycling-27',
        text: 'Informační cedule a pokyny pro diváky',
        isPrevention: true, isDetection: false, isReaction: false,
        applicableRisks: [
          'Davová panika a nekontrolovaný pohyb lidí',
          'Ztráta dítěte',
          'Vběhnutí diváka nebo zvířete na trať',
        ],
      },
      {
        id: 'cycling-28',
        text: 'Procedura evakuace start/cíl/fan zóny',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Uložení výbušniny',
          'Výbuch',
          'Anonymní výhružka (hrozba závažným násilím / výbuchem)',
          'Požární poplach (skutečný i falešný)',
          'Únik škodlivé látky ve vzduchu',
        ],
      },
      {
        id: 'cycling-29',
        text: 'Sběrné místo pro ztracené děti',
        isPrevention: true, isDetection: true, isReaction: true,
        applicableRisks: [
          'Ztráta dítěte',
        ],
      },
    ],
  },
  {
    id: 'transport',
    title: 'Doprava a logistika',
    icon: 'DirectionsCar',
    color: '#ea580c',
    measures: [
      {
        id: 'cycling-30',
        text: 'Dopravně-inženýrské opatření (DIO) s Policií ČR',
        isPrevention: true, isDetection: false, isReaction: false,
        applicableRisks: [
          'Dopravní kolaps dopravy v okolí akce',
          'Najetí vozidlem do davu',
        ],
      },
      {
        id: 'cycling-31',
        text: 'Alternativní objízdné trasy a informace pro veřejnost',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Dopravní kolaps dopravy v okolí akce',
        ],
      },
      {
        id: 'cycling-32',
        text: 'Dopravní koordinátoři na křižovatkách',
        isPrevention: true, isDetection: true, isReaction: true,
        applicableRisks: [
          'Dopravní kolaps dopravy v okolí akce',
          'Najetí vozidlem do davu',
          'Vběhnutí diváka nebo zvířete na trať',
        ],
      },
      {
        id: 'cycling-33',
        text: 'Plán přesměrování/zkrácení trasy (náhradní okruhy)',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Dopravní kolaps dopravy v okolí akce',
          'Mimořádně závažná událost v blízkosti akce',
          'Přívalové srážky / lokální záplava',
        ],
      },
    ],
  },
  {
    id: 'communication',
    title: 'Komunikace a koordinace',
    icon: 'Headset',
    color: '#0891b2',
    measures: [
      {
        id: 'cycling-34',
        text: 'Radiová komunikační síť (velín - úsekáři - moto)',
        isPrevention: true, isDetection: true, isReaction: true,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Vběhnutí diváka nebo zvířete na trať',
          'Sabotáž trati (hřebíky, olej, překážky, natažený drát)',
          'Davová panika a nekontrolovaný pohyb lidí',
          'Větší počet zraněných osob (různými vlivy)',
          'Extrémní vítr / bouřka',
          'Mimořádně závažná událost v blízkosti akce',
        ],
      },
      {
        id: 'cycling-35',
        text: 'Koordinační štáb / Control Room na akci',
        isPrevention: true, isDetection: true, isReaction: true,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Střelba',
          'Výbuch',
          'Davová panika a nekontrolovaný pohyb lidí',
          'Větší počet zraněných osob (různými vlivy)',
          'Mimořádně závažná událost v blízkosti akce',
          'Extrémní vítr / bouřka',
          'Dopravní kolaps dopravy v okolí akce',
        ],
      },
      {
        id: 'cycling-36',
        text: 'Spolupráce s Policií ČR a IZS',
        isPrevention: true, isDetection: true, isReaction: true,
        applicableRisks: [
          'Střelba',
          'Výbuch',
          'Anonymní výhružka (hrozba závažným násilím / výbuchem)',
          'Mimořádně závažná událost v blízkosti akce',
          'Najetí vozidlem do davu',
          'Útok chladnou zbraní',
          'Nepřátelské narušení akce / demonstrace / blokáda',
        ],
      },
      {
        id: 'cycling-37',
        text: 'Spolupráce s ostatními měkkými cíli v trase',
        isPrevention: true, isDetection: true, isReaction: false,
        applicableRisks: [
          'Mimořádně závažná událost v blízkosti akce',
          'Anonymní výhružka (hrozba závažným násilím / výbuchem)',
        ],
      },
      {
        id: 'cycling-38',
        text: 'Krizový tým a krizový plán',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Střelba',
          'Výbuch',
          'Davová panika a nekontrolovaný pohyb lidí',
          'Větší počet zraněných osob (různými vlivy)',
          'Mimořádně závažná událost v blízkosti akce',
          'Srážka / hromadný pád závodníků',
          'Únik škodlivé látky ve vzduchu',
        ],
      },
      {
        id: 'cycling-39',
        text: 'Briefing bezpečnostního personálu před každou etapou',
        isPrevention: true, isDetection: true, isReaction: false,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Vběhnutí diváka nebo zvířete na trať',
          'Sabotáž trati (hřebíky, olej, překážky, natažený drát)',
          'Davová panika a nekontrolovaný pohyb lidí',
          'Rvačka / výtržnosti / obtěžování',
          'Nepřátelské narušení akce / demonstrace / blokáda',
        ],
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technická opatření',
    icon: 'Engineering',
    color: '#4f46e5',
    measures: [
      {
        id: 'cycling-40',
        text: 'Záložní napájení a technická redundance',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Elektrotechnická závada (zkrat, požár kabeláže)',
          'Sabotáž techniky',
        ],
      },
      {
        id: 'cycling-41',
        text: 'Technicko-bezpečnostní přejímka areálů (start/cíl)',
        isPrevention: true, isDetection: true, isReaction: false,
        applicableRisks: [
          'Pád / zřícení pódia, stage, stanu nebo jiné konstrukce',
          'Elektrotechnická závada (zkrat, požár kabeláže)',
          'Požární poplach (skutečný i falešný)',
        ],
      },
      {
        id: 'cycling-42',
        text: 'Hasicí přístroje a protipožární hlídky',
        isPrevention: true, isDetection: true, isReaction: true,
        applicableRisks: [
          'Požární poplach (skutečný i falešný)',
          'Elektrotechnická závada (zkrat, požár kabeláže)',
          'Nelegální použití pyrotechniky',
        ],
      },
      {
        id: 'cycling-43',
        text: 'Ochrana IT/AV infrastruktury',
        isPrevention: true, isDetection: true, isReaction: true,
        applicableRisks: [
          'Sabotáž techniky',
        ],
      },
    ],
  },
  {
    id: 'legal-org',
    title: 'Právní a organizační',
    icon: 'Gavel',
    color: '#64748b',
    measures: [
      {
        id: 'cycling-44',
        text: 'Ohlašovací povinnosti a povolení (obec, PČR, doprava)',
        isPrevention: true, isDetection: false, isReaction: false,
        applicableRisks: [
          'Dopravní kolaps dopravy v okolí akce',
          'Mimořádně závažná událost v blízkosti akce',
          'Nepřátelské narušení akce / demonstrace / blokáda',
        ],
      },
      {
        id: 'cycling-45',
        text: 'Vydání a zveřejnění návštěvního řádu',
        isPrevention: true, isDetection: false, isReaction: false,
        applicableRisks: [
          'Rvačka / výtržnosti / obtěžování',
          'Verbální konflikt',
          'Rasistické / diskriminační projevy a incidenty',
          'Nelegální použití pyrotechniky',
          'Vhazování předmětů na hrací plochu / trať',
        ],
      },
      {
        id: 'cycling-46',
        text: 'Směrnice výkonu ostrahy (SBS)',
        isPrevention: true, isDetection: true, isReaction: true,
        applicableRisks: [
          'Závažný vandalismus',
          'Rvačka / výtržnosti / obtěžování',
          'Útok chladnou zbraní',
          'Nepřátelské narušení akce / demonstrace / blokáda',
        ],
      },
      {
        id: 'cycling-47',
        text: 'Behaviorální detekce u vstupů do zázemí',
        isPrevention: true, isDetection: true, isReaction: false,
        applicableRisks: [
          'Střelba',
          'Uložení výbušniny',
          'Sabotáž trati (hřebíky, olej, překážky, natažený drát)',
          'Sabotáž techniky',
        ],
      },
      {
        id: 'cycling-48',
        text: 'Debriefing a vyhodnocení po akci / etapě',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Srážka / hromadný pád závodníků',
          'Davová panika a nekontrolovaný pohyb lidí',
          'Mimořádně závažná událost v blízkosti akce',
          'Větší počet zraněných osob (různými vlivy)',
        ],
      },
      {
        id: 'cycling-49',
        text: 'Zpracování dokumentace požární ochrany (PO)',
        isPrevention: true, isDetection: false, isReaction: false,
        applicableRisks: [
          'Požární poplach (skutečný i falešný)',
          'Elektrotechnická závada (zkrat, požár kabeláže)',
          'Nelegální použití pyrotechniky',
        ],
      },
      {
        id: 'cycling-50',
        text: 'Stanovení požárně bezpečnostního řešení pro dočasné stavby',
        isPrevention: true, isDetection: true, isReaction: false,
        applicableRisks: [
          'Požární poplach (skutečný i falešný)',
          'Pád / zřícení pódia, stage, stanu nebo jiné konstrukce',
          'Elektrotechnická závada (zkrat, požár kabeláže)',
        ],
      },
      {
        id: 'cycling-51',
        text: 'Zajištění požárních hlídek a preventistů PO',
        isPrevention: true, isDetection: true, isReaction: true,
        applicableRisks: [
          'Požární poplach (skutečný i falešný)',
          'Elektrotechnická závada (zkrat, požár kabeláže)',
          'Nelegální použití pyrotechniky',
        ],
      },
      {
        id: 'cycling-52',
        text: 'Zajištění průjezdnosti přístupových komunikací pro HZS',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Požární poplach (skutečný i falešný)',
          'Výbuch',
          'Dopravní kolaps dopravy v okolí akce',
        ],
      },
      {
        id: 'cycling-53',
        text: 'Školení personálu v obsluze PHP a evakuaci při požáru',
        isPrevention: true, isDetection: false, isReaction: true,
        applicableRisks: [
          'Požární poplach (skutečný i falešný)',
          'Elektrotechnická závada (zkrat, požár kabeláže)',
        ],
      },
      {
        id: 'cycling-54',
        text: 'Zákaz otevřeného ohně a regulace pyrotechniky',
        isPrevention: true, isDetection: false, isReaction: false,
        applicableRisks: [
          'Nelegální použití pyrotechniky',
          'Požární poplach (skutečný i falešný)',
        ],
      },
    ],
  },
];

// Flat array všech opatření s kategorií
export const allCyclingMeasures = measureCategories.flatMap(cat =>
  cat.measures.map(m => ({ ...m, categoryId: cat.id, categoryTitle: cat.title, categoryColor: cat.color }))
);

// Mapování podle typu akce (extensible)
export const measuresByEventType = {
  etapovy_cyklisticky_zavod: measureCategories,
};

/**
 * Vrátí strukturovaná opatření pro daný typ akce.
 * @param {string} eventType - Typ akce z ProjectBasic
 * @returns {Array|null} - Pole kategorií s opatřeními, nebo null
 */
export function getMeasuresForEventType(eventType) {
  return measuresByEventType[eventType] || null;
}
