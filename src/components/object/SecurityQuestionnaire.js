// src/components/object/SecurityQuestionnaire.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import {
    Typography, Box, TextField, FormControlLabel, Switch, Checkbox, FormGroup,
    Accordion, AccordionSummary, AccordionDetails, Button, Paper, Grid, IconButton, Tooltip,
    CircularProgress, Alert, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// Helper komponenta (beze změny)
function QuestionRow({ label, name, checked, note, onChange }) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 1.5, borderBottom: '1px solid #eee', pb: 1.5 }}>
            <FormControlLabel
                control={<Switch name={name} checked={!!checked} onChange={onChange} />}
                label={label}
                sx={{ flex: '1 1 350px', mr: 'auto', fontWeight: 500 }}
            />
            <TextField
                name={`${name}_note`}
                value={note || ''}
                onChange={onChange}
                label="Poznámka"
                variant="outlined"
                size="small"
                sx={{ flex: '1 1 300px', minWidth: '250px' }}
            />
        </Box>
    );
}

function SecurityQuestionnaire() {
    const [basicInfo, setBasicInfo] = useState({ name: '', address: '', components: '', capacity: '', size: '' });
    const [formData, setFormData] = useState({});
    const [customQuestions, setCustomQuestions] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savingStatus, setSavingStatus] = useState('Uloženo');

    const { id: projectId, objectId } = useParams();
    const isInitialLoad = useRef(true);

    useEffect(() => {
        const loadData = async () => {
            if (!projectId || !objectId) { setLoading(false); return; }
            setLoading(true);
            isInitialLoad.current = true;
            try {
                const docRef = doc(db, 'projects', projectId, 'buildings', objectId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setBasicInfo({ name: data.name || '', address: data.address || '', components: data.components || '', capacity: data.capacity || '', size: data.size || '' });
                    setFormData(data.questionnaireData || {});
                    setCustomQuestions(data.customQuestionsData || []);
                }
            } catch (err) { setError("Nepodařilo se načíst data dotazníku."); }
            setLoading(false);
        };
        loadData();
    }, [projectId, objectId]);
    
    const saveData = useCallback(async () => {
        if (!projectId || !objectId) return;
        setSavingStatus('Ukládání...');
        try {
            const docRef = doc(db, 'projects', projectId, 'buildings', objectId);
            await setDoc(docRef, {
                ...basicInfo,
                questionnaireData: formData,
                customQuestionsData: customQuestions
            }, { merge: true });
            setSavingStatus('Uloženo');
        } catch (err) {
            setError("Automatické uložení selhalo.");
            setSavingStatus('Chyba při ukládání');
        }
    }, [projectId, objectId, basicInfo, formData, customQuestions]);

    useEffect(() => {
        if (loading || isInitialLoad.current) {
            if (!loading) isInitialLoad.current = false;
            return;
        }

        setSavingStatus('Neuložené změny');
        const handler = setTimeout(() => {
            saveData();
        }, 1500);

        return () => clearTimeout(handler);
    }, [basicInfo, formData, customQuestions, saveData, loading]);


    const handleBasicInfoChange = (e) => {
        const { name, value } = e.target;
        setBasicInfo(prev => ({ ...prev, [name]: value }));
    };
    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData(prevState => ({ ...prevState, [name]: type === 'checkbox' || type === 'switch' ? checked : value }));
    };
    const addCustomQuestion = () => setCustomQuestions(prev => [...prev, { id: Date.now(), question: '', answer: '' }]);
    const removeCustomQuestion = (id) => setCustomQuestions(prev => prev.filter(q => q.id !== id));
    const handleCustomChange = (id, event) => {
        const { name, value } = event.target;
        setCustomQuestions(prev => prev.map(q => q.id === id ? { ...q, [name]: value } : q));
    };

    const handleExportDocx = () => { /* ... kód pro export ... */ };
    const renderSubQuestions = (children) => (<Box sx={{ pl: { xs: 2, md: 4 }, mt: 2, pt: 2, borderLeft: '2px solid #f0f0f0' }}>{children}</Box>);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, position: 'sticky', top: 0, zIndex: 1100, backgroundColor: 'white' }}>
                <Typography variant="h5" component="h1">Bezpečnostní dotazník</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip label={savingStatus} color={savingStatus === 'Uloženo' ? 'success' : savingStatus === 'Ukládání...' ? 'info' : 'warning'} />
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportDocx}>Stáhnout .docx</Button>
                </Box>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>Základní informace o objektu</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}> <TextField name="name" label="Název budovy" fullWidth onChange={handleBasicInfoChange} value={basicInfo.name} variant="filled" /> </Grid>
                    <Grid item xs={12}> <TextField name="address" label="Adresa" fullWidth onChange={handleBasicInfoChange} value={basicInfo.address} variant="filled" /> </Grid>
                    <Grid item xs={12} sm={6}> <TextField name="capacity" label="Kapacita (osob)" type="number" fullWidth onChange={handleBasicInfoChange} value={basicInfo.capacity} variant="filled" /> </Grid>
                    <Grid item xs={12} sm={6}> <TextField name="size" label="Velikost (např. m²)" fullWidth onChange={handleBasicInfoChange} value={basicInfo.size} variant="filled" /> </Grid>
                    <Grid item xs={12}> <TextField name="components" label="Součásti" fullWidth onChange={handleBasicInfoChange} value={basicInfo.components} variant="filled" helperText="Např. laboratoře, posluchárny, kanceláře..." /> </Grid>
                </Grid>
            </Paper>
            
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">I. Okolí, Rizika a Incidenty</Typography></AccordionSummary>
                <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                    <QuestionRow label="Leží objekt v rizikové lokalitě z hlediska měkkých cílů?" name="isRiskyLocation" checked={!!formData.isRiskyLocation} note={formData.isRiskyLocation_note || ''} onChange={handleChange} />
                    <QuestionRow label="Je okolí objektu rizikové z hlediska běžné kriminality?" name="isCrimeRisk" checked={!!formData.isCrimeRisk} note={formData.isCrimeRisk_note || ''} onChange={handleChange} />
                    <QuestionRow label="Má objekt mimořádnou atraktivitu pro útoky extremistů?" name="isAttractiveExtremists" checked={!!formData.isAttractiveExtremists} note={formData.isAttractiveExtremists_note || ''} onChange={handleChange} />
                    <QuestionRow label="Má objekt mimořádnou atraktivitu pro útoky teroristů?" name="isAttractiveTerrorists" checked={!!formData.isAttractiveTerrorists} note={formData.isAttractiveTerrorists_note || ''} onChange={handleChange} />
                    <QuestionRow label="Má objekt mimořádnou atraktivitu pro závažnou kriminální činnost?" name="isAttractiveCrime" checked={!!formData.isAttractiveCrime} note={formData.isAttractiveCrime_note || ''} onChange={handleChange} />
                    <TextField name="pastIncidents" label="Jaké bezpečnostní incidenty se v objektu v minulosti staly?" fullWidth multiline rows={3} onChange={handleChange} value={formData.pastIncidents || ''} />
                    <QuestionRow label="Jsou v objektu zvlášť rizikové prostory?" name="hasRiskyAreas" checked={!!formData.hasRiskyAreas} note={formData.hasRiskyAreas_note || ''} onChange={handleChange} />
                </AccordionDetails>
            </Accordion>
            
            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">II. Funkce, Personál a Organizace</Typography></AccordionSummary>
                <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                    <TextField name="objectFunctions" label="Jaké funkce objekt plní?" fullWidth multiline rows={2} onChange={handleChange} value={formData.objectFunctions || ''} />
                    <QuestionRow label="Je vhodné zabezpečovat objekt i v noci?" name="needsNightSecurity" checked={!!formData.needsNightSecurity} note={formData.needsNightSecurity_note || ''} onChange={handleChange} />
                    <QuestionRow label="Působí v objektu cizí organizace?" name="hasForeignOrgs" checked={!!formData.hasForeignOrgs} note={formData.hasForeignOrgs_note || ''} onChange={handleChange} />
                    <QuestionRow label="Bylo by při incidentu chaotické informovat a koordinovat organizace?" name="isCoordinationChaotic" checked={!!formData.isCoordinationChaotic} note={formData.isCoordinationChaotic_note || ''} onChange={handleChange} />
                    <Typography variant="subtitle1">Jsou v objektu stálí pracovníci, které lze zahrnout do bezp. systému?</Typography>
                    <FormGroup><Grid container spacing={2}>
                        {[{name: 'staffReception', label: 'Vrátní/Ostraha'}, {name: 'staffCleaning', label: 'Úklid'}, {name: 'staffMaintenance', label: 'Údržba'}, {name: 'staffOther', label: 'Další'}].map(item =>
                            <Grid item xs={12} sm={6} md={3} key={item.name}><FormControlLabel control={<Checkbox onChange={handleChange} name={item.name} checked={!!formData[item.name]} />} label={item.label} /></Grid>
                        )}
                    </Grid></FormGroup>
                    <TextField name="staff_note" label="Poznámka ke stálým pracovníkům" fullWidth onChange={handleChange} value={formData.staff_note || ''}/>
                    <QuestionRow label="Je pohyb v objektu nepřehledný?" name="isLayoutConfusing" checked={!!formData.isLayoutConfusing} note={formData.isLayoutConfusing_note || ''} onChange={handleChange} />
                    <TextField name="concentrationSpots" label="Uveďte místa největší koncentrace osob" fullWidth multiline rows={3} onChange={handleChange} value={formData.concentrationSpots || ''}/>
                </AccordionDetails>
            </Accordion>

            {/* --- VRÁCENÉ SEKCE --- */}
            <Accordion defaultExpanded>
                 <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">III. Technické Zabezpečení</Typography></AccordionSummary>
                 <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                    <QuestionRow label="Je na objektu kamerový systém?" name="hasCCTV" checked={!!formData.hasCCTV} note={formData.hasCCTV_note || ''} onChange={handleChange} />
                    {formData.hasCCTV && renderSubQuestions(
                        <Grid container spacing={2}><Grid item xs={12} md={6}>
                            <QuestionRow label="Se záznamem?" name="cctvHasRecording" checked={!!formData.cctvHasRecording} note={formData.cctvHasRecording_note || ''} onChange={handleChange} />
                            <QuestionRow label="Umožňuje kvalita rozpoznat postavu?" name="cctvQualityGood" checked={!!formData.cctvQualityGood} note={formData.cctvQualityGood_note || ''} onChange={handleChange} />
                        </Grid><Grid item xs={12} md={6}>
                            <QuestionRow label="Je obrazovka na objektu?" name="cctvHasScreen" checked={!!formData.cctvHasScreen} note={formData.cctvHasScreen_note || ''} onChange={handleChange} />
                            <QuestionRow label="Snímá se hlavní vstup?" name="cctvCoversEntrance" checked={!!formData.cctvCoversEntrance} note={formData.cctvCoversEntrance_note || ''} onChange={handleChange} />
                        </Grid>
                        <Grid item xs={12}><TextField name="cctvNotes" label="Připomínky ke kamerovému systému" fullWidth sx={{mt:2}} onChange={handleChange} value={formData.cctvNotes || ''}/></Grid>
                        </Grid>
                    )}
                    <QuestionRow label="Je instalován poplachový zabezpečovací systém (PZS)?" name="hasAlarmSystem" checked={!!formData.hasAlarmSystem} note={formData.hasAlarmSystem_note || ''} onChange={handleChange} />
                    {formData.hasAlarmSystem && renderSubQuestions(
                        <><TextField name="alarmSignalDestination" label="Kam je sveden signál?" fullWidth onChange={handleChange} value={formData.alarmSignalDestination || ''}/>
                        <TextField name="alarmReaction" label="Jaká je reakce při spuštění?" fullWidth sx={{mt: 2}} onChange={handleChange} value={formData.alarmReaction || ''}/></>
                    )}
                    <QuestionRow label="Je instalován ACS (přístupový systém)?" name="hasAccessControl" checked={!!formData.hasAccessControl} note={formData.hasAccessControl_note || ''} onChange={handleChange} />
                    {formData.hasAccessControl && renderSubQuestions(
                         <><TextField name="acsLocation" label="Kde je umístěn?" fullWidth onChange={handleChange} value={formData.acsLocation || ''}/>
                         <TextField name="acsTraining" label="Kdo je proškolen?" sx={{mt: 2}} fullWidth onChange={handleChange} value={formData.acsTraining || ''}/></>
                    )}
                    <QuestionRow label="Je objekt a okolí dostatečně osvětleno?" name="hasLighting" checked={!!formData.hasLighting} note={formData.hasLighting_note || ''} onChange={handleChange} />
                    <QuestionRow label="Jsou instalována paniková tlačítka?" name="hasPanicButtons" checked={!!formData.hasPanicButtons} note={formData.hasPanicButtons_note || ''} onChange={handleChange} />
                    <QuestionRow label="Je k dispozici mobilní defibrilátor?" name="hasDefibrillator" checked={!!formData.hasDefibrillator} note={formData.hasDefibrillator_note || ''} onChange={handleChange} />
                    <QuestionRow label="Je v objektu vnitřní rozhlas / jiný způsob komunikace?" name="hasInternalComms" checked={!!formData.hasInternalComms} note={formData.hasInternalComms_note || ''} onChange={handleChange} />
                 </AccordionDetails>
            </Accordion>
            
            <Accordion defaultExpanded>
                 <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">IV. Požární ochrana a Stavební Zabezpečení</Typography></AccordionSummary>
                 <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                    <TextField name="fireSafetyManagement" label="Jak je řešena požární ochrana (vlastní zaměstnanec / externí firma)?" fullWidth onChange={handleChange} value={formData.fireSafetyManagement || ''}/>
                    <QuestionRow label="Jsou chráněné evakuační požární cesty funkčně značené?" name="evacRoutesMarked" checked={!!formData.evacRoutesMarked} note={formData.evacRoutesMarked_note || ''} onChange={handleChange} />
                    <QuestionRow label="Jsou chráněné evakuační požární cesty skutečně průchozí?" name="evacRoutesClear" checked={!!formData.evacRoutesClear} note={formData.evacRoutesClear_note || ''} onChange={handleChange} />
                    <QuestionRow label="Jsou v objektu podzemní garáže?" name="hasUndergroundGarage" checked={!!formData.hasUndergroundGarage} note={formData.hasUndergroundGarage_note || ''} onChange={handleChange} />
                    <QuestionRow label="Jsou v objektu dobré podmínky pro přípravu bezpečné místnosti (save haven)?" name="hasSafeRoom" checked={!!formData.hasSafeRoom} note={formData.hasSafeRoom_note || ''} onChange={handleChange} />
                    <QuestionRow label="Jsou instalovány bezpečnostní fólie na některé skleněné plochy?" name="hasSecurityFoil" checked={!!formData.hasSecurityFoil} note={formData.hasSecurityFoil_note || ''} onChange={handleChange} />
                    <QuestionRow label="Jsou okna a dveře do výšky 3m chráněny mřížemi?" name="hasGrilles" checked={!!formData.hasGrilles} note={formData.hasGrilles_note || ''} onChange={handleChange} />
                 </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">V. Procedury a Externí Spolupráce</Typography></AccordionSummary>
                <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                    <TextField name="visitorControl" label="Jak je řešena kontrola vstupu externích osob?" fullWidth onChange={handleChange} value={formData.visitorControl || ''}/>
                    <TextField name="mailHandler" label="Kdo přijímá poštu?" fullWidth onChange={handleChange} value={formData.mailHandler || ''}/>
                    <QuestionRow label="Lze do objektu telefonovat přes ústřednu?" name="hasPhoneExchange" checked={!!formData.hasPhoneExchange} note={formData.hasPhoneExchange_note || ''} onChange={handleChange} />
                    <QuestionRow label="Je pro objekt zpracována karta objektu pro PČR?" name="hasPoliceCard" checked={!!formData.hasPoliceCard} note={formData.hasPoliceCard_note || ''} onChange={handleChange} />
                    <QuestionRow label="Je nastavena nadstandardní spolupráce s IZS (zejména s PČR)?" name="hasIZSCooperation" checked={!!formData.hasIZSCooperation} note={formData.hasIZSCooperation_note || ''} onChange={handleChange} />
                </AccordionDetails>
            </Accordion>
            
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">Závěrečné poznámky a doporučení</Typography></AccordionSummary>
                <AccordionDetails sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                    <TextField name="personnelRecommendations" label="Má personál nějaká doporučení pro zlepšení zabezpečení?" fullWidth multiline rows={4} onChange={handleChange} value={formData.personnelRecommendations || ''} />
                    <TextField name="inspectorNotesScoring" label="Poznámky inspektora k bodování analýzy ohroženosti" fullWidth multiline rows={4} onChange={handleChange} value={formData.inspectorNotesScoring || ''} />
                    <TextField name="inspectorNotesRecommendations" label="Poznámky inspektora k doporučením" fullWidth multiline rows={4} onChange={handleChange} value={formData.inspectorNotesRecommendations || ''} />
                </AccordionDetails>
            </Accordion>

            <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6">Vlastní otázky</Typography></AccordionSummary>
                <AccordionDetails>
                    {customQuestions.map((q, index) => (
                        <Paper key={q.id} sx={{ p: 2, mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                            <TextField label={`Vlastní otázka #${index + 1}`} name="question" value={q.question} onChange={(e) => handleCustomChange(q.id, e)} fullWidth />
                            <TextField label="Odpověď" name="answer" value={q.answer} onChange={(e) => handleCustomChange(q.id, e)} fullWidth />
                            <Tooltip title="Smazat otázku"><IconButton onClick={() => removeCustomQuestion(q.id)} color="error"><DeleteIcon /></IconButton></Tooltip>
                        </Paper>
                    ))}
                    <Button startIcon={<AddCircleOutlineIcon />} onClick={addCustomQuestion} sx={{ mt: 2 }}>Přidat další otázku</Button>
                </AccordionDetails>
            </Accordion>
        </Box>
    );
}

export default SecurityQuestionnaire;