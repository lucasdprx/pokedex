// « En ce moment » : ce qui te manque et qu'on peut avoir maintenant ou bientôt
// (raids, œufs, études de terrain, Heures vedettes, Journées Communauté).
// Données : ScrapedDuck, copie automatique de Leek Duck (https://github.com/bigfoott/ScrapedDuck).
// Les Pokémon sauvages des événements n'y sont pas : Leek Duck ne les liste pas.

const DUCK = "https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/";
const DUCK_KEY = "pokedex-go-events";
const DUCK_AGE = 3 * 3600e3; // relu toutes les 3 h

let duck = null;      // données brutes reçues
let howMap = null;    // clé de carte → [{src, detail, start, end, shiny}] trié, du plus proche au plus loin

async function loadDuck() {
  try {
    const c = JSON.parse(localStorage.getItem(DUCK_KEY));
    if (c) { duck = c; buildHow(); }
    if (c && Date.now() - c.time < DUCK_AGE) return;
  } catch {}
  try {
    const get = f => fetch(DUCK + f + ".json").then(r => { if (!r.ok) throw r.status; return r.json(); });
    const [raids, eggs, research, events] = await Promise.all(["raids", "eggs", "research", "events"].map(get));
    duck = { time: Date.now(), raids, eggs, research, events };
    try { localStorage.setItem(DUCK_KEY, JSON.stringify(duck)); } catch {}
    buildHow();
  } catch { /* hors ligne : la dernière liste reçue, ou rien */ }
}

// N° de Pokédex lu dans le nom de l'image (pm942.icon.png, pokemon_icon_487_11.png, poke_capture_0824_…)
const dexOf = img => +((img || "").match(/(?:pm|pokemon_icon_|poke_capture_0*)(\d+)/) || [, 0])[1];
const REGIONAL = [["Alolan", "ALOLA"], ["Galarian", "GALAR"], ["Hisuian", "HISUI"], ["Paldean", "PALDEA"]];
// Carte du Pokédex : forme régionale si le nom l'indique, sinon la forme de base
// (obscur, costumé, Méga : on attrape l'espèce de base)
function entryOf(name, img) {
  const id = dexOf(img);
  if (!id) return null;
  const reg = REGIONAL.find(([w]) => (name || "").includes(w));
  if (reg) {
    const e = entries.find(e => e.id === id && e.regional && e.form.toUpperCase().startsWith(reg[1]));
    if (e) return e;
  }
  return entries.find(e => e.id === id && !e.regional) || null;
}
const parseDate = s => s ? new Date(s).getTime() : null;

function buildHow() {
  if (!duck || !entries.length) return;
  const map = new Map();
  const add = (name, img, src, detail, shiny, start = null, end = null) => {
    const e = entryOf(name, img);
    if (!e) return;
    const list = map.get(e.key) || [];
    // Même source et même début déjà notés (raid listé deux fois) : on garde le premier
    if (!list.some(h => h.src === src && h.start === start)) list.push({ src, detail, start, end, shiny: shiny !== false });
    map.set(e.key, list);
  };
  const tier = s => {
    if (/mega/i.test(s)) return "mega";
    const n = (s.match(/(\d)-star/i) || [])[1];
    return n ? +n : "";
  };
  for (const r of duck.raids || []) add(r.name, r.image, "raid", tier(r.tier), r.canBeShiny);
  for (const g of duck.eggs || []) add(g.name, g.image, "egg", g.eggType, g.canBeShiny);
  for (const task of duck.research || [])
    for (const r of task.rewards || []) add(r.name, r.image, "research", "", r.canBeShiny);
  const now = Date.now();
  for (const ev of duck.events || []) {
    const start = parseDate(ev.start), end = parseDate(ev.end);
    if (end && end < now) continue;
    const x = ev.extraData || {};
    const when = start && start > now ? start : null; // à venir : sa date ; en cours : maintenant
    if (x.spotlight) for (const p of x.spotlight.list || []) add(p.name, p.image, "spotlight", "", p.canBeShiny, when, end);
    if (x.communityday) for (const p of x.communityday.spawns || []) add(p.name, p.image, "cday", "", true, when, end);
    if (x.raidbattles && when) for (const p of x.raidbattles.bosses || []) add(p.name, p.image, "raid", tier(ev.name), p.canBeShiny, when, end);
  }
  for (const list of map.values()) list.sort((a, b) => (a.start || 0) - (b.start || 0));
  howMap = map;
  if (typeof render === "function" && els.grid.children.length) render();
}

// Ce qui compte comme « manquant » dans le mode affiché, avec ses moyens de l'avoir
function howFor(e) {
  if (!howMap || !can(e) || marks().has(e.key)) return null;
  return (howMap.get(e.key) || []).filter(h => !shinyMode || h.shiny);
}

const fmtDay = ms => new Date(ms).toLocaleDateString(LANG, { day: "numeric", month: "short" });
function howLabel(h) {
  const base = h.src === "raid" ? (h.detail === "mega" ? t("raidMega") : t("raidN", { n: h.detail }))
    : h.src === "egg" ? t("eggKm", { km: h.detail })
    : h.src === "research" ? t("fieldResearch")
    : h.src === "spotlight" ? t("spotlightOne") : t("cdayOne");
  return h.start ? base + " " + t("fromDay", { d: fmtDay(h.start) }) : base;
}

// Ligne de la carte (à la place des types) : comment l'avoir, ou « Pas en ce moment »
window.howToGet = e => {
  const list = howFor(e);
  if (!list) return null;
  if (!list.length) return `<span class="how off">${t("notNow")}</span>`;
  return `<span class="how">${howLabel(list[0])}</span>`;
};

// --- La feuille « En ce moment » (menu ⋯) ---
const nowDialog = document.getElementById("nowDialog");
let nowPane = "now";
const SRC_ORDER = ["raid", "egg", "research", "spotlight", "cday"];
const SRC_HEAD = { raid: "hRaids", egg: "hEggs", research: "hResearch", spotlight: "hSpotlight", cday: "hCday" };

function sheetRows() {
  const now = [], soon = [];
  for (const e of entries) {
    for (const h of howFor(e) || []) (h.start ? soon : now).push({ e, h });
  }
  return { now, soon };
}

function renderNow() {
  const { now, soon } = sheetRows();
  document.getElementById("nowTitle").textContent = t("nowTitle") + (shinyMode ? " ✦" : "");
  document.getElementById("nowTabs").innerHTML =
    `<button data-p="now"${nowPane === "now" ? ' class="on"' : ""}>${t("nowTab")} <span>${now.length}</span></button>` +
    `<button data-p="soon"${nowPane === "soon" ? ' class="on"' : ""}>${t("soonTab")} <span>${soon.length}</span></button>`;
  const rows = nowPane === "now" ? now : soon;
  const body = document.getElementById("nowBody");
  if (!howMap) { body.innerHTML = `<p class="now-empty">${t("nowOffline")}</p>`; return; }
  if (!rows.length) { body.innerHTML = `<p class="now-empty">${t("nowNothing")}</p>`; return; }
  body.innerHTML = SRC_ORDER.map(src => {
    const list = rows.filter(r => r.h.src === src).sort((a, b) => (a.h.start || 0) - (b.h.start || 0) || a.e.id - b.e.id);
    if (!list.length) return "";
    return `<h3>${t(SRC_HEAD[src])}</h3>` + list.map(({ e, h }) => {
      const sp = spriteOf(e);
      const detail = h.src === "raid" ? (h.detail === "mega" ? t("mega") : h.detail + "★") : h.src === "egg" ? h.detail : "";
      const when = h.start ? t("fromDay", { d: fmtDay(h.start) }) : "";
      return `<div class="now-row"><img loading="lazy" src="${shinyMode ? SPRITE_SMALL_SHINY(sp) : SPRITE_SMALL(sp)}" alt="" ` +
        `data-sprite="${sp}" data-shiny="${shinyMode ? 1 : 0}" onerror="imgFallback(this)"><span>${e.name}</span>` +
        `<b${h.start ? ' class="later"' : ""}>${[detail, when].filter(Boolean).join(" ")}</b></div>`;
    }).join("");
  }).join("");
}

document.getElementById("nowBtn").addEventListener("click", () => {
  setMenu(false);
  nowPane = "now";
  renderNow();
  nowDialog.showModal();
  loadDuck().then(() => { if (nowDialog.open) renderNow(); });
});
document.getElementById("nowTabs").addEventListener("click", ev => {
  const b = ev.target.closest("button[data-p]");
  if (!b) return;
  nowPane = b.dataset.p;
  renderNow();
});

loadDuck();
