import React, { useState } from 'react';
import { db } from '../../firebase'; // Upravte cestu k vašemu souboru firebase.js
import { collection, writeBatch } from 'firebase/firestore';
import { Button, CircularProgress, Typography, Box, Alert } from '@mui/material';

// Data vygenerovaná z vašich dokumentů
const measuresData = [
  {
    "name": "nastavení spolupráce s ostatními měkkými cíli",
    "category": "prevence",
    "applicableRisks": [
      "Napadení střelnou zbraní", "Anonymní výhrůžka", "Výbušnina umístěná v prostoru akce (NVS)",
      "Výbušnina ve vozidle", "Nájezd vozidla do davu", "Dopravní zácpy a kolaps dopravy v okolí akce",
      "Mimořádně závažná událost mimo akci", "Přelet nepovoleného dronu"
    ]
  },
  {
    "name": "informování a nastavení spolupráce s policií",
    "category": "prevence",
    "applicableRisks": [
      "Napadení chladnou zbraní", "Napadení střelnou zbraní", "Anonymní výhrůžka", "Závažný vandalismus",
      "Žhářský útok", "Nenávistné shromáždění", "Výbušnina umístěná v prostoru akce (NVS)", "Braní rukojmí",
      "Výbušnina ve vozidle", "Nájezd vozidla do davu", "Narušení akce extrémním počasím",
      "Dopravní zácpy a kolaps dopravy v okolí akce", "Přeplnění kapacity areálu a riziko tlačenice",
      "Davová panika a nekontrolovaný pohyb lidí", "Větší počet zraněných osob (různými vlivy)",
      "Mimořádně závažná událost mimo akci", "Únik škodlivé látky ve vzduchu", "Přelet nepovoleného dronu",
      "Sabotáž techniky"
    ]
  },
  {
    "name": "jmenná registrace osob",
    "category": "prevence",
    "applicableRisks": [
      "Napadení chladnou zbraní", "Napadení střelnou zbraní", "Anonymní výhrůžka", "Závažný vandalismus",
      "Žhářský útok", "Nenávistné shromáždění", "Výbušnina umístěná v prostoru akce (NVS)", "Braní rukojmí",
      "Přeplnění kapacity areálu a riziko tlačenice", "Davová panika a nekontrolovaný pohyb lidí",
      "Přelet nepovoleného dronu"
    ]
  },
  {
    "name": "kontrola vstupujících osob",
    "category": "prevence",
    "applicableRisks": [
      "Napadení střelnou zbraní", "Anonymní výhrůžka", "Žhářský útok", "Nenávistné shromáždění",
      "Výbušnina umístěná v prostoru akce (NVS)", "Braní rukojmí", "Přelet nepovoleného dronu"
    ]
  },
  {
    "name": "kontrola zavazadel",
    "category": "detekce",
    "applicableRisks": [
      "Napadení chladnou zbraní", "Napadení střelnou zbraní", "Anonymní výhrůžka", "Žhářský útok",
      "Výbušnina umístěná v prostoru akce (NVS)"
    ]
  },
  {
    "name": "kontrola pošty",
    "category": "detekce",
    "applicableRisks": [ "Anonymní výhrůžka", "Výbušnina umístěná v prostoru akce (NVS)" ]
  },
  {
    "name": "kontrola vjíždějících vozidel",
    "category": "detekce",
    "applicableRisks": [ "Výbušnina umístěná v prostoru akce (NVS)", "Výbušnina ve vozidle", "Přelet nepovoleného dronu" ]
  },
  {
    "name": "kontrola vozidel v okolí",
    "category": "detekce",
    "applicableRisks": [ "Výbušnina ve vozidle", "Nájezd vozidla do davu" ]
  },
  {
    "name": "kontrola osob bezpečnostním rámem",
    "category": "prevence",
    "applicableRisks": [ "Napadení chladnou zbraní", "Napadení střelnou zbraní" ]
  },
  {
    "name": "monitoring prostor kamerovým systémem",
    "category": "prevence",
    "applicableRisks": [
      "Napadení chladnou zbraní", "Napadení střelnou zbraní", "Závažný vandalismus", "Žhářský útok",
      "Nenávistné shromáždění", "Výbušnina umístěná v prostoru akce (NVS)", "Braní rukojmí",
      "Nájezd vozidla do davu", "Přeplnění kapacity areálu a riziko tlačenice",
      "Davová panika a nekontrolovaný pohyb lidí", "Přelet nepovoleného dronu"
    ]
  },
  {
    "name": "monitoring počasí",
    "category": "detekce",
    "applicableRisks": [ "Narušení akce extrémním počasím", "Únik škodlivé látky ve vzduchu" ]
  },
  {
    "name": "použití tísňových tlačítek",
    "category": "detekce",
    "applicableRisks": [
      "Napadení chladnou zbraní", "Napadení střelnou zbraní", "Anonymní výhrůžka", "Závažný vandalismus",
      "Žhářský útok", "Braní rukojmí", "Davová panika a nekontrolovaný pohyb lidí"
    ]
  },
  {
    "name": "Vymezení neveřejných prostor pomocí ACS",
    "category": "prevence",
    "applicableRisks": [
      "Anonymní výhrůžka", "Závažný vandalismus", "Nenávistné shromáždění",
      "Výbušnina umístěná v prostoru akce (NVS)", "Braní rukojmí", "Sabotáž techniky"
    ]
  },
  {
    "name": "Zastřežení uzavřených prostor pomocí PZTS (EZS)",
    "category": "prevence", // Placeholder, nebylo v tabulce, doplněno jako prevence
    "applicableRisks": [
      "Nenávistné shromáždění", "Výbušnina umístěná v prostoru akce (NVS)", "Braní rukojmí",
      "Davová panika a nekontrolovaný pohyb lidí", "Sabotáž techniky"
    ]
  },
  {
    "name": "Přítomnost fyzické ostrahy",
    "category": "prevence",
    "applicableRisks": [
      "Napadení chladnou zbraní", "Napadení střelnou zbraní", "Závažný vandalismus", "Žhářský útok",
      "Nenávistné shromáždění", "Výbušnina umístěná v prostoru akce (NVS)", "Braní rukojmí",
      "Výbušnina ve vozidle", "Nájezd vozidla do davu", "Narušení akce extrémním počasím",
      "Dopravní zácpy a kolaps dopravy v okolí akce", "Přeplnění kapacity areálu a riziko tlačenice",
      "Davová panika a nekontrolovaný pohyb lidí", "Větší počet zraněných osob (různými vlivy)",
      "Únik škodlivé látky ve vzduchu", "Přelet nepovoleného dronu"
    ]
  },
  {
    "name": "Použití zábran proti nájezdu",
    "category": "prevence",
    "applicableRisks": [ "Nenávistné shromáždění", "Výbušnina ve vozidle", "Nájezd vozidla do davu" ]
  },
  {
    "name": "Použití požární signalizace",
    "category": "detekce",
    "applicableRisks": [ "Žhářský útok" ]
  },
    {
    "name": "Vymezení prostoru pomocí oplocenek",
    "category": "prevence", // Placeholder, nebylo v tabulce, doplněno jako prevence
    "applicableRisks": [ "Přeplnění kapacity areálu a riziko tlačenice", "Davová panika a nekontrolovaný pohyb lidí" ]
  },
  {
    "name": "zdravotnická služba",
    "category": "reakce", // Změněno z detekce na reakce
    "applicableRisks": [
      "Napadení chladnou zbraní", "Napadení střelnou zbraní", "Žhářský útok", "Nenávistné shromáždění",
      "Braní rukojmí", "Nájezd vozidla do davu", "Narušení akce extrémním počasím",
      "Přeplnění kapacity areálu a riziko tlačenice", "Davová panika a nekontrolovaný pohyb lidí",
      "Větší počet zraněných osob (různými vlivy)", "Únik škodlivé látky ve vzduchu"
    ]
  },
  {
    "name": "nastavení procedury evakuace",
    "category": "reakce", // Změněno z prevence na reakce
    "applicableRisks": [
      "Napadení chladnou zbraní", "Anonymní výhrůžka", "Žhářský útok", "Nenávistné shromáždění",
      "Výbušnina umístěná v prostoru akce (NVS)", "Braní rukojmí", "Výbušnina ve vozidle",
      "Nájezd vozidla do davu", "Narušení akce extrémním počasím",
      "Přeplnění kapacity areálu a riziko tlačenice", "Davová panika a nekontrolovaný pohyb lidí",
      "Větší počet zraněných osob (různými vlivy)", "Mimořádně závažná událost mimo akci",
      "Únik škodlivé látky ve vzduchu"
    ]
  },
  {
    "name": "nastavení procedury lockdown",
    "category": "reakce", // Změněno z prevence na reakce
    "applicableRisks": [
      "Napadení chladnou zbraní", "Napadení střelnou zbraní", "Anonymní výhrůžka", "Žhářský útok",
      "Nenávistné shromáždění", "Výbušnina umístěná v prostoru akce (NVS)", "Braní rukojmí",
      "Dopravní zácpy a kolaps dopravy v okolí akce", "Mimořádně závažná událost mimo akci",
      "Únik škodlivé látky ve vzduchu", "Přelet nepovoleného dronu"
    ]
  },
  {
    "name": "příprava krizového týmu",
    "category": "prevence",
    "applicableRisks": [
      "Napadení chladnou zbraní", "Napadení střelnou zbraní", "Anonymní výhrůžka", "Závažný vandalismus",
      "Žhářský útok", "Nenávistné shromáždění", "Braní rukojmí", "Narušení akce extrémním počasím",
      "Dopravní zácpy a kolaps dopravy v okolí akce", "Davová panika a nekontrolovaný pohyb lidí",
      "Přelet nepovoleného dronu", "Sabotáž techniky"
    ]
  }
];


function MeasuresImporter() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleImport = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // Vytvoření dávkového zápisu pro efektivní nahrání všech dokumentů najednou
      const batch = writeBatch(db);
      const measuresCollectionRef = collection(db, 'measures_library');
      
      measuresData.forEach((measure) => {
        // V Firestore se dokument vytvoří automaticky, není potřeba specifikovat ID
        const docRef = doc(measuresCollectionRef); 
        batch.set(docRef, measure);
      });

      // Spuštění dávkového zápisu
      await batch.commit();

      setStatus({ type: 'success', message: `Úspěšně naimportováno ${measuresData.length} opatření do kolekce 'measures_library'.` });
    } catch (error) {
      console.error("Chyba při importu opatření: ", error);
      setStatus({ type: 'error', message: `Při importu došlo k chybě: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: '8px', maxWidth: '600px', m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Import knihovny opatření
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Toto tlačítko nahraje předdefinovanou sadu bezpečnostních opatření do vaší databáze Firestore. Tuto akci proveďte pouze jednou.
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleImport} 
        disabled={loading}
        startIcon={loading && <CircularProgress size={20} color="inherit" />}
      >
        {loading ? 'Importuji...' : 'Spustit import opatření'}
      </Button>

      {status.message && (
        <Alert severity={status.type} sx={{ mt: 2 }}>
          {status.message}
        </Alert>
      )}
    </Box>
  );
}

export default MeasuresImporter;
