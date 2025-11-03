// src/components/object/RiskMatrix.js

import React from 'react';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Box, Typography } from '@mui/material';

// Registrace potřebných částí Chart.js
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

function RiskMatrix({ threats }) {

  // Připravíme data do formátu, kterému graf rozumí
  const data = {
    datasets: [{
      label: 'Hrozby',
      data: threats.map(threat => ({
        // Osa X: Součet bodů za pravděpodobnost
        x: (threat.availability || 1) + (threat.occurrence || 1) + (threat.complexity || 1),
        // Osa Y: Součet bodů za dopad
        y: (threat.lifeAndHealth || 1) + (threat.facility || 1) + (threat.financial || 1) + (threat.community || 1),
        // Extra data pro zobrazení v tooltipu
        name: threat.name
      })),
      backgroundColor: 'rgba(255, 99, 132, 0.8)',
      pointRadius: 8,
      pointHoverRadius: 12,
    }],
  };

  // Nastavení os a vzhledu grafu
  const options = {
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Pravděpodobnost (3-21)',
          font: { size: 14 }
        },
        min: 3,
        max: 21,
      },
      y: {
        title: {
          display: true,
          text: 'Dopad (4-28)',
          font: { size: 14 }
        },
        min: 4,
        max: 28,
      }
    },
    plugins: {
      legend: {
        display: false // Skryjeme legendu, máme jen jednu datovou sadu
      },
      tooltip: {
        callbacks: {
          // Vlastní formát pro tooltip, který se ukáže po najetí myší
          label: function(context) {
            const point = context.raw;
            return `${point.name}: (Pravděpodobnost: ${point.x}, Dopad: ${point.y})`;
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  return (
    <Box mt={5}>
      <Typography variant="h5" component="h2" gutterBottom>
        Matice Rizik
      </Typography>
      <Box sx={{ position: 'relative', height: '500px', p: 1, border: '1px solid #ddd', borderRadius: '4px' }}>
        <Scatter options={options} data={data} />
      </Box>
    </Box>
  );
}

export default RiskMatrix;