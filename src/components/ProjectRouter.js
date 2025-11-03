import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CircularProgress, Alert, Box } from '@mui/material';

// --- Layouty ---
import ProjectLayout from './project/ProjectLayout';
import ObjectLayout from './object/ObjectLayout';
import CampusLayout from './object/CampusLayout';
import CampusObjectLayout from './object/CampusObjectLayout';

// --- Komponenty pro "Akce" ---
import ProjectBasic from './project/ProjectBasic.jsx';
import ProjectRisks from './project/ProjectRisks';
import ProjectMeasures from './project/ProjectMeasures';
import ProjectChecklistWrapper from './project/ProjectChecklistWrapper.jsx';
import PlanDocumentA4 from './project/PlanDocumentA4';
import ProjectLogList from './project/ProjectLogList';
// --- ZMĚNA ZDE: Import nových komponent pro menu ---
import ProjectTeam from './project/ProjectTeam';
import ProjectProcedures from './project/ProjectProcedures';
import ProjectCommunication from './project/ProjectCommunication';
import SpravaProjektu from './project/SpravaProjektu';


// --- Komponenty pro "Objekt" a "Kampus" ---
import CampusOverview from './object/CampusOverview.js';
import SecurityQuestionnaire from './object/SecurityQuestionnaire.js';
import SecurityDirectives from './object/SecurityDirectives.js';
import SecurityPlan from './object/SecurityPlan.js';
import ObjectSecurityPlan from './object/ObjectSecurityPlan';
import SoftTargetCard from './object/SoftTargetCard';
import ThreatAnalysis from './object/ThreatAnalysis.js';
import IncidentLog from './object/IncidentLog.js';
import SecurityDocumentation from './object/SecurityDocumentation.js';
import CrisisPreparednessPlan from './object/CrisisPreparednessPlan';

// "Chytrá výhybka", která řídí zobrazení podle typu projektu
function ProjectRouter() {
    const { id } = useParams();
    const [projectData, setProjectData] = useState({ type: null, loading: true, error: '' });

    useEffect(() => {
        const fetchProjectType = async () => {
            if (!id) {
                setProjectData({ loading: false, error: 'Chybí ID projektu v adrese.' });
                return;
            }
            try {
                const projectRef = doc(db, 'projects', id);
                const docSnap = await getDoc(projectRef);
                if (docSnap.exists()) {
                    setProjectData({ type: docSnap.data().projectType || 'event', loading: false, error: '' });
                } else {
                    setProjectData({ loading: false, error: 'Projekt s tímto ID nebyl nalezen.' });
                }
            } catch (err) {
                console.error("Chyba ve výhybce (ProjectRouter):", err);
                setProjectData({ loading: false, error: 'Při načítání dat projektu došlo k chybě.' });
            }
        };
        fetchProjectType();
    }, [id]);

    if (projectData.loading) {
        return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><CircularProgress /></Box>;
    }
    if (projectData.error) {
        return <Box p={4}><Alert severity="error">{projectData.error}</Alert></Box>;
    }

    // Scénář 1: Projekt typu KAMPUS (beze změny)
    if (projectData.type === 'kampus') {
        return (
            <Routes>
                <Route path="object/:objectId/*" element={<CampusObjectLayout />}>
                    <Route index element={<Navigate to="questionnaire" replace />} />
                    <Route path="questionnaire" element={<SecurityQuestionnaire />} />
                    <Route path="incident-log" element={<IncidentLog />} />
                    <Route path="documentation" element={<SecurityDocumentation />} />
                    <Route path="threat-analysis" element={<ThreatAnalysis />} />
                    <Route path="risks" element={<ProjectRisks />} />
                    <Route path="measures" element={<ProjectMeasures />} />
                    <Route path="object-plan" element={<ObjectSecurityPlan />} />
                    <Route path="soft-target-card" element={<SoftTargetCard />} />
                </Route>
                <Route path="*" element={<CampusLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<CampusOverview />} />
                    <Route path="directives" element={<SecurityDirectives />} />
                    <Route path="plan" element={<SecurityPlan />} />
                    <Route path="central-measures" element={<ProjectMeasures />} />
                    <Route path="crisis-team" element={<CrisisPreparednessPlan />} />
                    <Route path="central-incident-log" element={<IncidentLog />} />
                </Route>
            </Routes>
        );
    }

    // Scénář 2: Projekt typu OBJEKT (beze změny)
    if (projectData.type === 'objekt') {
        return (
            <Routes>
                <Route path="*" element={<ObjectLayout />}>
                    <Route index element={<Navigate to="questionnaire" replace />} />
                    <Route path="questionnaire" element={<SecurityQuestionnaire />} />
                    <Route path="threat-analysis" element={<ThreatAnalysis />} />
                    <Route path="risks" element={<ProjectRisks />} />
                    <Route path="measures" element={<ProjectMeasures />} />
                    <Route path="directives" element={<SecurityDirectives />} />
                    <Route path="plan" element={<SecurityPlan />} />
                    <Route path="soft-target-card" element={<SoftTargetCard />} />
                </Route>
            </Routes>
        );
    }

    // Scénář 3: Projekt typu AKCE (výchozí)
    return (
        <Routes>
            <Route path="*" element={<ProjectLayout />}>
                <Route index element={<Navigate to="basic" replace />} />
                <Route path="basic" element={<ProjectBasic />} />
                <Route path="risks" element={<ProjectRisks />} />
                <Route path="measures" element={<ProjectMeasures />} />
                <Route path="log" element={<ProjectLogList />} />
                <Route path="checklist" element={<ProjectChecklistWrapper />} />
                <Route path="plan" element={<PlanDocumentA4 />} />

                {/* --- ZMĚNA ZDE: Přidání cest pro nové komponenty --- */}
                <Route path="team" element={<ProjectTeam />} />
                <Route path="procedures" element={<ProjectProcedures />} />
                <Route path="communication" element={<ProjectCommunication />} />
                <Route path="management" element={<SpravaProjektu />} />
            </Route>
        </Routes>
    );
}

export default ProjectRouter;