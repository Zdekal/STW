import { db } from "../firebase";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";

/** Vytvoří/zaktualizuje projekt ve Firestore pod uživatelem */
export async function upsertCloudProject(user, project) {
  const pid = project.id || crypto.randomUUID();
  const ref = doc(db, "projects", pid);
  await setDoc(ref, {
    ownerUid: user.uid,
    title: project.title || "Projekt",
    status: project.status || "active",
    data: project.data || {},
    updatedAt: serverTimestamp(),
    createdAt: project.createdAt ? new Date(project.createdAt) : serverTimestamp(),
  }, { merge: true });

  // zajisti členství vlastníka
  const membersRef = doc(collection(db, "projects", pid, "members"), user.uid);
  await setDoc(membersRef, {
    role: "owner",
    addedAt: serverTimestamp(),
  }, { merge: true });

  return pid;
}

/** Přidá spolupracovníka (později UI na pozvánku) */
export async function addCollaborator(projectId, uid, role = "editor") {
  const ref = doc(db, "projects", projectId, "members", uid);
  await setDoc(ref, { role, addedAt: serverTimestamp() }, { merge: true });
}
