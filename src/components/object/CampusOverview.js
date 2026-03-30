import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, deleteField } from 'firebase/firestore';
import { db, storage, auth } from '../../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    Typography, Button, Box, Grid, CircularProgress, Alert, Paper, Input, LinearProgress,
    TextField, IconButton, Tooltip, Avatar, styled
} from '@mui/material';
import CampusObjectTile from './CampusObjectTile';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const HoverContainer = styled(Box)({
    position: 'relative',
    '& .controls': {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '8px',
        padding: '2px',
        opacity: 0,
        transition: 'opacity 0.2s',
    },
    '&:hover .controls': {
        opacity: 1,
    },
});

function CampusOverview() {
    const { id: projectId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projectDetails, setProjectDetails] = useState(null);
    const [buildings, setBuildings] = useState([]);

    // Stavy pro nový editační režim
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    // Ostatní stavy
    const [mapUrl, setMapUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [mapUploading, setMapUploading] = useState(false);
    const [logoUploading, setLogoUploading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Načítání dat
    useEffect(() => {
        if (!projectId) return;

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects }) => {
                const lp = listProjects().find(p => p.id === projectId);
                if (lp) {
                    setProjectDetails(lp);
                    setFormData({
                        name: lp.name || '',
                        authorName: lp.authorName || '',
                        organizationName: lp.organizationName || '',
                        organizationAddress: lp.organizationAddress || '',
                    });
                    setMapUrl(lp.campusMapUrl || '');
                    setLogoUrl(lp.organizationLogoUrl || '');
                    setBuildings(lp.buildings ? Object.values(lp.buildings) : []);
                } else {
                    setError("Projekt nenalezen.");
                }
                setLoading(false);
            });
            return;
        }

        if (!db) {
            setLoading(false);
            return;
        }

        const projectRef = doc(db, 'projects', projectId);
        const unsubscribeProject = onSnapshot(projectRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setProjectDetails(data);
                // Nastavíme formulářová data při každé změně z DB
                setFormData({
                    name: data.name || '',
                    authorName: data.authorName || '',
                    organizationName: data.organizationName || '',
                    organizationAddress: data.organizationAddress || '',
                });
                setMapUrl(data.campusMapUrl || '');
                setLogoUrl(data.organizationLogoUrl || '');
            } else {
                setError("Projekt nenalezen.");
            }
            setLoading(false);
        });

        const buildingsRef = collection(db, 'projects', projectId, 'buildings');
        const unsubscribeBuildings = onSnapshot(buildingsRef, (snapshot) => {
            setBuildings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubscribeProject();
            unsubscribeBuildings();
        };
    }, [projectId]);

    const handleEditToggle = () => {
        if (!isEditing) {
            // Při vstupu do editačního módu načteme čerstvá data
            setFormData({
                name: projectDetails.name || '',
                authorName: projectDetails.authorName || '',
                organizationName: projectDetails.organizationName || '',
                organizationAddress: projectDetails.organizationAddress || '',
            });
        }
        setIsEditing(!isEditing);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        try {
            if (projectId.startsWith('local-')) {
                import('../../services/localStore').then(({ listProjects, updateProject }) => {
                    const existing = listProjects().find(p => p.id === projectId) || {};
                    updateProject({ ...existing, ...formData, lastModified: new Date().toISOString() });
                    setProjectDetails({ ...existing, ...formData });
                    setIsEditing(false);
                });
                return;
            }

            if (!db) return;
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
                ...formData,
                lastModified: serverTimestamp()
            });
            setIsEditing(false);
        } catch (err) {
            setError("Uložení selhalo. Zkuste to prosím znovu.");
            console.error("Save error:", err);
        }
    };

    // --- OSTATNÍ FUNKCE JSOU ZACHOVÁNY ---
    const handleFileUpload = async (file, path, fieldToUpdate, stateSetter, uploaderStateSetter) => {
        if (!file) return;
        if (!auth || !auth.currentUser) {
            setError("Musíte být přihlášeni.");
            return;
        }
        uploaderStateSetter(true);
        setError(null);
        try {
            const storageRef = ref(storage, `${path}/${projectId}/${file.name}`);
            const metadata = { customMetadata: { uploaderUid: auth.currentUser.uid } };
            await uploadBytes(storageRef, file, metadata);
            const downloadUrl = await getDownloadURL(storageRef);

            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, { [fieldToUpdate]: downloadUrl });

            stateSetter(downloadUrl);
        } catch (err) {
            setError(`Nahrávání selhalo: ${err.message}`);
        }
        uploaderStateSetter(false);
    };

    const handleMapDelete = async () => {
        if (!window.confirm("Opravdu chcete smazat mapu areálu?")) return;
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, { campusMapUrl: deleteField() });
        if (mapUrl) {
            const mapRef = ref(storage, mapUrl);
            await deleteObject(mapRef).catch(e => console.error("Map file might not exist:", e));
        }
        setMapUrl('');
    };

    const handleLogoDelete = async () => {
        if (!window.confirm("Opravdu chcete smazat logo organizace?")) return;
        const projectRef = doc(db, 'projects', projectId);
        await updateDoc(projectRef, { organizationLogoUrl: deleteField() });
        if (logoUrl) {
            const logoRef = ref(storage, logoUrl);
            await deleteObject(logoRef).catch(e => console.error("Logo file might not exist:", e));
        }
        setLogoUrl('');
    };

    const handleObjectDelete = async (buildingIdToDelete) => {
        if (!window.confirm("Opravdu chcete trvale smazat tento objekt?")) return;
        try {
            if (projectId.startsWith('local-')) {
                import('../../services/localStore').then(({ listProjects, updateProject }) => {
                    const existing = listProjects().find(p => p.id === projectId);
                    if (existing && existing.buildings && existing.buildings[buildingIdToDelete]) {
                        const updatedBuildings = { ...existing.buildings };
                        delete updatedBuildings[buildingIdToDelete];
                        updateProject({ ...existing, buildings: updatedBuildings });
                        setBuildings(Object.values(updatedBuildings));
                    }
                });
                return;
            }

            if (!db) return;
            await deleteDoc(doc(db, 'projects', projectId, 'buildings', buildingIdToDelete));
        } catch (err) {
            setError('Nepodařilo se smazat objekt.');
            console.error(err);
        }
    };

    const handleBuildingSelect = (buildingId) => navigate(`/project/${projectId}/object/${buildingId}/overview`);

    const handleAddObject = async () => {
        setIsCreating(true);
        try {
            if (projectId.startsWith('local-')) {
                import('../../services/localStore').then(({ listProjects, updateProject }) => {
                    const existing = listProjects().find(p => p.id === projectId);
                    if (existing) {
                        const newBuildingId = `b-${Date.now()}`;
                        const newBuilding = { id: newBuildingId, name: projectDetails?.projectType === 'cyklozavod' ? "Nová lokace/úsek" : "Nový objekt", createdAt: new Date().toISOString() };
                        const updatedBuildings = { ...(existing.buildings || {}), [newBuildingId]: newBuilding };
                        updateProject({ ...existing, buildings: updatedBuildings });
                        setBuildings(Object.values(updatedBuildings));
                        navigate(`/project/${projectId}/object/${newBuildingId}/overview`);
                    }
                });
            } else if (db) {
                const buildingsCollectionRef = collection(db, 'projects', projectId, 'buildings');
                const newBuildingRef = await addDoc(buildingsCollectionRef, {
                    name: projectDetails?.projectType === 'cyklozavod' ? "Nová lokace/úsek" : "Nový objekt",
                    createdAt: serverTimestamp(),
                });
                navigate(`/project/${projectId}/object/${newBuildingRef.id}/overview`);
            }
        } catch (err) {
            setError("Nepodařilo se vytvořit nový objekt.");
        }
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, flexGrow: 1 }}>
                        <HoverContainer>
                            <Avatar src={logoUrl} sx={{ width: 100, height: 100, fontSize: '2.5rem', bgcolor: 'primary.light' }}>
                                {projectDetails?.organizationName ? projectDetails.organizationName.charAt(0) : '?'}
                            </Avatar>
                            <Box className="controls">
                                <Tooltip title="Změnit logo"><IconButton size="small" component="label"><EditIcon fontSize="small" /><Input type="file" hidden onChange={(e) => handleFileUpload(e.target.files[0], 'organization_logos', 'organizationLogoUrl', setLogoUrl, setLogoUploading)} accept="image/png, image/jpeg" /></IconButton></Tooltip>
                                <Tooltip title="Smazat logo"><IconButton size="small" onClick={handleLogoDelete}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                            </Box>
                        </HoverContainer>
                        {logoUploading && <CircularProgress size={20} sx={{ ml: 1 }} />}

                        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                            {isEditing ? (
                                <>
                                    <Grid item xs={12} md={6}><TextField label="Interní název projektu" fullWidth name="name" value={formData.name || ''} onChange={handleInputChange} /></Grid>
                                    <Grid item xs={12} md={6}><TextField label="Autor projektu" fullWidth name="authorName" value={formData.authorName || ''} onChange={handleInputChange} /></Grid>
                                    <Grid item xs={12} md={6}><TextField label="Oficiální název organizace" fullWidth name="organizationName" value={formData.organizationName || ''} onChange={handleInputChange} /></Grid>
                                    <Grid item xs={12} md={6}><TextField label="Adresa organizace" fullWidth name="organizationAddress" value={formData.organizationAddress || ''} onChange={handleInputChange} /></Grid>
                                </>
                            ) : (
                                <>
                                    <Grid item xs={12}><Typography variant="h5" component="h2">{projectDetails?.name}</Typography></Grid>
                                    <Grid item xs={12} md={6}><Typography><strong>Organizace:</strong> {projectDetails?.organizationName || '–'}</Typography></Grid>
                                    <Grid item xs={12} md={6}><Typography><strong>Autor:</strong> {projectDetails?.authorName || '–'}</Typography></Grid>
                                    <Grid item xs={12}><Typography><strong>Adresa:</strong> {projectDetails?.organizationAddress || '–'}</Typography></Grid>
                                </>
                            )}
                        </Grid>
                    </Box>
                    <Box sx={{ minWidth: '120px', textAlign: 'right' }}>
                        {isEditing ? (
                            <>
                                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveChanges} sx={{ mr: 1 }}>Uložit</Button>
                                <Button variant="text" onClick={handleEditToggle}>Zrušit</Button>
                            </>
                        ) : (
                            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEditToggle}>Upravit</Button>
                        )}
                    </Box>
                </Box>
            </Paper>

            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                    {projectDetails?.projectType === 'cyklozavod' ? 'Mapa Tratě' : 'Mapa Areálu'}
                </Typography>
                {mapUploading && <LinearProgress sx={{ mb: 2 }} />}
                {mapUrl ? (
                    <HoverContainer>
                        <Box component="img" src={mapUrl} alt="Mapa Areálu" sx={{ width: '100%', maxHeight: '400px', objectFit: 'contain', border: '1px solid #ddd', borderRadius: '8px' }} />
                        <Box className="controls">
                            <Tooltip title="Změnit mapu"><IconButton size="small" component="label"><EditIcon fontSize="small" /><Input type="file" hidden onChange={(e) => handleFileUpload(e.target.files[0], 'campus_maps', 'campusMapUrl', setMapUrl, setMapUploading)} accept="image/*" /></IconButton></Tooltip>
                            <Tooltip title="Smazat mapu"><IconButton size="small" onClick={handleMapDelete}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                        </Box>
                    </HoverContainer>
                ) : (
                    <Box sx={{ textAlign: 'center', p: 4, border: '2px dashed #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
                        <Typography color="text.secondary" gutterBottom>
                            {projectDetails?.projectType === 'cyklozavod' ? 'Mapa tratě závodů zatím nebyla nahrána.' : 'Mapa areálu zatím nebyla nahrána.'}
                        </Typography>
                        <Button variant="contained" component="label" startIcon={<AddPhotoAlternateIcon />}>
                            Nahrát mapu
                            <Input type="file" hidden onChange={(e) => handleFileUpload(e.target.files[0], 'campus_maps', 'campusMapUrl', setMapUrl, setMapUploading)} accept="image/*" />
                        </Button>
                    </Box>
                )}
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                    {projectDetails?.projectType === 'cyklozavod' ? 'Přehled úseků a zón' : 'Přehled objektů areálu'}
                </Typography>
                <Button variant="contained" onClick={handleAddObject} disabled={isCreating}>
                    {isCreating ? 'Vytváření...' : (projectDetails?.projectType === 'cyklozavod' ? '+ Přidat zónu/úsek' : '+ Přidat nový objekt')}
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={3}>
                {buildings.map((building) => (
                    <Grid key={building.id} xs={12} sm={6} md={4}>
                        <CampusObjectTile
                            building={building}
                            onSelect={() => handleBuildingSelect(building.id)}
                            onDelete={() => handleObjectDelete(building.id)}
                        />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}

export default CampusOverview;