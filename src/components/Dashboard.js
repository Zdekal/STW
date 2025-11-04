import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProjectHeader from "./ProjectHeader";
import {
  Box, Button, Typography, Grid, CircularProgress, Alert,
  Dialog, DialogActions, DialogContent, DialogTitle, TextField
} from "@mui/material";
import ProjectCard from "./ProjectCard";

export default function Dashboard() {
  const { currentUser, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);           // loading projektů
  const [error, setError] = useState("");

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

  const navigate = useNavigate();

  // Načtení projektů aktuálního uživatele
  useEffect(() => {
    // počkej, až doběhne auth
    if (authLoading) return;

    // není přihlášen? ukonči načítání a zobraz info
    if (!currentUser) {
      setProjects([]);
      setError("Uživatel není přihlášen.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    // schéma s polem members: [uid]
    const q = query(
      collection(db, "projects"),
      where("members", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProjects(list);
        setLoading(false);
      },
      (err) => {
        console.error("Chyba při načítání projektů:", err);
        setError("Nepodařilo se načíst projekty.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, authLoading]);

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
    if (!currentUser) {
      setError("Pro vytvoření projektu musíte být přihlášen.");
      return;
    }
    if (!newProjectData.name) {
      alert("Název projektu je povinný.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "projects"), {
        ...newProjectData,
        projectType: selectedProjectType,
        ownerId: currentUser.uid,
        members: [currentUser.uid],             // pokud časem půjdeš na subkolekci members, uprav viz poznámka níže
        createdAt: serverTimestamp(),
        lastModified: serverTimestamp()
      });

      handleCloseAllModals();
      navigate(`/project/${docRef.id}`);
    } catch (err) {
      console.error("Chyba při vytváření projektu:", err);
      setError("Vytvoření projektu selhalo.");
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
      {/* Hlavička projektu (lokální draft + Save to cloud) */}
      <ProjectHeader />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} mt={2}>
        <Typography variant="h4" component="h1">Moje projekty</Typography>
        <Button variant="contained" size="large" onClick={handleOpenTypeSelectionModal}>
          + Založit nový projekt
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
        <DialogTitle>Založit nový projekt typu „{selectedProjectType}“</DialogTitle>
        <DialogContent>
          <TextField autoFocus required margin="dense" name="name" label="Název projektu (interní)" fullWidth variant="standard" onChange={handleInputChange} />
          <TextField margin="dense" name="organizationName" label="Oficiální název organizace" fullWidth variant="standard" onChange={handleInputChange} />
          <TextField margin="dense" name="authorName" label="Autor projektu" fullWidth variant="standard" onChange={handleInputChange} />
          <TextField margin="dense" name="organizationAddress" label="Adresa organizace" fullWidth variant="standard" onChange={handleInputChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAllModals}>Zrušit</Button>
          <Button onClick={handleCreateProject} variant="contained">Vytvořit projekt</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
