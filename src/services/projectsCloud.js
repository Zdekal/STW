import { db } from "../firebase";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";

/** Creates/updates a project in Firestore under the given user */
export async function upsertCloudProject(user, project) {
  const pid = project.id && !String(project.id).startsWith("local-")
    ? project.id
    : crypto.randomUUID();

  const ref = doc(db, "projects", pid);
  await setDoc(ref, {
    ownerId: user.uid,
    name: project.name || "Nový projekt",
    status: project.status || "active",
    data: project.data || {},
    members: [user.uid],              // top-level array required by Dashboard query + Firestore rules
    updatedAt: serverTimestamp(),
    createdAt: project.createdAt ? new Date(project.createdAt) : serverTimestamp(),
  }, { merge: true });

  // Also write owner into the members subcollection
  const membersRef = doc(collection(db, "projects", pid, "members"), user.uid);
  await setDoc(membersRef, {
    role: "owner",
    addedAt: serverTimestamp(),
  }, { merge: true });

  return pid;
}

/** Add a collaborator (future invite UI) */
export async function addCollaborator(projectId, uid, role = "editor") {
  const ref = doc(db, "projects", projectId, "members", uid);
  await setDoc(ref, { role, addedAt: serverTimestamp() }, { merge: true });
}
