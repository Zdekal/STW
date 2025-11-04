import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { loadDraft, saveDraft, clearDraft, newLocalProject } from "../services/projectStore";
import { upsertCloudProject } from "../services/projectsCloud";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const ProjectContext = createContext();
export const useProject = () => useContext(ProjectContext);

export default function ProjectProvider({ children }) {
  const { currentUser, loginWithGoogle } = useAuth();
  const [project, setProject] = useState(null);

  // načti draft nebo vytvoř nový
  useEffect(() => {
    const draft = loadDraft();
    setProject(draft || newLocalProject());
  }, []);

  // autosave do localStorage jen pro local projekty
  useEffect(() => {
    if (project && String(project.id).startsWith("local-")) {
      saveDraft(project);
    }
  }, [project]);

  function updateProject(patch) {
    setProject(prev => ({ ...prev, ...patch, updatedAt: Date.now() }));
  }

  // počká na přihlášení (když se volá saveToCloud bez přihlášení)
  function waitForAuth() {
    return new Promise(resolve => {
      const unsub = onAuthStateChanged(auth, user => {
        if (user) { unsub(); resolve(user); }
      });
    });
  }

  async function saveToCloud() {
    let user = currentUser;
    if (!user) {
      await loginWithGoogle();          // vyvolá přihlášení
      user = await waitForAuth();       // a počká na stav
    }
    const cloudId = await upsertCloudProject(user, project);
    const migrated = { ...project, id: cloudId, status: "active" };
    setProject(migrated);
    clearDraft();
    return cloudId;
  }

  const value = useMemo(() => ({
    project,
    updateProject,
    saveToCloud,
    isLocal: project ? String(project.id).startsWith("local-") : true,
  }), [project]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
