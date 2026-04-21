// src/components/Dashboard.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

import ProjectCard from "./ProjectCard";
import ProjectWizard from "./project/ProjectWizard";
import { useAuth } from "../context/AuthContext";
import { listProjects, createProject } from "../services/localStore";
import { createCloudProject, subscribeProjectsForUser } from "../services/projectsCloud";

const LOCAL_MODE = String(process.env.REACT_APP_LOCAL_MODE || "").toLowerCase() === "true";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProjectType, setSelectedProjectType] = useState(null);

  const [creating, setCreating] = useState(false);

  // ochrana proti setState po unmountu
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const main = document.querySelector("main");
    if (main && typeof main.scrollTo === "function") {
      main.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  const isCloud = useMemo(() => !LOCAL_MODE && !!currentUser?.uid, [currentUser?.uid]);

  // načtení projektů
  useEffect(() => {
    setError("");
    setLoading(true);

    if (!isCloud) {
      try {
        const rows = listProjects();
        if (mountedRef.current) setProjects(rows);
      } catch (e) {
        console.warn(e);
        if (mountedRef.current) setError("Nepodařilo se načíst projekty.");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
      return;
    }

    const unsub = subscribeProjectsForUser(
      currentUser.uid,
      (rows) => {
        if (!mountedRef.current) return;
        setProjects(rows);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        if (!mountedRef.current) return;
        setError("Nepodařilo se načíst projekty z cloudu.");
        setLoading(false);
      }
    );

    return () => unsub?.();
  }, [isCloud, currentUser?.uid]);

  const openCreateModal = (typeValue) => {
    setError("");
    setSelectedProjectType(typeValue);
    setIsDetailsModalOpen(true);
  };

  const closeAllModals = () => {
    setIsDetailsModalOpen(false);
    setSelectedProjectType(null);
    setError("");
  };

  const refreshLocalProjects = () => {
    if (!isCloud) {
      try {
        setProjects(listProjects());
      } catch (e) {
        console.warn(e);
        setError("Nepodařilo se obnovit lokální projekty.");
      }
    }
  };

  const handleCreateProjectFromWizard = async (wizardData) => {
    setError("");
    if (!selectedProjectType) return;

    try {
      setCreating(true);
      const payload = {
        name: wizardData.name.trim(),
        projectType: selectedProjectType,
        audienceSize: wizardData.audienceSize || 0,
        environmentType: wizardData.environmentType || "",
        eventType: wizardData.eventType || "",
        duration: wizardData.duration || "",
        hasControlRoom: !!wizardData.hasControlRoom,
        accessModel: wizardData.accessModel || {},
        selectedVulnerabilities: wizardData.selectedVulnerabilities || [],
        meta: {},
      };

      if (!isCloud) {
        const project = createProject(payload);
        refreshLocalProjects();
        closeAllModals();
        navigate(`/project/${project.id}`);
        return;
      }

      const created = await createCloudProject(currentUser.uid, payload);
      closeAllModals();
      navigate(`/project/${created.id}`);
    } catch (err) {
      console.error("Chyba při vytváření projektu:", err);
      setError("Vytvoření projektu selhalo.");
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Hero Section */}
      <div className="bg-[#0f172a] text-white rounded-3xl p-10 mb-12 shadow-[0_20px_40px_-15px_rgba(30,41,59,0.3)] relative overflow-hidden">
        {/* Pozadí převzaté z inspirace (Gradient mix) */}
        <div className="absolute inset-0 opacity-60 bg-gradient-to-br from-indigo-900 via-[#0f172a] to-black"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-5 tracking-tight text-white">Bezpečnostní Portál</h1>
          <p className="text-lg text-slate-300 mb-12 max-w-2xl font-light leading-relaxed">
            Centrální systém pro správu bezpečnostní dokumentace, hodnocení rizik a detailní plánování struktury a zabezpečení.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              onClick={() => openCreateModal("event")}
              className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md p-6 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-start group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
            >
              <div className="w-14 h-14 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-50">Nová Akce</h3>
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300 leading-relaxed">Bezpečnostní plán a generátor checklistů pro jednorázovou událost.</p>
            </div>

            <div
              onClick={() => openCreateModal("objekt")}
              className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md p-6 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-start group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
            >
              <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                <i className="fas fa-building"></i>
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-50">Nový Objekt</h3>
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300 leading-relaxed">Kompletní analýza ohroženosti a bezpečnostní projekt budovy.</p>
            </div>

            <div
              onClick={() => openCreateModal("kampus")}
              className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md p-6 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-start group hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
            >
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 shadow-inner">
                <i className="fas fa-city"></i>
              </div>
              <h3 className="text-xl font-bold mb-2 text-slate-50">Nový Areál</h3>
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300 leading-relaxed">Správa komplexu budov s centrálním přehledem a dílčími objekty.</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Moje Projekty Section */}
      <div className="mb-8 flex justify-between items-end border-b pb-4 border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Moje projekty</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Data jsou {isCloud ? "synchronizována přes Firebase" : "uložena lokálně"}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={refreshLocalProjects}
            />
          ))
        ) : (
          <div className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500">
            Zatím nemáte žádné projekty. Zvolte jeden z typů nahoře a začněte!
          </div>
        )}
      </div>

      {/* Celoobrazovkový Wizard nahrazuje původní Dialog */}
      {isDetailsModalOpen && selectedProjectType && (
        <ProjectWizard
          selectedProjectType={selectedProjectType}
          onComplete={handleCreateProjectFromWizard}
          onCancel={closeAllModals}
        />
      )}
    </div>
  );
}
