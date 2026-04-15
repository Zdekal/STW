// src/config/eventTypesRisks.js
// Mapování typů akcí na názvy rizik a outdoor-specifická rizika.
// Odvozeno z defaultProjectRisks.js (eventTypes a environments polí).

import { defaultProjectRisksValues } from './defaultProjectRisks';

// Dynamicky vygenerované mapování: eventType → pole názvů rizik
function buildMapping() {
    const mapping = {};
    for (const risk of defaultProjectRisksValues) {
        if (!risk.eventTypes) continue;
        for (const et of risk.eventTypes) {
            if (!mapping[et]) mapping[et] = [];
            mapping[et].push(risk.name);
        }
    }
    return mapping;
}

export const eventTypeRisksMapping = buildMapping();

// Rizika specifická pro venkovní prostředí (pouze venkovní+kombinovaná, nikoliv vnitřní)
export const outdoorRisks = defaultProjectRisksValues
    .filter(r =>
        r.environments &&
        r.environments.includes('venkovní') &&
        !r.environments.includes('vnitřní')
    )
    .map(r => r.name);
