// src/components/object/ThreatScoringDialog.js

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Slider, Grid
} from '@mui/material';
import { evaluationCriteria } from '../../config/threatMethodologyData';

// Helper component for a single scoring slider
const ScoringSlider = ({ label, value, onChange }) => (
  <Box>
    <Typography gutterBottom>{label}</Typography>
    <Slider
      value={value || 1}
      onChange={onChange}
      step={1}
      marks
      min={1}
      max={7}
      valueLabelDisplay="auto"
    />
  </Box>
);

function ThreatScoringDialog({ open, onClose, threat, onSave }) {
  const [scores, setScores] = useState({});

  useEffect(() => {
    // When the dialog opens, initialize scores from the threat object
    if (threat) {
      setScores({
        availability: threat.availability || 1,
        occurrence: threat.occurrence || 1,
        complexity: threat.complexity || 1,
        lifeAndHealth: threat.lifeAndHealth || 1,
        facility: threat.facility || 1,
        financial: threat.financial || 1,
        community: threat.community || 1,
      });
    }
  }, [threat, open]);

  const handleSave = () => {
    onSave(threat.id, scores);
    onClose();
  };

  if (!threat) return null;

  // Calculate totals
  const probabilityTotal = (scores.availability || 1) + (scores.occurrence || 1) + (scores.complexity || 1);
  const impactTotal = (scores.lifeAndHealth || 1) + (scores.facility || 1) + (scores.financial || 1) + (scores.community || 1);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detailní hodnocení hrozby: "{threat.name}"</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={4}>
          {/* Probability Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Pravděpodobnost (max 21)</Typography>
            {evaluationCriteria.probability.map(criterion => (
              <ScoringSlider
                key={criterion.key}
                label={criterion.label}
                value={scores[criterion.key]}
                onChange={(_, newValue) => setScores(prev => ({ ...prev, [criterion.key]: newValue }))}
              />
            ))}
            <Typography variant="h6" align="right" mt={2}>Celkem: {probabilityTotal}</Typography>
          </Grid>
          {/* Impact Section */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Dopad (max 28)</Typography>
            {evaluationCriteria.impact.map(criterion => (
              <ScoringSlider
                key={criterion.key}
                label={criterion.label}
                value={scores[criterion.key]}
                onChange={(_, newValue) => setScores(prev => ({ ...prev, [criterion.key]: newValue }))}
              />
            ))}
            <Typography variant="h6" align="right" mt={2}>Celkem: {impactTotal}</Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zrušit</Button>
        <Button onClick={handleSave} variant="contained">Uložit hodnocení</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ThreatScoringDialog;