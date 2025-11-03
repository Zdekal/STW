import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Typography, Checkbox, FormControlLabel, FormGroup, Box, CircularProgress, Alert } from '@mui/material';

const ProjectChecklist = ({ projectId: propProjectId, audienceSize: propAudienceSize }) => {
    const { id: routeProjectId } = useParams();
    const projectId = propProjectId || routeProjectId;
    const [audienceSize, setAudienceSize] = useState(propAudienceSize ?? null);
    const [checklistItems, setChecklistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAudience = async () => {
            if (audienceSize === null && projectId) {
                try {
                    const docRef = doc(db, 'projects', projectId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setAudienceSize(data.audienceSize || 0);
                    }
                } catch (err) {
                    setError('Chyba při načítání dat projektu');
                }
            }
        };
        fetchAudience();
    }, [audienceSize, projectId]);

    useEffect(() => {
        if (audienceSize === null) return;

        const newChecklist = [];
        const parsed = parseInt(audienceSize, 10);

        if (!isNaN(parsed) && parsed > 200) {
            newChecklist.push({
                label: 'Konzultovat požární dokumentaci vzhledem k vyššímu počtu osob',
                explanation: 'Pro akce s větším počtem účastníků je nutné řešit požární ochranu podle vyhlášky.',
                id: 'fire_doc_consult',
                checked: false,
            });
            newChecklist.push({
                label: 'Zajistit zdravotnickou pomoc',
                explanation: 'U větších nebo rizikových akcí je doporučeno zajistit zdravotnický dohled.',
                id: 'medical_aid',
                checked: false,
            });
        }

        setChecklistItems(newChecklist);
        setLoading(false);
    }, [audienceSize]);

    const handleChecklistItemToggle = (id) => {
        setChecklistItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            )
        );
    };

    if (loading) return <Box className="flex justify-center p-8"><CircularProgress /></Box>;
    if (error) return <Alert severity="error" className="m-4">{error}</Alert>;

    return (
        <section className="my-12">
            <h2 className="text-xl font-semibold border-b pb-3 mb-6">Doporučené úkoly a povinnosti</h2>
            {checklistItems.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    Pro tento počet účastníků nejsou aktuálně žádné specifické doporučené úkoly.
                </Typography>
            ) : (
                <FormGroup>
                    {checklistItems.map((item) => (
                        <div key={item.id} className="mb-4">
                            <FormControlLabel
                                control={<Checkbox checked={item.checked} onChange={() => handleChecklistItemToggle(item.id)} />}
                                label={<Typography variant="body1" sx={{ fontWeight: 'medium' }}>{item.label}</Typography>}
                            />
                            {item.explanation && (
                                <Typography variant="caption" display="block" sx={{ ml: 4, mt: -0.5, color: 'text.secondary' }}>
                                    {item.explanation}
                                </Typography>
                            )}
                        </div>
                    ))}
                </FormGroup>
            )}
        </section>
    );
};

export default ProjectChecklist;
