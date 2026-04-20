// src/lib/risks/riskGenerator.js
// Generátor výchozích rizik pro nový projekt na základě typu akce a prostředí.

import { defaultProjectRisksValues } from '../../config/defaultProjectRisks';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generuje počáteční rizika projektu na základě jeho konfigurace.
 * Přidává tagy podle toho, proč bylo riziko zahrnuto.
 * @param {string} uid - ID uživatele
 * @param {Object} projectData - Data projektu (eventType, environmentType, selectedVulnerabilities, ...)
 * @param {Object[]} vulnerabilities - Globální zranitelnosti s targets
 * @returns {Object[]} Pole rizik s unikátními ID a tagy
 */
export async function generateInitialRisks(uid, projectData = {}, vulnerabilities = []) {
    const eventType = projectData.eventType || '';
    const environmentType = projectData.environmentType || 'kombinovaná';
    const selectedVulnIds = projectData.selectedVulnerabilities || [];

    // Rizika odpovídající typu akce a prostředí
    const baseRisks = defaultProjectRisksValues.filter(risk => {
        if (eventType && risk.eventTypes && risk.eventTypes.length > 0) {
            if (!risk.eventTypes.includes(eventType)) return false;
        }
        if (environmentType && risk.environments && risk.environments.length > 0) {
            if (!risk.environments.includes(environmentType)) return false;
        }
        return true;
    });

    const baseRiskNames = new Set(baseRisks.map(r => r.name));

    // Rizika přidaná ze zranitelností (která nejsou v base)
    const vulnAddedRiskNames = new Set();
    if (selectedVulnIds.length > 0 && vulnerabilities.length > 0) {
        for (const vuln of vulnerabilities) {
            if (!selectedVulnIds.includes(vuln.id)) continue;
            for (const target of (vuln.targets || [])) {
                if (!baseRiskNames.has(target.riskName)) {
                    vulnAddedRiskNames.add(target.riskName);
                }
            }
        }
    }

    // Rizika, kterých se dotýkají zranitelnosti (i base)
    const vulnModifiedRiskNames = new Set();
    if (selectedVulnIds.length > 0 && vulnerabilities.length > 0) {
        for (const vuln of vulnerabilities) {
            if (!selectedVulnIds.includes(vuln.id)) continue;
            for (const target of (vuln.targets || [])) {
                const mods = target.modifiers || {};
                const hasNonZero = Object.values(mods).some(v => v !== 0);
                if (hasNonZero) {
                    vulnModifiedRiskNames.add(target.riskName);
                }
            }
        }
    }

    // Přidej rizika z vulnerabilit, která nejsou v base
    const extraRisks = [];
    if (vulnAddedRiskNames.size > 0) {
        for (const name of vulnAddedRiskNames) {
            const def = defaultProjectRisksValues.find(r => r.name === name);
            if (def) extraRisks.push(def);
        }
    }

    const allDefs = [...baseRisks, ...extraRisks];

    // Outdoor-only rizika (venkovní/kombinovaná, ale ne vnitřní)
    const isOutdoorEnv = environmentType === 'venkovní' || environmentType === 'kombinovaná';

    return allDefs.map((def) => {
        const tags = [];

        // Outdoor-only tag
        const isOutdoorOnly = def.environments &&
            !def.environments.includes('vnitřní') &&
            (def.environments.includes('venkovní') || def.environments.includes('kombinovaná'));

        if (isOutdoorOnly && isOutdoorEnv) {
            tags.push('Prostředí: Venkovní');
        } else if (baseRiskNames.has(def.name) && !vulnAddedRiskNames.has(def.name)) {
            tags.push('Základní pro typ akce');
        }

        // Vulnerability tags
        if (vulnAddedRiskNames.has(def.name)) {
            tags.push('Přidáno ze specifik akce');
        }
        if (vulnModifiedRiskNames.has(def.name)) {
            // Calculate total modifier sum for display
            let totalMod = 0;
            for (const vuln of vulnerabilities) {
                if (!selectedVulnIds.includes(vuln.id)) continue;
                for (const target of (vuln.targets || [])) {
                    if (target.riskName !== def.name) continue;
                    const mods = target.modifiers || {};
                    totalMod += Object.values(mods).reduce((s, v) => s + v, 0);
                }
            }
            if (totalMod !== 0) {
                tags.push(`Modifikováno ze specifik akce (${totalMod > 0 ? '+' : ''}${totalMod})`);
            }
        }

        return {
            id: `risk-default-${Date.now()}-${uuidv4().slice(0, 8)}`,
            name: def.name,
            probability: (def.availability || 1) + (def.occurrence || 1) + (def.complexity || 1),
            impact: (def.lifeAndHealth || 1) + (def.facility || 1) + (def.financial || 1) + (def.community || 1),
            availability: def.availability || 1,
            occurrence: def.occurrence || 1,
            complexity: def.complexity || 1,
            lifeAndHealth: def.lifeAndHealth || 1,
            facility: def.facility || 1,
            financial: def.financial || 1,
            community: def.community || 1,
            tags,
            createdAt: new Date().toISOString(),
        };
    });
}
