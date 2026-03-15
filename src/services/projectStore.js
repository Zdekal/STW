// Lokální úložiště pro nepřihlášeného uživatele
const LS_KEY = "esp.draftProject";

export function loadDraft() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || null; } catch { return null; }
}
export function saveDraft(draft) {
  localStorage.setItem(LS_KEY, JSON.stringify(draft));
}
export function clearDraft() {
  localStorage.removeItem(LS_KEY);
}
export function newLocalProject() {
  // jednoduché ID (čas + náh. číslo)
  const id = "local-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2,8);
  return { id, title: "Nový projekt", createdAt: Date.now(), status: "draft", data: {} };
}
