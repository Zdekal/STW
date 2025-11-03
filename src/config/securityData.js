// src/config/securityData.js

/**
 * Centrální seznam všech možných rizik, která lze v aplikaci použít.
 */
export const allPossibleRisks = [
    'Napadení chladnou zbraní', 
    'Napadení střelnou zbraní', 
    'Anonymní výhrůžka', 
    'Závažný vandalismus', 
    'Žhářský útok', 
    'Přelet nepovoleného dronu', 
    'Únik škodlivé látky ve vzduchu', 
    'Obtěžování', 
    'Krádeže', 
    'Nenávistné shromáždění', 
    'Výbušnina umístěná v prostoru akce (NVS)', 
    'Braní rukojmí', 
    'Výbušnina ve vozidle', 
    'Nájezd vozidla do davu', 
    'Sabotáž techniky', 
    'Narušení akce extrémním počasím', 
    'Extrémní vítr / bouřka', 
    'Přívalové srážky / lokální záplava', 
    'Úder blesku', 
    'Extrémní teplota (horko / mráz)', 
    'Davová panika a nekontrolovaný pohyb lidí', 
    'Větší počet zraněných osob (různými vlivy)', 
    'Mimořádně závažná udost mimo akci', 
    'Dopravní zácpy a kolaps dopravy v okolí akce', 
    'Přeplnění kapacity areálu a riziko tlačenice', 
    'Rizika z okolí'
];

/**
 * Výchozí (defaultní) knihovna bezpečnostních opatření.
 * Slouží jako šablona pro nové uživatele a pro resetování knihovny.
 */
export const defaultMeasures = [
    { id: 'default-1', text: 'Nastavení spolupráce s ostatními měkkými cíli', isPrevention: true, isDetection: true, isReaction: true, applicableRisks: ['Napadení střelnou zbraní', 'Anonymní výhrůžka', 'Výbušnina umístěná v prostoru akce (NVS)', 'Výbušnina ve vozidle', 'Nájezd vozidla do davu', 'Dopravní zácpy a kolaps dopravy v okolí akce', 'Mimořádně závažná udost mimo akci', 'Přelet nepovoleného dronu'] },
    { id: 'default-2', text: 'Informování a nastavení spolupráce s policií', isPrevention: true, isDetection: true, isReaction: true, applicableRisks: ['Napadení chladnou zbraní', 'Napadení střelnou zbraní', 'Anonymní výhrůžka', 'Závažný vandalismus', 'Žhářský útok', 'Nenávistné shromáždění', 'Výbušnina umístěná v prostoru akce (NVS)', 'Braní rukojmí', 'Výbušnina ve vozidle', 'Nájezd vozidla do davu', 'Narušení akce extrémním počasím', 'Dopravní zácpy a kolaps dopravy v okolí akce', 'Přeplnění kapacity areálů a riziko tlačenice', 'Davová panika a nekontrolovaný pohyb lidí', 'Větší počet zraněných osob (různými vlivy)', 'Mimořádně závažná udost mimo akci', 'Únik škodlivé látky ve vzduchu', 'Přelet nepovoleného dronu', 'Sabotáž techniky'] },
    { id: 'default-3', text: 'Jmenná registrace osob', isPrevention: true, isDetection: true, isReaction: false, applicableRisks: ['Napadení chladnou zbraní', 'Napadení střelnou zbraní', 'Anonymní výhrůžka', 'Závažný vandalismus', 'Žhářský útok', 'Nenávistné shromáždění', 'Výbušnina umístěná v prostoru akce (NVS)', 'Braní rukojmí', 'Přeplnění kapacity areálů a riziko tlačenice', 'Davová panika a nekontrolovaný pohyb lidí', 'Sabotáž techniky'] },
    { id: 'default-4', text: 'Kontrola vstupujících osob', isPrevention: true, isDetection: true, isReaction: false, applicableRisks: ['Napadení střelnou zbraní', 'Žhářský útok', 'Nenávistné shromáždění', 'Výbušnina umístěná v prostoru akce (NVS)', 'Braní rukojmí', 'Přelet nepovoleného dronu', 'Davová panika a nekontrolovaný pohyb lidí'] },
    { id: 'default-5', text: 'Kontrola zavazadel', isPrevention: false, isDetection: true, isReaction: false, applicableRisks: ['Napadení chladnou zbraní', 'Napadení střelnou zbraní', 'Anonymní výhrůžka', 'Žhářský útok', 'Nenávistné shromáždění', 'Výbušnina umístěná v prostoru akce (NVS)', 'Braní rukojmí', 'Přelet nepovoleného dronu'] },
    { id: 'default-6', text: 'Kontrola pošty', isPrevention: false, isDetection: true, isReaction: false, applicableRisks: ['Anonymní výhrůžka', 'Výbušnina umístěná v prostoru akce (NVS)'] },
    { id: 'default-7', text: 'Kontrola vjíždějících vozidel', isPrevention: false, isDetection: true, isReaction: false, applicableRisks: ['Výbušnina umístěná v prostoru akce (NVS)', 'Výbušnina ve vozidle', 'Přelet nepovoleného dronu'] },
    { id: 'default-8', text: 'Kontrola vozidel v okolí', isPrevention: false, isDetection: true, isReaction: false, applicableRisks: ['Výbušnina ve vozidle', 'Nájezd vozidla do davu'] },
    { id: 'default-9', text: 'Kontrola osob bezpečnostním rámem', isPrevention: true, isDetection: true, isReaction: false, applicableRisks: ['Napadení chladnou zbraní', 'Napadení střelnou zbraní', 'Žhářský útok', 'Nenávistné shromáždění', 'Výbušnina umístěná v prostoru akce (NVS)', 'Braní rukojmí'] },
    { id: 'default-10', text: 'Monitoring prostor CCTV', isPrevention: true, isDetection: true, isReaction: true, applicableRisks: ['Napadení chladnou zbraní', 'Napadení střelnou zbraní', 'Závažný vandalismus', 'Žhářský útok', 'Nenávistné shromáždění', 'Výbušnina umístěná v prostoru akce (NVS)', 'Braní rukojmí', 'Nájezd vozidla do davu', 'Přeplnění kapacity areálů a riziko tlačenice', 'Davová panika a nekontrolovaný pohyb lidí', 'Přelet nepovoleného dronu'] },
    { id: 'default-11', text: 'Monitoring počasí', isPrevention: false, isDetection: true, isReaction: false, applicableRisks: ['Narušení akce extrémním počasím', 'Únik škodlivé látky ve vzduchu'] },
    { id: 'default-12', text: 'Použití tísňových tlačítek', isPrevention: false, isDetection: true, isReaction: true, applicableRisks: ['Napadení chladnou zbraní', 'Závažný vandalismus', 'Nenávistné shromáždění', 'Braní rukojmí', 'Davová panika a nekontrolovaný pohyb lidí'] },
    { id: 'default-13', text: 'Vymezení neveřejných prostor pomocí ACS', isPrevention: true, isDetection: true, isReaction: false, applicableRisks: ['Anonymní výhrůžka', 'Nenávistné shromáždění', 'Výbušnina umístěná v prostoru akce (NVS)', 'Braní rukojmí', 'Sabotáž techniky'] },
    { id: 'default-14', text: 'Zastřežení uzavřených prostor pomocí PZTS (EZS)', isPrevention: false, isDetection: true, isReaction: false, applicableRisks: ['Závažný vandalismus', 'Nenávistné shromáždění', 'Výbušnina umístěná v prostoru akce (NVS)', 'Braní rukojmí', 'Davová panika a nekontrolovaný pohyb lidí', 'Sabotáž techniky'] },
    { id: 'default-15', text: 'Přítomnost fyzické ostrahy', isPrevention: true, isDetection: true, isReaction: true, applicableRisks: ['Napadení chladnou zbraní', 'Napadení střelnou zbraní', 'Závažný vandalismus', 'Nenávistné shromáždění', 'Braní rukojmí', 'Výbušnina ve vozidle', 'Nájezd vozidla do davu', 'Narušení akce extrémním počasím', 'Dopravní zácpy a kolaps dopravy v okolí akce', 'Přeplnění kapacity areálů a riziko tlačenice', 'Davová panika a nekontrolovaný pohyb lidí', 'Větší počet zraněných osob (různými vlivy)', 'Únik škodlivé látky ve vzduchu', 'Přelet nepovoleného dronu', 'Sabotáž techniky'] },
    { id: 'default-16', text: 'Použití zábran proti nájezdu', isPrevention: true, isDetection: false, isReaction: true, applicableRisks: ['Nenávistné shromáždění', 'Výbušnina ve vozidle', 'Nájezd vozidla do davu'] },
    { id: 'default-17', text: 'Použití požární signalizace', isPrevention: false, isDetection: true, isReaction: false, applicableRisks: ['Žhářský útok'] },
    { id: 'default-18', text: 'Vymezení prostoru pomocí oplocenek', isPrevention: true, isDetection: false, isReaction: false, applicableRisks: ['Nenávistné shromáždění', 'Přeplnění kapacity areálů a riziko tlačenice', 'Davová panika a nekontrolovaný pohyb lidí']},
    { id: 'default-19', text: 'Zdravotnická služba', isPrevention: false, isDetection: true, isReaction: true, applicableRisks: ['Napadení chladnou zbraní', 'Napadení střelnou zbraní', 'Braní rukojmí', 'Nájezd vozidla do davu', 'Narušení akce extrémním počasím', 'Přeplnění kapacity areálů a riziko tlačenice', 'Davová panika a nekontrolovaný pohyb lidí', 'Větší počet zraněných osob (různými vlivy)', 'Únik škodlivé látky ve vzduchu'] },
    { id: 'default-20', text: 'Nastavení procedury evakuace', isPrevention: true, isDetection: false, isReaction: true, applicableRisks: ['Napadení chladnou zbraní', 'Anonymní výhrůžka', 'Žhářský útok', 'Nenávistné shromáždění', 'Výbušnina umístěná v prostoru akce (NVS)', 'Braní rukojmí', 'Výbušnina ve vozidle', 'Nájezd vozidla do davu', 'Narušení akce extrémním počasím', 'Přeplnění kapacity areálů a riziko tlačenice', 'Mimořádně závažná udost mimo akci', 'Únik škodlivé látky ve vzduchu'] },
    { id: 'default-21', text: 'Nastavení procedury lockdown', isPrevention: true, isDetection: false, isReaction: true, applicableRisks: ['Napadení chladnou zbraní', 'Mimořádně závažná udost mimo akci'] },
    { id: 'default-22', text: 'Příprava krizového týmu', isPrevention: true, isDetection: false, isReaction: true, applicableRisks: ['Napadení chladnou zbraní', 'Napadení střelnou zbraní', 'Anonymní výhrůžka', 'Závažný vandalismus', 'Žhářský útok', 'Nenávistné shromáždění', 'Výbušnina umístěná v prostoru akce (NVS)', 'Braní rukojmí', 'Výbušnina ve vozidle', 'Nájezd vozidla do davu', 'Narušení akce extrémním počasím', 'Dopravní zácpy a kolaps dopravy v okolí akce', 'Přeplnění kapacity areálů a riziko tlačenice', 'Davová panika a nekontrolovaný pohyb lidí', 'Větší počet zraněných osob (různými vlivy)', 'Mimořádně závažná udost mimo akci', 'Únik škodlivé látky ve vzduchu', 'Přelet nepovoleného dronu', 'Sabotáž techniky'] }
];