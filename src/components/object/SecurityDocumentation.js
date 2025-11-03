// src/components/object/SecurityDocumentation.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Typography, Box, Paper, CircularProgress, Alert, Chip, Tabs, Tab, Button, styled } from '@mui/material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Komponenta pro ovládací panel editoru TipTap
const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Button size="small" onClick={() => editor.chain().focus().toggleBold().run()} variant={editor.isActive('bold') ? 'contained' : 'outlined'}>Bold</Button>
      <Button size="small" onClick={() => editor.chain().focus().toggleItalic().run()} variant={editor.isActive('italic') ? 'contained' : 'outlined'}>Italic</Button>
      <Button size="small" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} variant={editor.isActive('heading', { level: 2 }) ? 'contained' : 'outlined'}>Nadpis</Button>
      <Button size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} variant={editor.isActive('bulletList') ? 'contained' : 'outlined'}>Seznam</Button>
    </Box>
  );
};

// Vlastní styly pro obsah editoru
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

function SecurityDocumentation() {
    const { id: projectId, objectId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingStatus, setSavingStatus] = useState('Uloženo');
    const [activeTab, setActiveTab] = useState(0);
    
    const [directives, setDirectives] = useState({ governing: '', regime: '', emergency: '', securityService: '' });
    
    const isInitialLoad = useRef(true);
    const debounceTimeout = useRef(null);

    const directiveKeys = ['governing', 'regime', 'emergency', 'securityService'];
    const activeDirectiveKey = directiveKeys[activeTab];

    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setDirectives(prev => ({ ...prev, [activeDirectiveKey]: html }));
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
                if (docSnap.exists() && docSnap.data().securityDocumentation) {
                    const data = docSnap.data().securityDocumentation;
                    const loadedDirectives = {
                        governing: data.governing || '',
                        regime: data.regime || '',
                        emergency: data.emergency || '',
                        securityService: data.securityService || ''
                    };
                    setDirectives(loadedDirectives);
                    // Načtení obsahu do editoru po načtení dat
                    if (editor) {
                        editor.commands.setContent(loadedDirectives[activeDirectiveKey], false);
                    }
                }
            } catch (err) { setError("Nepodařilo se načíst dokumentaci."); }
            setLoading(false);
        };
        loadData();
    }, [projectId, objectId, editor, activeDirectiveKey]); // Přidán editor a activeDirectiveKey do závislostí

    const saveData = useCallback(async () => {
        if (!projectId || !objectId) return;
        setSavingStatus('Ukládání...');
        try {
            const docRef = doc(db, 'projects', projectId, 'buildings', objectId);
            await setDoc(docRef, { securityDocumentation: directives }, { merge: true });
            setSavingStatus('Uloženo');
        } catch (err) {
            setError("Automatické uložení selhalo.");
            setSavingStatus('Chyba při ukládání');
        }
    }, [projectId, objectId, directives]);

    useEffect(() => {
        if (loading || isInitialLoad.current) {
            if (!loading) isInitialLoad.current = false;
            return;
        }
        setSavingStatus('Neuložené změny');
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => saveData(), 2000);

        return () => clearTimeout(debounceTimeout.current);
    }, [directives, saveData, loading]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    if (loading) return <CircularProgress />;

    return (
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Bezpečnostní dokumentace</Typography>
                <Chip label={savingStatus} color={savingStatus === 'Uloženo' ? 'success' : savingStatus === 'Ukládání...' ? 'info' : 'warning'} />
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="záložky směrnic">
                    <Tab label="Nosná směrnice" />
                    <Tab label="Režimová směrnice" />
                    <Tab label="Mimořádné události" />
                    <Tab label="Služba ostrahy" />
                </Tabs>
            </Box>
            
            <EditorWrapper sx={{ border: 1, borderColor: 'divider', borderRadius: '0 0 4px 4px' }}>
                <MenuBar editor={editor} />
                <EditorContent editor={editor} />
            </EditorWrapper>
        </Paper>
    );
}

export default SecurityDocumentation;