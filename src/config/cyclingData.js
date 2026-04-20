// src/config/cyclingData.js
// Rizika specifická pro cyklistický závod (projektový typ "cyklozavod").
// Filtruje z defaultProjectRisks rizika, která mají "etapovy_cyklisticky_zavod" v eventTypes.

import { defaultProjectRisksValues } from './defaultProjectRisks';

export const cyclingRisks = defaultProjectRisksValues
    .filter(r => r.eventTypes && r.eventTypes.includes('etapovy_cyklisticky_zavod'))
    .map(r => ({ ...r }));
