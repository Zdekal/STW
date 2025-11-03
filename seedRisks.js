// scripts/seedRisks.js
// Naplní Firestore kolekci threats_library (pro testovací prostředí / emulátor)

const admin = require("firebase-admin");

const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT ||
  process.env.GCLOUD_PROJECT ||
  "eventsecurityplanner";

admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

const risks = [
  {
    name: "Přelet nepovoleného dronu",
    category: "fyzická hrozba",
    description:
      "Narušení akce nebo ohrožení účastníků pomocí bezpilotního prostředku.",
    probability: 2,
    impact: 3,
  },
  {
    name: "Krádeže",
    category: "majetková hrozba",
    description:
      "Kapsáři, krádeže z vozidel nebo zázemí akce, odcizení techniky.",
    probability: 3,
    impact: 2,
  },
  {
    name: "Nenávistné shromáždění",
    category: "společenská hrozba",
    description:
      "Narušení akce skupinou protestujících, extremistické projevy.",
    probability: 2,
    impact: 3,
  },
  {
    name: "Nájezd vozidla do davu",
    category: "fyzická hrozba",
    description:
      "Úmyslný nebo neúmyslný nájezd motorovým vozidlem do prostoru s lidmi.",
    probability: 1,
    impact: 4,
  },
  {
    name: "Požár nebo výbuch",
    category: "technická hrozba",
    description:
      "Vznícení stánků, elektroinstalace nebo úmyslné zapálení výbušniny.",
    probability: 1,
    impact: 4,
  },
  {
    name: "Tlačenice / panika",
    category: "davová hrozba",
    description:
      "Nekontrolovaný pohyb davu, přetlak u vstupů, nebezpečí pádu a udušení.",
    probability: 2,
    impact: 4,
  },
  {
    name: "Napadení osob",
    category: "fyzická hrozba",
    description: "Útok jednotlivce nebo skupiny proti účastníkům akce.",
    probability: 2,
    impact: 3,
  },
  {
    name: "Výbušnina umístěná v prostoru akce (NVS)",
    category: "teroristická hrozba",
    description:
      "Podomácku vyrobené výbušné zařízení nebo improvizovaná bomba.",
    probability: 1,
    impact: 5,
  },
];

(async () => {
  try {
    const batch = db.batch();
    const col = db.collection("threats_library");

    // Vyčistit staré záznamy
    const snap = await col.get();
    snap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    // Přidat nové hrozby
    const batch2 = db.batch();
    risks.forEach((r) => {
      const ref = col.doc();
      batch2.set(ref, {
        ...r,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        source: "seed",
      });
    });
    await batch2.commit();

    console.log(
      `✅ Zapsáno ${risks.length} rizik do threats_library (projekt: ${PROJECT_ID}).`
    );
    process.exit(0);
  } catch (e) {
    console.error("❌ Chyba seeding:", e);
    process.exit(1);
  }
})();