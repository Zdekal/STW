import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { TextField, Button, Checkbox, FormControlLabel, FormGroup, IconButton, CircularProgress, Chip, Typography, FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { AddCircleOutline, Delete, CloudDone, Edit, Save } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

// --- Datové šablony (beze změny) ---
const staticRisks = [
    'Napadení chladnou zbraní',
    'Napadení střelnou zbraní',
    'Anonymní výhrůžka',
    'Závažný vandalismus',
    'Žhářský útok',
    'Přelet nepovoleného dronu',
    'Únik škodlivé látky ve vzduchu',
];

const dynamicRiskTemplates = {
  'Zvýšená kriminalita': ['Obtěžování', 'Krádeže'],
  'Extremismus a terorismus': ['Nenávistné shromáždění', 'Výbušnina umístěná v prostoru akce (NVS)', 'Braní rukojmí', 'Výbušnina ve vozidle', 'Nájezd vozidla do davu', 'Sabotáž techniky'],
  'Extrémní počasí': ['Extrémní vítr / bouřka', 'Přívalové srážky / lokální záplava', 'Úder blesku', 'Extrémní teplota (horko / mráz)'],
  'Hromadné akce': ['Davová panika a nekontrolovaný pohyb lidí', 'Větší počet zraněných osob (různými vlivy)', 'Mimořádně závažná událost mimo akci', 'Dopravní zácpy a kolaps dopravy v okolí akce', 'Přeplnění kapacity areálu a riziko tlačenice']
};

const specificsToSourceMapping = {
    crimeLocation: 'Zvýšená kriminalita',
    controversialTopic: 'Extremismus a terorismus',
    badWeatherExpected: 'Extrémní počasí'
};

const SaveStatusIndicator = ({ status }) => {
    if (status === 'Uloženo') return <Chip icon={<CloudDone />} label="Všechny změny uloženy" size="small" color="success" />;
    if (status === 'Ukládám...') return <Chip icon={<CircularProgress size={16} />} label="Ukládám..." size="small" variant="outlined" />;
    return null;
};

// Komponenta pro editovatelný seznam (beze změny)
const EditableList = ({ title, items, setItems }) => {
    const [newItemText, setNewItemText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');

    const handleAddItem = () => {
        if (newItemText.trim() === '') return;
        setItems(prev => [...prev, { id: Date.now() + Math.random(), name: newItemText, isCustom: true }]);
        setNewItemText('');
    };
    const handleRemoveItem = (id) => setItems(prev => prev.filter(item => item.id !== id));
    const handleEdit = (item) => { setEditingId(item.id); setEditingText(item.name); };
    const handleSaveEdit = (id) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, name: editingText } : item));
        setEditingId(null);
    };

    return (
        <div>
            <Typography variant="h6" component="h3" className="font-semibold mb-2 text-gray-700">{title}</Typography>
            {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100">
                    {editingId === item.id ? (
                        <TextField value={editingText} onChange={(e) => setEditingText(e.target.value)} size="small" variant="standard" fullWidth autoFocus onBlur={() => handleSaveEdit(item.id)} onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(item.id)} />
                    ) : ( <span className="flex-grow py-1">{item.name}</span> )}
                    <IconButton onClick={() => editingId === item.id ? handleSaveEdit(item.id) : handleEdit(item)} size="small">{editingId === item.id ? <Save fontSize="small" color="primary" /> : <Edit fontSize="small" />}</IconButton>
                    <IconButton onClick={() => handleRemoveItem(item.id)} color="secondary" size="small"><Delete fontSize="small" /></IconButton>
                </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
                <TextField label={`Přidat ${title.toLowerCase()}`} size="small" variant="outlined" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddItem()} fullWidth />
                <Button onClick={handleAddItem} variant="contained" size="small"><AddCircleOutline /></Button>
            </div>
        </div>
    );
};

function ProjectRisks() {
  const { id: projectId } = useParams();
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('Načteno');
  
  const initialLoadRef = useRef(true);
  
  // Načítání dat (beze změny)
  useEffect(() => {
    const projectDocRef = doc(db, 'projects', projectId);
    const unsubscribe = onSnapshot(projectDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const assessmentData = data.riskAssessment || {};
        const savedRisks = data.risks || [];

        let allPossibleRiskNames = [...staticRisks];
        Object.values(dynamicRiskTemplates).forEach(tpl => allPossibleRiskNames.push(...tpl));
        allPossibleRiskNames = [...new Set(allPossibleRiskNames)];

        const displayedRisks = allPossibleRiskNames.map(riskName => {
            const existingRisk = savedRisks.find(r => r.name === riskName);
            return {
                id: existingRisk?.id || uuidv4(),
                name: riskName,
                category: Object.keys(dynamicRiskTemplates).find(key => dynamicRiskTemplates[key].includes(riskName)) || 'Základní rizika',
                isChecked: !!existingRisk,
                isCustom: false
            };
        });

        const customRisks = savedRisks.filter(r => r.isCustom).map(r => ({ ...r, isChecked: true }));
        customRisks.forEach(cr => {
            if (!displayedRisks.some(dr => dr.name === cr.name)) {
                displayedRisks.push(cr);
            }
        });

        setRiskData({
            specifics: assessmentData.specifics || {},
            selectedSources: assessmentData.selectedSources || {},
            risks: displayedRisks,
            locations: assessmentData.locations || [],
            timings: assessmentData.timings || [],
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [projectId]);

  // Ukládání dat (beze změny)
  const saveData = useCallback(async (dataToSave) => {
    if (!dataToSave) return;
    const projectDocRef = doc(db, 'projects', projectId);
    
    const checkedRisks = dataToSave.risks
        .filter(r => r.isChecked)
        .map(({ id, name, category, isCustom }) => ({ id, name, category, isCustom }));

    const payload = {
        risks: checkedRisks,
        riskAssessment: {
            specifics: dataToSave.specifics,
            selectedSources: dataToSave.selectedSources,
            locations: dataToSave.locations,
            timings: dataToSave.timings
        },
        lastEdited: serverTimestamp()
    };
    
    await updateDoc(projectDocRef, payload);
    setSaveStatus('Uloženo');
  }, [projectId]);

  // Debounced save effect (beze změny)
  useEffect(() => {
    if (initialLoadRef.current) {
        initialLoadRef.current = false;
        return;
    }
    if (!riskData) return;

    setSaveStatus('Ukládám...');
    const handler = setTimeout(() => {
        saveData(riskData);
    }, 1500);
    return () => clearTimeout(handler);
  }, [riskData, saveData]);


  const updateRiskData = (updater) => {
    setRiskData(prevData => updater(prevData));
  };
  
  // --- NOVÉ FUNKCE PRO MANIPULACI S RIZIKY ---
  const handleRiskNameChange = (id, newName) => {
      updateRiskData(prev => ({
          ...prev,
          risks: prev.risks.map(r => r.id === id ? { ...r, name: newName } : r)
      }));
  };

  const handleAddNewRisk = (category) => {
      const newRisk = {
          id: Date.now() + Math.random(),
          name: 'Nové vlastní riziko',
          category: category,
          isChecked: true,
          isCustom: true,
      };
      updateRiskData(prev => ({
          ...prev,
          risks: [...prev.risks, newRisk]
      }));
  };
  
  const handleRemoveRisk = (id) => {
      updateRiskData(prev => ({
          ...prev,
          risks: prev.risks.filter(r => r.id !== id)
      }));
  };
  
  // Ostatní handler funkce (beze změny)
  const handleRiskCheckToggle = (id) => {
    updateRiskData(prev => ({
        ...prev,
        risks: prev.risks.map(r => r.id === id ? { ...r, isChecked: !r.isChecked } : r)
    }));
  };
  
  const handleSpecifikaChange = (e) => {
    const { name, value } = e.target;
    updateRiskData(prev => {
        const newSpecifics = { ...prev.specifics, [name]: value };
        let newRisks = [...prev.risks];
        let newSelectedSources = { ...prev.selectedSources };

        Object.keys(specificsToSourceMapping).forEach(specKey => {
            const sourceName = specificsToSourceMapping[specKey];
            if(newSpecifics[specKey] === 'ano') {
                newSelectedSources[sourceName] = true;
            }
        });
        
        if (name === 'softTargetsNearby' && value === 'ne') {
             newRisks = newRisks.filter(r => r.name !== 'Rizika z okolí');
        } else if (name === 'softTargetsNearby' && value === 'ano') {
            if (!newRisks.some(r => r.name === 'Rizika z okolí')) {
                newRisks.push({id: Date.now(), name: 'Rizika z okolí', category: 'Základní rizika', isChecked: true, isCustom: false})
            }
        }

        Object.entries(dynamicRiskTemplates).forEach(([sourceName, templateRisks]) => {
            const shouldBeActive = newSelectedSources[sourceName];
            newRisks = newRisks.map(risk => {
                if (templateRisks.includes(risk.name)) {
                    return { ...risk, isChecked: shouldBeActive };
                }
                return risk;
            });
        });

        return { ...prev, specifics: newSpecifics, risks: newRisks, selectedSources: newSelectedSources };
    });
  };
  
    const handleSourceToggle = (sourceName) => {
        updateRiskData(prev => {
            const isLocked = Object.entries(specificsToSourceMapping).some(([specKey, src]) => 
                src === sourceName && prev.specifics[specKey] === 'ano'
            );

            if (isLocked && prev.selectedSources[sourceName]) {
                alert('Tento zdroj rizik je automaticky aktivován na základě odpovědí v sekci "Specifika" a nelze jej ručně deaktivovat.');
                return prev;
            }

            const newSelectedSources = { ...prev.selectedSources, [sourceName]: !prev.selectedSources[sourceName] };
            let newRisks = [...prev.risks];

            Object.entries(dynamicRiskTemplates).forEach(([src, templateRisks]) => {
                 newRisks = newRisks.map(risk => {
                    if (templateRisks.includes(risk.name)) {
                        return { ...risk, isChecked: !!newSelectedSources[src] };
                    }
                    return risk;
                });
            });

            return {...prev, selectedSources: newSelectedSources, risks: newRisks };
        });
    };

  const categorizedRisks = useMemo(() => {
    if (!riskData?.risks) return {};
    return riskData.risks.reduce((acc, risk) => {
        const category = risk.category || 'Nekategorizováno';
        if (!acc[category]) acc[category] = [];
        acc[category].push(risk);
        return acc;
    }, {});
  }, [riskData?.risks]);

  if (loading || !riskData) return <div className="flex justify-center items-center p-8"><CircularProgress /></div>;

  return (
    <div className="space-y-10">
        <div className="flex justify-between items-start">
            {/* --- ZMĚNA ZDE: Upraven hlavní nadpis stránky --- */}
            <h1 className="text-3xl font-bold">Zvažovaná rizika</h1>
            <SaveStatusIndicator status={saveStatus} />
        </div>

        <section>
            <h2 className="text-xl font-semibold border-b pb-3 mb-6">1. Specifika</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormControl fullWidth variant="outlined">
                    <InputLabel>Je akce v lokalitě se zvýšenou kriminalitou?</InputLabel>
                    <Select name="crimeLocation" value={riskData.specifics.crimeLocation || ''} onChange={handleSpecifikaChange} label="Je akce v lokalitě se zvýšenou kriminalitou?">
                        <MenuItem value=""><em>-- Vyberte --</em></MenuItem><MenuItem value="ano">Ano</MenuItem><MenuItem value="ne">Ne</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth variant="outlined">
                    <InputLabel>Je akce v lokalitě jiných atraktivních měkkých cílů?</InputLabel>
                    <Select name="softTargetsNearby" value={riskData.specifics.softTargetsNearby || ''} onChange={handleSpecifikaChange} label="Je akce v lokalitě jiných atraktivních měkkých cílů?">
                        <MenuItem value=""><em>-- Vyberte --</em></MenuItem><MenuItem value="ano">Ano</MenuItem><MenuItem value="ne">Ne</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth variant="outlined">
                    <InputLabel>Bude téma akce či účinkující kontroverzní?</InputLabel>
                    <Select name="controversialTopic" value={riskData.specifics.controversialTopic || ''} onChange={handleSpecifikaChange} label="Bude téma akce či účinkující kontroverzní?">
                        <MenuItem value=""><em>-- Vyberte --</em></MenuItem><MenuItem value="ano">Ano</MenuItem><MenuItem value="ne">Ne</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth variant="outlined">
                    <InputLabel>Očekává se nebezpečný vliv počasí?</InputLabel>
                    <Select name="badWeatherExpected" value={riskData.specifics.badWeatherExpected || ''} onChange={handleSpecifikaChange} label="Očekává se nebezpečný vliv počasí?">
                        <MenuItem value=""><em>-- Vyberte --</em></MenuItem><MenuItem value="ano">Ano</MenuItem><MenuItem value="ne">Ne</MenuItem>
                    </Select>
                </FormControl>
            </div>
        </section>

        <section>
            <h2 className="text-xl font-semibold border-b pb-3 mb-6">2. Zdroje ohroženosti</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.keys(dynamicRiskTemplates).map(source => (
                    <div key={source} onClick={() => handleSourceToggle(source)} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${riskData?.selectedSources?.[source] ? 'bg-blue-100 border-blue-500 shadow-md' : 'bg-white hover:bg-gray-50'}`}>
                        <Typography variant="h6" className={`font-semibold ${riskData?.selectedSources?.[source] ? 'text-blue-800' : 'text-gray-700'}`}>{source}</Typography>
                    </div>
                ))}
            </div>
        </section>

        {/* --- ZMĚNA ZDE: Kompletně přepracovaná sekce pro zobrazení, editaci a přidávání rizik --- */}
        <section>
            <h2 className="text-xl font-semibold border-b pb-3 mb-6">3. Identifikovaná rizika</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {Object.entries(categorizedRisks).map(([category, riskItems]) => (
                    <div key={category} className="break-inside-avoid">
                        <Typography variant="h6" component="h3" className="font-semibold mb-2 text-gray-700">{category}</Typography>
                        <FormGroup>
                            {riskItems.map(risk => (
                                <Box key={risk.id} display="flex" alignItems="center" className="-ml-3">
                                    <Checkbox checked={risk.isChecked} onChange={() => handleRiskCheckToggle(risk.id)} />
                                    <TextField 
                                        fullWidth
                                        variant="standard"
                                        value={risk.name}
                                        onChange={(e) => handleRiskNameChange(risk.id, e.target.value)}
                                        disabled={!risk.isCustom} // Lze editovat jen vlastní rizika
                                        InputProps={{ disableUnderline: !risk.isCustom }}
                                    />
                                    {risk.isCustom && ( // Tlačítko pro smazání se ukáže jen u vlastních rizik
                                        <IconButton size="small" onClick={() => handleRemoveRisk(risk.id)}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                            <Button 
                                size="small" 
                                startIcon={<AddCircleOutline />} 
                                onClick={() => handleAddNewRisk(category)}
                                sx={{mt: 1, justifyContent: 'flex-start', ml: '2px'}}
                            >
                                Přidat vlastní riziko
                            </Button>
                        </FormGroup>
                    </div>
                ))}
            </div>
        </section>
        
        <section>
            <h2 className="text-xl font-semibold border-b pb-3 mb-6">4. Nejrizikovější lokalizace a načasování</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <EditableList title="Lokalizace" items={riskData.locations} setItems={(newItems) => updateRiskData(prev => ({ ...prev, locations: newItems }))} />
                <EditableList title="Načasování" items={riskData.timings} setItems={(newItems) => updateRiskData(prev => ({ ...prev, timings: newItems }))} />
            </div>
        </section>
    </div>
  );
}

export default ProjectRisks;