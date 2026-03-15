// src/components/Dashboard.js
import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useProject } from "../context/ProjectContext"; // ⟵ volitelné: pro zobrazení chyb ukládání
import ProjectHeader from "./ProjectHeader";
import {
  Box, Button, Typography, Grid, CircularProgress, Alert,
  Dialog, DialogActions, DialogContent, DialogTitle, TextField
} from "@mui/material";
import ProjectCard from "./ProjectCard";

export default function Dashboard() {
  const { currentUser, loading: authLoading } = useAuth();
  const { error: projectError } = useProject?.() || {}; // ⟵ volitelné (pokud kontext existuje)
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);           // loading projektů
  const [error, setError] = useState("");

  // DEV offline režim (umožní zakládat projekty bez přihlášení)
  const OFFLINE = String(process.env.REACT_APP_DEV_OFFLINE || "").toLowerCase() === "true";
  const user = currentUser || (OFFLINE ? { uid: "DEV_USER" } : null);

  // modály
  const [isTypeSelectionModalOpen, setIsTypeSelectionModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedProjectType, setSelectedProjectType] = useState(null);
  const [newProjectData, setNewProjectData] = useState({
    name: "",
    organizationName: "",
    authorName: "",
    organizationAddress: ""
  });

  const [creating, setCreating] = useState(false); // ⟵ disable tlačítka při vytváření
  const navigate = useNavigate();

  // Načtení projektů aktuálního uživatele
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProjects([]);
      setError("Uživatel není přihlášen.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    // Query 1: projects where user is in members array (new schema)
    const qMembers = query(
      collection(db, "projects"),
      where("members", "array-contains", user.uid)
    );
    // Query 2: projects where user is the owner (backward compat — old docs without members field)
    const qOwner = query(
      collection(db, "projects"),
      where("ownerId", "==", user.uid)
    );

    const unsubscribeMembers = onSnapshot(
      qMembers,
      (snap) => {
        setProjects(prev => {
          const memberIds = new Set(snap.docs.map(d => d.id));
          const ownerOnly = prev.filter(p => !memberIds.has(p.id) && p._source === 'owner');
          const memberDocs = snap.docs.map(d => ({ id: d.id, ...d.data(), _source: 'members' }));
          return [...memberDocs, ...ownerOnly];
        });
        setLoading(false);
      },
      (err) => {
        console.error("Chyba při načítání projektů (members):", err);
        setLoading(false);
      }
    );

    const unsubscribeOwner = onSnapshot(
      qOwner,
      (snap) => {
        setProjects(prev => {
          const existingIds = new Set(prev.filter(p => p._source === 'members').map(p => p.id));
          const ownerDocs = snap.docs
            .filter(d => !existingIds.has(d.id))
            .map(d => ({ id: d.id, ...d.data(), _source: 'owner' }));
          const memberDocs = prev.filter(p => p._source === 'members');
          return [...memberDocs, ...ownerDocs];
        });
        setLoading(false);
      },
      (err) => {
        console.error("Chyba při načítání projektů (owner):", err);
        setError("Nepodařilo se načíst projekty.");
        setLoading(false);
      }
    );

    return () => { unsubscribeMembers(); unsubscribeOwner(); };
  }, [user, authLoading]);

  // modály
  const handleOpenTypeSelectionModal = () => setIsTypeSelectionModalOpen(true);
  const handleCloseAllModals = () => {
    setIsTypeSelectionModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedProjectType(null);
    setNewProjectData({ name: "", organizationName: "", authorName: "", organizationAddress: "" });
  };
  const handleTypeSelect = (type) => {
    setSelectedProjectType(type);
    setIsTypeSelectionModalOpen(false);
    setIsDetailsModalOpen(true);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProjectData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProject = async () => {
    if (!user) {
      setError("Pro vytvoření projektu musíte být přihlášen.");
      return;
    }
    if (!selectedProjectType) {
      setError("Vyberte typ projektu (Akce / Objekt / Kampus).");
      return;
    }
    if (!newProjectData.name?.trim()) {
      alert("Název projektu je povinný.");
      return;
    }

    try {
      setCreating(true);
      const docRef = await addDoc(collection(db, "projects"), {
        ...newProjectData,
        projectType: selectedProjectType,
        ownerId: user.uid,
        members: [user.uid], // pokud časem půjdeš na subkolekci members, uprav to zde
        createdAt: serverTimestamp(),
        lastModified: serverTimestamp()
      });

      handleCloseAllModals();
      navigate(`/project/${docRef.id}`);
    } catch (err) {
      console.error("Chyba při vytváření projektu:", err);
      const msg = err?.message || err?.code || "Vytvoření projektu selhalo.";
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  // stavové obrazovky
  if (authLoading || loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Info banner pro offline režim */}
      {OFFLINE && !currentUser && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Vývojový režim bez přihlášení (uživatel: DEV_USER). Vypni přes REACT_APP_DEV_OFFLINE=false.
        </Alert>
      )}

      {/* Chyby z ProjectContextu (např. ukládání do cloudu v hlavičce) */}
      {projectError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {projectError}
        </Alert>
      )}

      {/* Lokální chyba stránky */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Hlavička projektu (lokální draft + Save to cloud) */}
      <ProjectHeader />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} mt={2}>
        <Typography variant="h4" component="h1">Moje projekty</Typography>
        <Button
          variant="contained"
          size="large"
          onClick={handleOpenTypeSelectionModal}
          disabled={creating}
        >
          + Založit nový projekt
        </Button>
      </Box>

    <Grid container spacing={3}>
    {projects.length > 0 ? (
        projects.map((project) => (
        <Grid item key={project.id} xs={12} sm={6} md={4}>
            <ProjectCard project={project} />
        </Grid>
        ))
    ) : (
        <Grid item xs={12}>
        <Typography sx={{ p: 2 }}>
            Zatím nemáte žádné projekty. Založte si první!
        </Typography>
        </Grid>
    )}
    </Grid>

      {/* Dialog: výběr typu */}
      <Dialog open={isTypeSelectionModalOpen} onClose={handleCloseAllModals}>
        <DialogTitle>Jaký typ projektu chcete založit?</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
          <Button variant="outlined" onClick={() => handleTypeSelect("akce")}>Akce</Button>
          <Button variant="outlined" onClick={() => handleTypeSelect("objekt")}>Objekt</Button>
          <Button variant="outlined" onClick={() => handleTypeSelect("kampus")}>Kampus</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAllModals}>Zrušit</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: detaily projektu */}
      <Dialog open={isDetailsModalOpen} onClose={handleCloseAllModals} maxWidth="sm" fullWidth>
        <DialogTitle>Založit nový projekt typu „{selectedProjectType || "—"}“</DialogTitle>
        <DialogContent>
          <TextField autoFocus required margin="dense" name="name" label="Název projektu (interní)" fullWidth variant="standard" onChange={handleInputChange} />
          <TextField margin="dense" name="organizationName" label="Oficiální název organizace" fullWidth variant="standard" onChange={handleInputChange} />
          <TextField margin="dense" name="authorName" label="Autor projektu" fullWidth variant="standard" onChange={handleInputChange} />
          <TextField margin="dense" name="organizationAddress" label="Adresa organizace" fullWidth variant="standard" onChange={handleInputChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAllModals}>Zrušit</Button>
          <Button onClick={handleCreateProject} variant="contained" disabled={creating}>
            {creating ? "Vytvářím…" : "Vytvořit projekt"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
