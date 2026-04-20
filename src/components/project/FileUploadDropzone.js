import React from 'react';
import { Box, Typography } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

export default function FileUploadDropzone({ projectId, existingFiles = [], onFilesChange }) {
    return (
        <Box
            sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                color: 'text.secondary',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
            }}
        >
            <CloudUpload sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">
                Funkce nahrávání souborů bude brzy k dispozici.
            </Typography>
            {existingFiles.length > 0 && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Nahráno souborů: {existingFiles.length}
                </Typography>
            )}
        </Box>
    );
}
