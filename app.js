"use strict";

const STORAGE_KEY = "byetoc.v1";

/** @type {Array<{id:string,label:string,state:boolean,createdAt:string,lastUpdatedAt:string|null,history:Array<{previousState:boolean|null,newState:boolean,timestamp:string}>}>} */
let switches = [];
const openHistory = new Set(); // ids con historial expandido (no persistido)

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const inputEl = document.getElementById("new-label");
const importFileEl = document.getElementById("import-file");

/* ---------- Persistencia ---------- */

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { switches = []; return; }
    const data = JSON.parse(raw);
    switches = normalize(data);
  } catch (_) {
    switches = [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(switches));
  } catch (_) {
    // almacenamiento lleno o no disponible: la sesión sigue en memoria
  }
}

function normalize(data) {
  const arr = Array.isArray(data) ? data : (data && Array.isArray(data.switches) ? data.switches : []);
  return arr
    .filter(s => s && typeof s.label === "string")
    .map(s => ({
      id: typeof s.id === "string" ? s.id : newId(),
      label: s.label,
      state: !!s.state,
      createdAt: typeof s.createdAt === "string" ? s.createdAt : new Date().toISOString(),
      lastUpdatedAt: typeof s.lastUpdatedAt === "string" ? s.lastUpdatedAt : null,
      history: Array.isArray(s.history) ? s.history.filter(h => h && typeof h.timestamp === "string").map(h => ({
        previousState: typeof h.previousState === "boolean" ? h.previousState : null,
        newState: !!h.newState,
        timestamp: h.timestamp
      })) : []
    }));
}

function newId() {
  return (crypto.randomUUID && crypto.randomUUID()) ||
    (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
}

/* ---------- Formato ---------- */

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/* ---------- Acciones ---------- */

function addSwitch(label) {
  const clean = label.trim();
  if (!clean) return;
  switches.unshift({
    id: newId(),
    label: clean,
    state: false,
    createdAt: new Date().toISOString(),
    lastUpdatedAt: null,
    history: []
  });
  save();
  render();
}

function toggle(id) {
  const s = switches.find(x => x.id === id);
  if (!s) return;
  const now = new Date().toISOString();
  s.history.push({ previousState: s.state, newState: !s.state, timestamp: now });
  s.state = !s.state;
  s.lastUpdatedAt = now;
  save();
  render();
}

function rename(id) {
  const s = switches.find(x => x.id === id);
  if (!s) return;
  const next = window.prompt("Nuevo nombre", s.label);
  if (next === null) return;
  const clean = next.trim();
  if (!clean) return;
  s.label = clean;
  save();
  render();
}

function remove(id) {
  switches = switches.filter(x => x.id !== id);
  openHistory.delete(id);
  save();
  render();
}

function resetTimestamp(id) {
  const s = switches.find(x => x.id === id);
  if (!s) return;
  s.state = false;
  s.lastUpdatedAt = null; // historial y etiqueta intactos
  save();
  render();
}

function toggleHistory(id) {
  if (openHistory.has(id)) openHistory.delete(id);
  else openHistory.add(id);
  render();
}

/* ---------- Backup ---------- */

function exportJSON() {
  const blob = new Blob([JSON.stringify({ app: "ByeTOC", switches }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `byetoc-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      switches = normalize(data);
      openHistory.clear();
      save();
      render();
    } catch (_) {
      // archivo no válido: no se altera el estado actual
    }
  };
  reader.readAsText(file);
}

/* ---------- Render ---------- */

function render() {
  listEl.textContent = "";
  emptyEl.hidden = switches.length > 0;

  for (const s of switches) {
    const card = document.createElement("section");
    card.className = "card";
    card.dataset.id = s.id;

    const main = document.createElement("div");
    main.className = "card-main";

    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "drag-handle";
    handle.textContent = "⠿";
    handle.setAttribute("aria-label", "Reordenar (flechas arriba y abajo)");
    handle.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") { e.preventDefault(); moveSwitch(s.id, -1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); moveSwitch(s.id, 1); }
    });

    const text = document.createElement("div");
    text.className = "card-text";

    const label = document.createElement("div");
    label.className = "card-label";
    label.textContent = s.label;

    const time = document.createElement("div");
    time.className = "card-time";
    time.textContent = s.lastUpdatedAt
      ? `${fmtDate(s.lastUpdatedAt)} · ${fmtTime(s.lastUpdatedAt)}`
      : "Sin registro reciente";

    text.append(label, time);

    const sw = document.createElement("button");
    sw.className = "switch";
    sw.setAttribute("role", "switch");
    sw.setAttribute("aria-checked", String(s.state));
    sw.setAttribute("aria-label", s.label);
    const thumb = document.createElement("span");
    thumb.className = "thumb";
    sw.appendChild(thumb);
    sw.addEventListener("click", () => toggle(s.id));

    main.append(handle, text, sw);

    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.append(
      actionBtn("Renombrar", () => rename(s.id)),
      actionBtn("Restablecer", () => resetTimestamp(s.id)),
      actionBtn(`Historial (${s.history.length})`, () => toggleHistory(s.id)),
      actionBtn("Eliminar", () => remove(s.id))
    );

    card.append(main, actions);

    if (openHistory.has(s.id)) {
      card.appendChild(renderHistory(s));
    }

    listEl.appendChild(card);
  }
}

function actionBtn(text, onClick) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.addEventListener("click", onClick);
  return b;
}

function renderHistory(s) {
  const box = document.createElement("div");
  box.className = "history";
  if (s.history.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-hist";
    p.textContent = "Sin eventos.";
    box.appendChild(p);
    return box;
  }
  const ul = document.createElement("ul");
  for (let i = s.history.length - 1; i >= 0; i--) {
    const h = s.history[i];
    const li = document.createElement("li");
    const when = document.createElement("span");
    when.textContent = `${fmtDate(h.timestamp)} ${fmtTime(h.timestamp)}`;
    const st = document.createElement("span");
    st.className = "ev-state";
    const prev = h.previousState === null ? "—" : (h.previousState ? "ON" : "OFF");
    st.textContent = `${prev} → ${h.newState ? "ON" : "OFF"}`;
    li.append(when, st);
    ul.appendChild(li);
  }
  box.appendChild(ul);
  return box;
}

/* ---------- Reordenar ---------- */

let sortable = null;

function initSortable() {
  if (sortable || typeof Sortable === "undefined") return;
  sortable = Sortable.create(listEl, {
    handle: ".drag-handle",
    animation: 170,
    easing: "cubic-bezier(0.2, 0, 0, 1)",
    forceFallback: true,
    fallbackTolerance: 4,
    chosenClass: "is-chosen",
    ghostClass: "is-ghost",
    dragClass: "is-drag",
    onEnd: commitOrder
  });
}

function commitOrder() {
  const order = Array.from(listEl.querySelectorAll(".card")).map((c) => c.dataset.id);
  switches.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  save();
}

function moveSwitch(id, dir) {
  const i = switches.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= switches.length) return;
  const [moved] = switches.splice(i, 1);
  switches.splice(j, 0, moved);
  save();
  render();
  const h = listEl.querySelector(`.card[data-id="${id}"] .drag-handle`);
  if (h) h.focus();
}

/* ---------- Eventos globales ---------- */

document.getElementById("add").addEventListener("click", () => {
  addSwitch(inputEl.value);
  inputEl.value = "";
  inputEl.focus();
});
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addSwitch(inputEl.value);
    inputEl.value = "";
  }
});
document.getElementById("export").addEventListener("click", exportJSON);
document.getElementById("import").addEventListener("click", () => importFileEl.click());
importFileEl.addEventListener("change", () => {
  if (importFileEl.files && importFileEl.files[0]) importJSON(importFileEl.files[0]);
  importFileEl.value = "";
});

/* ---------- Instalación PWA ---------- */

let deferredPrompt = null;
const installBtn = document.getElementById("install");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  installBtn.hidden = true;
});

/* ---------- Service worker ---------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

/* ---------- Inicio ---------- */

load();
render();
initSortable();
