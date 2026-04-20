// src/lib/documentGenerator.js
// Generátor DOCX dokumentů z dat projektu a šablony.

import {
    Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, PageBreak,
    Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
    Header, Footer, PageNumber, VerticalAlign, HeightRule, ImageRun,
} from 'docx';
import { toBand, SUBFACTOR_BANDS } from './risks';

// URL loga pro hlavičku DOCX (musí být v public/). Fallback: bez loga.
const LOGO_URL = '/logo-stt.png';
const LOGO_WIDTH = 120; // px v headeru (poměr stran ~2.75:1 → výška ~44)
const LOGO_HEIGHT = 44;

async function loadLogoBuffer() {
    try {
        const res = await fetch(LOGO_URL);
        if (!res.ok) return null;
        return await res.arrayBuffer();
    } catch {
        return null;
    }
}

// Klasický serif font pro celý dokument — lépe odpovídá formálnímu stylu
// bezpečnostních dokumentů (vs. moderní Calibri).
const DOC_FONT = 'Times New Roman';

// Barvy pásem rizik (fill + kontrastní text), sladěné s UI.
const BAND_COLORS = {
    critical: { fill: 'B91C1C', text: 'FFFFFF', label: 'Kritická' },
    high:     { fill: 'F59E0B', text: '000000', label: 'Vysoká' },
    medium:   { fill: 'FDE68A', text: '000000', label: 'Střední' },
    low:      { fill: 'BBF7D0', text: '000000', label: 'Nízká' },
};

// ── Pomocné funkce ──────────────────────────────────────────────────────

function heading1(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 32, font: DOC_FONT })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 200 },
    });
}

function heading2(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 26, font: DOC_FONT })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 280, after: 140 },
    });
}

function heading3(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 22, font: DOC_FONT })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
    });
}

function para(text, options = {}) {
    return new Paragraph({
        children: [new TextRun({ text, font: DOC_FONT, ...options })],
        spacing: { after: 100 },
        alignment: AlignmentType.JUSTIFIED,
    });
}

function bulletItem(text) {
    return new Paragraph({
        children: [new TextRun({ text, font: DOC_FONT })],
        bullet: { level: 0 },
        spacing: { after: 60 },
    });
}

function emptyLine() {
    return new Paragraph({ text: '', spacing: { after: 100 } });
}

function placeholderPara(text) {
    return new Paragraph({
        children: [new TextRun({ text: `[${text}]`, italics: true, color: '999999', font: DOC_FONT })],
        spacing: { after: 100 },
    });
}

function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
}

// ── Pomocné funkce pro tabulky ──────────────────────────────────────────

function tableHeaderCell(text, widthPct, alignment = AlignmentType.CENTER) {
    return new TableCell({
        width: { size: widthPct, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: '1F2937' },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
            alignment,
            children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 20, font: DOC_FONT })],
        })],
    });
}

function tableDataCell(text, { alignment = AlignmentType.LEFT, bold = false, size = 20 } = {}) {
    return new TableCell({
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
            alignment,
            children: [new TextRun({ text, size, bold, font: DOC_FONT })],
        })],
    });
}

function tableBandCell(band) {
    const c = BAND_COLORS[band?.id] || { fill: 'FFFFFF', text: '000000' };
    return new TableCell({
        shading: { type: ShadingType.CLEAR, fill: c.fill },
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: band?.label || '—', bold: true, color: c.text, size: 20, font: DOC_FONT })],
        })],
    });
}

function noBorders() {
    const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    return { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
}

// Titulní strana
function titlePage(template, project) {
    const projectName = project.officialName || project.name || 'Projekt';
    const date = new Date().toLocaleDateString('cs-CZ');
    const author = project.author || '';

    return [
        new Paragraph({ text: '', spacing: { before: 3000 } }),
        new Paragraph({
            children: [new TextRun({ text: template.title, bold: true, size: 56 })],
            alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
            children: [new TextRun({ text: template.subtitle || '', size: 32, color: '666666' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        }),
        new Paragraph({
            children: [new TextRun({ text: projectName, bold: true, size: 40 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
        }),
        new Paragraph({
            children: [new TextRun({ text: `Datum zpracování: ${date}`, size: 24, color: '666666' })],
            alignment: AlignmentType.CENTER,
        }),
        ...(author ? [new Paragraph({
            children: [new TextRun({ text: `Zpracovatel: ${author}`, size: 24, color: '666666' })],
            alignment: AlignmentType.CENTER,
        })] : []),
        pageBreak(),
    ];
}

// Obsah (statický seznam kapitol)
function tableOfContents(template) {
    const items = [];
    items.push(heading1('Obsah'));
    for (const ch of template.chapters) {
        items.push(para(`${ch.number}. ${ch.title}`));
        if (ch.subchapters) {
            for (const sub of ch.subchapters) {
                items.push(para(`    ${sub.number} ${sub.title}`));
            }
        }
    }
    items.push(pageBreak());
    return items;
}

// ── Generátory obsahu kapitol ───────────────────────────────────────────

function generateBasicInfo(project) {
    const items = [];
    items.push(para(`Oficiální název: ${project.officialName || project.name || '—'}`));
    if (project.organizer) items.push(para(`Organizátor: ${project.organizer}`));
    if (project.audienceSize) items.push(para(`Očekávaný počet osob: ${project.audienceSize}`));
    if (project.environmentType) items.push(para(`Prostředí: ${project.environmentType}`));
    if (project.eventType) items.push(para(`Typ akce: ${project.eventType}`));

    const dates = project.dates || [];
    if (dates.length > 0) {
        items.push(emptyLine());
        items.push(heading3('Termíny a místa konání'));
        dates.forEach((d, i) => {
            const parts = [];
            if (d.date) parts.push(d.date);
            if (d.location) parts.push(d.location);
            if (d.description) parts.push(d.description);
            items.push(bulletItem(parts.join(' – ') || `Den ${i + 1}`));
        });
    }

    if (items.length === 0) {
        items.push(placeholderPara('Doplňte základní informace o akci v sekci Základní údaje'));
    }
    return items;
}

function generateRiskSummary(project) {
    const items = [];
    const risks = project.customRisks || [];
    const isOutdoor = project.environmentType === 'venkovní' || project.environmentType === 'vnější';

    items.push(para('Hodnocení ohroženosti bylo provedeno na základě metodiky Ministerstva vnitra ČR pro ochranu měkkých cílů.'));
    items.push(para(`Celkem bylo identifikováno ${risks.length} rizik.`));

    // Poznámka o dopadu na techniku/objekt
    if (isOutdoor) {
        items.push(emptyLine());
        items.push(para('Poznámka k hodnocení dopadu na techniku a objekt:', { bold: true }));
        items.push(para('Při hodnocení dopadu incidentu na techniku a objekt u venkovních akcí pracujeme s verzí, že objekt (budova, sportoviště) je ve vlastnictví soukromého subjektu, který ponese dopad na budovu sám. Pořadatel akce proto řeší pouze dopad na vlastní techniku (nikoli na budovu/objekt). Z tohoto důvodu je subfaktor „Technika/Objekt" u venkovních akcí vynechán z výpočtu dopadu.'));
    }

    if (risks.length > 0) {
        const computeScore = (r) => {
            const pSum = (Number(r.availability) || 1) + (Number(r.occurrence) || 1) + (Number(r.complexity) || 1);
            const dSum = (Number(r.lifeAndHealth) || 1) + (isOutdoor ? 0 : (Number(r.facility) || 1)) + (Number(r.financial) || 1) + (Number(r.community) || 1);
            return { pSum, dSum, score: pSum * dSum };
        };

        // Graf rozložení rizik podle pásem
        items.push(emptyLine());
        items.push(heading3('Rozložení rizik podle pásem'));
        items.push(...generateRiskDistributionChart(project));

        // Prioritní rizika (top 5 by score)
        const sorted = [...risks].sort((a, b) => computeScore(b).score - computeScore(a).score);
        items.push(emptyLine());
        items.push(heading3('Prioritní rizika'));
        sorted.slice(0, 5).forEach((r, i) => {
            const { score } = computeScore(r);
            items.push(bulletItem(`${i + 1}. ${r.name} (skóre: ${score})`));
        });

        // Nejpravděpodobnější a nejvyšší dopad
        const byProbability = [...risks].sort((a, b) => computeScore(b).pSum - computeScore(a).pSum);
        const byImpact = [...risks].sort((a, b) => computeScore(b).dSum - computeScore(a).dSum);

        items.push(emptyLine());
        items.push(heading3('Celkové hodnocení'));
        items.push(bulletItem(`Nejpravděpodobnější incident: ${byProbability[0]?.name} (P = ${computeScore(byProbability[0]).pSum})`));
        items.push(bulletItem(`Incident s nejvyšším dopadem: ${byImpact[0]?.name} (D = ${computeScore(byImpact[0]).dSum})`));
        items.push(bulletItem(`Nejrizikovější incident celkově: ${sorted[0]?.name} (skóre = ${computeScore(sorted[0]).score})`));

        // Lokalizace a načasování vliv
        try {
            const { getLocationTimingConfig, computeLocationTimingImpact } = require('../config/locationTimingData');
            const ltConfig = getLocationTimingConfig(project.eventType);
            const activeLocTimings = project.activeLocationTimings || [];
            if (ltConfig && activeLocTimings.length > 0) {
                const impact = computeLocationTimingImpact(activeLocTimings, ltConfig, risks, isOutdoor);
                const locImpact = impact.filter(i => i.type === 'location' && i.totalImpact > 0).sort((a, b) => b.totalImpact - a.totalImpact);
                const timeImpact = impact.filter(i => i.type === 'timing' && i.totalImpact > 0).sort((a, b) => b.totalImpact - a.totalImpact);

                if (locImpact.length > 0) {
                    items.push(bulletItem(`Nejrizikovější lokalizace: ${locImpact[0].name} (+${locImpact[0].totalImpact} bodů)`));
                }
                if (timeImpact.length > 0) {
                    items.push(bulletItem(`Nejrizikovější načasování: ${timeImpact[0].name} (+${timeImpact[0].totalImpact} bodů)`));
                }
            }
        } catch (e) { /* no location/timing data */ }
    } else {
        items.push(placeholderPara('Přidejte rizika v sekci Zvažovaná rizika'));
    }
    return items;
}

function generateThreatSources(project) {
    const items = [];
    items.push(para('Identifikace zdrojů nebezpečí vychází z metodiky MV ČR, bezpečnostního dotazníku, zkušeností z předchozích ročníků a konzultace s organizátorem.'));
    items.push(emptyLine());
    items.push(heading3('Potenciální zdroje ohrožení'));
    items.push(bulletItem('Běžní pachatelé klasické kriminality'));
    items.push(bulletItem('Psychicky narušené osoby'));
    items.push(bulletItem('Osoby motivované pomstou'));
    items.push(bulletItem('Konkurenční konflikty'));
    items.push(emptyLine());
    items.push(heading3('Způsoby provedení (modus operandi)'));

    const risks = project.customRisks || [];
    if (risks.length > 0) {
        risks.forEach(r => items.push(bulletItem(r.name)));
    } else {
        items.push(placeholderPara('Doplňte identifikovaná rizika'));
    }
    return items;
}

function generateVulnerabilities(project) {
    const items = [];
    const selected = project.selectedVulnerabilities || [];
    if (selected.length > 0) {
        items.push(para(`Pro tento projekt bylo identifikováno ${selected.length} specifických zranitelností ovlivňujících hodnocení rizik.`));
        items.push(placeholderPara('Detailní popis zranitelností – viz záložka Zranitelnosti akce v aplikaci'));
    } else {
        items.push(para('Nebyly identifikovány žádné specifické zranitelnosti projektu.'));
        items.push(placeholderPara('Zranitelnosti lze nastavit v záložce Rizika → Zranitelnosti akce'));
    }
    return items;
}

function generateLocationTimingSpecifics(project) {
    const items = [];
    const activeLocTimings = project.activeLocationTimings || [];
    const customLocTimings = project.customLocationTimings || [];
    const isOutdoor = project.environmentType === 'venkovní' || project.environmentType === 'vnější';

    // Pokud máme strukturovaná data (checkboxy)
    let ltConfig = null;
    try {
        const { getLocationTimingConfig, computeLocationTimingImpact } = require('../config/locationTimingData');
        ltConfig = getLocationTimingConfig(project.eventType);

        if (ltConfig && activeLocTimings.length > 0) {
            const allLocations = [...(ltConfig.locations || []), ...customLocTimings.filter(c => c.type === 'location')];
            const allTimings = [...(ltConfig.timings || []), ...customLocTimings.filter(c => c.type === 'timing')];
            const activeLocations = allLocations.filter(l => activeLocTimings.includes(l.id));
            const activeTimingsItems = allTimings.filter(t => activeLocTimings.includes(t.id));

            items.push(heading3('Specifikace lokalizace rizik'));
            if (activeLocations.length > 0) {
                items.push(para('Pro analýzu byly vybrány následující lokalizace:'));
                activeLocations.forEach(l => items.push(bulletItem(l.name)));
            } else {
                items.push(para('Nebyly specifikovány konkrétní lokalizace.'));
            }

            items.push(emptyLine());
            items.push(heading3('Specifikace načasování rizik'));
            if (activeTimingsItems.length > 0) {
                items.push(para('Pro analýzu byla vybrána následující načasování:'));
                activeTimingsItems.forEach(t => items.push(bulletItem(t.name)));
            } else {
                items.push(para('Nebyla specifikována konkrétní načasování.'));
            }

            // Celkové hodnocení vlivu
            const impact = computeLocationTimingImpact(activeLocTimings, ltConfig, project.customRisks || [], isOutdoor);
            if (impact.length > 0) {
                items.push(emptyLine());
                items.push(heading3('Celkové hodnocení vlivu lokalizace a načasování'));
                items.push(para('Vybrané lokalizace a načasování ovlivňují hodnocení rizik následovně (seřazeno od nejvyššího vlivu):'));
                impact.forEach(item => {
                    const prefix = item.totalImpact > 0 ? '+' : '';
                    const typeLabel = item.type === 'location' ? 'Lokalizace' : 'Načasování';
                    items.push(bulletItem(`${typeLabel}: ${item.name} — vliv na celkovou ohroženost: ${prefix}${item.totalImpact} bodů`));
                });

                const sorted = [...impact].sort((a, b) => b.totalImpact - a.totalImpact);
                const highest = sorted[0];
                const highestByType = {
                    location: sorted.find(i => i.type === 'location' && i.totalImpact > 0),
                    timing: sorted.find(i => i.type === 'timing' && i.totalImpact > 0),
                };
                items.push(emptyLine());
                items.push(para('Závěr hodnocení lokalizace a načasování:', { bold: true }));
                if (highestByType.location) {
                    items.push(bulletItem(`Nejrizikovější lokalizace: ${highestByType.location.name} (+${highestByType.location.totalImpact} bodů)`));
                }
                if (highestByType.timing) {
                    items.push(bulletItem(`Nejrizikovější načasování: ${highestByType.timing.name} (+${highestByType.timing.totalImpact} bodů)`));
                }
                if (highest && highest.totalImpact > 0) {
                    items.push(para(`Na základě analýzy vlivu lokalizace a načasování představuje nejvyšší riziko kombinace akce na lokalizaci „${highestByType.location?.name || '—'}" v čase „${highestByType.timing?.name || '—'}". Bezpečnostní opatření by měla být zaměřena zejména na tyto oblasti.`));
                }
            }

            return items;
        }
    } catch (e) {
        // Fallback na starou verzi
    }

    // Fallback: textové pole (pro typy akcí bez matice)
    const loc = project.locationSpecifics || '';
    const time = project.timingSpecifics || '';

    items.push(heading3('Riziková místa'));
    if (loc.trim()) {
        loc.split('\n').filter(l => l.trim()).forEach(l => items.push(bulletItem(l.trim())));
    } else {
        items.push(placeholderPara('Doplňte specifika lokality v sekci Rizika → Specifikace lokalizace'));
    }

    items.push(emptyLine());
    items.push(heading3('Rizikové časy'));
    if (time.trim()) {
        time.split('\n').filter(l => l.trim()).forEach(l => items.push(bulletItem(l.trim())));
    } else {
        items.push(placeholderPara('Doplňte specifika načasování v sekci Rizika → Specifikace načasování'));
    }
    return items;
}

function computeRiskScore(r, isOutdoor) {
    const p = (Number(r.availability) || 1) + (Number(r.occurrence) || 1) + (Number(r.complexity) || 1);
    const d = (Number(r.lifeAndHealth) || 1) + (isOutdoor ? 0 : (Number(r.facility) || 1)) + (Number(r.financial) || 1) + (Number(r.community) || 1);
    return { p, d, score: p * d };
}

function generateRiskDistributionChart(project) {
    const items = [];
    const risks = project.customRisks || [];
    if (risks.length === 0) return items;
    const isOutdoor = project.environmentType === 'venkovní' || project.environmentType === 'vnější';

    const bandCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    risks.forEach(r => {
        const { score } = computeRiskScore(r, isOutdoor);
        const band = toBand(score, SUBFACTOR_BANDS);
        if (band) bandCounts[band.id] = (bandCounts[band.id] || 0) + 1;
    });
    const max = Math.max(bandCounts.critical, bandCounts.high, bandCounts.medium, bandCounts.low, 1);
    const BAR_MAX = 30; // max počet bloků v baru

    const bandOrder = [
        { id: 'critical', color: 'B91C1C' },
        { id: 'high',     color: 'D97706' },
        { id: 'medium',   color: 'CA8A04' },
        { id: 'low',      color: '16A34A' },
    ];

    const rows = bandOrder.map(b => {
        const count = bandCounts[b.id];
        const barLen = Math.max(count > 0 ? 1 : 0, Math.round((count / max) * BAR_MAX));
        return new TableRow({
            children: [
                new TableCell({
                    width: { size: 18, type: WidthType.PERCENTAGE },
                    borders: noBorders(),
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({
                        children: [new TextRun({ text: BAND_COLORS[b.id].label, bold: true, size: 22, font: DOC_FONT })],
                    })],
                }),
                new TableCell({
                    width: { size: 74, type: WidthType.PERCENTAGE },
                    borders: noBorders(),
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({
                        children: [new TextRun({
                            text: '█'.repeat(barLen) || '·',
                            color: b.color,
                            size: 22,
                            font: 'Consolas',
                        })],
                    })],
                }),
                new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    borders: noBorders(),
                    verticalAlign: VerticalAlign.CENTER,
                    children: [new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: String(count), bold: true, size: 22, font: DOC_FONT })],
                    })],
                }),
            ],
        });
    });

    items.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
    }));
    items.push(emptyLine());
    return items;
}

function generateRiskMatrix(project) {
    const items = [];
    const risks = project.customRisks || [];
    if (risks.length === 0) {
        items.push(placeholderPara('Přidejte rizika v sekci Zvažovaná rizika'));
        return items;
    }

    const isOutdoor = project.environmentType === 'venkovní' || project.environmentType === 'vnější';
    items.push(para('Hodnocení subfaktorů pravděpodobnosti (P) a dopadu (D) na škále 1–7.'));
    items.push(para('P = Dostupnost + Výskyt + Složitost (3–21)'));
    items.push(para(isOutdoor
        ? 'D = Životy + Finance + Společenství (3–21) — u venkovních akcí je subfaktor „Technika/Objekt" vynechán.'
        : 'D = Životy + Objekt + Finance + Společenství (4–28)'));
    items.push(para('Skóre = P × D'));
    items.push(emptyLine());

    const sorted = [...risks]
        .map(r => ({ r, ...computeRiskScore(r, isOutdoor) }))
        .sort((a, b) => b.score - a.score);

    const headerRow = new TableRow({
        tableHeader: true,
        height: { value: 400, rule: HeightRule.ATLEAST },
        children: [
            tableHeaderCell('#', 6),
            tableHeaderCell('Riziko', 44, AlignmentType.LEFT),
            tableHeaderCell('P', 8),
            tableHeaderCell('D', 8),
            tableHeaderCell('Skóre', 10),
            tableHeaderCell('Pásmo', 24),
        ],
    });

    const dataRows = sorted.map(({ r, p, d, score }, i) => {
        const band = toBand(score, SUBFACTOR_BANDS);
        const zebra = i % 2 === 1;
        const dataCell = (text, opts = {}) => {
            const base = {
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                    alignment: opts.alignment || AlignmentType.LEFT,
                    children: [new TextRun({ text, size: 20, bold: !!opts.bold, font: DOC_FONT })],
                })],
            };
            if (zebra) base.shading = { type: ShadingType.CLEAR, fill: 'F8FAFC' };
            return new TableCell(base);
        };
        return new TableRow({
            children: [
                dataCell(String(i + 1), { alignment: AlignmentType.CENTER }),
                dataCell(r.name),
                dataCell(String(p), { alignment: AlignmentType.CENTER }),
                dataCell(String(d), { alignment: AlignmentType.CENTER }),
                dataCell(String(score), { alignment: AlignmentType.CENTER, bold: true }),
                tableBandCell(band),
            ],
        });
    });

    items.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [headerRow, ...dataRows],
    }));

    return items;
}

function generateMeasures(project) {
    const items = [];
    const selected = Object.entries(project.selectedMeasures || {}).filter(([, v]) => v);
    if (selected.length > 0) {
        selected.forEach(([name]) => items.push(bulletItem(name)));
    } else {
        items.push(placeholderPara('Vyberte bezpečnostní opatření v sekci Bezpečnostní opatření'));
    }
    return items;
}

function generateChecklist(project) {
    const items = [];
    // Checklist items are dynamically generated — just add placeholder
    items.push(para('Kontrolní seznam úkolů je generován automaticky na základě vybraných opatření a rizik.'));
    items.push(placeholderPara('Pro aktuální stav checklistu navštivte sekci Checklist v aplikaci'));
    return items;
}

function generateProcedures(project) {
    const items = [];
    const risks = project.customRisks || [];
    const procedures = project.riskProcedures || {};

    if (risks.length === 0) {
        items.push(placeholderPara('Přidejte rizika a definujte postupy v sekci Krizové postupy'));
        return items;
    }

    risks.forEach(risk => {
        const proc = procedures[risk.id] || {};
        items.push(heading3(risk.name));

        items.push(new Paragraph({
            children: [new TextRun({ text: 'Co dělat na místě:', bold: true })],
            spacing: { after: 60 },
        }));
        if (proc.immediateReaction) {
            proc.immediateReaction.split('\n').filter(l => l.trim()).forEach(l => items.push(bulletItem(l.trim())));
        } else {
            items.push(placeholderPara('Doplňte v sekci Krizové postupy'));
        }

        if (project.hasControlRoom) {
            items.push(new Paragraph({
                children: [new TextRun({ text: 'Co dělá koordinační centrum:', bold: true })],
                spacing: { before: 100, after: 60 },
            }));
            if (proc.coordTeamReaction) {
                proc.coordTeamReaction.split('\n').filter(l => l.trim()).forEach(l => items.push(bulletItem(l.trim())));
            } else {
                items.push(placeholderPara('Doplňte v sekci Krizové postupy'));
            }
        }
        items.push(emptyLine());
    });
    return items;
}

function generateTeam(project) {
    const items = [];
    const staffMembers = project.crisisStaffPlan?.staffMembers || [];

    if (staffMembers.length > 0) {
        items.push(heading3('Složení koordinačního týmu'));
        staffMembers.forEach(member => {
            const role = member.ktRole || member.role || '—';
            const namePart = member.name || '(neuvedeno)';
            const funcPart = member.eventFunction ? ` (${member.eventFunction})` : '';
            items.push(para(`${role} — ${namePart}${funcPart}`, { bold: true }));
            if (member.description) {
                items.push(new Paragraph({
                    children: [new TextRun({ text: `   ${member.description}`, size: 20, color: '555555', italics: true })],
                    spacing: { after: 40 },
                }));
            }
            const contactParts = [];
            if (member.phone) contactParts.push(`Tel: ${member.phone}`);
            if (member.crisisPhone) contactParts.push(`Krizový: ${member.crisisPhone}`);
            if (member.email) contactParts.push(`E-mail: ${member.email}`);
            if (contactParts.length > 0) {
                items.push(new Paragraph({
                    children: [new TextRun({ text: `   ${contactParts.join('  |  ')}`, size: 20, color: '555555' })],
                    spacing: { after: 80 },
                }));
            }
        });

        // Coordination centers
        const centers = project.crisisStaffPlan?.coordinationCenters || [];
        if (centers.length > 0) {
            items.push(emptyLine());
            items.push(heading3('Koordinační centra'));
            centers.forEach((c, i) => {
                const label = c.locationName || c.stage || `Centrum ${i + 1}`;
                items.push(bulletItem(`${label}: ${c.primaryLocation || '(neuvedeno)'}${c.secondaryLocation ? ` / záložní: ${c.secondaryLocation}` : ''}`));
            });
        }

        // Activation
        const activation = project.crisisStaffPlan?.activationMethod;
        if (activation) {
            items.push(emptyLine());
            items.push(heading3('Způsob svolání koordinačního týmu'));
            activation.split('\n').filter(l => l.trim()).forEach(l => items.push(para(l.trim())));
        }

        const authority = project.crisisStaffPlan?.activationAuthority;
        if (authority) {
            items.push(emptyLine());
            items.push(heading3('Oprávnění k aktivaci koordinačního plánu'));
            authority.split('\n').filter(l => l.trim()).forEach(l => items.push(para(l.trim())));
        }

        // Incident triggers
        const triggers = project.crisisStaffPlan?.incidentTriggers || {};
        const autoTriggers = triggers.automatic || [];
        const manualTriggers = triggers.manual || [];
        const risks = project.customRisks || [];
        if (autoTriggers.length > 0 || manualTriggers.length > 0) {
            items.push(emptyLine());
            items.push(heading3('Incidenty vedoucí k aktivaci'));
            if (autoTriggers.length > 0) {
                items.push(para('Automatická aktivace:', { bold: true }));
                autoTriggers.forEach(id => {
                    const r = risks.find(r => r.id === id);
                    if (r) items.push(bulletItem(r.name));
                });
            }
            if (manualTriggers.length > 0) {
                items.push(para('Aktivace na rozhodnutí oprávněné osoby:', { bold: true }));
                manualTriggers.forEach(id => {
                    const r = risks.find(r => r.id === id);
                    if (r) items.push(bulletItem(r.name));
                });
            }
        }
    } else {
        const involved = Object.entries(project.involvedTeams || {}).filter(([, v]) => v);
        if (involved.length > 0) {
            items.push(heading3('Zapojené složky'));
            involved.forEach(([name]) => items.push(bulletItem(name)));
        }
        items.push(emptyLine());
        items.push(placeholderPara('Doplňte koordinační tým v sekci Koordinační plán'));
    }
    return items;
}

function generateCommunication(project) {
    const items = [];
    const comm = project.crisisCommunication || {};

    if (comm.mediaContact) items.push(para(`Kontakt pro média: ${comm.mediaContact}`));
    if (comm.publicStatement) {
        items.push(heading3('Vzorové prohlášení pro veřejnost'));
        items.push(para(comm.publicStatement));
    }
    if (comm.internalComm) {
        items.push(heading3('Interní komunikace'));
        items.push(para(comm.internalComm));
    }

    if (!comm.mediaContact && !comm.publicStatement && !comm.internalComm) {
        items.push(placeholderPara('Doplňte komunikační strategii v sekci Krizová komunikace'));
    }
    return items;
}

function generateContacts(project) {
    const items = [];
    const staffMembers = project.crisisStaffPlan?.staffMembers || [];
    const teamContacts = project.teamContacts || {};
    const involvedTeams = project.involvedTeams || {};

    // Koordinační tým
    if (staffMembers.length > 0) {
        items.push(heading3('Koordinační tým'));
        staffMembers.forEach(member => {
            const role = member.ktRole || member.role || '—';
            const parts = [role];
            if (member.name) parts.push(member.name);
            if (member.eventFunction) parts.push(`(${member.eventFunction})`);
            items.push(para(parts.join(' — '), { bold: true }));
            const contactParts = [];
            if (member.phone) contactParts.push(`Tel: ${member.phone}`);
            if (member.crisisPhone) contactParts.push(`Krizový: ${member.crisisPhone}`);
            if (member.email) contactParts.push(`E-mail: ${member.email}`);
            if (contactParts.length > 0) {
                items.push(new Paragraph({
                    children: [new TextRun({ text: `   ${contactParts.join('  |  ')}`, size: 20, color: '555555' })],
                    spacing: { after: 60 },
                }));
            }
        });
        items.push(emptyLine());
    }

    // Kontakty zapojených týmů
    const activeTeams = Object.entries(involvedTeams).filter(([, v]) => v).map(([name]) => name);
    if (activeTeams.length > 0) {
        items.push(heading3('Kontakty zapojených týmů'));
        activeTeams.forEach(teamName => {
            const contact = teamContacts[teamName] || {};
            const contactInfo = [];
            if (contact.contactName) contactInfo.push(contact.contactName);
            if (contact.phone) contactInfo.push(`Tel: ${contact.phone}`);
            if (contact.email) contactInfo.push(contact.email);
            items.push(bulletItem(`${teamName}${contactInfo.length > 0 ? ' — ' + contactInfo.join(', ') : ''}`));
        });
    }

    if (staffMembers.length === 0 && activeTeams.length === 0) {
        items.push(placeholderPara('Doplňte kontaktní údaje v sekci Týmy a kontakty'));
    }
    return items;
}

// ── KP-specifické generátory (Koordinační plán dle metodiky MV ČR) ─────

function generateKpIntro() {
    return [
        para('Tento koordinační plán (dále jen „KP") je zpracován v souladu s metodikou Ministerstva vnitra ČR pro ochranu měkkých cílů. Definuje organizační strukturu, postupy a odpovědnosti pro případ závažného bezpečnostního incidentu.'),
        emptyLine(),
        heading3('Účel koordinačního plánu'),
        bulletItem('Minimalizovat ztráty na životech a zdraví osob v místě incidentu.'),
        bulletItem('Zajistit efektivní komunikaci s Integrovaným záchranným systémem (IZS).'),
        bulletItem('Koordinovat vnitřní a vnější komunikaci organizace.'),
        bulletItem('Zajistit psychologickou a sociální pomoc zasaženým osobám.'),
        bulletItem('Ochránit majetek a infrastrukturu organizace.'),
        bulletItem('Umožnit co nejrychlejší návrat k běžnému fungování.'),
        emptyLine(),
        heading3('Právní rámec'),
        para('KP je dobrovolným dokumentem, který doplňuje zákonné povinnosti vyplývající ze zákona č. 240/2000 Sb. (krizový zákon), zákona č. 133/1985 Sb. (o požární ochraně) a zákona č. 224/2015 Sb. (o prevenci závažných havárií). Na rozdíl od těchto předpisů se KP zaměřuje specificky na fáze bezprostředně po závažném incidentu a na koordinaci vlastních zdrojů organizace.'),
        emptyLine(),
        heading3('Tři pilíře připravenosti'),
        bulletItem('Koordinační plán (KP) – tento dokument, definující postupy a odpovědnosti.'),
        bulletItem('Koordinační tým (KT) – skupina osob zodpovědných za řízení reakce na incident.'),
        bulletItem('Koordinační centrum (KC) – fyzické místo, odkud KT řídí reakci.'),
    ];
}

function generateKpDefinitions() {
    return [
        para('Pro účely tohoto dokumentu se používají následující pojmy:', { bold: true }),
        emptyLine(),
        para('Závažná situace – jakákoli neočekávaná událost, která má potenciál narušit běžné fungování organizace a vyžaduje koordinovanou reakci nad rámec běžných provozních postupů.', { italics: false }),
        emptyLine(),
        para('Závažný incident – závažná situace, při které došlo nebo bezprostředně hrozí újma na životech, zdraví, majetku nebo pověsti organizace. Zahrnuje úmyslné útoky, nehody, přírodní katastrofy i další mimořádné události.'),
        emptyLine(),
        para('Koordinační tým (KT) – skupina klíčových osob organizace, která je aktivována v případě závažného incidentu. KT řídí reakci organizace, koordinuje komunikaci a rozhoduje o dalších krocích.'),
        emptyLine(),
        para('Koordinační centrum (KC) – předem určené místo, kam se KT svolá a odkud řídí reakci na incident. KC musí být vybaveno potřebnou technikou a komunikačními prostředky.'),
        emptyLine(),
        para('Aktivace KP – formální rozhodnutí oprávněné osoby o zahájení činnosti KT podle tohoto plánu. Může být automatická (při splnění definovaných podmínek) nebo diskreční (na základě rozhodnutí oprávněné osoby).'),
    ];
}

function generateKpTeamComposition(project) {
    const items = [];
    const staffMembers = project.crisisStaffPlan?.staffMembers || [];

    if (staffMembers.length > 0) {
        items.push(para('Koordinační tým je složen z následujících členů:'));
        items.push(emptyLine());
        staffMembers.forEach(member => {
            const role = member.ktRole || member.role || '—';
            const namePart = member.name || '[doplnit]';
            const funcPart = member.eventFunction ? `, funkce na akci: ${member.eventFunction}` : '';
            items.push(para(`${role}`, { bold: true }));
            items.push(new Paragraph({
                children: [new TextRun({ text: `   ${namePart}${funcPart}`, size: 20 })],
                spacing: { after: 40 },
            }));
            if (member.description) {
                items.push(new Paragraph({
                    children: [new TextRun({ text: `   Odpovědnost: ${member.description}`, size: 20, color: '555555', italics: true })],
                    spacing: { after: 40 },
                }));
            }
            const contactParts = [];
            if (member.phone) contactParts.push(`Tel: ${member.phone}`);
            if (member.crisisPhone) contactParts.push(`Krizový mobil: ${member.crisisPhone}`);
            if (member.email) contactParts.push(`E-mail: ${member.email}`);
            if (contactParts.length > 0) {
                items.push(new Paragraph({
                    children: [new TextRun({ text: `   ${contactParts.join('  |  ')}`, size: 20, color: '555555' })],
                    spacing: { after: 80 },
                }));
            }
        });
    } else {
        items.push(placeholderPara('Doplňte členy koordinačního týmu v sekci Koordinační plán'));
    }
    return items;
}

function generateKpRoleTasks(project) {
    const items = [];
    const staffMembers = project.crisisStaffPlan?.staffMembers || [];
    const roleTasks = project.crisisStaffPlan?.roleTasks || {};

    if (staffMembers.length === 0) {
        items.push(placeholderPara('Nejprve definujte členy KT v sekci Koordinační plán'));
        return items;
    }

    items.push(para('Pro každou pozici v koordinačním týmu jsou definovány konkrétní úkoly a odpovědnosti při aktivaci KP:'));
    items.push(emptyLine());

    staffMembers.forEach(member => {
        const role = member.ktRole || member.role || '—';
        items.push(heading3(role));
        const tasks = roleTasks[member.id];
        if (tasks && tasks.trim()) {
            tasks.split('\n').filter(l => l.trim()).forEach(l => items.push(bulletItem(l.trim())));
        } else {
            items.push(placeholderPara(`Doplňte úkoly pro pozici "${role}" v sekci Koordinační plán`));
        }
    });
    return items;
}

function generateKpActivation(project) {
    const items = [];
    const plan = project.crisisStaffPlan || {};

    // Způsob svolání
    items.push(heading3('Způsob svolání koordinačního týmu'));
    if (plan.activationMethod && plan.activationMethod.trim()) {
        plan.activationMethod.split('\n').filter(l => l.trim()).forEach(l => items.push(para(l.trim())));
    } else {
        items.push(placeholderPara('Doplňte způsob svolání KT'));
    }

    // Oprávnění
    items.push(emptyLine());
    items.push(heading3('Oprávnění k aktivaci'));
    if (plan.activationAuthority && plan.activationAuthority.trim()) {
        plan.activationAuthority.split('\n').filter(l => l.trim()).forEach(l => items.push(para(l.trim())));
    } else {
        items.push(placeholderPara('Doplňte, kdo může KP aktivovat'));
    }

    // Incidenty
    items.push(emptyLine());
    items.push(heading3('Incidenty vedoucí k aktivaci'));
    const triggers = plan.incidentTriggers || {};
    const autoTriggers = triggers.automatic || [];
    const manualTriggers = triggers.manual || [];
    const risks = project.customRisks || [];

    if (autoTriggers.length > 0) {
        items.push(para('Automatická aktivace (KP se aktivuje vždy):', { bold: true }));
        autoTriggers.forEach(id => { const r = risks.find(r => r.id === id); if (r) items.push(bulletItem(r.name)); });
    }
    if (manualTriggers.length > 0) {
        items.push(para('Diskreční aktivace (o aktivaci rozhoduje oprávněná osoba):', { bold: true }));
        manualTriggers.forEach(id => { const r = risks.find(r => r.id === id); if (r) items.push(bulletItem(r.name)); });
    }
    if (autoTriggers.length === 0 && manualTriggers.length === 0) {
        items.push(placeholderPara('Definujte incidenty a jejich typ aktivace v sekci Koordinační plán'));
    }

    return items;
}

function generateKpPhases() {
    return [
        para('Postup koordinačního týmu je rozdělen do čtyř časových fází. Každá fáze má své priority a specifické úkoly.'),
        emptyLine(),
        heading3('Fáze 1: Okamžitá reakce (0–15 minut)'),
        para('Priority:', { bold: true }),
        bulletItem('Zajistit bezpečí osob v bezprostředním ohrožení.'),
        bulletItem('Přivolat Integrovaný záchranný systém (112, 150, 155, 158).'),
        bulletItem('Poskytnout první pomoc raněným.'),
        bulletItem('Zahájit evakuaci z ohrožené zóny.'),
        bulletItem('Informovat vedení organizace / předsedu KT.'),
        emptyLine(),
        heading3('Fáze 2: Konsolidace (15 minut – 3 hodiny)'),
        para('Priority:', { bold: true }),
        bulletItem('Aktivovat koordinační tým a svolat ho do KC.'),
        bulletItem('Navázat komunikaci s IZS na místě.'),
        bulletItem('Shromáždit informace o raněných a zasažených osobách.'),
        bulletItem('Zajistit psychologickou první pomoc.'),
        bulletItem('Připravit první komunikaci směrem dovnitř organizace.'),
        emptyLine(),
        heading3('Fáze 3: Řízení situace (3–6 hodin)'),
        para('Priority:', { bold: true }),
        bulletItem('KT je plně informovaný a řídí situaci z KC.'),
        bulletItem('Pravidelné brífinky KT (min. každých 30 minut).'),
        bulletItem('Interní komunikace se všemi složkami a partnery.'),
        bulletItem('Externí komunikace – první tiskové prohlášení.'),
        bulletItem('Sledování mediálního prostoru.'),
        bulletItem('Plánování logistiky (jídlo, přeprava, ubytování pro zasažené).'),
        emptyLine(),
        heading3('Fáze 4: Stabilizace a obnova (6+ hodin)'),
        para('Priority:', { bold: true }),
        bulletItem('Kontrola nad situací, shromáždění všech informací v KC.'),
        bulletItem('Pokračující komunikace s médii a veřejností.'),
        bulletItem('Plánování dalšího dne a střednědobých opatření.'),
        bulletItem('Psychosociální podpora zasažených osob.'),
        bulletItem('Dokumentace incidentu a rozhodnutí KT.'),
        bulletItem('Příprava na případné ukončení činnosti KT.'),
    ];
}

function generateKpCoordCenter(project) {
    const items = [];
    const centers = project.crisisStaffPlan?.coordinationCenters || [];

    if (centers.length > 0) {
        items.push(heading3('Určená koordinační centra'));
        centers.forEach((c, i) => {
            const label = c.locationName || c.stage || `Centrum ${i + 1}`;
            items.push(para(label, { bold: true }));
            if (c.primaryLocation) items.push(bulletItem(`Primární KC: ${c.primaryLocation}`));
            if (c.secondaryLocation) items.push(bulletItem(`Záložní KC: ${c.secondaryLocation}`));
            if (!c.primaryLocation && !c.secondaryLocation) items.push(placeholderPara('Doplňte adresu KC'));
        });
    } else {
        items.push(placeholderPara('Definujte koordinační centra v sekci Koordinační plán'));
    }

    items.push(emptyLine());
    items.push(heading3('Požadované vybavení koordinačního centra'));
    items.push(para('Podle metodiky MV ČR by KC mělo být vybaveno následujícím:'));
    const equipment = [
        'Reflexní vesty s označením rolí', 'Mobilní telefony / vysílačky', 'Nabíječky a powerbanky',
        'Notebook s připojením k internetu', 'Projektor nebo velká obrazovka', 'Tiskárna / kopírka',
        'Flipchart / whiteboard s fixy', 'Megafon', 'Papírové formuláře a psací potřeby',
        'Trezor pro citlivé dokumenty', 'Lékárnička', 'Zásoby jídla a vody',
        'Klíče od všech relevantních prostor', 'Mapy lokality a plány budov',
        'Vytištěný koordinační plán a kontaktovník',
    ];
    equipment.forEach(e => items.push(bulletItem(e)));

    return items;
}

function generateKpCommProtocol(project) {
    const items = [];
    const protocol = project.crisisStaffPlan?.commProtocol || {};

    items.push(para('Komunikační protokol definuje, kdo, s kým, jakými kanály a s jakým obsahem komunikuje v jednotlivých fázích incidentu. Protokol je organizován do matice 2×2:'));
    items.push(emptyLine());

    const categories = [
        { key: 'internalIncoming', title: 'Vnitřní příchozí komunikace', desc: 'Informace přijímané od vlastních lidí (zaměstnanci, pořadatelé, dobrovolníci).' },
        { key: 'internalOutgoing', title: 'Vnitřní odchozí komunikace', desc: 'Instrukce a informace směřované k vlastním lidem.' },
        { key: 'externalIncoming', title: 'Vnější příchozí komunikace', desc: 'Informace přijímané od IZS, médií, veřejnosti, partnerů.' },
        { key: 'externalOutgoing', title: 'Vnější odchozí komunikace', desc: 'Prohlášení pro média, informace pro veřejnost, komunikace s úřady.' },
    ];

    categories.forEach(cat => {
        items.push(heading3(cat.title));
        items.push(para(cat.desc, { italics: true, color: '666666' }));
        const data = protocol[cat.key] || {};
        if (data.partners) items.push(para(`Partneři: ${data.partners}`));
        if (data.channels) items.push(para(`Kanály: ${data.channels}`));
        if (data.coordinator) items.push(para(`Koordinátor: ${data.coordinator}`));
        if (data.firstMessage) {
            items.push(para('Šablona první zprávy:', { bold: true }));
            items.push(para(data.firstMessage));
        }
        if (!data.partners && !data.channels && !data.coordinator) {
            items.push(placeholderPara('Doplňte v sekci Koordinační plán'));
        }
        items.push(emptyLine());
    });

    return items;
}

function generateKpPcrHzs(project) {
    const items = [];
    const pcrHzs = project.crisisStaffPlan?.pcrHzsInfo || {};

    items.push(para('Tabulka se základními údaji pro Policii ČR a Hasičský záchranný sbor:'));
    items.push(emptyLine());

    const fields = [
        { key: 'orgName', label: 'Název organizace' },
        { key: 'orgAddress', label: 'Adresa sídla' },
        { key: 'eventAddress', label: 'Adresa konání akce' },
        { key: 'contactPerson', label: 'Kontaktní osoba' },
        { key: 'contactPhone', label: 'Telefon kontaktní osoby' },
        { key: 'expectedPersons', label: 'Očekávaný počet osob' },
        { key: 'securityLevel', label: 'Úroveň bezpečnostní připravenosti' },
        { key: 'hasKP', label: 'Existence koordinačního plánu' },
        { key: 'hasKT', label: 'Existence koordinačního týmu' },
        { key: 'cooperationIZS', label: 'Spolupráce s IZS' },
    ];

    const rows = fields.map((f, i) => {
        const val = (pcrHzs[f.key] || '').toString();
        const zebra = i % 2 === 1;
        const cellBase = zebra ? { shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' } } : {};
        return new TableRow({
            children: [
                new TableCell({
                    width: { size: 38, type: WidthType.PERCENTAGE },
                    margins: { top: 60, bottom: 60, left: 100, right: 100 },
                    verticalAlign: VerticalAlign.CENTER,
                    ...cellBase,
                    children: [new Paragraph({
                        children: [new TextRun({ text: f.label, bold: true, size: 20, font: DOC_FONT })],
                    })],
                }),
                new TableCell({
                    width: { size: 62, type: WidthType.PERCENTAGE },
                    margins: { top: 60, bottom: 60, left: 100, right: 100 },
                    verticalAlign: VerticalAlign.CENTER,
                    ...cellBase,
                    children: [new Paragraph({
                        children: val
                            ? [new TextRun({ text: val, size: 20, font: DOC_FONT })]
                            : [new TextRun({ text: '[doplnit]', italics: true, color: '999999', size: 20, font: DOC_FONT })],
                    })],
                }),
            ],
        });
    });

    items.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
    }));

    return items;
}

function generateRisksSimple(project) {
    const items = [];
    const risks = project.customRisks || [];
    if (risks.length > 0) {
        risks.forEach(r => items.push(bulletItem(r.name)));
    } else {
        items.push(placeholderPara('Přidejte rizika v sekci Zvažovaná rizika'));
    }
    return items;
}

// ── Mapování dataKey → generátor ────────────────────────────────────────

const generators = {
    basicInfo: generateBasicInfo,
    riskSummary: generateRiskSummary,
    threatSources: generateThreatSources,
    vulnerabilities: generateVulnerabilities,
    locationTimingSpecifics: generateLocationTimingSpecifics,
    riskMatrix: generateRiskMatrix,
    measures: generateMeasures,
    checklist: generateChecklist,
    procedures: generateProcedures,
    team: generateTeam,
    communication: generateCommunication,
    risks: generateRisksSimple,
    contacts: generateContacts,
    // KP-specifické generátory
    kpIntro: () => generateKpIntro(),
    kpDefinitions: () => generateKpDefinitions(),
    kpTeamComposition: generateKpTeamComposition,
    kpRoleTasks: generateKpRoleTasks,
    kpActivation: generateKpActivation,
    kpPhases: () => generateKpPhases(),
    kpCoordCenter: generateKpCoordCenter,
    kpCommProtocol: generateKpCommProtocol,
    kpPcrHzs: generateKpPcrHzs,
    manual: (project) => [placeholderPara('Tuto kapitolu doplňte ručně ve staženém dokumentu.')],
};

// ── Hlavní generátor ────────────────────────────────────────────────────

/**
 * Vygeneruje DOCX dokument a nabídne ke stažení.
 * @param {Object} template - Šablona dokumentu z documentTemplates.js
 * @param {Object} project - Data projektu
 */
export async function generateDocument(template, project) {
    const children = [];

    // Titulní strana (obsahuje vlastní page-break na konci)
    children.push(...titlePage(template, project));

    // Obsah (obsahuje vlastní page-break na konci)
    children.push(...tableOfContents(template));

    // Kapitoly — každá kapitola začíná na nové stránce
    template.chapters.forEach((chapter, idx) => {
        if (idx > 0) children.push(pageBreak());
        children.push(heading1(`${chapter.number}. ${chapter.title}`));

        if (chapter.subchapters) {
            for (const sub of chapter.subchapters) {
                children.push(heading2(`${sub.number} ${sub.title}`));
                const gen = generators[sub.dataKey] || generators.manual;
                children.push(...gen(project));
            }
        } else {
            const gen = generators[chapter.dataKey] || generators.manual;
            children.push(...gen(project));
        }
    });

    const eventLabel = project.officialName || project.name || '';
    const docTitle = template.title || '';
    const logoBuffer = await loadLogoBuffer();

    const headerChildren = [];
    if (logoBuffer) {
        // Dvousloupcová tabulka: vlevo logo, vpravo texty (název dokumentu + název akce)
        headerChildren.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders(),
            rows: [new TableRow({
                children: [
                    new TableCell({
                        width: { size: 35, type: WidthType.PERCENTAGE },
                        borders: noBorders(),
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        children: [new Paragraph({
                            children: [new ImageRun({
                                data: logoBuffer,
                                transformation: { width: LOGO_WIDTH, height: LOGO_HEIGHT },
                            })],
                        })],
                    }),
                    new TableCell({
                        width: { size: 65, type: WidthType.PERCENTAGE },
                        borders: noBorders(),
                        verticalAlign: VerticalAlign.CENTER,
                        margins: { top: 0, bottom: 0, left: 0, right: 0 },
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [new TextRun({ text: docTitle, size: 18, color: '64748B', font: DOC_FONT })],
                            }),
                            ...(eventLabel ? [new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                children: [new TextRun({ text: eventLabel, size: 18, color: '334155', bold: true, font: DOC_FONT })],
                            })] : []),
                        ],
                    }),
                ],
            })],
        }));
        headerChildren.push(new Paragraph({
            border: { bottom: { color: 'CBD5E1', space: 4, style: BorderStyle.SINGLE, size: 6 } },
            children: [new TextRun({ text: '', size: 2 })],
        }));
    } else {
        // Fallback bez loga: jen text vpravo
        headerChildren.push(new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { color: 'CBD5E1', space: 4, style: BorderStyle.SINGLE, size: 6 } },
            children: [
                new TextRun({ text: docTitle, size: 18, color: '64748B', font: DOC_FONT }),
                ...(eventLabel ? [new TextRun({ text: '  ·  ', size: 18, color: 'CBD5E1', font: DOC_FONT }), new TextRun({ text: eventLabel, size: 18, color: '334155', bold: true, font: DOC_FONT })] : []),
            ],
        }));
    }

    const docFile = new Document({
        creator: project.author || 'Event Security Planner',
        title: docTitle,
        styles: {
            default: {
                document: { run: { font: DOC_FONT, size: 22 } },
            },
            paragraphStyles: [
                {
                    id: 'Normal',
                    name: 'Normal',
                    run: { font: DOC_FONT, size: 22 },
                    paragraph: { spacing: { line: 300 } },
                },
            ],
        },
        sections: [{
            properties: {
                page: {
                    size: { width: 11906, height: 16838, orientation: 'portrait' }, // A4 v twips
                    margin: { top: 1134, right: 1134, bottom: 1134, left: 1134, header: 567, footer: 567 },
                },
            },
            headers: {
                default: new Header({ children: headerChildren }),
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: 'Strana ', size: 18, color: '64748B', font: DOC_FONT }),
                            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '64748B', font: DOC_FONT }),
                            new TextRun({ text: ' z ', size: 18, color: '64748B', font: DOC_FONT }),
                            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '64748B', font: DOC_FONT }),
                        ],
                    })],
                }),
            },
            children,
        }],
    });

    const blob = await Packer.toBlob(docFile);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const projectSlug = (project.name || 'dokument').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/g, '');
    a.download = `${template.id}_${projectSlug}.docx`;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 * Vrátí stav naplněnosti kapitol (pro zobrazení v UI).
 * @returns {{ chapterNumber, title, status: 'filled'|'partial'|'empty' }[]}
 */
export function getChapterStatuses(template, project) {
    return template.chapters.map(ch => {
        let status = 'empty';

        switch (ch.dataKey) {
            case 'basicInfo':
                status = (project.officialName || project.name) ? 'filled' : 'empty';
                break;
            case 'riskSummary':
            case 'riskMatrix':
            case 'risks':
            case 'threatSources':
                status = (project.customRisks || []).length > 0 ? 'filled' : 'empty';
                break;
            case 'vulnerabilities':
                status = (project.selectedVulnerabilities || []).length > 0 ? 'filled' : 'empty';
                break;
            case 'locationTimingSpecifics':
                status = (project.locationSpecifics || project.timingSpecifics) ? 'partial' : 'empty';
                if (project.locationSpecifics && project.timingSpecifics) status = 'filled';
                break;
            case 'measures':
                status = Object.values(project.selectedMeasures || {}).some(v => v) ? 'filled' : 'empty';
                break;
            case 'checklist':
                status = 'partial'; // always auto-generated
                break;
            case 'procedures': {
                const risks = project.customRisks || [];
                const procs = project.riskProcedures || {};
                const hasSome = risks.some(r => procs[r.id]?.immediateReaction);
                status = hasSome ? (risks.every(r => procs[r.id]?.immediateReaction) ? 'filled' : 'partial') : 'empty';
                break;
            }
            case 'team':
                status = (project.crisisStaffPlan?.staffMembers || []).length > 0 || Object.values(project.involvedTeams || {}).some(v => v) ? 'filled' : 'empty';
                break;
            case 'contacts': {
                const hasStaff = (project.crisisStaffPlan?.staffMembers || []).some(m => m.name || m.phone);
                const hasTeamContacts = Object.values(project.teamContacts || {}).some(c => c.contactName || c.phone);
                status = hasStaff && hasTeamContacts ? 'filled' : (hasStaff || hasTeamContacts ? 'partial' : 'empty');
                break;
            }
            case 'communication':
                status = (project.crisisCommunication?.mediaContact || project.crisisCommunication?.publicStatement) ? 'filled' : 'empty';
                break;
            case 'kpIntro':
            case 'kpDefinitions':
            case 'kpPhases':
                status = 'filled'; // fixed boilerplate — always filled
                break;
            case 'kpTeamComposition':
                status = (project.crisisStaffPlan?.staffMembers || []).some(m => m.name) ? 'filled' : 'empty';
                break;
            case 'kpRoleTasks': {
                const tasks = project.crisisStaffPlan?.roleTasks || {};
                status = Object.values(tasks).some(t => t && t.trim()) ? 'partial' : 'empty';
                break;
            }
            case 'kpActivation': {
                const act = project.crisisStaffPlan || {};
                const hasTriggers = (act.incidentTriggers?.automatic?.length > 0 || act.incidentTriggers?.manual?.length > 0);
                status = (act.activationAuthority && hasTriggers) ? 'filled' : (act.activationAuthority || act.activationMethod || hasTriggers ? 'partial' : 'empty');
                break;
            }
            case 'kpCoordCenter':
                status = (project.crisisStaffPlan?.coordinationCenters || []).some(c => c.primaryLocation) ? 'filled' : 'empty';
                break;
            case 'kpCommProtocol': {
                const proto = project.crisisStaffPlan?.commProtocol || {};
                status = Object.values(proto).some(p => p && (p.partners || p.channels)) ? 'partial' : 'empty';
                break;
            }
            case 'kpPcrHzs': {
                const info = project.crisisStaffPlan?.pcrHzsInfo || {};
                status = Object.values(info).some(v => v && v.trim()) ? 'partial' : 'empty';
                break;
            }
            case 'manual':
                status = 'manual';
                break;
            default:
                status = 'empty';
        }

        return { number: ch.number, title: ch.title, status, dataKey: ch.dataKey };
    });
}
