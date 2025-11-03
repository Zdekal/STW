// src/config/threatMethodologyData.js

/**
 * This file contains data structures based on the "Vyhodnocení ohroženosti měkkého cíle"
 * methodology from the Czech Ministry of the Interior.
 */

// Threat sources and their associated specific threats
export const threatSources = {
  basic: {
    name: 'Základní hrozby (kriminalita, vnitřní hrozby)',
    threats: [
      'Napadení chladnou zbraní (bodné, sečné, tupé apod.)',
      'Napadení střelnou zbraní (krátkou, dlouhou)',
      'Žhářský útok',
      'Braní rukojmí a barikádová situace',
      'Napadení měkkého cíle davem (násilná shromáždění)',
      'Výbušnina v poštovní zásilce',
      'Jedovatá látka v poštovní zásilce',
      'Nastražená imitace výbušniny',
      'Umístění výbušniny do prostoru (bez přítomnosti útočníka)',
      'Falešné oznámení o umístění výbušniny',
    ],
  },
  organizedCrime: {
    name: 'Organizovaný zločin',
    threats: ['Výbušnina v zaparkovaném vozidle', 'Únos osoby'],
  },
  hateCrime: {
    name: 'Útoky z nenávisti (Hate Crime)',
    threats: [
      'Fyzické napadení v blízkém okolí objektu',
      'Verbální agrese s hanlivými prvky',
    ],
  },
  terrorism: {
    name: 'Terorismus',
    threats: [
      'Sebevražedný útok s použitím výbušniny',
      'Nájezd vozidla s výbušninou se sebevražedným útočníkem',
      'Útok nájezdem vozidla do lidí',
    ],
  },
};

// Evaluation criteria for Probability and Impact
export const evaluationCriteria = {
  probability: [
    { key: 'availability', label: 'Dostupnost prostředků útoku' },
    { key: 'occurrence', label: 'Výskyt daného způsobu útoku' },
    { key: 'complexity', label: 'Složitost provedení útoku' },
  ],
  impact: [
    { key: 'lifeAndHealth', label: 'Dopad na životy a zdraví' },
    { key: 'facility', label: 'Dopad na objekt' },
    { key: 'financial', label: 'Finanční dopad' },
    { key: 'community', label: 'Dopad na zasažené společenství' },
  ],
};