import { db } from "../firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  arrayUnion,
  where,
  orderBy,
} from "firebase/firestore";
import { allPossibleRisks } from "../config/securityData";
import { defaultProjectRisksValues } from "../config/defaultProjectRisks";
import { cyclingRisks } from "../config/cyclingData";
import { eventTypeRisksMapping, outdoorRisks } from "../config/eventTypesRisks";
import { generateInitialRisks } from "../lib/risks/riskGenerator";

/**
 * Realtime seznam projektů, ke kterým má uživatel přístup.
 * - ownerId == uid || memberIds array-contains uid (pro rychlý seznam)
 */
export function subscribeProjectsForUser(uid, cb, onError) {
  if (!db) throw new Error("Firestore is not initialized");
  const q = query(
    collection(db, "projects"),
    where("memberIds", "array-contains", uid),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), onError);
}

export async function createCloudProject(uid, { name, projectType, meta = {}, ...rest }) {
  if (!db) throw new Error("Firestore is not initialized");

  // Automatické vygenerování startovních 19 rizik dle metodiky MV + nově definice BetterSafe
  let initialRisks = [];

  if (projectType === "cyklozavod") {
    initialRisks = cyclingRisks.map((def, idx) => ({
      ...def,
      id: `risk-default-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString()
    }));
  } else {
    // Použijeme centrální logiku pro generování přesných defaultních rizik s ohledem na kapacitu, prostředí a zranitelnosti!
    initialRisks = await generateInitialRisks(uid, { projectType, ...rest });
  }



  const ref = await addDoc(collection(db, "projects"), {
    name,
    projectType,
    meta,
    ...rest, // Naplní údaje z Wizarda: audienceSize, environmentType
    customRisks: initialRisks, // Nastavení prvních rizik
    ownerId: uid,
    memberIds: [uid],
    members: { [uid]: "owner" },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastEditedBy: uid,
    lastEditedAt: serverTimestamp(),
  });
  return { id: ref.id };
}

export async function updateCloudProject(projectId, patch) {
  if (!db) throw new Error("Firestore is not initialized");
  await updateDoc(doc(db, "projects", projectId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCloudProject(projectId) {
  if (!db) throw new Error("Firestore is not initialized");
  await deleteDoc(doc(db, "projects", projectId));
}

/**
 * Přidání člena do projektu – jednoduchý helper (pozvánky řešte samostatně).
 */
export async function addProjectMember(projectId, uid, role = "editor") {
  if (!db) throw new Error("Firestore is not initialized");
  await setDoc(
    doc(db, "projects", projectId, "members", uid),
    { role, addedAt: serverTimestamp() },
    { merge: true }
  );
  // pro rychlé filtrování v dashboardu
  await updateDoc(doc(db, "projects", projectId), {
    [`members.${uid}`]: role,
    memberIds: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  }).catch(() => { });
}
