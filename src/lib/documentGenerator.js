// src/lib/documentGenerator.js
// Generátor DOCX dokumentů z dat projektu a šablony.

import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, PageBreak } from 'docx';
import { toBand, SUBFACTOR_BANDS } from './risks';

// ── Pomocné funkce ──────────────────────────────────────────────────────

function heading1(text) {
    return new Paragraph({
        text,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
    });
}

function heading2(text) {
    return new Paragraph({
        text,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
    });
}

function heading3(text) {
    return new Paragraph({
        text,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
    });
}

function para(text, options = {}) {
    return new Paragraph({
        children: [new TextRun({ text, ...options })],
        spacing: { after: 100 },
    });
}

function bulletItem(text) {
    return new Paragraph({
        text,
        bullet: { level: 0 },
        spacing: { after: 60 },
    });
}

function emptyLine() {
    return new Paragraph({ text: '', spacing: { after: 100 } });
}

function placeholderPara(text) {
    return new Paragraph({
        children: [new TextRun({ text: `[${text}]`, italics: true, color: '999999' })],
        spacing: { after: 100 },
    });
}

function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
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
    items.push(para('Hodnocení ohroženosti bylo provedeno na základě metodiky Ministerstva vnitra ČR pro ochranu měkkých cílů.'));
    items.push(para(`Celkem bylo identifikováno ${risks.length} rizik.`));

    if (risks.length > 0) {
        // Spočítat rizika podle pásem
        const bandCounts = { low: 0, medium: 0, high: 0, critical: 0 };
        risks.forEach(r => {
            const pSum = (Number(r.availability) || 1) + (Number(r.occurrence) || 1) + (Number(r.complexity) || 1);
            const dSum = (Number(r.lifeAndHealth) || 1) + (Number(r.facility) || 1) + (Number(r.financial) || 1) + (Number(r.community) || 1);
            const score = pSum * dSum;
            const band = toBand(score, SUBFACTOR_BANDS);
            if (band) bandCounts[band.id] = (bandCounts[band.id] || 0) + 1;
        });
        items.push(emptyLine());
        items.push(heading3('Rozložení rizik podle pásem'));
        items.push(bulletItem(`Kritická: ${bandCounts.critical}`));
        items.push(bulletItem(`Vysoká: ${bandCounts.high}`));
        items.push(bulletItem(`Střední: ${bandCounts.medium}`));
        items.push(bulletItem(`Nízká: ${bandCounts.low}`));

        // Prioritní rizika (top 5 by score)
        const sorted = [...risks].sort((a, b) => {
            const scoreA = ((Number(a.availability)||1)+(Number(a.occurrence)||1)+(Number(a.complexity)||1)) * ((Number(a.lifeAndHealth)||1)+(Number(a.facility)||1)+(Number(a.financial)||1)+(Number(a.community)||1));
            const scoreB = ((Number(b.availability)||1)+(Number(b.occurrence)||1)+(Number(b.complexity)||1)) * ((Number(b.lifeAndHealth)||1)+(Number(b.facility)||1)+(Number(b.financial)||1)+(Number(b.community)||1));
            return scoreB - scoreA;
        });
        items.push(emptyLine());
        items.push(heading3('Prioritní rizika'));
        sorted.slice(0, 5).forEach((r, i) => {
            const pSum = (Number(r.availability)||1)+(Number(r.occurrence)||1)+(Number(r.complexity)||1);
            const dSum = (Number(r.lifeAndHealth)||1)+(Number(r.facility)||1)+(Number(r.financial)||1)+(Number(r.community)||1);
            items.push(bulletItem(`${i + 1}. ${r.name} (skóre: ${pSum * dSum})`));
        });
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
    const loc = project.locationSpecifics || '';
    const time = project.timingSpecifics || '';

    items.push(heading3('Riziková místa'));
    if (loc.trim()) {
        loc.split('\n').filter(l => l.trim()).forEach(l => items.push(bulletItem(l.trim())));
    } else {
        items.push(placeholderPara('Doplňte specifika lokality v sekci Rizika → Specifické podmínky'));
    }

    items.push(emptyLine());
    items.push(heading3('Rizikové časy'));
    if (time.trim()) {
        time.split('\n').filter(l => l.trim()).forEach(l => items.push(bulletItem(l.trim())));
    } else {
        items.push(placeholderPara('Doplňte specifika načasování v sekci Rizika → Specifické podmínky'));
    }
    return items;
}

function generateRiskMatrix(project) {
    const items = [];
    const risks = project.customRisks || [];
    if (risks.length === 0) {
        items.push(placeholderPara('Přidejte rizika v sekci Zvažovaná rizika'));
        return items;
    }

    items.push(para('Hodnocení subfaktorů pravděpodobnosti (P) a dopadu (D) na škále 1–7.'));
    items.push(para('P = Dostupnost + Výskyt + Složitost (3–21)'));
    items.push(para('D = Životy + Objekt + Finance + Společenství (4–28)'));
    items.push(para('Skóre = P × D'));
    items.push(emptyLine());

    // Simple text-based table (DOCX tables are complex)
    const sorted = [...risks].sort((a, b) => {
        const scoreA = ((Number(a.availability)||1)+(Number(a.occurrence)||1)+(Number(a.complexity)||1)) * ((Number(a.lifeAndHealth)||1)+(Number(a.facility)||1)+(Number(a.financial)||1)+(Number(a.community)||1));
        const scoreB = ((Number(b.availability)||1)+(Number(b.occurrence)||1)+(Number(b.complexity)||1)) * ((Number(b.lifeAndHealth)||1)+(Number(b.facility)||1)+(Number(b.financial)||1)+(Number(b.community)||1));
        return scoreB - scoreA;
    });

    sorted.forEach((r, i) => {
        const p = (Number(r.availability)||1)+(Number(r.occurrence)||1)+(Number(r.complexity)||1);
        const d = (Number(r.lifeAndHealth)||1)+(Number(r.facility)||1)+(Number(r.financial)||1)+(Number(r.community)||1);
        const score = p * d;
        const band = toBand(score, SUBFACTOR_BANDS);
        items.push(para(`${i + 1}. ${r.name}`));
        items.push(new Paragraph({
            children: [new TextRun({
                text: `   P: ${p} (D:${r.availability||1} V:${r.occurrence||1} S:${r.complexity||1})  ×  D: ${d} (Ž:${r.lifeAndHealth||1} O:${r.facility||1} F:${r.financial||1} Sp:${r.community||1})  =  ${score} [${band?.label || '?'}]`,
                size: 20,
                color: '555555',
            })],
            spacing: { after: 80 },
        }));
    });

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

    fields.forEach(f => {
        const val = pcrHzs[f.key] || '';
        items.push(para(`${f.label}: ${val || '[doplnit]'}`));
    });

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

    // Titulní strana
    children.push(...titlePage(template, project));

    // Obsah
    children.push(...tableOfContents(template));

    // Kapitoly
    for (const chapter of template.chapters) {
        children.push(heading1(`${chapter.number}. ${chapter.title}`));

        if (chapter.subchapters) {
            // Kapitola s podkapitolami
            for (const sub of chapter.subchapters) {
                children.push(heading2(`${sub.number} ${sub.title}`));
                const gen = generators[sub.dataKey] || generators.manual;
                children.push(...gen(project));
            }
        } else {
            const gen = generators[chapter.dataKey] || generators.manual;
            children.push(...gen(project));
        }

        children.push(emptyLine());
    }

    const docFile = new Document({
        styles: {
            paragraphStyles: [
                {
                    id: "Normal",
                    name: "Normal",
                    run: { font: "Calibri", size: 22 },
                    paragraph: { spacing: { line: 276 } },
                },
            ],
        },
        sections: [{ children }],
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
