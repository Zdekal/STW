// scripts/seedMeasures.js
// Naplní Firestore (EMULÁTOR) kolekcí `measures_library`.

const admin = require('firebase-admin');

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || 'eventsecurityplanner';

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

const measures = [
  // --- PREVENCE ---
  {
    name: 'Zvýšený počet pořadatelů u vstupů',
    category: 'prevence',
    description: 'Posílení dohledu na vstupních místech, frontách a v exponovaných zónách.',
    applicableRisks: ['Krádeže', 'Tlačenice / panika', 'Nenávistné shromáždění']
  },
  {
    name: 'Kontrola vstupenek a vizuální kontrola zavazadel',
    category: 'prevence',
    description: 'Validace vstupu + rychlá vizuální kontrola tašek bez zdržení toku.',
    applicableRisks: ['Vnesení nebezpečných předmětů', 'Výbušnina v prostoru akce (NVS)']
  },
  {
    name: 'Ochranná zóna proti nájezdu vozidla',
    category: 'prevence',
    description: 'Fyzické zábrany / umístění vozidel tak, aby znemožnily nájezd.',
    applicableRisks: ['Nájezd vozidla do davu']
  },

  // --- DETEKCE ---
  {
    name: 'CCTV dohled na vstupy a trasy davu',
    category: 'detekce',
    description: 'Kamerové pokrytí kritických bodů + živý dohled během akce.',
    applicableRisks: ['Krádeže', 'Tlačenice / panika', 'Napadení osob']
  },
  {
    name: 'Tísňová tlačítka / rychlé hlášení incidentu',
    category: 'detekce',
    description: 'Možnost okamžitého vyhlášení poplachu a přivolání reakcí týmu.',
    applicableRisks: ['Napadení osob', 'Požár', 'Lékařské obtíže']
  },

  // --- REAKCE ---
  {
    name: 'Vyklízení sektorů a řízení toku davu',
    category: 'reakce',
    description: 'Předem nacvičené trasy a role pro bezpečné vyvedení lidí.',
    applicableRisks: ['Tlačenice / panika', 'Požár']
  },
  {
    name: 'Koordinační kanál se složkami IZS',
    category: 'reakce',
    description: 'Kontakt a postupy pro PČR/HZS/ZZS, předem sdílené informace o akci.',
    applicableRisks: ['Napadení osob', 'Nájezd vozidla do davu', 'Požár']
  },
];

(async () => {
  try {
    const batch = db.batch();
    const col = db.collection('measures_library');

    // Vyčistit případné staré záznamy (volitelně)
    const snap = await col.get();
    snap.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Zapsat nová opatření
    const batch2 = db.batch();
    measures.forEach(m => {
      const ref = col.doc(); // auto ID
      batch2.set(ref, {
        ...m,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'seed',
      });
    });
    await batch2.commit();

    console.log(`✅ Zapsáno ${measures.length} opatření do measures_library (projekt: ${PROJECT_ID}).`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Chyba seeding:', e);
    process.exit(1);
  }
})();