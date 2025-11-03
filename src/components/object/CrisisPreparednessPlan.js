// src/components/object/CrisisPreparednessPlan.js
// --- Stránka pro plán krizové připravenosti ---
import React from 'react';
import { Typography } from '@mui/material';

function CrisisPreparednessPlan() {
    return (
        <div>
            <Typography variant="h4">Plán krizové připravenosti</Typography>
            <Typography sx={{mt: 2}}>Bude obsahovat kapitoly: Aktivace plánu, Členové krizového štábu, a Postupy.</Typography>
        </div>
    );
}
export default CrisisPreparednessPlan;