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

  // 1. Seskupíme hrozby se stejnými souřadnicemi
  const groupedData = {};
  if (Array.isArray(threats)) {
    threats
      .filter(threat => threat && typeof threat === 'object')
      .forEach(threat => {
        const availability = Number(threat.availability) || 1;
        const occurrence = Number(threat.occurrence) || 1;
        const complexity = Number(threat.complexity) || 1;
        const lifeAndHealth = Number(threat.lifeAndHealth) || 1;
        const facility = Number(threat.facility) || 1;
        const financial = Number(threat.financial) || 1;
        const community = Number(threat.community) || 1;

        const x = availability + occurrence + complexity;
        const y = lifeAndHealth + facility + financial + community;
        const key = `${x}-${y}`;

        if (!groupedData[key]) {
          groupedData[key] = { x, y, names: [], count: 0 };
        }
        groupedData[key].names.push(typeof threat.name === 'string' ? threat.name : 'Neznámá hrozba');
        groupedData[key].count += 1;
      });
  }

  // Převod na pole pro ChartJS
  const mappedData = Object.values(groupedData).map(group => {
    const score = group.x * group.y;
    // Určení priority / barvy podle skóre
    let color = 'rgba(34, 197, 94, 0.8)'; // Nízké (Zelená)
    let priorityName = 'Nízká priorita';
    
    if (score >= 300) { color = 'rgba(225, 29, 72, 0.8)'; priorityName = 'Kritické riziko'; }
    else if (score >= 150) { color = 'rgba(249, 115, 22, 0.8)'; priorityName = 'Vysoké riziko'; }
    else if (score >= 50) { color = 'rgba(234, 179, 8, 0.8)'; priorityName = 'Střední riziko'; }

    return {
      x: group.x,
      y: group.y,
      names: group.names,
      count: group.count,
      score: score,
      color: color,
      priorityName: priorityName
    };
  });

  const data = {
    datasets: [{
      label: 'Hrozby',
      data: mappedData,
      backgroundColor: (context) => {
        const point = context.raw;
        return point ? point.color : 'rgba(255, 99, 132, 0.8)';
      },
      // Zvětšení poloměru s každým dalším rizikem (základ 8, za každé navíc + 3)
      pointRadius: (context) => {
        const point = context.raw;
        if (!point) return 8;
        return 8 + (point.count - 1) * 3;
      },
      // Hover efekt o něco větší
      pointHoverRadius: (context) => {
        const point = context.raw;
        if (!point) return 12;
        return 12 + (point.count - 1) * 4;
      },
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
          label: function (context) {
            const point = context.raw;
            // Vrátíme pole řádků pro Tooltip
            let lines = [
                `Počet rizik v bodě: ${point.count}`,
                `Závažnost: ${point.priorityName} (Skóre: ${point.score})`,
                `Pravděpodobnost: ${point.x} | Dopad: ${point.y}`,
                '-------------------------'
            ];
            point.names.forEach(n => lines.push(`• ${n}`));
            return lines;
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