import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { CircularProgress, Box, Alert } from '@mui/material';
import ProjectRisks from '../../lib/risks/ProjectRisks';
import { defaultProjectRisksValues } from '../../config/defaultProjectRisks';
import { useAuth } from '../../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { generateInitialRisks } from '../../lib/risks/riskGenerator';
import { applyModifiers } from '../../lib/risks';

function ProjectRisksWrapper() {
    const { id: projectId } = useParams();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projectRisks, setProjectRisks] = useState([]);
    const [environmentType, setEnvironmentType] = useState('kombinovaná');
    const [projectType, setProjectType] = useState('akce');
    const [locationSpecifics, setLocationSpecifics] = useState('');
    const [timingSpecifics, setTimingSpecifics] = useState('');
    const [globalVulnerabilities, setGlobalVulnerabilities] = useState([]);
    const [selectedVulnerabilities, setSelectedVulnerabilities] = useState([]);

    // Načtení globálních zranitelností
    useEffect(() => {
        const fetchVulns = async () => {
            if (!db) return;
            try {
                const snap = await getDoc(doc(db, "settings", "globalVulnerabilities"));
                if (snap.exists() && snap.data().vulnerabilities) {
                    setGlobalVulnerabilities(snap.data().vulnerabilities);
                }
            } catch (e) { console.error("Chyba při stahování zranitelností:", e); }
        };
        fetchVulns();
    }, []);

    useEffect(() => {
        if (!projectId) return;

        setLoading(true);

        const initializeAndListen = async () => {
            if (projectId.startsWith('local-')) {
                // LocalStore verze
                import('../../services/localStore').then(async ({ listProjects, updateProject }) => { // <--- Added async
                    const existing = listProjects().find(p => p.id === projectId);
                    if (existing) {
                        setEnvironmentType(existing.environmentType || 'kombinovaná');
                        setProjectType(existing.type || existing.projectType || 'akce');
                        setLocationSpecifics(existing.locationSpecifics || '');
                        setTimingSpecifics(existing.timingSpecifics || '');
                        setSelectedVulnerabilities(existing.selectedVulnerabilities || []);
                        const hasDefaults = existing.customRisks && existing.customRisks.some(r => r.id && r.id.startsWith("risk-default"));
                        if (!existing.customRisks || existing.customRisks.length === 0 || (!hasDefaults && existing.customRisks.length < 5)) {
                            // Je to buď úplně prázdné, nebo starý legacy projekt
                            const initRisks = await generateInitialRisks(currentUser?.uid, existing); 

                            // Zahovej jakákoliv existující custom rizika
                            const merged = existing.customRisks ? [...initRisks, ...existing.customRisks] : initRisks;

                            updateProject({ ...existing, customRisks: merged });
                            setProjectRisks(merged);
                        } else {
                            setProjectRisks(existing.customRisks);
                        }
                    } else {
                        setError('Lokální projekt nebyl nalezen.');
                    }
                    setLoading(false);
                });
                return;
            }

            if (!db) {
                setLoading(false);
                setError('Připojení k databázi není dostupné.');
                return;
            }

            const projectRef = doc(db, 'projects', projectId);

            try {
                // Skontrolujeme a případně zkusíme inicializovat
                const docSnap = await getDoc(projectRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const hasDefaults = data.customRisks && data.customRisks.some(r => r.id && r.id.startsWith("risk-default"));

                    if (!data.customRisks || data.customRisks.length === 0 || (!hasDefaults && data.customRisks.length < 5)) {
                        const initRisks = await generateInitialRisks(currentUser?.uid, data); 
                        const merged = data.customRisks ? [...initRisks, ...data.customRisks] : initRisks;

                        await setDoc(projectRef, {
                            customRisks: merged,
                            customRisksInitialized: serverTimestamp()
                        }, { merge: true });
                        // Firebase listener nás zachytí
                    }
                } else {
                    setError('Projekt nebyl nalezen.');
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Chyba při inicializaci rizik projektu", err);
                setError('Nepodařilo se ověřit rizika projektu.');
            }

            // Real-time listener
            const unsubscribe = onSnapshot(projectRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setEnvironmentType(data.environmentType || 'kombinovaná');
                    setProjectType(data.type || data.projectType || 'akce');
                    setProjectRisks(data.customRisks || []);
                    setLocationSpecifics(data.locationSpecifics || '');
                    setTimingSpecifics(data.timingSpecifics || '');
                    setSelectedVulnerabilities(data.selectedVulnerabilities || []);
                }
                setLoading(false);
            }, (err) => {
                console.error("Chyba při stahování rizik projektu", err);
                setError('Došlo k chybě při načítání rizik.');
                setLoading(false);
            });

            return unsubscribe;
        };

        let unsub = () => { };
        initializeAndListen().then(res => { if (typeof res === 'function') unsub = res; });
        return () => unsub();
    }, [projectId, generateInitialRisks, currentUser]);

    const handleUpdateSpecifics = async (field, value) => {
        if (field === 'locationSpecifics') setLocationSpecifics(value);
        if (field === 'timingSpecifics') setTimingSpecifics(value);

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects, updateProject }) => {
                const existing = listProjects().find(p => p.id === projectId);
                if (existing) {
                    updateProject({ ...existing, [field]: value, lastModified: new Date().toISOString() });
                }
            });
            return;
        }

        if (db) {
            const projectRef = doc(db, 'projects', projectId);
            await setDoc(projectRef, {
                [field]: value,
                lastEdited: serverTimestamp()
            }, { merge: true });
        }
    };

    const handleUpdateRisks = async (updatedRisks) => {
        setProjectRisks(updatedRisks);

        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects, updateProject }) => {
                const existing = listProjects().find(p => p.id === projectId);
                if (existing) {
                    updateProject({ ...existing, customRisks: updatedRisks, lastModified: new Date().toISOString() });
                }
            });
            return;
        }

        if (db) {
            const projectRef = doc(db, 'projects', projectId);
            await setDoc(projectRef, {
                customRisks: updatedRisks,
                lastEdited: serverTimestamp()
            }, { merge: true });
        }
    };

    const handleCreateRisk = async (newRiskData) => {
        const pTotal = (Number(newRiskData.availability) || 1) + (Number(newRiskData.occurrence) || 1) + (Number(newRiskData.complexity) || 1);
        const isOutdoor = environmentType === 'venkovní' || environmentType === 'vnější';
        const facilityImpact = isOutdoor ? 0 : (Number(newRiskData.facility) || 1);
        const dTotal = (Number(newRiskData.lifeAndHealth) || 1) + facilityImpact + (Number(newRiskData.financial) || 1) + (Number(newRiskData.community) || 1);

        const newRisk = {
            id: `risk-custom-${uuidv4()}`,
            name: newRiskData.name,
            probability: pTotal,
            impact: dTotal,
            availability: newRiskData.availability || 1,
            occurrence: newRiskData.occurrence || 1,
            complexity: newRiskData.complexity || 1,
            lifeAndHealth: newRiskData.lifeAndHealth || 1,
            facility: newRiskData.facility || 1,
            financial: newRiskData.financial || 1,
            community: newRiskData.community || 1
        };
        const updatedRisks = [...projectRisks, newRisk];
        await handleUpdateRisks(updatedRisks);
    };

    const handleUpdateRisk = async (id, updatedData) => {
        const updatedRisks = projectRisks.map(r => {
            if (r.id === id) {
                const merged = { ...r, ...updatedData };
                const pTotal = (Number(merged.availability) || 1) + (Number(merged.occurrence) || 1) + (Number(merged.complexity) || 1);
                const isOutdoor = environmentType === 'venkovní' || environmentType === 'vnější';
                const facilityImpact = isOutdoor ? 0 : (Number(merged.facility) || 1);
                const dTotal = (Number(merged.lifeAndHealth) || 1) + facilityImpact + (Number(merged.financial) || 1) + (Number(merged.community) || 1);
                return {
                    ...merged,
                    probability: pTotal,
                    impact: dTotal
                };
            }
            return r;
        });
        await handleUpdateRisks(updatedRisks);
    };

    const handleDeleteRisk = async (id) => {
        if (!window.confirm("Opravdu chcete toto riziko z projektu odstranit?")) return;
        const updatedRisks = projectRisks.filter(r => r.id !== id);
        await handleUpdateRisks(updatedRisks);
    };

    if (loading) return <Box p={8} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (error) return <Box p={4}><Alert severity="error">{error}</Alert></Box>;

    // Aplikuj modifikátory zranitelností na rizika projektu
    const risksWithModifiers = projectRisks.map(risk =>
        applyModifiers(risk, selectedVulnerabilities, globalVulnerabilities)
    );

    return (
        <ProjectRisks
            risks={risksWithModifiers}
            environmentType={environmentType}
            projectType={projectType}
            locationSpecifics={locationSpecifics}
            timingSpecifics={timingSpecifics}
            onUpdateSpecifics={handleUpdateSpecifics}
            onCreateRisk={handleCreateRisk}
            onUpdateRisk={handleUpdateRisk}
            onDeleteRisk={handleDeleteRisk}
            activeVulnerabilities={selectedVulnerabilities}
            globalVulnerabilities={globalVulnerabilities}
        />
    );
}

export default ProjectRisksWrapper;
