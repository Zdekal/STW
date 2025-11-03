import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Box, Typography, CircularProgress, Alert, TextField, Button, Divider, Chip, IconButton, Paper, Tooltip, Menu, MenuItem } from '@mui/material';
import { Save, Edit, Check, Print, Refresh, Download, Delete, AddCircleOutline } from '@mui/icons-material';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, PageBreak } from 'docx';
import { v4 as uuidv4 } from 'uuid';

// --- STYLY ---
const pageStyle = {
    background: 'white', margin: 'auto', marginBottom: '20px', position: 'relative', display: 'flex', flexDirection: 'column',
    '@media screen': { width: '210mm', minHeight: '297mm', boxShadow: '0 0 10px rgba(0,0,0,0.1)', p: '2.5cm' },
    '@media print': { boxShadow: 'none', margin: 0, width: '100%', height: 'auto', minHeight: '277mm', pageBreakAfter: 'always', padding: '1.5cm' },
    '&:last-of-type': { '@media print': { pageBreakAfter: 'auto' } }
};

// --- Komponenty ---
const PageFooter = ({ currentPage, totalPages }) => (
    <Box sx={{ position: 'absolute', bottom: '1.5cm', left: 0, right: 0, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">Strana {currentPage} / {totalPages}</Typography>
    </Box>
);

const BlockContainer = ({ children, onAddBlock, onDelete }) => {
    const [hover, setHover] = useState(false);
    return (
        <Box
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            sx={{ position: 'relative', my: 1, borderLeft: '2px solid transparent', '&:hover': { borderColor: '#e0e0e0' } }}
        >
            {children}
            <Box sx={{ position: 'absolute', top: '50%', right: '-40px', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 1, opacity: hover ? 1 : 0, transition: 'opacity 0.2s' }} className="no-print">
                <Tooltip title="Odstranit blok"><IconButton onClick={onDelete} size="small"><Delete fontSize="inherit" /></IconButton></Tooltip>
                <Tooltip title="Přidat blok pod"><IconButton onClick={(e) => onAddBlock(e)} size="small"><AddCircleOutline fontSize="inherit" /></IconButton></Tooltip>
            </Box>
        </Box>
    );
};

const EditableBlock = ({ block, onSave, isEditing, onToggleEdit }) => {
    const [text, setText] = useState(block.content);
    useEffect(() => { setText(block.content); }, [block.content]);

    const handleSave = () => { onSave(block.id, { content: text }); onToggleEdit(null); };

    const variantMapping = { 'h1': 'h4', 'h2': 'h5', 'h3': 'h6', 'p': 'body1' };
    const fontWeightMapping = { 'h1': 'bold', 'h2': 'bold', 'h3': 'bold', 'p': 'normal' };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {isEditing ? (
                <Box sx={{ width: '100%' }}>
                    <TextField multiline fullWidth value={text} onChange={(e) => setText(e.target.value)} variant="outlined" autoFocus size="small" />
                    <Button onClick={handleSave} startIcon={<Save />} sx={{ mt: 1 }}>Uložit</Button>
                </Box>
            ) : (
                <Typography variant={variantMapping[block.type] || 'body1'} sx={{ whiteSpace: 'pre-wrap', flexGrow: 1, fontWeight: fontWeightMapping[block.type] }}>
                    {block.content}
                </Typography>
            )}
            <Tooltip title="Upravit text" className="no-print">
                <IconButton onClick={() => onToggleEdit(isEditing ? null : block.id)} size="small" sx={{ ml: 1, alignSelf: 'flex-start' }}>
                    {isEditing ? <Check /> : <Edit />}
                </IconButton>
            </Tooltip>
        </Box>
    );
};

const DynamicBlock = ({ block, onSync, title, children }) => (
    <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: '#f7f9fc', borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{title}</Typography>
            <Tooltip title="Načíst a vložit data z projektu jako editovatelné bloky">
                <IconButton onClick={() => onSync(block.id, block.dynamicKey)} size="small" className="no-print"><Refresh /></IconButton>
            </Tooltip>
        </Box>
        <Divider />
        <Box sx={{ pl: 1, mt: 2, maxHeight: 150, overflowY: 'auto' }}>{children}</Box>
    </Box>
);

function PlanDocumentA4() {
    const { id: projectId } = useParams();
    const { currentUser } = useAuth();
    const [project, setProject] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingBlockId, setEditingBlockId] = useState(null);
    const [addMenu, setAddMenu] = useState({ anchorEl: null, index: null });
    const [dynamicMenu, setDynamicMenu] = useState(null);

    // Načítání dat projektu
    useEffect(() => {
        if (!projectId || !currentUser) { setLoading(false); return; }

        const unsub = onSnapshot(doc(db, "projects", projectId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setProject({ id: doc.id, ...data });
                if (data.documentBlocks && Array.isArray(data.documentBlocks) && data.documentBlocks.length > 0) {
                    setBlocks(data.documentBlocks);
                } else {
                    // Vytvoření výchozí šablony dokumentu
                    const defaultBlocks = [
                        { id: uuidv4(), type: 'h1', content: `Bezpečnostní plán: ${data.officialName || 'Nový projekt'}` },
                        { id: uuidv4(), type: 'p', content: `Datum zpracování: ${new Date().toLocaleDateString('cs-CZ')}\nZpracovatel: ${data.author || currentUser.email}` },
                        { id: uuidv4(), type: 'page_break' },
                        { id: uuidv4(), type: 'h1', content: 'Obsah' },
                        { id: uuidv4(), type: 'p', content: '1. Základní údaje o akci\n2. Zvažovaná rizika\n3. Bezpečnostní opatření' },
                        { id: uuidv4(), type: 'page_break' },
                        { id: uuidv4(), type: 'h1', content: '1. Základní údaje o akci' },
                        { id: uuidv4(), type: 'dynamic', dynamicKey: 'basicInfo' },
                        { id: uuidv4(), type: 'h1', content: '2. Zvažovaná rizika' },
                        { id: uuidv4(), type: 'dynamic', dynamicKey: 'risks' },
                        { id: uuidv4(), type: 'h1', content: '3. Bezpečnostní opatření' },
                        { id: uuidv4(), type: 'dynamic', dynamicKey: 'measures' },
                    ];
                    setBlocks(defaultBlocks);
                    saveBlocks(defaultBlocks);
                }
            } else { setError("Projekt nebyl nalezen."); }
            setLoading(false);
        }, (err) => { setError("Nepodařilo se načíst data projektu."); setLoading(false); });
        return () => unsub();
    }, [projectId, currentUser]);

    // Funkce pro uložení bloků do DB
    const saveBlocks = useCallback(async (newBlocks) => {
        if (!projectId) return;
        const projectRef = doc(db, "projects", projectId);
        try { await updateDoc(projectRef, { documentBlocks: newBlocks, lastEdited: serverTimestamp() }); }
        catch (err) { console.error("Chyba při ukládání dokumentu:", err); }
    }, [projectId]);
    
    // --- KLÍČOVÁ FUNKCE: Synchronizace dynamického bloku na statické ---
    const handleSyncDynamicBlock = (blockId, dynamicKey) => {
        if (!project) return;
        
        let newContentBlocks = [];
        // Zde generujeme nové bloky na základě dat z projektu
        switch (dynamicKey) {
            case 'basicInfo':
                newContentBlocks.push({ id: uuidv4(), type: 'p', content: `Oficiální název: ${project.officialName || 'N/A'}` });
                newContentBlocks.push({ id: uuidv4(), type: 'p', content: `Organizátor: ${project.organizer || 'N/A'}` });
                newContentBlocks.push({ id: uuidv4(), type: 'p', content: `Počet účastníků: ${project.audienceSize || 'N/A'}` });
                break;
            case 'teams':
                newContentBlocks.push({ id: uuidv4(), type: 'h2', content: 'Týmy podílející se na akci' });
                const involvedTeams = Object.entries(project.involvedTeams || {}).filter(([_,v])=>v);
                if (involvedTeams.length > 0) {
                    involvedTeams.forEach(([teamName]) => {
                        newContentBlocks.push({ id: uuidv4(), type: 'p', content: `- ${teamName}` });
                    });
                } else {
                    newContentBlocks.push({ id: uuidv4(), type: 'p', content: 'Nebyly vybrány žádné týmy.' });
                }
                break;
            case 'risks':
                newContentBlocks.push({ id: uuidv4(), type: 'h2', content: 'Zvažovaná rizika' });
                if ((project.risks || []).length > 0) {
                    project.risks.forEach(risk => {
                        newContentBlocks.push({ id: uuidv4(), type: 'p', content: `- ${risk.name}` });
                    });
                } else {
                     newContentBlocks.push({ id: uuidv4(), type: 'p', content: 'Nebyla identifikována žádná rizika.' });
                }
                break;
            case 'measures':
                newContentBlocks.push({ id: uuidv4(), type: 'h2', content: 'Navrhovaná bezpečnostní opatření' });
                 const selectedMeasures = Object.entries(project.selectedMeasures || {}).filter(([_,v])=>v);
                if (selectedMeasures.length > 0) {
                    selectedMeasures.forEach(([measureName]) => {
                        newContentBlocks.push({ id: uuidv4(), type: 'p', content: `- ${measureName}` });
                    });
                } else {
                    newContentBlocks.push({ id: uuidv4(), type: 'p', content: 'Nebyla vybrána žádná opatření.' });
                }
                break;
            default:
                newContentBlocks.push({ id: uuidv4(), type: 'p', content: 'Neznámý dynamický blok.' });
        }
        
        const blockIndex = blocks.findIndex(b => b.id === blockId);
        const newBlocks = [...blocks];
        newBlocks.splice(blockIndex, 1, ...newContentBlocks); // Nahradí dynamický blok za nové statické
        setBlocks(newBlocks);
        saveBlocks(newBlocks);
    };

    // --- Funkce pro správu bloků (přidání, mazání, update) ---
    const handleBlockUpdate = (blockId, updatedData) => {
        const newBlocks = blocks.map(b => b.id === blockId ? { ...b, ...updatedData } : b);
        setBlocks(newBlocks);
        saveBlocks(newBlocks);
    };

    const handleOpenAddMenu = (event, index) => setAddMenu({ anchorEl: event.currentTarget, index });
    const handleCloseAddMenu = () => setAddMenu({ anchorEl: null, index: null });

    const handleAddBlock = (type, content = 'Nový blok...', dynamicKey = '') => {
        const newBlock = { id: uuidv4(), type, content, ...(dynamicKey && { dynamicKey }) };
        const newBlocks = [...blocks];
        newBlocks.splice(addMenu.index + 1, 0, newBlock);
        setBlocks(newBlocks);
        saveBlocks(newBlocks);
        handleCloseAddMenu();
        setDynamicMenu(null);
    };
    
    const handleDeleteBlock = (blockId) => {
        if (!window.confirm("Opravdu chcete odstranit tento blok?")) return;
        const newBlocks = blocks.filter(b => b.id !== blockId);
        setBlocks(newBlocks);
        saveBlocks(newBlocks);
    };
    
    // --- Export do .docx (vylepšený) ---
    const handleExportDocx = () => {
        if (!project) return;
        const docxChildren = blocks.flatMap(block => {
            switch(block.type) {
                case 'h1': return [new Paragraph({ text: block.content, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 150 } })];
                case 'h2': return [new Paragraph({ text: block.content, heading: HeadingLevel.HEADING_2, spacing: { before: 250, after: 120 } })];
                case 'p': return block.content.split('\n').map(line => {
                    if (line.trim().startsWith('- ')) {
                        return new Paragraph({ text: line.trim().substring(2), bullet: { level: 0 } });
                    }
                    return new Paragraph(line);
                });
                case 'page_break': return [new Paragraph({ children: [new PageBreak()] })];
                case 'dynamic': // Dynamický blok už by v exportu neměl být, ale pro jistotu
                     return [new Paragraph({ text: `[Dynamická sekce: ${block.dynamicKey} - Načtěte prosím data před exportem]`, style: "aside" })];
                default: return [];
            }
        });
        const docFile = new Document({ styles:{ paragraphStyles:[{id:"aside", name:"Aside", run:{italics:true, color:"999999"}}] }, sections: [{ children: docxChildren }] });
        Packer.toBlob(docFile).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `plan_${project.name.replace(/ /g, "_")}.docx`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    if (!project && !loading) return <Alert severity="warning">Projekt se nepodařilo načíst.</Alert>;
    if (!project) return null; // Pojistka

    // Rozdělení bloků na stránky
    let pageContent = [];
    const allPages = [];
    blocks.forEach(block => {
        if (block.type === 'page_break') {
            allPages.push([...pageContent]);
            pageContent = [];
        } else {
            pageContent.push(block);
        }
    });
    allPages.push([...pageContent]);

    return (
        <Box className="document-container" sx={{ p: 3, bgcolor: '#eef2f6', '@media print': { p: 0, bgcolor: 'transparent' } }}>
            <style type="text/css">{`@media print { body * { visibility: hidden; } .printable-area, .printable-area * { visibility: visible; } .printable-area { position: absolute; left: 0; top: 0; width: 100%;} .no-print { display: none !important; } }`}</style>
            <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                 <Typography variant="h4" gutterBottom>Náhled bezpečnostního plánu</Typography>
                 <Box><Button variant="outlined" startIcon={<Print />} onClick={() => window.print()} sx={{mr: 2}}>Vytisknout / PDF</Button>
                    <Button variant="contained" startIcon={<Download />} onClick={handleExportDocx}>Exportovat do .docx</Button></Box>
            </Box>
           
            <Box className="printable-area">
                {allPages.map((pageBlocks, pageIndex) => (
                    <Paper key={pageIndex} sx={pageStyle}>
                        <Box sx={{ flexGrow: 1 }}>
                            {pageBlocks.map((block) => {
                                const absoluteIndex = blocks.indexOf(block);
                                return (
                                <BlockContainer key={block.id} onDelete={() => handleDeleteBlock(block.id)} onAddBlock={(e) => handleOpenAddMenu(e, absoluteIndex)}>
                                    {block.type === 'dynamic' ? (
                                        (() => {
                                            let title = "Neznámý blok";
                                            let previewContent = <Typography>Náhled není dostupný.</Typography>;
                                            if (block.dynamicKey === 'basicInfo') {
                                                title = "Základní údaje";
                                                previewContent = <><Typography><strong>Oficiální název:</strong> {project.officialName || 'N/A'}</Typography><Typography><strong>Organizátor:</strong> {project.organizer || 'N/A'}</Typography></>
                                            } else if (block.dynamicKey === 'teams') {
                                                title = "Týmy";
                                                previewContent = Object.entries(project.involvedTeams || {}).filter(([_,v])=>v).length > 0 ? <ul>{Object.entries(project.involvedTeams).filter(([_,v])=>v).map(([k])=> <li key={k}><Typography variant="body2">{k}</Typography></li>)}</ul> : <Typography>Nebyly vybrány žádné týmy.</Typography>
                                            } else if (block.dynamicKey === 'risks') {
                                                title = "Zvažovaná rizika";
                                                previewContent = (project.risks || []).length > 0 ? <Box sx={{display:'flex', flexWrap:'wrap', gap:1}}>{project.risks.map(r => <Chip key={r.id} label={r.name} size="small" />)}</Box> : <Typography>Žádná rizika.</Typography>
                                            } else if (block.dynamicKey === 'measures') {
                                                title = "Bezpečnostní opatření";
                                                previewContent = Object.values(project.selectedMeasures || {}).some(v=>v) ? <ul>{Object.entries(project.selectedMeasures).filter(([_,v])=>v).map(([k])=> <li key={k}><Typography variant="body2">{k}</Typography></li>)}</ul> : <Typography>Žádná opatření.</Typography>
                                            }
                                            return <DynamicBlock block={block} title={title} onSync={handleSyncDynamicBlock}>{previewContent}</DynamicBlock>
                                        })()
                                    ) : (
                                        <EditableBlock block={block} onSave={handleBlockUpdate} isEditing={editingBlockId === block.id} onToggleEdit={setEditingBlockId} />
                                    )}
                                </BlockContainer>
                            )})}
                        </Box>
                        <PageFooter currentPage={pageIndex + 1} totalPages={allPages.length} />
                    </Paper>
                ))}
            </Box>
            <Menu anchorEl={addMenu.anchorEl} open={Boolean(addMenu.anchorEl)} onClose={handleCloseAddMenu}>
                <MenuItem onClick={() => handleAddBlock('h1')}>Nadpis 1</MenuItem>
                <MenuItem onClick={() => handleAddBlock('h2')}>Nadpis 2</MenuItem>
                <MenuItem onClick={() => handleAddBlock('p')}>Odstavec</MenuItem>
                <MenuItem onClick={() => handleAddBlock('page_break')}>Zalomení stránky</MenuItem>
                <Divider />
                <MenuItem onClick={(e) => setDynamicMenu(e.currentTarget)}>Vložit data z projektu</MenuItem>
            </Menu>
             <Menu anchorEl={dynamicMenu} open={Boolean(dynamicMenu)} onClose={() => setDynamicMenu(null)}>
                <MenuItem onClick={() => handleAddBlock('dynamic', '', 'basicInfo')}>Základní údaje</MenuItem>
                <MenuItem onClick={() => handleAddBlock('dynamic', '', 'teams')}>Týmy</MenuItem>
                <MenuItem onClick={() => handleAddBlock('dynamic', '', 'risks')}>Rizika</MenuItem>
                <MenuItem onClick={() => handleAddBlock('dynamic', '', 'measures')}>Opatření</MenuItem>
             </Menu>
        </Box>
    );
}

export default PlanDocumentA4;