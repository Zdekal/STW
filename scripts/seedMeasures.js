const admin = require('firebase-admin');
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'eventsecurityplanner';
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('ℹ️  Tip: export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080');
}
admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

const measures = [
  { name:'Zvýšený počet pořadatelů u vstupů', category:'prevence', description:'Posílení dohledu na vstupních místech.', applicableRisks:['Krádeže','Tlačenice / panika'] },
  { name:'Kontrola vstupenek a vizuální kontrola zavazadel', category:'prevence', description:'Validace vstupu + rychlá vizuální kontrola.', applicableRisks:['Vnesení nebezpečných předmětů','NVS'] },
  { name:'Ochranná zóna proti nájezdu vozidla', category:'prevence', description:'Fyzické zábrany proti nájezdu.', applicableRisks:['Nájezd vozidla do davu'] },
  { name:'CCTV dohled na vstupy a trasy davu', category:'detekce', description:'Živý dohled kritických bodů.', applicableRisks:['Krádeže','Napadení osob'] },
  { name:'Tísňová tlačítka / rychlé hlášení', category:'detekce', description:'Okamžité vyhlášení poplachu.', applicableRisks:['Napadení osob','Požár'] },
  { name:'Vyklízení sektorů a řízení toku davu', category:'reakce', description:'Nacvičené trasy a role.', applicableRisks:['Tlačenice / panika','Požár'] },
  { name:'Koordinační kanál se složkami IZS', category:'reakce', description:'Kontakty a postupy pro PČR/HZS/ZZS.', applicableRisks:['Napadení osob','Nájezd vozidla do davu'] },
];

(async () => {
  try {
    const col = db.collection('measures_library');
    const old = await col.get(); const batchDel = db.batch();
    old.forEach(d => batchDel.delete(d.ref)); await batchDel.commit();
    const batch = db.batch();
    measures.forEach(m => batch.set(col.doc(), {
      ...m, createdAt: admin.firestore.FieldValue.serverTimestamp(), source:'seed'
    }));
    await batch.commit();
    console.log(`✅ Zapsáno ${measures.length} opatření do measures_library.`);
    process.exit(0);
  } catch (e) { console.error('❌ Chyba seeding:', e); process.exit(1); }
})();
