// src/components/ProjectHeader.js
import React from 'react';
import { Typography } from '@mui/material';

const ProjectHeader = ({ title }) => (
  <Typography variant="h5" sx={{ mb: 2 }}>
    {title || "Dashboard"}
  </Typography>
);

export default ProjectHeader;
