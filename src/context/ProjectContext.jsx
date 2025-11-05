// src/context/ProjectContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { loadDraft, saveDraft, clearDraft, newLocalProject } from "../services/projectStore";
import { upsertCloudProject } from "../services/projectsCloud";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const ProjectContext = createContext(null);
export const useProject = () => useContext(ProjectContext);

/**
 * ProjectProvider
 * - Udržuje aktivní projekt (lokální nebo cloudový).
 * - Autosave lokálních (id začíná "local-") do localStorage.
 * - Umožní migraci lokálního projektu do cloudu (saveToCloud).
 */
export function ProjectProvider({ children }) {
  const { currentUser, loginWithGoogle } = useAuth();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);

  // Bezpečně načti lokální draft (nebo vytvoř nový)
  useEffect(() => {
    try {
      const draft = loadDraft();
      setProject(draft || newLocalProject());
    } catch (e) {
      console.warn("[ProjectContext] Nepodařilo se načíst draft, vytvářím nový:", e);
      setProject(newLocalProject());
    }
  }, []);

  // Autosave do localStorage (jen pro local-* projekty)
  useEffect(() => {
    if (project && String(project.id).startsWith("local-")) {
      try {
        saveDraft(project);
      } catch (e) {
        console.warn("[ProjectContext] Autosave selhal:", e);
      }
    }
  }, [project]);

  // Jednoduchý updater
  function updateProject(patch) {
    setProject(prev => ({ ...prev, ...patch, updatedAt: Date.now() }));
  }

  /**
   * Čeká na přihlášení uživatele (onAuthStateChanged) s timeoutem.
   * Když se přihlášení nepodaří/odmítnuté okno, promise nevisí donekonečna.
   */
  function waitForAuth({ timeoutMs = 30000 } = {}) {
    return new Promise((resolve, reject) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          try { unsub(); } catch {}
          reject(new Error("Přihlášení vypršelo (timeout)."));
        }
      }, timeoutMs);

      const unsub = onAuthStateChanged(
        auth,
        (user) => {
          if (user && !settled) {
            settled = true;
            clearTimeout(timer);
            unsub();
            resolve(user);
          }
        },
        (err) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            try { unsub(); } catch {}
            reject(err);
          }
        }
      );
    });
  }

  /**
   * Uloží (migruje) aktuální projekt do cloudu.
   * - Pokud uživatel není přihlášen, spustí přihlášení (Google) a čeká max 30 s.
   * - Po úspěchu vyčistí lokální draft a nahradí projekt cloudovou verzí.
   */
  async function saveToCloud() {
    setError(null);
    let user = currentUser;

    try {
      // Zajisti přihlášení
      if (!user) {
        await loginWithGoogle();   // vyvolá přihlášení (popup)
        user = await waitForAuth(); // čeká max 30 s
      }
      if (!user?.uid) throw new Error("Chybí user.uid po přihlášení.");

      // Validace projektu
      if (!project) throw new Error("Není co ukládat — chybí 'project'.");
      if (!project.name || String(project.name).trim() === "") {
        throw new Error("Projekt musí mít vyplněný název.");
      }

      // Upsert do cloudu
      const cloudId = await upsertCloudProject(user, project);

      // Migrace lokálního projektu na cloudový
      const migrated = { ...project, id: cloudId, status: "active" };
      setProject(migrated);
      clearDraft();

      return cloudId;
    } catch (err) {
      console.error("[ProjectContext] saveToCloud() selhalo:", err);
      setError(err?.message || "Uložení do cloudu selhalo.");
      throw err; // propusť dál (pro toast/alert v UI)
    }
  }

  const value = useMemo(
    () => ({
      project,
      updateProject,
      saveToCloud,
      isLocal: project ? String(project.id).startsWith("local-") : true,
      error,
      setError,
      setProject, // volitelné: někdy se hodí mít přímý setter
    }),
    [project, error]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
