// src/components/object/SecurityPlan.js
// --- Stránka pro bezpečnostní plán ---
import React from 'react';
import { Typography } from '@mui/material';

function SecurityPlan() {
    return (
        <div>
            <Typography variant="h4">Bezpečnostní plán</Typography>
             <Typography sx={{mt: 2}}>Bude obsahovat kapitoly "Obecný plán" a "Plán zabezpečení akcí v objektu".</Typography>
        </div>
    );
}
export default SecurityPlan;