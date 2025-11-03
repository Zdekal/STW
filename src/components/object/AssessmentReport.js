// src/components/object/AssessmentReport.js
// --- Stránka pro generování reportu ---
import React from 'react';
import { Typography, Button } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';

function AssessmentReport() {
    return (
        <div>
            <Typography variant="h4">Report bezpečnostního posouzení</Typography>
            <Typography sx={{mt: 2}}>Tato komponenta bude generovat PDF report na základě vyplněného bezpečnostního dotazníku.</Typography>
            <Button variant="contained" startIcon={<PictureAsPdf />} sx={{mt: 3}}>Generovat PDF</Button>
        </div>
    );
}
export default AssessmentReport;