// src/services/localStore.js
import { allPossibleRisks } from "../config/securityData";
import { defaultProjectRisksValues } from "../config/defaultProjectRisks";
import { cyclingRisks } from "../config/cyclingData";
import { eventTypeRisksMapping, outdoorRisks } from "../config/eventTypesRisks";
const KEY = "esp_local_projects_v1";

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { projects: [] };
  } catch {
    return { projects: [] };
  }
}

function write(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function listProjects() {
  return read().projects;
}

export function upsertProject(p) {
  const data = read();
  const idx = data.projects.findIndex(x => x.id === p.id);
  if (idx >= 0) data.projects[idx] = p;
  else data.projects.push(p);
  write(data);
  return p.id;
}

export const updateProject = upsertProject;

export function createProject({ name, projectType, meta = {}, ...rest }) {
  const id = `local-${Date.now()}`;

  let initialRisks = [];

  if (projectType === "cyklozavod") {
    initialRisks = cyclingRisks.map((def, idx) => ({
      ...def,
      id: `risk-default-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString()
    }));
  } else {
    let selectedRisksNames = allPossibleRisks;
    if (projectType === "event" || !projectType) {
        if (rest.eventType && eventTypeRisksMapping[rest.eventType]) {
            selectedRisksNames = [...eventTypeRisksMapping[rest.eventType]];
        } else {
            selectedRisksNames = [...allPossibleRisks];
        }

        if (rest.environmentType === 'venkovní' || rest.environmentType === 'kombinovaná') {
            outdoorRisks.forEach(risk => {
                if (!selectedRisksNames.includes(risk)) {
                    selectedRisksNames.push(risk);
                }
            });
        }
    }

    initialRisks = selectedRisksNames.map((riskName, idx) => {
      const def = defaultProjectRisksValues.find(r => r.name === riskName);
      return {
        id: `risk-default-${Date.now()}-${idx}`,
        name: riskName,
        probability: def ? ((def.availability || 1) + (def.occurrence || 1) + (def.complexity || 1)) : 3,
        impact: def ? ((def.lifeAndHealth || 1) + (def.facility || 1) + (def.financial || 1) + (def.community || 1)) : 4,
        availability: def ? def.availability : 1,
        occurrence: def ? def.occurrence : 1,
        complexity: def ? def.complexity : 1,
        lifeAndHealth: def ? def.lifeAndHealth : 1,
        facility: def ? def.facility : 1,
        financial: def ? def.financial : 1,
        community: def ? def.community : 1
      };
    });
  }



  const p = {
    id,
    name,
    projectType,
    ...rest,
    customRisks: initialRisks,
    members: ["LOCAL_USER"],
    ownerId: "LOCAL_USER",
    createdAt: Date.now(),
    lastModified: Date.now(),
    ...meta
  };
  upsertProject(p);
  return p;
}

export function removeProject(id) {
  const data = read();
  data.projects = data.projects.filter(p => p.id !== id);
  write(data);
}

export function saveAll(projects) {
  write({ projects });
}
