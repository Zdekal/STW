const admin = require('firebase-admin');
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'eventsecurityplanner';
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('ℹ️  Tip: export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080');
}
admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

const risks = [
  { name:'Přelet nepovoleného dronu', category:'fyzická', probability:2, impact:3 },
  { name:'Krádeže', category:'majetková', probability:3, impact:2 },
  { name:'Nenávistné shromáždění', category:'společenská', probability:2, impact:3 },
  { name:'Nájezd vozidla do davu', category:'fyzická', probability:1, impact:4 },
  { name:'Požár nebo výbuch', category:'technická', probability:1, impact:4 },
  { name:'Tlačenice / panika', category:'davová', probability:2, impact:4 },
  { name:'Napadení osob', category:'fyzická', probability:2, impact:3 },
  { name:'Výbušnina v prostoru akce (NVS)', category:'teroristická', probability:1, impact:5 },
];

(async () => {
  try {
    const col = db.collection('threats_library');
    const old = await col.get(); const batchDel = db.batch();
    old.forEach(d => batchDel.delete(d.ref)); await batchDel.commit();
    const batch = db.batch();
    risks.forEach(r => batch.set(col.doc(), {
      ...r, createdAt: admin.firestore.FieldValue.serverTimestamp(), source:'seed'
    }));
    await batch.commit();
    console.log(`✅ Zapsáno ${risks.length} rizik do threats_library.`);
    process.exit(0);
  } catch (e) { console.error('❌ Chyba seeding:', e); process.exit(1); }
})();
