import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Box,
    TextField,
    CircularProgress,
    Chip,
} from '@mui/material';
import { ExpandMore, CloudDone, EditNote } from '@mui/icons-material';

// ---------------------------------------------------------------------------
// VÝCHOZÍ POSTUPY
// Klíče jsou podřetězce názvů rizik (lowercase). Funkce findDefault() prochází
// klíče a vrátí první shodu. Pořadí klíčů je důležité – specifičtější klíče
// musí být PŘED obecnějšími (např. "sabotáž trati" před "sabotáž").
// ---------------------------------------------------------------------------
const defaultProcedures = {

    // ── BEZPEČNOSTNÍ HROZBY – ZÁMĚRNÉ ──────────────────────────────────────

    'nepřátelské narušení': {
        immediateReaction:
            `1. Vyhodnoť závažnost situace a svou vlastní bezpečnost – nestav se do fyzické konfrontace.\n` +
            `2. Nepokoušej se demonstranty/blokující osoby fyzicky zadržet ani odstranit.\n` +
            `3. Deeskaluj: komunikuj klidně, naslouchej, neprovokuj ani nesděluj informace o akci.\n` +
            `4. Zabraň přihlížejícím ve vstupu do konfliktu – odveď je stranou.\n` +
            `5. Informuj vedoucího úseku nebo krizového manažera (rádio / telefon).\n` +
            `6. Zavolej PČR (158), pokud jsou porušovány zákon nebo bezpečnostní pravidla.\n` +
            `7. Průběžně podávej hlášení o vývoji situace.`,
        coordTeamReaction:
            `1. Přijmi hlášení a vyhodnoť dopad na průběh akce.\n` +
            `2. Kontaktuj PČR (158) a informuj o situaci.\n` +
            `3. Rozhodni o případné úpravě nebo přerušení programu.\n` +
            `4. Informuj komunikační oddělení – připrav stručné sdělení pro veřejnost.\n` +
            `5. Monitoruj vývoj a pokud situace eskaluje, aktivuj Koordinační plán.\n` +
            `6. Zaznamenej incident do krizového logu.`,
    },

    'anonymní výhružka': {
        immediateReaction:
            `1. Pokud přijímáš hovor: NEPOKLÁDEJ telefon – prodlužuj konverzaci. Zapiš číslo volajícího.\n` +
            `2. Zjisti co nejvíce: kde, kdy, jak předmět vypadá, proč volá. Vnímej hlas a zvuky v pozadí.\n` +
            `3. Po ukončení hovoru okamžitě informuj vedoucího / krizového manažera.\n` +
            `4. Zavolej PČR (158) a předej veškeré zjištěné informace.\n` +
            `5. Vždy jednej, jako by hrozba byla reálná – nepodceňuj.\n` +
            `6. Nešiř informaci o hrozbě veřejně – postupuj dle pokynů PČR.\n` +
            `7. Dej krizovému manažerovi vědět, že jsi v pořádku.`,
        coordTeamReaction:
            `1. Přijmi hlášení a aktivuj Koordinační plán.\n` +
            `2. Kontaktuj PČR (158) okamžitě – předej všechny dostupné informace.\n` +
            `3. Informuj vedoucí sektorů, aby zahájili diskrétní prohledávání svěřených prostor.\n` +
            `4. Připrav se na možnou evakuaci – nespouštěj bez pokynu PČR.\n` +
            `5. Informuj Event Directora.\n` +
            `6. Postupuj výhradně dle instrukcí PČR.`,
    },

    'verbální konflikt': {
        immediateReaction:
            `1. Vyhodnoť závažnost a svou bezpečnost – nepřibližuj se k agresivní osobě zbytečně blízko.\n` +
            `2. Přistup klidně, udržuj otevřenou řeč těla, nerukuj.\n` +
            `3. Deeskaluj: naslouchej oběma stranám, neprovokuj, nezvyšuj hlas.\n` +
            `4. Odveď přihlížející dál – zabraň eskalaci ze strany okolí.\n` +
            `5. Nabídni přivolání vedoucího nebo incident supervisora, pokud situaci nelze vyřešit.\n` +
            `6. Informuj vedoucího úseku / krizového manažera.\n` +
            `7. Pokud hrozí přechod do fyzického konfliktu, okamžitě zavolej PČR (158).`,
        coordTeamReaction:
            `1. Přijmi hlášení a vyhodnoť situaci.\n` +
            `2. Pokud konflikt eskaluje, vyšli security tým na místo.\n` +
            `3. Pokud přerůstá ve fyzický střet, kontaktuj PČR (158).\n` +
            `4. Zaznamenej incident do krizového logu.`,
    },

    'rvačka': {
        immediateReaction:
            `1. Vyhodnoť závažnost a svou bezpečnost – nevstupuj do fyzického střetu.\n` +
            `2. Zaměř se na izolaci incidentu: odveď přihlížející, zabraň eskalaci.\n` +
            `3. Přivolej pomoc – informuj vedoucího úseku nebo security tým.\n` +
            `4. Zavolej PČR (158).\n` +
            `5. V případě obtěžování oddělte strany a nabídněte oběti pomoc a bezpečné místo.\n` +
            `6. Nezasahuj fyzicky, pokud nejsi speciálně vyškolený.\n` +
            `7. Poskytni první pomoc zraněným z bezpečné vzdálenosti.`,
        coordTeamReaction:
            `1. Přijmi hlášení, vyšli security tým na místo.\n` +
            `2. Kontaktuj PČR (158) při fyzickém napadení.\n` +
            `3. Zajisti, aby oběť měla k dispozici bezpečné místo a podporu.\n` +
            `4. Zaznamenej incident do krizového logu.`,
    },

    'útok chladnou': {
        immediateReaction:
            `1. Vyhodnoť závažnost – jedná se o aktivní útok ohrožující životy.\n` +
            `2. UTÍKEJ do bezpečí. Pokud nelze utéct, SCHOVEJ SE. Pokud nelze schovat, BRAŇ SE.\n` +
            `3. Varuj ostatní v okolí – hlasitě a stručně (např. „Útočník s nožem, utíkejte!").\n` +
            `4. Zavolej PČR (158) – sděluj polohu, popis útočníka, počet zraněných.\n` +
            `5. Po zajištění bezpečnosti informuj vedoucího / krizového manažera.\n` +
            `6. Poskytni první pomoc zraněným – zastavení krvácení (přitlač ránu).\n` +
            `7. Dej krizovému manažerovi vědět, že jsi v pořádku.`,
        coordTeamReaction:
            `1. Přijmi hlášení – aktivuj Koordinační plán okamžitě.\n` +
            `2. Kontaktuj PČR (158) a ZZS (155) – informuj o počtu zraněných a poloze.\n` +
            `3. Vydej pokyn k izolaci oblasti incidentu – uzavři přístupy.\n` +
            `4. Informuj všechny vedoucí sektorů.\n` +
            `5. Připrav se na lockdown nebo evakuaci dle situace a pokynů PČR.\n` +
            `6. Zkontroluj, že všichni členové týmu jsou v pořádku.`,
    },

    'střelba': {
        immediateReaction:
            `1. Okamžitě se schyl / lehni na zem. Vyhodnoť, zda lze bezpečně utéct.\n` +
            `2. UTÍKEJ, pokud je úniková cesta jasná – nech za sebou vše. Varuj ostatní.\n` +
            `3. Pokud nelze utéct, SCHOVEJ SE: zavři a zablokuj dveře, ztichni, vypni telefon na vibrace.\n` +
            `4. Pokud se nelze schovat, BRAŇ SE jako poslední možnost.\n` +
            `5. Zavolej PČR (158) – šeptej, sděluj polohu a popis útočníka.\n` +
            `6. Nezasahuj sám – čekej na pokyny PČR. Nikomu neotvírej, dokud nepřijde policie.\n` +
            `7. Po zajištění bezpečnosti ihned dej krizovému manažerovi vědět, že jsi v pořádku.`,
        coordTeamReaction:
            `1. Přijmi hlášení – aktivuj Koordinační plán OKAMŽITĚ.\n` +
            `2. Kontaktuj PČR (158) s maximální prioritou – sděluj polohu a odhadované počty.\n` +
            `3. Spusť varování pro všechny zaměstnance v areálu (rádio / hromadná SMS).\n` +
            `4. Vydej pokyn k lockdownu nebo evakuaci výhradně dle pokynů PČR.\n` +
            `5. Uvolni příjezdové trasy pro IZS – zabraň výjezdu vozidel z areálu.\n` +
            `6. Nezveřejňuj informace – komunikuj pouze interně.\n` +
            `7. Proveď hlášení dostupnosti vedoucích sektorů.`,
    },

    'žhářství': {
        immediateReaction:
            `1. Vyhodnoť závažnost a svou bezpečnost – nepřibližuj se k ohni bez vybavení.\n` +
            `2. Aktivuj požární alarm (pokud je k dispozici).\n` +
            `3. Zavolej HZS (150) nebo IZS (112).\n` +
            `4. Informuj vedoucího / krizového manažera.\n` +
            `5. Pokud je to bezpečné (malý počáteční oheň), použij hasicí přístroj – útočíš na základnu ohně.\n` +
            `6. Evakuuj osoby z ohrožené zóny – nepřekračuj dýmové bariéry.\n` +
            `7. Po evakuaci dej krizovému manažerovi vědět, že jsi v pořádku.`,
        coordTeamReaction:
            `1. Přijmi hlášení – aktivuj Koordinační plán.\n` +
            `2. Kontaktuj HZS (150) a ZZS (155) okamžitě.\n` +
            `3. Vydej pokyn k evakuaci postižené oblasti a uvolni příjezdové trasy.\n` +
            `4. Informuj Event Directora a komunikační tým.\n` +
            `5. Proveď hlášení dostupnosti zaměstnanců.`,
    },

    'uložení výbušniny': {
        immediateReaction:
            `1. NEDOTÝKEJ SE podezřelého předmětu ani předmětů v jeho blízkosti.\n` +
            `2. Vzdal se minimálně na 100 metrů – varuj ostatní v okolí klidně a stručně.\n` +
            `3. Informuj vedoucího / krizového manažera.\n` +
            `4. Zavolej PČR (158) – sděluj přesnou polohu a popis předmětu.\n` +
            `5. Nikomu neumožni přístup k předmětu až do příjezdu PČR.\n` +
            `6. Dej krizovému manažerovi vědět, že jsi v pořádku.`,
        coordTeamReaction:
            `1. Přijmi hlášení – aktivuj Koordinační plán.\n` +
            `2. Kontaktuj PČR (158) okamžitě.\n` +
            `3. Vydej pokyn k evakuaci bezpečnostního perimetru dle pokynů PČR.\n` +
            `4. Informuj Event Directora.\n` +
            `5. Nepodnikej samostatné kroky – postupuj výhradně dle instrukcí PČR.`,
    },

    'výbuch': {
        immediateReaction:
            `1. Lehni na zem a chraň hlavu. Vyhodnoť svůj zdravotní stav.\n` +
            `2. Opusť prostor v co nejkratší době – varuj ostatní. Pozor na sekundární výbuchy.\n` +
            `3. Zavolej IZS (112) – sděluj polohu, rozsah, odhadovaný počet zraněných.\n` +
            `4. Informuj vedoucího / krizového manažera.\n` +
            `5. Poskytni první pomoc: priorita zastavení krvácení a zajištění dýchání.\n` +
            `6. Po dosažení bezpečí dej krizovému manažerovi vědět, že jsi v pořádku.`,
        coordTeamReaction:
            `1. Přijmi hlášení – okamžitě aktivuj Koordinační plán.\n` +
            `2. Zavolej IZS (112) s maximální prioritou.\n` +
            `3. Vydej pokyn k okamžité evakuaci celého areálu.\n` +
            `4. Informuj všechny vedoucí sektorů a uvolni příjezdové trasy.\n` +
            `5. Zkontroluj dostupnost všech členů týmu.\n` +
            `6. Řiď se výhradně pokyny velitele IZS na místě.`,
    },

    'závažný vandalismus': {
        immediateReaction:
            `1. Vyhodnoť závažnost a svou bezpečnost – nepokoušej se fyzicky zadržet vandaly.\n` +
            `2. Pokud je to bezpečné, zdokumentuj situaci (poloha, počet osob, popis).\n` +
            `3. Informuj vedoucího úseku / krizového manažera.\n` +
            `4. Zavolej PČR (158).\n` +
            `5. Izoluj postiženou oblast – zabraň dalšímu přístupu veřejnosti.`,
        coordTeamReaction:
            `1. Přijmi hlášení a kontaktuj PČR (158).\n` +
            `2. Vyšli security tým k izolaci oblasti.\n` +
            `3. Zdokumentuj škody pro záznamy.\n` +
            `4. Zaznamenej do krizového logu.`,
    },

    'únik škodlivé': {
        immediateReaction:
            `1. Vyhodnoť situaci – všimni si neobvyklých pachů, dýmu nebo zdravotních příznaků u okolí.\n` +
            `2. Okamžitě opusť postižený prostor – pohybuj se PROTI větru.\n` +
            `3. Varuj ostatní v okolí a informuj vedoucího / krizového manažera.\n` +
            `4. Zavolej IZS (112).\n` +
            `5. Neposkytuj první pomoc v kontaminované zóně.\n` +
            `6. Po dosažení bezpečí dej krizovému manažerovi vědět, že jsi v pořádku.`,
        coordTeamReaction:
            `1. Přijmi hlášení – aktivuj Koordinační plán.\n` +
            `2. Kontaktuj IZS (112) okamžitě – HZS má speciální vybavení pro CBRN.\n` +
            `3. Vydej pokyn k evakuaci s upřesněním směru úniku (pohyb proti větru).\n` +
            `4. Informuj Event Directora.\n` +
            `5. Postupuj výhradně dle pokynů HZS a záchranných složek.`,
    },

    'sabotáž trati': {
        immediateReaction:
            `1. Vyhodnoť závažnost – hřebíky, olej nebo natažený drát jsou pro závodníky smrtelně nebezpečné.\n` +
            `2. Okamžitě informuj vedoucího úseku o charakteru sabotáže a přesné poloze.\n` +
            `3. Pokud je bezpečné, zabezpeč oblast (kužely, vlajky, varování) bez dotýkání předmětů.\n` +
            `4. NEDOTÝKEJ SE předmětů – mohou být důkazním materiálem.\n` +
            `5. Informuj PČR (158) – jedná se o trestný čin.\n` +
            `6. Informuj Race Directora.`,
        coordTeamReaction:
            `1. Přijmi hlášení – okamžitě vydej pokyn k zastavení nebo neutralizaci závodu.\n` +
            `2. Kontaktuj PČR (158).\n` +
            `3. Zorganizuj systematické prohledání celé trati před obnovením závodu.\n` +
            `4. Neobnovuj závod bez souhlasu PČR a prohledání trati.\n` +
            `5. Zaznamenej incident do krizového logu.`,
    },

    'sabotáž techniky': {
        immediateReaction:
            `1. Vyhodnoť závažnost – zdali je bezpečné techniku okamžitě zastavit.\n` +
            `2. Zastav provoz postižené techniky a zabraň přístupu nepovolaných osob.\n` +
            `3. Informuj technického manažera a vedoucího / krizového manažera.\n` +
            `4. Pokud hrozí nebezpečí (elektrický požár, výbuch), zavolej HZS (150).\n` +
            `5. Zdokumentuj poškození a nezasahuj do stop před příjezdem PČR.`,
        coordTeamReaction:
            `1. Přijmi hlášení a zvaž dopad na průběh akce.\n` +
            `2. Rozhodni o přerušení postižené části programu.\n` +
            `3. Kontaktuj PČR (158) – jedná se o trestný čin.\n` +
            `4. Zaznamenej incident do krizového logu.`,
    },

    'nelegální použití pyrotechniky': {
        immediateReaction:
            `1. Vyhodnoť nebezpečí (riziko požáru, zranění osob v okolí).\n` +
            `2. NEPOKOUŠEJ SE fyzicky odebrat pyrotechniku – hrozí zranění.\n` +
            `3. Varuj osoby v bezprostředním okolí a odveď je dál.\n` +
            `4. Informuj vedoucího úseku / krizového manažera.\n` +
            `5. Zavolej PČR (158) – nelegální použití pyrotechniky je trestný čin.\n` +
            `6. Pokud vznikl požár, aktivuj požární alarm a zavolej HZS (150).`,
        coordTeamReaction:
            `1. Přijmi hlášení a kontaktuj PČR (158).\n` +
            `2. Vyšli security tým k pachateli.\n` +
            `3. Zaznamenej incident do krizového logu.`,
    },

    'najetí vozidlem': {
        immediateReaction:
            `1. Okamžitě opusť zónu ohrožení – varuj ostatní hlasitě a stručně.\n` +
            `2. UTÍKEJ od vozidla. Pokud nelze, SCHOVEJ SE za pevnou překážku (zeď, sloup).\n` +
            `3. Zavolej IZS (112) – sděluj polohu, popis vozidla, odhadovaný počet zraněných.\n` +
            `4. Informuj vedoucího / krizového manažera.\n` +
            `5. Nepřibližuj se k stojícímu vozidlu – možné riziko výbuchu nebo dalšího útoku.\n` +
            `6. Poskytni první pomoc zraněným z bezpečné vzdálenosti (zastavení krvácení).\n` +
            `7. Po dosažení bezpečí dej krizovému manažerovi vědět, že jsi v pořádku.`,
        coordTeamReaction:
            `1. Přijmi hlášení – aktivuj Koordinační plán okamžitě.\n` +
            `2. Kontaktuj IZS (112) a PČR (158).\n` +
            `3. Vydej pokyn k uzavření areálu a uvolnění příjezdových tras pro záchranné složky.\n` +
            `4. Informuj všechny vedoucí sektorů.\n` +
            `5. Vydej pokyn k evakuaci postižené oblasti.\n` +
            `6. Zajisti, aby nikdo nepřibližoval k vozidlu.`,
    },

    // ── PŘÍRODNÍ HROZBY ─────────────────────────────────────────────────────

    'extrémní vítr': {
        immediateReaction:
            `1. Vyhodnoť závažnost – sleduj meteorologická upozornění a vizuální projevy (chvění konstrukcí).\n` +
            `2. Informuj vedoucího / krizového manažera o situaci.\n` +
            `3. Vyzvi osoby, aby opustily otevřené plochy a vyhledaly úkryt v pevných budovách nebo vozidlech.\n` +
            `4. Zabraň vstupu do blízkosti nestabilních konstrukcí (stany, stage, tribuna, stromy).\n` +
            `5. Pokud hrozí pád konstrukcí, okamžitě evakuuj okolí.\n` +
            `6. Zavolej IZS (112) v případě zraněných nebo poškozené infrastruktury.`,
        coordTeamReaction:
            `1. Sleduj meteorologické výstrahy – aktivuj postup při dosažení limitních hodnot (vítr 35 km/h+ / 75 km/h+ pro stage).\n` +
            `2. Vydej pokyn k evakuaci nebo úkrytu všech účastníků.\n` +
            `3. Kontaktuj technický tým k zajištění nebo demontáži nestabilních konstrukcí.\n` +
            `4. Informuj vedoucí sektorů o aktuální situaci.\n` +
            `5. Rozhodni o přerušení programu.\n` +
            `6. Kontaktuj IZS (112) při zraněních nebo škodách.`,
    },

    'přívalové srážky': {
        immediateReaction:
            `1. Vyhodnoť závažnost a rychlost vzestupu vody.\n` +
            `2. Okamžitě varuj ostatní a informuj vedoucího / krizového manažera.\n` +
            `3. Evakuuj osoby z nízko položených míst (příkopů, podchodů, zaplavených prostor).\n` +
            `4. NEVSTUPUJ do proudící vody – i mělká proudící voda strhne člověka.\n` +
            `5. Zavolej IZS (112) v případě ohrožení zdraví nebo uvíznutí osob.`,
        coordTeamReaction:
            `1. Sleduj meteorologické výstrahy a aktuální vodní stavy.\n` +
            `2. Vydej pokyn k evakuaci ohrožených míst.\n` +
            `3. Informuj vedoucí sektorů.\n` +
            `4. Kontaktuj IZS (112) v případě potřeby.\n` +
            `5. Rozhodni o přerušení programu.`,
    },

    'úder blesku': {
        immediateReaction:
            `1. Okamžitě zajisti vlastní bezpečnost – vyhledej úkryt v pevné budově nebo uzavřeném kovovém vozidle.\n` +
            `2. Nezdržuj se pod stromy, u plotů, v otevřeném terénu nebo u vody.\n` +
            `3. Pokud je osoba zasažena bleskem, zavolej ZZS (155) – zasaženou osobu lze beztrestně oživovat, NENÍ nebezpečná.\n` +
            `4. Poskytni první pomoc: KPR, pokud je to bezpečné (ohrožení blesků pominulo).\n` +
            `5. Informuj vedoucího / krizového manažera.\n` +
            `6. Vyzvi ostatní k okamžitému ukrytí.`,
        coordTeamReaction:
            `1. Sleduj meteorologické výstrahy – vydej pokyn k evakuaci a ukrytí při elektrické bouřce (blesky do 8 km).\n` +
            `2. Kontaktuj ZZS (155) v případě zasažené osoby.\n` +
            `3. Vydej pokyn k přerušení veškerých venkovních aktivit.\n` +
            `4. Informuj vedoucí sektorů o uzavření venkovních prostor.`,
    },

    'extrémní teplota': {
        immediateReaction:
            `1. Sleduj příznaky přehřátí (závrať, slabost, zrudnutí, mdloby) nebo podchlazení (třes, zmatenost) u osob v okolí.\n` +
            `2. Přesuň postiženého do stínu / chladu (úpal) nebo teplého místa (podchlazení).\n` +
            `3. Zajisti tekutiny (vlažná voda), ochlazuj mokrými hadry (úpal) nebo zahřívej pomalu (podchlazení).\n` +
            `4. Zavolej ZZS (155) při ztrátě vědomí nebo závažném stavu.\n` +
            `5. Informuj vedoucího / krizového manažera.\n` +
            `6. Upozorňuj přítomné na preventivní opatření (pití vody, stín, oblečení).`,
        coordTeamReaction:
            `1. Sleduj meteorologické výstrahy a měření teploty.\n` +
            `2. Zajisti dostupnost tekutin a stínových míst v areálu.\n` +
            `3. Informuj vedoucí sektorů o preventivních opatřeních.\n` +
            `4. V případě více postižených aktivuj krizový zdravotní plán a kontaktuj ZZS.`,
    },

    'padající stromy': {
        immediateReaction:
            `1. Okamžitě opusť oblast pod stromy nebo větvemi, které hrozí pádem.\n` +
            `2. Varuj ostatní v okolí.\n` +
            `3. Zavolej ZZS (155) při zraněných.\n` +
            `4. Informuj vedoucího / krizového manažera.\n` +
            `5. Zabezpeč oblast a zabraň dalšímu přístupu osob.`,
        coordTeamReaction:
            `1. Vydej pokyn k evakuaci nebo uzavření lesnatých a rizikových oblastí při silném větru.\n` +
            `2. Přijmi hlášení a kontaktuj ZZS (155) v případě zraněných.\n` +
            `3. Zaznamenej incident do krizového logu.`,
    },

    // ── DAVOVÉ INCIDENTY ────────────────────────────────────────────────────

    'davová panika': {
        immediateReaction:
            `1. Vyhodnoť závažnost – NEPOHYBUJ SE proti proudu davu.\n` +
            `2. Hledej úkryt u pevné zdi, sloupu nebo ve výklenku.\n` +
            `3. Pokud jsi uvnitř davu: pohybuj se šikmo ke straně, chraň hrudník rukama, nezakloň hlavu.\n` +
            `4. Varuj ostatní klidným a autoritativním hlasem – zabraň šíření paniky.\n` +
            `5. Informuj vedoucího / krizového manažera.\n` +
            `6. Zavolej IZS (112) v případě zraněných.\n` +
            `7. Pomoz otevřít přístup k únikovým cestám.`,
        coordTeamReaction:
            `1. Přijmi hlášení a vyhodnoť situaci.\n` +
            `2. Spusť zvukové varování – dej davu jasné a klidné instrukce (výzva k pohybu konkrétním směrem).\n` +
            `3. Vydej pokyn k otevření všech únikových cest a zabrzdění přílivu nových osob.\n` +
            `4. Kontaktuj ZZS (155) a PČR (158).\n` +
            `5. Aktivuj Koordinační plán.`,
    },

    'větší počet zraněných': {
        immediateReaction:
            `1. Vyhodnoť vlastní bezpečnost – nevstupuj do prostoru, pokud hrozí další nebezpečí.\n` +
            `2. Zavolej ZZS (155) nebo IZS (112) – sděluj odhadovaný počet a druh zranění.\n` +
            `3. Proveď triáž: nejdříve pomáhej těm, kdo mají šanci přežít (vědomí, dýchání).\n` +
            `4. Informuj vedoucího / krizového manažera.\n` +
            `5. Zabraň přístupu nezraněných osob do prostoru zranění.\n` +
            `6. Poskytuj první pomoc: zastavení krvácení, stabilní poloha, KPR.\n` +
            `7. Dej krizovému manažerovi vědět, že jsi v pořádku.`,
        coordTeamReaction:
            `1. Aktivuj Koordinační plán.\n` +
            `2. Kontaktuj ZZS (155) a IZS (112) – sděl počet a charakter zranění.\n` +
            `3. Zajisti a udrž přístupové cesty pro záchranné složky.\n` +
            `4. Koordinuj přítomné zdravotníky a urči triage point.\n` +
            `5. Informuj Event Directora a připrav interní komunikaci.\n` +
            `6. Zaznamenej průběh do krizového logu.`,
    },

    'kolaps bariér': {
        immediateReaction:
            `1. Okamžitě varuj osoby v bezprostředním okolí.\n` +
            `2. Informuj vedoucího / krizového manažera.\n` +
            `3. Zavolej IZS (112) při zraněných.\n` +
            `4. Zabezpeč prostor – zabraň dalšímu přístupu osob do nebezpečné zóny.\n` +
            `5. Poskytni první pomoc zraněným.`,
        coordTeamReaction:
            `1. Přijmi hlášení a kontaktuj záchranné složky dle závažnosti zranění.\n` +
            `2. Vydej pokyn k opravě nebo náhradě zábran.\n` +
            `3. Rozhodni o pokračování provozu v postižené oblasti.`,
    },

    'invaze diváků': {
        immediateReaction:
            `1. Okamžitě informuj vedoucího úseku a závodní / sportovní ředitelství.\n` +
            `2. Kontaktuj PČR (158) nebo MP.\n` +
            `3. Zabraň dalším vstupům na trať / plochu.\n` +
            `4. Pokud jsou závodníci nebo sportovci v pohybu – okamžitě varuj Race Directora nebo rozhodčí.`,
        coordTeamReaction:
            `1. Přijmi hlášení – vydej okamžitý pokyn k neutralizaci závodu / přerušení akce.\n` +
            `2. Kontaktuj PČR (158).\n` +
            `3. Koordinuj vyklizení trati nebo plochy.\n` +
            `4. Zaznamenej incident do krizového logu.`,
    },

    'vhazování předmětů': {
        immediateReaction:
            `1. Vyhodnoť závažnost a pokus se identifikovat pachatele.\n` +
            `2. Informuj vedoucího úseku / závodního ředitelství.\n` +
            `3. Komunikuj s osobami v sektoru, aby přestaly.\n` +
            `4. Přivolej security nebo PČR, pokud situace přetrvává.\n` +
            `5. Zdokumentuj incident (poloha, popis pachatele).`,
        coordTeamReaction:
            `1. Přijmi hlášení.\n` +
            `2. Rozhodni o neutralizaci závodu / přerušení akce dle závažnosti.\n` +
            `3. Kontaktuj PČR (158).\n` +
            `4. Zaznamenej incident do protokolu.`,
    },

    'střety skupin': {
        immediateReaction:
            `1. Vyhodnoť závažnost a svou bezpečnost – nevstupuj do střetu.\n` +
            `2. Odveď přihlížející mimo dosah konfliktu.\n` +
            `3. Informuj vedoucího / krizového manažera a security tým.\n` +
            `4. Kontaktuj PČR (158) okamžitě.\n` +
            `5. Poskytni první pomoc zraněným z bezpečné vzdálenosti.`,
        coordTeamReaction:
            `1. Přijmi hlášení – vyšli security tým na místo.\n` +
            `2. Kontaktuj PČR (158) okamžitě.\n` +
            `3. Vydej pokyn k uzavření postiženého sektoru.\n` +
            `4. Zaznamenej incident do krizového logu.`,
    },

    'rasistické': {
        immediateReaction:
            `1. Vyhodnoť závažnost situace.\n` +
            `2. Deeskaluj: nezapoj se do debaty, netlač a nezagituj.\n` +
            `3. Nabídni pachateli dobrovolný odchod ze sektoru.\n` +
            `4. Zabraň odvetným reakcím ze strany okolí – nech PČR, aby situaci vyřešila.\n` +
            `5. Informuj vedoucího / krizového manažera.\n` +
            `6. Kontaktuj PČR (158) – podněcování nenávisti je trestný čin.`,
        coordTeamReaction:
            `1. Přijmi hlášení.\n` +
            `2. Vyšli security tým na místo.\n` +
            `3. Kontaktuj PČR (158) dle závažnosti.\n` +
            `4. Zaznamenej incident do krizového logu.`,
    },

    // ── ZÁVODNÍ / SPORTOVNÍ INCIDENTY ───────────────────────────────────────

    'hromadný pád závodníků': {
        immediateReaction:
            `1. Dbej na vlastní bezpečnost při vstupu do jízdního koridoru.\n` +
            `2. Informuj telefonicky vedoucího úseku: počet zraněných, jejich stav, průjezdnost trati, příčina pádu.\n` +
            `3. Zavolej ZZS (155) při závažném zranění.\n` +
            `4. Poskytni první pomoc – lékárnička, voda, stabilní poloha.\n` +
            `5. NEFOŤ nehodu ani závodníky.\n` +
            `6. Zabezpeč místo nehody – zabraň průjezdu dalších vozidel a závodníků.`,
        coordTeamReaction:
            `1. Přijmi hlášení o incidentu.\n` +
            `2. Kontaktuj Race Directora a Event Directora.\n` +
            `3. Zajisti příjezd zdravotní služby na místo.\n` +
            `4. Rozhodni o neutralizaci nebo přerušení závodu.\n` +
            `5. Zaznamenej incident do protokolu závodu.`,
    },

    'vběhnutí diváka': {
        immediateReaction:
            `1. Okamžitě informuj vedoucího úseku a závodní ředitelství.\n` +
            `2. Pokud je to bezpečné, pokus se dostat osobu / zvíře z trati.\n` +
            `3. Zabraň dalšímu přístupu na trať.\n` +
            `4. Informuj Race Directora / rozhodčí.`,
        coordTeamReaction:
            `1. Přijmi hlášení.\n` +
            `2. Vydej pokyn k neutralizaci / přerušení závodu dle závažnosti.\n` +
            `3. Zaznamenej incident do protokolu závodu.`,
    },

    // ── ZDRAVOTNÍ A ZÁCHRANNÉ INCIDENTY ────────────────────────────────────

    'zdravotní problémy': {
        immediateReaction:
            `1. Vyhodnoť závažnost – zeptej se na příznaky a zjisti vědomí postiženého.\n` +
            `2. Zavolej ZZS (155) při závažném stavu (bezvědomí, křeče, bolest na hrudi, dušnost).\n` +
            `3. Poskytni první pomoc: stabilní poloha, KPR, AED (pokud je dostupný).\n` +
            `4. Přivolej přítomné zdravotníky.\n` +
            `5. Informuj vedoucího / krizového manažera.\n` +
            `6. Nezanechávej postiženého bez dozoru do příjezdu ZZS.`,
        coordTeamReaction:
            `1. Přijmi hlášení.\n` +
            `2. Vyšli přítomné zdravotníky na místo okamžitě.\n` +
            `3. Zajisti přístup ZZS k postiženému – uvolni cestu.\n` +
            `4. Zaznamenej incident do krizového logu.`,
    },

    'úpal': {
        immediateReaction:
            `1. Přesuň postiženého do stínu / chladu (úpal/úžeh) nebo teplého místa (podchlazení).\n` +
            `2. Chlaď postiženého mokrými hadry nebo proudem vzduchu (úpal). Zahřívej pomalu (podchlazení) – ne šokově.\n` +
            `3. Zajisti hydrataci vlažnou vodou – nevnucuj studené pití při úpalu.\n` +
            `4. Zavolej ZZS (155) při bezvědomí nebo zhoršujícím se stavu.\n` +
            `5. Informuj vedoucího / krizového manažera.\n` +
            `6. Přivolej přítomné zdravotníky.`,
        coordTeamReaction:
            `1. Přijmi hlášení a kontaktuj zdravotníky.\n` +
            `2. V případě více postižených aktivuj krizový zdravotní plán.\n` +
            `3. Kontaktuj ZZS (155) dle závažnosti.\n` +
            `4. Zaznamenej incident do krizového logu.`,
    },

    'utonutí': {
        immediateReaction:
            `1. Okamžitě zavolej ZZS (155) a HZS (150).\n` +
            `2. Hoď záchrannou pomůcku (kruh, lano, plovák) – NEVSTUPUJ sám do vody, pokud nejsi vyškolený záchranář.\n` +
            `3. Udržuj hlasový kontakt s osobou v nebezpečí.\n` +
            `4. Informuj vedoucího / krizového manažera.\n` +
            `5. Poskytni první pomoc po vytažení z vody (KPR dle potřeby).`,
        coordTeamReaction:
            `1. Přijmi hlášení – kontaktuj ZZS (155) a HZS (150) okamžitě.\n` +
            `2. Zaznamenej incident do krizového logu.`,
    },

    'omezená': {
        immediateReaction:
            `1. Informuj vedoucího / krizového manažera o omezeném přístupu záchranných složek.\n` +
            `2. Pokračuj v první pomoci na místě bez přerušení.\n` +
            `3. Kontaktuj dispečink ZZS (155) – přesně popište terén a přístupovou trasu.\n` +
            `4. Vyšli pracovníka naproti záchranářům pro navigaci.\n` +
            `5. Připrav LZ (heliport) nebo alternativní přístupové místo, pokud je k dispozici.`,
        coordTeamReaction:
            `1. Přijmi hlášení.\n` +
            `2. Kontaktuj ZZS (155) a informuj o přístupové trase a alternativách.\n` +
            `3. Vyšli pracovníky k navigaci záchranářů ke správnému místu.\n` +
            `4. Zvaž alternativní přepravu (vrtulník, čtyřkolka).`,
    },

    // ── DĚTI ────────────────────────────────────────────────────────────────

    'ztráta dítěte': {
        immediateReaction:
            `1. Přijmi hlášení od zákonného zástupce – zaznamenej přesný popis dítěte (věk, výška, oblečení, jméno).\n` +
            `2. Okamžitě informuj vedoucího / krizového manažera.\n` +
            `3. Zveřejni hlášení přes zvukový systém nebo interní rádio (bez vyvolání paniky).\n` +
            `4. Zorganizuj systematické prohledávání – toalety, atrakce, bezpečné kouty, vstupní brány.\n` +
            `5. Kontaktuj PČR (158) po 15 minutách neúspěšného hledání.\n` +
            `6. Udržuj zákonného zástupce v klidu na dohodnutém místě.`,
        coordTeamReaction:
            `1. Přijmi hlášení a aktivuj vyhledávací protokol – informuj všechny sektory.\n` +
            `2. Vyšli dostupné pracovníky na systematické prohledávání.\n` +
            `3. Kontaktuj PČR (158) při prodloužení hledání.\n` +
            `4. Zaznamenej incident do krizového logu.`,
    },

    'nevhodné chování vůči dětem': {
        immediateReaction:
            `1. Okamžitě odveď dítě do bezpečí – odděl ho od podezřelé osoby.\n` +
            `2. Informuj vedoucího / krizového manažera.\n` +
            `3. Kontaktuj PČR (158) – jedná se o potenciálně trestný čin.\n` +
            `4. NEPOKOUŠEJ se sám konfrontovat podezřelou osobu.\n` +
            `5. Poskytni dítěti klid, podporu a zavolej zákonného zástupce.`,
        coordTeamReaction:
            `1. Přijmi hlášení – kontaktuj PČR (158) okamžitě.\n` +
            `2. Zajisti bezpečnost a podporu pro dítě.\n` +
            `3. Pokus se identifikovat podezřelou osobu bez konfrontace (CCTV, popisy).\n` +
            `4. Zaznamenej incident do krizového logu.`,
    },

    // ── TECHNICKÉ INCIDENTY ─────────────────────────────────────────────────

    'kybernetický útok': {
        immediateReaction:
            `1. Vyhodnoť, které systémy jsou postiženy (AV, IT, komunikace).\n` +
            `2. Odpoj postižená zařízení od sítě (Ethernet, WiFi) – zabraň šíření.\n` +
            `3. Informuj IT / technického manažera a vedoucího / krizového manažera.\n` +
            `4. Dokumentuj abnormální chování systémů.\n` +
            `5. NEPOKOUŠEJ se sám obnovit systémy – risk dalšího poškození nebo ztráty důkazů.`,
        coordTeamReaction:
            `1. Přijmi hlášení.\n` +
            `2. Aktivuj záložní komunikační systémy (rádio, telefonní strom).\n` +
            `3. Kontaktuj IT bezpečnostního specialistu.\n` +
            `4. Vyhodnoť dopad na průběh akce a informuj Event Directora.\n` +
            `5. Zaznamenej incident do krizového logu.`,
    },

    'elektrotechnická závada': {
        immediateReaction:
            `1. Vyhodnoť závažnost – kouř, jiskry nebo plameny z elektroinstalace jsou bezprostřední hrozbou.\n` +
            `2. Odpoj elektrické napájení dané sekce (pokud víš jak a je to bezpečné).\n` +
            `3. Informuj technického manažera a vedoucího / krizového manažera.\n` +
            `4. Zavolej HZS (150) při požáru elektroinstalace.\n` +
            `5. Evakuuj okolní osoby.\n` +
            `6. NEHAS vodou – použij CO2 nebo práškový hasicí přístroj.`,
        coordTeamReaction:
            `1. Přijmi hlášení.\n` +
            `2. Kontaktuj technický tým a HZS dle závažnosti.\n` +
            `3. Rozhodni o přerušení provozu postižené sekce.\n` +
            `4. Zaznamenej incident do krizového logu.`,
    },

    'požární poplach': {
        immediateReaction:
            `1. Okamžitě zahaj evakuaci prostoru – jednej jako by šlo o skutečný požár.\n` +
            `2. Informuj vedoucího / krizového manažera.\n` +
            `3. Zavolej HZS (150), pokud identifikuješ skutečný oheň nebo dým.\n` +
            `4. NEPOUŽÍVEJ výtahy – používej nouzové únikové cesty.\n` +
            `5. Po evakuaci sečti přítomné osoby na shromaždišti.\n` +
            `6. Nevracej se do prostoru bez souhlasu odpovědné osoby.`,
        coordTeamReaction:
            `1. Přijmi hlášení – spusť evakuaci a kontaktuj HZS (150).\n` +
            `2. Informuj vedoucí sektorů o evakuaci.\n` +
            `3. Koordinuj evakuaci a přepočet osob na shromaždišti.\n` +
            `4. Ověř, že všichni jsou v bezpečí před případným návratem.`,
    },

    'selhání evakuace': {
        immediateReaction:
            `1. Okamžitě informuj vedoucího / krizového manažera o zablokované únikové cestě.\n` +
            `2. Přesměruj osoby na alternativní únikovou cestu.\n` +
            `3. Zavolej IZS (112) pro pomoc s evakuací.\n` +
            `4. Zkontroluj, zda nejsou za blokádou uvězněné osoby.\n` +
            `5. Zabezpeč oblast – zabraň dalšímu přístupu na zablokovanou cestu.`,
        coordTeamReaction:
            `1. Přijmi hlášení – okamžitě přehodnoť evakuační plán.\n` +
            `2. Informuj záchranné složky o zablokované cestě.\n` +
            `3. Vyšli dostupné pracovníky na odblokování nebo přesměrování.\n` +
            `4. Koordinuj evakuaci přes alternativní trasy.`,
    },

    'zřícení': {
        immediateReaction:
            `1. Okamžitě opusť nebezpečnou oblast – vzdal se od zřícené nebo nestabilní konstrukce.\n` +
            `2. Varuj ostatní v okolí.\n` +
            `3. Zavolej IZS (112) – sděluj polohu a odhadovaný počet osob pod troskami.\n` +
            `4. Informuj vedoucího / krizového manažera.\n` +
            `5. NEPŘIBLIŽUJ SE k troskami – riziko dalšího zřícení.\n` +
            `6. Poskytni první pomoc přístupným zraněným.\n` +
            `7. Dej krizovému manažerovi vědět, že jsi v pořádku.`,
        coordTeamReaction:
            `1. Přijmi hlášení – aktivuj Koordinační plán okamžitě.\n` +
            `2. Kontaktuj IZS (112).\n` +
            `3. Evakuuj celou oblast v bezpečnostním perimetru.\n` +
            `4. Informuj Event Directora a technický tým.\n` +
            `5. Zajisti přístup záchranným složkám.`,
    },

    'požár (stánky': {
        immediateReaction:
            `1. Okamžitě aktivuj požární alarm a varuj osoby v okolí.\n` +
            `2. Zavolej HZS (150) nebo IZS (112).\n` +
            `3. Zahaj evakuaci ohrožené oblasti.\n` +
            `4. Pokud je to bezpečné (malý počáteční oheň), použij hasicí přístroj (CO2 nebo práškový).\n` +
            `5. Informuj vedoucího / krizového manažera.\n` +
            `6. Dej krizovému manažerovi vědět, že jsi v pořádku.`,
        coordTeamReaction:
            `1. Přijmi hlášení – kontaktuj HZS (150) okamžitě.\n` +
            `2. Vydej pokyn k evakuaci postižené oblasti.\n` +
            `3. Uvolni příjezdové trasy pro záchranné složky.\n` +
            `4. Informuj Event Directora.`,
    },

    // ── DOPRAVA A LOGISTIKA ─────────────────────────────────────────────────

    'dopravní kolaps': {
        immediateReaction:
            `1. Informuj vedoucího / krizového manažera o dopravní situaci.\n` +
            `2. Přesměruj návštěvníky na alternativní parkovací místa nebo trasy.\n` +
            `3. Spolupracuj s PČR / MP na regulaci dopravy.\n` +
            `4. Informuj záchranné složky o kolapsové situaci pro zajištění průjezdu.`,
        coordTeamReaction:
            `1. Přijmi hlášení.\n` +
            `2. Kontaktuj dopravního manažera a PČR / MP.\n` +
            `3. Aktivuj alternativní dopravní plán.\n` +
            `4. Zajisti průjezdnost pro záchranné složky.\n` +
            `5. Informuj Event Directora a komunikační tým.`,
    },

    'mimořádně závažná událost': {
        immediateReaction:
            `1. Vyhodnoť, zda je bezpečné zůstat na místě.\n` +
            `2. Informuj vedoucího / krizového manažera o situaci.\n` +
            `3. Sleduj pokyny krizového manažera a záchranných složek.\n` +
            `4. Zabraň dalším osobám pohybu do nebezpečné oblasti.\n` +
            `5. Připrav se na možnou evakuaci nebo lockdown.`,
        coordTeamReaction:
            `1. Přijmi hlášení – kontaktuj PČR (158) a IZS (112).\n` +
            `2. Vyhodnoť dopad na akci.\n` +
            `3. Rozhodni o pokračování, přerušení nebo evakuaci akce.\n` +
            `4. Informuj vedoucí sektorů.\n` +
            `5. Aktivuj Koordinační plán dle potřeby.`,
    },

    // ── OSTATNÍ ─────────────────────────────────────────────────────────────

    'distribuce návykových': {
        immediateReaction:
            `1. NEVYSTUPUJ konfrontačně – diskrétně zdokumentuj (poloha, popis osob).\n` +
            `2. Informuj vedoucího / krizového manažera.\n` +
            `3. Kontaktuj PČR (158) – distribuce OPL je trestný čin.\n` +
            `4. Pokud zpozoruješ osobu se zdravotními problémy po užití látek, přivolej ZZS (155).`,
        coordTeamReaction:
            `1. Přijmi hlášení – kontaktuj PČR (158) okamžitě.\n` +
            `2. Vyšli security tým.\n` +
            `3. Koordinuj pomoc osobám v nouzi (ZZS, zdravotníci).\n` +
            `4. Zaznamenej incident do krizového logu.`,
    },
};

// Fallback – výchozí text pro neznámá rizika
const FALLBACK = {
    immediateReaction:
        `1. Vyhodnoť závažnost hrozby a svou vlastní bezpečnost.\n` +
        `2. U aktivního útočníka: UTÍKEJ → SCHOVEJ SE → BRAŇ SE. Varuj ostatní v okolí.\n` +
        `3. U verbálních incidentů: deeskaluj a zabraň ostatním v eskalaci.\n` +
        `4. Informuj PČR (158) pokud je to nutné.\n` +
        `5. Informuj vedoucího úseku nebo krizového manažera.\n` +
        `6. Poskytni první pomoc v bezpečné vzdálenosti.\n` +
        `7. U life-threatening incidentu dej krizovému manažerovi vědět, že jsi v pořádku.`,
    coordTeamReaction:
        `1. Přijmi hlášení a vyhodnoť závažnost.\n` +
        `2. Kontaktuj příslušné záchranné složky dle situace.\n` +
        `3. Informuj vedoucí sektorů.\n` +
        `4. Aktivuj Koordinační plán dle potřeby.\n` +
        `5. Zaznamenej incident do krizového logu.`,
};

// Vyhledání výchozího postupu podle názvu rizika
const findDefault = (riskName) => {
    const lower = riskName.toLowerCase();
    for (const key of Object.keys(defaultProcedures)) {
        if (lower.includes(key)) return defaultProcedures[key];
    }
    return FALLBACK;
};

// ---------------------------------------------------------------------------
// Komponenty
// ---------------------------------------------------------------------------
const SaveStatusIndicator = ({ status }) => {
    if (status === 'Uloženo') return <Chip icon={<CloudDone />} label="Všechny změny uloženy" size="small" />;
    if (status === 'Ukládám...') return <Chip icon={<CircularProgress size={16} />} label="Ukládám..." size="small" variant="outlined" />;
    return null;
};

function ProjectProcedures() {
    const { id: projectId } = useParams();
    const [checkedRisks, setCheckedRisks] = useState([]);
    const [procedures, setProcedures] = useState({});
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState('Načteno');
    const [hasControlRoom, setHasControlRoom] = useState(false);
    const initialLoadRef = React.useRef(true);

    useEffect(() => {
        if (!projectId) return;

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects }) => {
                const lp = listProjects().find(p => p.id === projectId);
                if (lp) {
                    setCheckedRisks(lp.customRisks || lp.risks || []);
                    setProcedures(lp.riskProcedures || {});
                    setHasControlRoom(lp.hasControlRoom || false);
                } else {
                    console.error("Lokální projekt nenalezen!");
                }
                setLoading(false);
            });
            return;
        }

        if (!db) { setLoading(false); return; }

        const projectDocRef = doc(db, 'projects', projectId);
        const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCheckedRisks(data.customRisks || data.risks || []);
                setProcedures(data.riskProcedures || {});
                setHasControlRoom(data.hasControlRoom || false);
            }
            setLoading(false);
        }, (error) => {
            console.error("Chyba při načítání dat pro krizové postupy:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [projectId]);

    const saveData = useCallback(async (dataToSave) => {
        if (!dataToSave || Object.keys(dataToSave).length === 0) return;
        if (!projectId) return;

        try {
            if (projectId.startsWith('local-')) {
                import('../../services/localStore').then(({ listProjects, updateProject }) => {
                    const existing = listProjects().find(p => p.id === projectId) || {};
                    updateProject({ ...existing, riskProcedures: dataToSave });
                    setSaveStatus('Uloženo');
                });
                return;
            }
            if (!db) return;
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, { riskProcedures: dataToSave, lastEdited: serverTimestamp() });
            setSaveStatus('Uloženo');
        } catch (error) { console.error("Chyba při ukládání postupů:", error); }
    }, [projectId]);

    useEffect(() => {
        if (initialLoadRef.current) { initialLoadRef.current = false; return; }
        if (loading) return;
        setSaveStatus('Ukládám...');
        const handler = setTimeout(() => { saveData(procedures); }, 1500);
        return () => clearTimeout(handler);
    }, [procedures, loading, saveData]);

    const handleProcedureChange = (riskId, field, value) => {
        setProcedures(prev => ({
            ...prev,
            [riskId]: { ...(prev[riskId] || {}), [field]: value },
        }));
    };

    if (loading) {
        return <Box className="flex justify-center items-center p-8"><CircularProgress /></Box>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <Typography variant="h4" component="h1" className="font-bold text-gray-800">
                    Krizové postupy
                </Typography>
                <SaveStatusIndicator status={saveStatus} />
            </div>
            <Typography>
                Pro každé identifikované riziko jsou předvyplněny doporučené postupy. Texty jsou editovatelné – upravte je podle podmínek a struktury vaší akce.{' '}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#555' }}>
                    <EditNote fontSize="small" /> Světle modrý rámeček = výchozí doporučení, tmavý = váš upravený text.
                </span>
            </Typography>

            <div className="space-y-4">
                {checkedRisks.length > 0 ? (
                    checkedRisks.map(risk => {
                        const defaults = findDefault(risk.name);
                        const savedImmediate = procedures[risk.id]?.immediateReaction;
                        const savedCoord = procedures[risk.id]?.coordTeamReaction;

                        const immediateValue = savedImmediate ?? defaults.immediateReaction;
                        const coordValue = savedCoord ?? defaults.coordTeamReaction;
                        const immediateIsDefault = savedImmediate === undefined || savedImmediate === null;
                        const coordIsDefault = savedCoord === undefined || savedCoord === null;

                        return (
                            <Accordion key={risk.id} TransitionProps={{ unmountOnExit: true }} defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMore />} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                                    <Typography variant="h6">{risk.name}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box className={hasControlRoom ? "grid grid-cols-1 md:grid-cols-2 gap-8" : "grid grid-cols-1 gap-8"}>

                                        {/* ── CO DĚLAT NA MÍSTĚ ── */}
                                        <Box className="space-y-2">
                                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                Co dělat na místě
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 0.5 }}>
                                                Pořadatelé na trati, security tým, první osoba na místě
                                            </Typography>
                                            <TextField
                                                multiline
                                                minRows={8}
                                                maxRows={20}
                                                fullWidth
                                                variant="outlined"
                                                value={immediateValue}
                                                onChange={(e) => handleProcedureChange(risk.id, 'immediateReaction', e.target.value)}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        backgroundColor: 'white',
                                                        '& fieldset': {
                                                            borderColor: immediateIsDefault ? '#90caf9' : '#1976d2',
                                                            borderWidth: immediateIsDefault ? 1 : 2,
                                                        },
                                                    },
                                                }}
                                            />
                                        </Box>

                                        {/* ── CO DĚLÁ CONTROL ROOM ── */}
                                        {hasControlRoom && (
                                            <Box className="space-y-2 animate-fade-in">
                                                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                                    Co dělá Control Room
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#888', display: 'block', mb: 0.5 }}>
                                                    Vzdálené řízení bezpečnosti, přijímání hlášení, vydávání rozhodnutí
                                                </Typography>
                                                <TextField
                                                    multiline
                                                    minRows={8}
                                                    maxRows={20}
                                                    fullWidth
                                                    variant="outlined"
                                                    value={coordValue}
                                                    onChange={(e) => handleProcedureChange(risk.id, 'coordTeamReaction', e.target.value)}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            backgroundColor: 'white',
                                                            '& fieldset': {
                                                                borderColor: coordIsDefault ? '#90caf9' : '#1976d2',
                                                                borderWidth: coordIsDefault ? 1 : 2,
                                                            },
                                                        },
                                                    }}
                                                />
                                            </Box>
                                        )}
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })
                ) : (
                    <Typography className="p-8 text-center border-2 border-dashed rounded-lg text-gray-500">
                        Na stránce "Zvažovaná rizika" zatím nejsou aktivní žádná rizika. Přejděte prosím na analýzu rizik a vyberte relevantní hrozby.
                    </Typography>
                )}
            </div>
        </div>
    );
}

export default ProjectProcedures;
