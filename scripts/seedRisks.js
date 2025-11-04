/* eslint-disable no-console */
const { admin, db } = require("./_bootstrap");

const risks = [
  { name:"Přelet nepovoleného dronu", category:"fyzická", probability:2, impact:3 },
  { name:"Krádeže", category:"majetková", probability:3, impact:2 },
  { name:"Nenávistné shromáždění", category:"společenská", probability:2, impact:3 },
  { name:"Nájezd vozidla do davu", category:"fyzická", probability:1, impact:4 },
  { name:"Požár nebo výbuch", category:"technická", probability:1, impact:4 },
  { name:"Tlačenice / panika", category:"davová", probability:2, impact:4 },
  { name:"Napadení osob", category:"fyzická", probability:2, impact:3 },
  { name:"Výbušnina v prostoru akce (NVS)", category:"teroristická", probability:1, impact:5 }
];

const slug = s => s.toLowerCase().normalize("NFKD").replace(/[^\w]+/g,"-").replace(/(^-|-$)/g,"");
// ...
const id = slug(r.name);
batch.set(col.doc(id), { ...r, ... });

async function clearCollection(col) {
  const snap = await col.get(); if (snap.empty) return;
  const docs = snap.docs, chunk = 400;
  for (let i = 0; i < docs.length; i += chunk) {
    const b = db.batch();
    docs.slice(i, i + chunk).forEach(d => b.delete(d.ref));
    await b.commit();
  }
}

(async () => {
  try {
    const col = db.collection("threats_library");
    await clearCollection(col); // pokud chceš idempotenci bez mazání, vynech a použij .doc(slug)
    const batch = db.batch();
    risks.forEach(r => batch.set(col.doc(), { ...r, source:"seed", createdAt: admin.firestore.FieldValue.serverTimestamp() }));
    await batch.commit();
    console.log(`✅ Zapsáno ${risks.length} rizik do threats_library.`); process.exit(0);
  } catch (e) { console.error("❌ Chyba seeding:", e); process.exit(1); }
})();
