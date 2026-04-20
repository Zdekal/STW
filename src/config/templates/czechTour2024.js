// src/config/templates/czechTour2024.js
/**
 * Šablona Koordinačního plánu pro cyklistický etapový závod
 * podle dokumentu "CT_Koordinační plán 2024" (Czech Tour 2024).
 *
 * Použitelné jako výchozí bod pro podobné závody (MČ, Czech Tour,
 * L'Etape apod.). Po importu je nutné upravit jména, data, lokace
 * a specifika dané akce.
 *
 * Import probíhá v ProjectTeam.js přes tlačítko "Importovat šablonu".
 */

export const czechTour2024Template = {
  templateId: "czech_tour_2024",
  label: "Czech Tour 2024 — cyklistický etapový závod",
  description:
    "Šablona koordinačního plánu pro mezinárodní silniční etapový cyklistický závod s 9člennou organizační strukturou.",

  // Obsazení 9 pozic dle dokumentu CT 2024. Zbylé 2 default pozice
  // (Tým bezpečnosti, Zdravotně-psychologická pomoc) zůstávají
  // nevyplněné a budou ponechány v projektu beze změny.
  staffMembers: [
    {
      ktRole: "Předseda KT",
      description: "Reprezentuje tým navenek, má rozhodující slovo.",
      name: "Robert Kolář",
      eventFunction: "Race President",
      phone: "602 517 448",
      crisisPhone: "",
      email: "",
    },
    {
      ktRole: "Krizový manažer",
      description: "Řídí koordinační tým, zodpovídá za agendu bezpečnosti.",
      name: "Zdeněk Rak",
      eventFunction: "Event Director",
      phone: "605 512 444",
      crisisPhone: "",
      email: "",
    },
    {
      ktRole: "Sportovní koordinátor",
      description: "Koordinace se sportovní/programovou částí akce.",
      name: "Leo König",
      eventFunction: "Race Director",
      phone: "605 511 652",
      crisisPhone: "",
      email: "",
    },
    {
      ktRole: "Koordinátor s IZS",
      description: "Komunikace s Integrovaným záchranným systémem a státními orgány.",
      name: "Ivo Pytlíček",
      eventFunction: "Operations Manager",
      phone: "777 751 226",
      crisisPhone: "",
      email: "",
    },
    {
      ktRole: "Interní komunikace",
      description: "Komunikace s vlastními lidmi – zaměstnanci, pořadateli, dobrovolníky.",
      name: "Tereza Skálová",
      eventFunction: "Event Coordinator / Head of Operations",
      phone: "605 511 718",
      crisisPhone: "",
      email: "",
    },
    {
      ktRole: "Externí komunikace (PR)",
      description: "Komunikace s médii a veřejností, tiskový mluvčí.",
      name: "Alexandr Kliment",
      eventFunction: "Communication Manager",
      phone: "606 923 441",
      crisisPhone: "",
      email: "",
    },
    {
      ktRole: "Logistika a IT",
      description: "Vybavení KC, technika, hesla, weby, jídlo, přeprava.",
      name: "Pavel Hájek",
      eventFunction: "Production Manager",
      phone: "605 508 565",
      crisisPhone: "",
      email: "",
    },
    {
      ktRole: "Koordinátor v místě incidentu",
      description: "Zůstává na místě incidentu a podává zprávy do KC.",
      name: "Zdeněk Kalvach",
      eventFunction: "Crisis Manager",
      phone: "733 153 377",
      crisisPhone: "",
      email: "",
    },
    {
      ktRole: "Zapisovatel",
      description: "Zaznamenává klíčové informace a rozhodnutí v KC.",
      name: "Ad hoc",
      eventFunction: "",
      phone: "",
      crisisPhone: "",
      email: "",
    },
  ],

  activationMethod:
    "Při získání informace o závažném incidentu si členové koordinačního týmu volají navzájem " +
    "(neřízeně, bez matice vyrozumění – pro KT do cca 10 osob se ukazuje jako efektivnější). " +
    "Zároveň je zřízena WhatsApp skupina koordinačního týmu pro sdílení informací a kontrolu doručení zpráv. " +
    "Event Director před každou etapou informuje členy KT o umístění koordinačního centra (KC-1 a KC-2).",

  activationAuthority:
    "Koordinační plán aktivuje rozhodnutím nejméně DVOU členů koordinačního týmu, " +
    "kteří jsou uvedeni v tomto plánu. Automaticky (bez rozhodnutí) je plán aktivován " +
    "v níže uvedených případech (viz Incidenty vedoucí k aktivaci).",

  // Spouštěče – mapováno podle kanonických názvů rizik z defaultProjectRisks.js.
  // Při importu se najde risk.id v projektu podle jména.
  incidentTriggerNames: {
    automatic: [
      "Extrémní vítr / bouřka",
      "Extrémní teplota",
      "Přívalové srážky / lokální záplava",
      "Úder blesku",
      "Najetí vozidlem do davu",
      "Anonymní výhružka (hrozba závažným násilím / výbuchem)",
      "Uložení výbušniny",
      "Výbuch",
      "Střelba",
      "Útok chladnou zbraní",
      "Nepřátelské narušení akce / demonstrace / blokáda",
    ],
    manual: [
      "Sabotáž trati (hřebíky, olej, překážky, natažený drát)",
      "Srážka / hromadný pád závodníků",
      "Žhářství",
      "Závažný vandalismus",
      "Větší počet zraněných osob (různými vlivy)",
      "Mimořádně závažná událost v blízkosti akce",
    ],
  },

  // Úkoly dle pozice (klíčované podle ktRole – při importu se mapují na member.id).
  roleTasksByRole: {
    "Předseda KT":
      "Při přijetí informace o relevantním incidentu:\n" +
      "1. Zhodnocení závažnosti situace dle Koordinačního plánu.\n" +
      "2. V případě aktivace KP ihned odchází do KC.\n" +
      "3. Cestou do KC stručně informuje ostatní členy KT s výzvou k příchodu do KC.\n" +
      "4. Pokud bude dlouze telefonovat, zajistí si druhý telefon a asistenta pro administraci hovorů.\n\n" +
      "Po příchodu do KC:\n" +
      "1. Ujasní priority a akceschopnost KT podle vyhodnocení situace.\n" +
      "2. Pověří pracovníka komunikace, aby v součinnosti s tiskovým oddělením IZS formuloval první tiskovou zprávu a zprávu pracovníkům závodu.\n" +
      "3. Ujistí se, že všem členům KT jsou známa fakta o situaci.",

    "Krizový manažer":
      "Při přijetí informace o relevantním incidentu:\n" +
      "1. Odchází do KC.\n" +
      "2. Obvolává všechny ostatní členy KT (prioritně zjišťuje, zda byl informován Předseda KT).\n\n" +
      "Po příchodu do KC:\n" +
      "1. Přítomností Předsedy KT (nebo sebe sama) spolu s alespoň jedním dalším členem KT dochází k formální aktivaci KP.\n" +
      "2. Soustředí se na širší obrázek o situaci a dbá, aby členové KT dělali, co je třeba.\n" +
      "3. Stanovuje čas a agendu prvního briefingu (cca do 20 min. od aktivace KC), průběžně pověřuje přicházející členy KT přípravou jejich části.\n" +
      "4. Kontroluje technické vybavení KC (wifi, tiskárna, projektor, nabíječky, občerstvení).\n" +
      "5. Obvolává dosud nepřítomné členy KT, po jejich příchodu se ujišťuje, že mají nabitý telefon.\n" +
      "6. Zajišťuje kontakt se styčným pracovníkem v místě incidentu.\n" +
      "7. Zvažuje preventivní opatření i na jiných místech akce.\n" +
      "8. Dává podnět pro evakuaci / úpravu prostor dle situace.\n" +
      "9. Pokud jsou členové zahlceni úkoly, zajistí asistenta z administrativních pracovníků závodu.\n" +
      "10. Ujišťuje se, že funguje zapisování do LOG listu.",

    "Sportovní koordinátor":
      "Při přijetí informace o relevantním incidentu:\n" +
      "1. V případě aktivace KP ihned odchází do KC.\n" +
      "2. Cestou do KC stručně informuje ostatní členy KT s výzvou k příchodu do KC.\n\n" +
      "Po příchodu do KC:\n" +
      "1. Řeší otázky sportovní části závodu.\n" +
      "2. Koordinuje činnost KT s potřebami sportovních týmů a organizací.",

    "Koordinátor s IZS":
      "Při přijetí informace o relevantním incidentu:\n" +
      "1. Odchází do KC.\n" +
      "2. Obvolává všechny ostatní členy KT.\n\n" +
      "Po příchodu do KC:\n" +
      "1. Koordinuje aktivity KT se složkami IZS.\n" +
      "2. Jedná s lokálními autoritami o potřebách a pomoci s krizovou situací.\n" +
      "3. Kontroluje, aby činnosti KT byly v souladu s požadavky státních i samosprávních autorit.",

    "Interní komunikace":
      "Při přijetí informace o relevantním incidentu:\n" +
      "1. Odchází do KC.\n" +
      "2. Obvolává ostatní členy KT (prioritně Předsedu a Krizového manažera KT).\n\n" +
      "Po příchodu do KC:\n" +
      "1. Připravuje kontaktní seznamy tak, aby bylo možné informovat pracovníky závodu, respektive dodavatele služeb.\n" +
      "2. V koordinaci s koordinátorem vnější komunikace připravuje první zprávu pro pracovníky závodu.\n" +
      "3. Nastavuje informační kanál pro komunikaci s týmem (FB / WhatsApp / mailing list apod.).",

    "Externí komunikace (PR)":
      "Při přijetí informace o relevantním incidentu:\n" +
      "1. Odchází do KC.\n" +
      "2. Obvolává ostatní členy KT.\n\n" +
      "Po příchodu do KC:\n" +
      "1. Viditelně pro všechny zapisuje fakta o situaci (flipchart nebo sdílený soubor).\n" +
      "2. V koordinaci s koordinátorem vnitřní komunikace připravuje první zprávu pro veřejnost a média.\n" +
      "3. Formuluje tiskovou zprávu a koordinuje ji s tiskovým oddělením IZS.",

    "Logistika a IT":
      "Při přijetí informace o relevantním incidentu:\n" +
      "1. Odchází do KC.\n" +
      "2. Obvolává ostatní členy KT.\n\n" +
      "Po příchodu do KC:\n" +
      "1. Připravuje KC po technické stránce – připojení k internetu, adekvátní vybavení.\n" +
      "2. Ujišťuje se, že jsou dostupná všechna potřebná datová úložiště s kontaktovníky apod.\n" +
      "3. Stará se o vybavení KC a technické potřeby k řešení incidentu.",

    "Zapisovatel":
      "Bude zvolen ad hoc.\n" +
      "1. Začne zapisovat příchozí informace do KC – optimálně tak, aby byl záznam viditelný pro všechny přítomné (projektor / sdílený soubor).\n" +
      "2. Nabádá členy týmu, aby informace sdíleli.",

    "Koordinátor v místě incidentu":
      "1. Odchází na místo incidentu.\n" +
      "2. Obvolává ostatní členy KT.\n" +
      "3. Spolupracuje s IZS v místě incidentu.\n" +
      "4. Podává zprávy o situaci do KT.\n" +
      "5. Zůstává na místě incidentu, odkud komunikuje s KT o vývoji.",
  },
};

/**
 * Všechny dostupné šablony. Přidávej sem další pro jiné typy akcí.
 */
export const availableTemplates = [czechTour2024Template];
