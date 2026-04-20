import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

export default function RiskScoringDialog({ open, onClose, risk, onSave }) {
    if (!risk) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Detailní hodnocení rizika: "{risk.name}"</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    Detailní hodnocení subfaktorů je dostupné přímo v tabulce hodnocení ohroženosti.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Zavřít</Button>
            </DialogActions>
        </Dialog>
    );
}
