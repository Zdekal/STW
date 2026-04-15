import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { getLocationTimingConfig, locationTimingToVulnerabilities, computeLocationTimingImpact } from '../../config/locationTimingData';

// Zranitelnosti nevhodné pro venkovní akce
const OUTDOOR_EXCLUDED_VULNS = [
    "Nelze využít evakuační rozhlas",
];

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
    const [eventType, setEventType] = useState('');
    const [projectDates, setProjectDates] = useState([]);
    // Location/Timing state
    const [activeLocationTimings, setActiveLocationTimings] = useState([]);
    const [customLocationTimings, setCustomLocationTimings] = useState([]);

    const isOutdoor = environmentType === 'venkovní' || environmentType === 'vnější';

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

    // Filtrovaná zranitelnosti - vyloučit nevhodné pro venkovní
    const filteredVulnerabilities = useMemo(() => {
        if (!isOutdoor) return globalVulnerabilities;
        return globalVulnerabilities.filter(v => !OUTDOOR_EXCLUDED_VULNS.includes(v.name));
    }, [globalVulnerabilities, isOutdoor]);

    // Konfigurace lokalizace/načasování pro daný typ akce
    const locationTimingConfig = useMemo(() => getLocationTimingConfig(eventType), [eventType]);

    useEffect(() => {
        if (!projectId) return;

        setLoading(true);

        const initializeAndListen = async () => {
            if (projectId.startsWith('local-')) {
                // LocalStore verze
                import('../../services/localStore').then(async ({ listProjects, updateProject }) => {
                    const existing = listProjects().find(p => p.id === projectId);
                    if (existing) {
                        setEnvironmentType(existing.environmentType || 'kombinovaná');
                        setProjectType(existing.type || existing.projectType || 'akce');
                        setLocationSpecifics(existing.locationSpecifics || '');
                        setTimingSpecifics(existing.timingSpecifics || '');
                        setSelectedVulnerabilities(existing.selectedVulnerabilities || []);
                        setEventType(existing.eventType || '');
                        setProjectDates(existing.dates || []);
                        setActiveLocationTimings(existing.activeLocationTimings || []);
                        setCustomLocationTimings(existing.customLocationTimings || []);
                        const hasDefaults = existing.customRisks && existing.customRisks.some(r => r.id && r.id.startsWith("risk-default"));
                        if (!existing.customRisks || existing.customRisks.length === 0 || (!hasDefaults && existing.customRisks.length < 5)) {
                            const initRisks = await generateInitialRisks(currentUser?.uid, existing, globalVulnerabilities);
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
                const docSnap = await getDoc(projectRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const hasDefaults = data.customRisks && data.customRisks.some(r => r.id && r.id.startsWith("risk-default"));

                    if (!data.customRisks || data.customRisks.length === 0 || (!hasDefaults && data.customRisks.length < 5)) {
                        const initRisks = await generateInitialRisks(currentUser?.uid, data, globalVulnerabilities);
                        const merged = data.customRisks ? [...initRisks, ...data.customRisks] : initRisks;

                        await setDoc(projectRef, {
                            customRisks: merged,
                            customRisksInitialized: serverTimestamp()
                        }, { merge: true });
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
                if (docSnap.metadata.hasPendingWrites) return;
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setEnvironmentType(data.environmentType || 'kombinovaná');
                    setProjectType(data.type || data.projectType || 'akce');
                    setProjectRisks(data.customRisks || []);
                    setLocationSpecifics(data.locationSpecifics || '');
                    setTimingSpecifics(data.timingSpecifics || '');
                    setSelectedVulnerabilities(data.selectedVulnerabilities || []);
                    setEventType(data.eventType || '');
                    setProjectDates(data.dates || []);
                    setActiveLocationTimings(data.activeLocationTimings || []);
                    setCustomLocationTimings(data.customLocationTimings || []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, currentUser]);

    // Automatická správa rizika časovky
    const TIME_TRIAL_RISK_ID = 'risk-time-trial-collision';
    const TIME_TRIAL_RISK_NAME = 'Kolize cyklistů s netrpělivými chodci a vozidly (zejména parkoviště OC, benzínové stanice)';

    useEffect(() => {
        if (loading) return;
        const hasTimeTrial = eventType === 'etapovy_cyklisticky_zavod' && projectDates.some(d => d.isTimeTrial);
        const existingIdx = projectRisks.findIndex(r => r.id === TIME_TRIAL_RISK_ID);

        if (hasTimeTrial && existingIdx === -1) {
            const newRisk = {
                id: TIME_TRIAL_RISK_ID,
                name: TIME_TRIAL_RISK_NAME,
                probability: 12,
                impact: 10,
                availability: 5, occurrence: 4, complexity: 3,
                lifeAndHealth: 4, facility: 1, financial: 2, community: 3,
                tags: ['Časovka'],
            };
            const updated = [...projectRisks, newRisk];
            handleUpdateRisks(updated);
        } else if (!hasTimeTrial && existingIdx !== -1) {
            const updated = projectRisks.filter(r => r.id !== TIME_TRIAL_RISK_ID);
            handleUpdateRisks(updated);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventType, projectDates, loading]);

    // ── Persistence helpers ──

    const saveField = async (fields) => {
        if (projectId.startsWith('local-')) {
            import('../../services/localStore').then(({ listProjects, updateProject }) => {
                const existing = listProjects().find(p => p.id === projectId);
                if (existing) {
                    updateProject({ ...existing, ...fields, lastModified: new Date().toISOString() });
                }
            });
            return;
        }
        if (db) {
            const projectRef = doc(db, 'projects', projectId);
            await setDoc(projectRef, { ...fields, lastEdited: serverTimestamp() }, { merge: true });
        }
    };

    const handleToggleVulnerability = async (vulnId) => {
        const newSelected = selectedVulnerabilities.includes(vulnId)
            ? selectedVulnerabilities.filter(id => id !== vulnId)
            : [...selectedVulnerabilities, vulnId];
        setSelectedVulnerabilities(newSelected);
        await saveField({ selectedVulnerabilities: newSelected });
    };

    const handleToggleLocationTiming = async (ltId) => {
        const newActive = activeLocationTimings.includes(ltId)
            ? activeLocationTimings.filter(id => id !== ltId)
            : [...activeLocationTimings, ltId];
        setActiveLocationTimings(newActive);
        await saveField({ activeLocationTimings: newActive });
    };

    const handleAddCustomLocationTiming = async (item) => {
        const newCustom = [...customLocationTimings, item];
        const newActive = [...activeLocationTimings, item.id];
        setCustomLocationTimings(newCustom);
        setActiveLocationTimings(newActive);
        await saveField({ customLocationTimings: newCustom, activeLocationTimings: newActive });
    };

    const handleRemoveCustomLocationTiming = async (itemId) => {
        const newCustom = customLocationTimings.filter(c => c.id !== itemId);
        const newActive = activeLocationTimings.filter(id => id !== itemId);
        setCustomLocationTimings(newCustom);
        setActiveLocationTimings(newActive);
        await saveField({ customLocationTimings: newCustom, activeLocationTimings: newActive });
    };

    const handleUpdateSpecifics = async (field, value) => {
        if (field === 'locationSpecifics') setLocationSpecifics(value);
        if (field === 'timingSpecifics') setTimingSpecifics(value);
        await saveField({ [field]: value });
    };

    const handleUpdateRisks = async (updatedRisks) => {
        setProjectRisks(updatedRisks);
        await saveField({ customRisks: updatedRisks });
    };

    const handleCreateRisk = async (newRiskData) => {
        const pTotal = (Number(newRiskData.availability) || 1) + (Number(newRiskData.occurrence) || 1) + (Number(newRiskData.complexity) || 1);
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

    // Převod aktivních lokalizací/načasování na pseudo-zranitelnosti
    const ltPseudoVulns = locationTimingToVulnerabilities(activeLocationTimings, locationTimingConfig, customLocationTimings);

    // Kombinuj reálné zranitelnosti + pseudo-zranitelnosti z lokalizací/načasování
    const allVulnerabilities = [...filteredVulnerabilities, ...ltPseudoVulns];
    const allActiveVulnIds = [...selectedVulnerabilities, ...activeLocationTimings.filter(id => ltPseudoVulns.some(v => v.id === id))];

    // Aplikuj modifikátory na rizika projektu
    const risksWithModifiers = projectRisks.map(risk => {
        const modified = applyModifiers(risk, allActiveVulnIds, allVulnerabilities);

        // Dynamicky přidej/odeber tagy
        const baseTags = (risk.tags || []).filter(t =>
            !t.includes('Modifikováno ze specifik') && !t.includes('Přímý přenos') &&
            !t.includes('Lokalizace') && !t.includes('Načasování')
        );

        // Tag pro zranitelnosti
        if (selectedVulnerabilities.length > 0 && filteredVulnerabilities.length > 0) {
            let totalMod = 0;
            for (const vuln of filteredVulnerabilities) {
                if (!selectedVulnerabilities.includes(vuln.id)) continue;
                for (const target of (vuln.targets || [])) {
                    const matches = target.riskId ? target.riskId === risk.id : target.riskName === risk.name;
                    if (!matches) continue;
                    totalMod += Object.values(target.modifiers || {}).reduce((s, v) => s + v, 0);
                }
            }
            if (totalMod !== 0) {
                baseTags.push(`Modifikováno ze specifik akce (${totalMod > 0 ? '+' : ''}${totalMod})`);
            }
        }

        // Tag pro lokalizace/načasování
        if (ltPseudoVulns.length > 0) {
            let ltMod = 0;
            for (const pv of ltPseudoVulns) {
                for (const target of (pv.targets || [])) {
                    if (target.riskName !== risk.name) continue;
                    ltMod += Object.values(target.modifiers || {}).reduce((s, v) => s + v, 0);
                }
            }
            if (ltMod !== 0) {
                baseTags.push(`Lokalizace/Načasování (${ltMod > 0 ? '+' : ''}${ltMod})`);
            }
        }

        return { ...modified, tags: baseTags };
    });

    // Spočítej vliv lokalizací/načasování
    const locationTimingImpact = computeLocationTimingImpact(
        activeLocationTimings, locationTimingConfig, projectRisks, isOutdoor
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
            globalVulnerabilities={filteredVulnerabilities}
            onToggleVulnerability={handleToggleVulnerability}
            locationTimingConfig={locationTimingConfig}
            activeLocationTimings={activeLocationTimings}
            onToggleLocationTiming={handleToggleLocationTiming}
            customLocationTimings={customLocationTimings}
            onAddCustomLocationTiming={handleAddCustomLocationTiming}
            onRemoveCustomLocationTiming={handleRemoveCustomLocationTiming}
            locationTimingImpact={locationTimingImpact}
        />
    );
}

export default ProjectRisksWrapper;
