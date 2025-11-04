/* eslint-disable no-console */
const { admin, db } = require("./_bootstrap");

const risks = [
  { name: "Přelet nepovoleného dronu", category: "fyzická", probability: 2, impact: 3 },
  { name: "Krádeže", category: "majetková", probability: 3, impact: 2 },
  { name: "Nenávistné shromáždění", category: "společenská", probability: 2, impact: 3 },
  { name: "Nájezd vozidla do davu", category: "fyzická", probability: 1, impact: 4 },
  { name: "Požár nebo výbuch", category: "technická", probability: 1, impact: 4 },
  { name: "Tlačenice / panika", category: "davová", probability: 2, impact: 4 },
  { name: "Napadení osob", category: "fyzická", probability: 2, impact: 3 },
  { name: "Výbušnina v prostoru akce (NVS)", category: "teroristická", probability: 1, impact: 5 }
];

const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w]+/g, "-")
    .replace(/(^-|-$)/g, "");

(async () => {
  try {
    const col = db.collection("threats_library");
    const batch = db.batch();

    risks.forEach((r) => {
      const id = slug(r.name); // stabilní ID
      batch.set(
        col.doc(id),
        {
          ...r,
          source: "seed",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true } // idempotentní upsert
      );
    });

    await batch.commit();
    console.log(`✅ Upsert hotov pro ${risks.length} rizik do threats_library.`);
    process.exit(0);
  } catch (e) {
    console.error("❌ Chyba seeding:", e);
    process.exit(1);
  }
})();
