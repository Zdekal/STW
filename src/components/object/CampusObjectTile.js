// src/components/object/CampusObjectTile.js
import React from 'react';
import { Card, CardActionArea, CardContent, Typography, Box, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

// Komponenta nyní přijímá novou funkci "onDelete"
function CampusObjectTile({ building, onSelect, onDelete }) {
    const { name, address, capacity, size, components } = building;

    const handleDeleteClick = (e) => {
        // Zastaví "prokliknutí" na kartu, aby se neaktivovala funkce onSelect
        e.stopPropagation(); 
        if (window.confirm(`Opravdu si přejete smazat objekt "${name}"?`)) {
            onDelete();
        }
    };

    return (
        // Přidáváme position: 'relative', aby se ikona mohla absolutně pozicovat
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <Tooltip title="Smazat objekt">
                <IconButton
                    aria-label="delete"
                    onClick={handleDeleteClick}
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, backgroundColor: 'rgba(255,255,255,0.7)' }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <CardActionArea onClick={onSelect} sx={{ flexGrow: 1 }}>
                <CardContent>
                    <Typography gutterBottom variant="h5" component="h2" color="primary">
                        {name}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Adresa:</strong> {address}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Kapacita:</strong> {capacity} osob
                        </Typography>
                         <Typography variant="body2" color="text.secondary">
                            <strong>Velikost:</strong> {size}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            <strong>Součásti:</strong> {components}
                        </Typography>
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

export default CampusObjectTile;