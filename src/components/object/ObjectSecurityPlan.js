// src/components/object/ObjectSecurityPlan.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Typography, Box, Paper, CircularProgress, Alert, Chip, Tabs, Tab, Button, styled } from '@mui/material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Komponenta pro ovládací panel editoru TipTap (stejná jako v předchozí komponentě)
const MenuBar = ({ editor }) => {
  if (!editor) return null;
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Button size="small" onClick={() => editor.chain().focus().toggleBold().run()} variant={editor.isActive('bold') ? 'contained' : 'outlined'}>Bold</Button>
      <Button size="small" onClick={() => editor.chain().focus().toggleItalic().run()} variant={editor.isActive('italic') ? 'contained' : 'outlined'}>Italic</Button>
      <Button size="small" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} variant={editor.isActive('heading', { level: 2 }) ? 'contained' : 'outlined'}>Nadpis</Button>
      <Button size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} variant={editor.isActive('bulletList') ? 'contained' : 'outlined'}>Seznam</Button>
    </Box>
  );
};

const EditorWrapper = styled(Box)(({ theme }) => ({
    '& .ProseMirror': {
        minHeight: '300px',
        padding: theme.spacing(2),
        outline: 'none',
    },
    '& .ProseMirror p': {
        margin: 0,
    }
}));

function ObjectSecurityPlan() {
    const { id: projectId, objectId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingStatus, setSavingStatus] = useState('Uloženo');
    const [activeTab, setActiveTab] = useState(0);

    const [planSections, setPlanSections] = useState({
        general: '',  // Obecně
        phases: '',   // Fáze MÚ
        contacts: '', // Kontakty
        info: ''      // Systém informování
    });
    
    const isInitialLoad = useRef(true);
    const debounceTimeout = useRef(null);

    const planSectionKeys = ['general', 'phases', 'contacts', 'info'];
    const activePlanSectionKey = planSectionKeys[activeTab];

    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setPlanSections(prev => ({ ...prev, [activePlanSectionKey]: html }));
        },
    }, [activeTab]);

    useEffect(() => {
        const loadData = async () => {
            if (!projectId || !objectId) { setLoading(false); return; }
            setLoading(true);
            isInitialLoad.current = true;
            try {
                const docRef = doc(db, 'projects', projectId, 'buildings', objectId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().objectSecurityPlan) {
                    const data = docSnap.data().objectSecurityPlan;
                    const loadedSections = {
                        general: data.general || '',
                        phases: data.phases || '',
                        contacts: data.contacts || '',
                        info: data.info || ''
                    };
                    setPlanSections(loadedSections);
                    if (editor) {
                        editor.commands.setContent(loadedSections[activePlanSectionKey], false);
                    }
                }
            } catch (err) { setError("Nepodařilo se načíst bezpečnostní plán."); }
            setLoading(false);
        };
        loadData();
    }, [projectId, objectId, editor, activePlanSectionKey]);

    const saveData = useCallback(async () => {
        if (!projectId || !objectId) return;
        setSavingStatus('Ukládání...');
        try {
            const docRef = doc(db, 'projects', projectId, 'buildings', objectId);
            await setDoc(docRef, {
                objectSecurityPlan: planSections
            }, { merge: true });
            setSavingStatus('Uloženo');
        } catch (err) {
            setError("Automatické uložení selhalo.");
            setSavingStatus('Chyba při ukládání');
        }
    }, [projectId, objectId, planSections]);

    useEffect(() => {
        if (loading || isInitialLoad.current) {
            if (!loading) isInitialLoad.current = false;
            return;
        }
        setSavingStatus('Neuložené změny');
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => saveData(), 2000);

        return () => clearTimeout(debounceTimeout.current);
    }, [planSections, saveData, loading]);


    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    if (loading) return <CircularProgress />;

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Bezpečnostní plán objektu</Typography>
                <Chip label={savingStatus} color={savingStatus === 'Uloženo' ? 'success' : savingStatus === 'Ukládání...' ? 'info' : 'warning'} />
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="kapitoly bezpečnostního plánu">
                    <Tab label="Obecně" />
                    <Tab label="Fáze MÚ" />
                    <Tab label="Kontakty" />
                    <Tab label="Systém informování" />
                </Tabs>
            </Box>
            
            <EditorWrapper sx={{ border: 1, borderColor: 'divider', borderRadius: '0 0 4px 4px' }}>
                <MenuBar editor={editor} />
                <EditorContent editor={editor} />
            </EditorWrapper>
        </Paper>
    );
}

export default ObjectSecurityPlan;