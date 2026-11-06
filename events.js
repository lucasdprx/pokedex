// « En ce moment » : les Pokémon (manquants d'abord) qu'on peut avoir maintenant ou bientôt
// (raids, œufs, études de terrain, sauvages des événements, Heures vedettes, Journées Communauté).
// Données : ScrapedDuck, copie automatique de Leek Duck (https://github.com/bigfoott/ScrapedDuck).
// Les sauvages des événements n'y sont pas : wild.json, lu chaque jour sur Leek Duck (tools/wild.py).

const DUCK = "https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/";
const DUCK_KEY = "pokedex-go-events2";
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
    const wild = await fetch("wild.json").then(r => r.ok ? r.json() : []).catch(() => []);
    duck = { time: Date.now(), raids, eggs, research, events, wild };
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
  const add = (name, img, src, detail, shiny, start = null, end = null, shadow = false) => {
    const e = entryOf(name, img);
    if (!e) return;
    const list = map.get(e.key) || [];
    // Même source et même début déjà notés (raid listé deux fois) : on garde le premier
    if (!list.some(h => h.src === src && h.start === start && h.shadow === shadow && (src !== "research" || h.detail === detail))) list.push({ src, detail, start, end, shadow, shiny: shiny !== false });
    map.set(e.key, list);
  };
  const tier = s => {
    if (/mega/i.test(s)) return "mega";
    const n = (s.match(/(\d)-star/i) || [])[1];
    return n ? +n : "";
  };
  for (const r of duck.raids || []) add(r.name, r.image, "raid", tier(r.tier), r.canBeShiny, null, null, /^Shadow /.test(r.name));
  for (const g of duck.eggs || []) add(g.name, g.image, "egg", g.eggType, g.canBeShiny);
  for (const task of duck.research || [])
    for (const r of task.rewards || []) add(r.name, r.image, "research", (task.text || "").replace(/<[^>]+>/g, "").trim(), r.canBeShiny);
  const now = Date.now();
  for (const w of duck.wild || []) {
    const start = parseDate(w.start), end = parseDate(w.end);
    if (!(end && end < now)) add(w.name, w.image, "wild", "", w.canBeShiny, start && start > now ? start : null, end);
  }
  for (const ev of duck.events || []) {
    const start = parseDate(ev.start), end = parseDate(ev.end);
    if (end && end < now) continue;
    const x = ev.extraData || {};
    const when = start && start > now ? start : null; // à venir : sa date ; en cours : maintenant
    if (x.spotlight) for (const p of x.spotlight.list || []) add(p.name, p.image, "spotlight", "", p.canBeShiny, when, end);
    if (x.communityday) for (const p of x.communityday.spawns || []) add(p.name, p.image, "cday", "", true, when, end);
    if (x.raidbattles && when) for (const p of x.raidbattles.bosses || []) add(p.name, p.image, "raid", tier(ev.name), p.canBeShiny, when, end, /shadow/i.test(ev.name));
  }
  for (const list of map.values()) list.sort((a, b) => (a.start || 0) - (b.start || 0));
  howMap = map;
  updateNowDot();
  if (nowDialog.open) markNowSeen();
  if (typeof render === "function" && els.grid.children.length) render();
}

// Ce qui compte comme « manquant » dans le mode affiché, avec ses moyens de l'avoir
function howFor(e) {
  if (!howMap || !can(e) || marks().has(e.key)) return null;
  return (howMap.get(e.key) || []).filter(h => !shinyMode || h.shiny);
}

const fmtDay = ms => new Date(ms).toLocaleDateString(LANG, { day: "numeric", month: "short" });
function howLabel(h) {
  const base = h.src === "raid" ? (h.shadow ? t("raidShadow") + (h.detail ? " " + h.detail + "★" : "")
      : h.detail === "mega" ? t("raidMega") : t("raidN", { n: h.detail }))
    : h.src === "egg" ? t("eggKm", { km: h.detail })
    : h.src === "research" ? t("fieldResearch")
    : h.src === "wild" ? t("wildOne")
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

// --- La feuille « En ce moment » (icône du haut) ---
// Onglets Maintenant / Bientôt, puis Tout / Raids / Œufs / Études ; sous-titres par niveau.
const nowDialog = document.getElementById("nowDialog");
let nowPane = "now", nowCat = "all";

// Tâche d'étude de terrain (en anglais chez Leek Duck), traduite en français par modèles ;
// une tâche inconnue reste en anglais
const TASK_FR = [
  [/^Catch (a|\d+) (\w+)-type Pokémon$/, (n, ty) => `Attraper ${n === "a" ? "un" : n} Pokémon de type ${typeName(ty)}`],
  [/^Catch (\d+) different species of Pokémon$/, n => `Attraper ${n} espèces de Pokémon différentes`],
  [/^Catch (\d+) Pokémon with Weather Boost$/, n => `Attraper ${n} Pokémon boostés par la météo`],
  [/^Catch (a|\d+) Pokémon$/, n => `Attraper ${n === "a" ? "un" : n} Pokémon`],
  [/^Make (a|\d+) (Nice|Great|Excellent) (Curveball )?Throws?( in a row)?$/, (n, q, c, row) =>
    `Faire ${n === "a" ? "un" : n} ${{ Nice: "Joli", Great: "Super", Excellent: "Excellent" }[q]}${n === "a" || n === "1" || q === "Great" ? "" : "s"} Lancer${n === "a" || n === "1" ? "" : "s"}${c ? " en courbe" : ""}${row ? " d'affilée" : ""}`],
  [/^Make (a|\d+) Curveball Throws?$/, n => `Faire ${n === "a" ? "un" : n} lancer${n === "a" || n === "1" ? "" : "s"} en courbe`],
  [/^Win a three-star raid or higher$/, () => "Gagner un raid 3★ ou plus"],
  [/^Win (a|\d+) raids?$/, n => n === "a" ? "Gagner un raid" : `Gagner ${n} raids`],
  [/^Explore (\d+) km$/, n => `Parcourir ${n} km`],
  [/^Hatch (an|\d+) Eggs?$/, n => n === "an" ? "Faire éclore un Œuf" : `Faire éclore ${n} Œufs`],
  [/^Spin (\d+) PokéStops or Gyms$/, n => `Faire tourner ${n} PokéStops ou Arènes`],
  [/^Spin (\d+) PokéStops$/, n => `Faire tourner ${n} PokéStops`],
  [/^Take a snapshot of a wild Pokémon$/, () => "Photographier un Pokémon sauvage"],
  [/^Evolve (a|\d+) Pokémon$/, n => `Faire évoluer ${n === "a" ? "un" : n} Pokémon`],
  [/^Power up Pokémon (\d+) times$/, n => `Améliorer des Pokémon ${n} fois`],
  [/^Earn (\d+) Candies walking with your buddy$/, n => `Gagner ${n} Bonbons avec ton copain`],
  [/^Send (\d+) Gifts and add a sticker to each$/, n => `Envoyer ${n} Cadeaux avec un autocollant`],
  [/^Trade (a|\d+) Pokémon$/, n => `Échanger ${n === "a" ? "un" : n} Pokémon`],
  [/^Defeat (a|\d+) Team GO Rocket Grunts?$/, n => n === "a" ? "Vaincre un Sbire de la Team GO Rocket" : `Vaincre ${n} Sbires de la Team GO Rocket`],
];
function taskLabel(text) {
  if (LANG !== "fr") return text || t("hResearch");
  for (const [re, fr] of TASK_FR) { const m = (text || "").match(re); if (m) return fr(...m.slice(1)); }
  return text || t("hResearch");
}

// Icônes dessinées pour le site, aux couleurs des œufs et des raids du jeu
const EGG_SHAPE = "M12 2.5c4.2 0 7.5 6.6 7.5 11.3A7.5 7.5 0 0 1 4.5 13.8C4.5 9.1 7.8 2.5 12 2.5z";
const eggIcon = (band, spot) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${EGG_SHAPE}" fill="#fff" stroke="#9bbcc8"/>` +
  `<circle cx="9" cy="9" r="2.2" fill="${spot}"/><circle cx="15" cy="12.5" r="2.6" fill="${spot}"/><circle cx="9.5" cy="16" r="1.8" fill="${spot}"/>` +
  `<path d="M5 15.5c2 1.6 12 1.6 14 0" stroke="${band}" stroke-width="2.2" fill="none"/></svg>`;
const raidIcon = fill => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${EGG_SHAPE}" fill="${fill}" stroke="rgba(0,0,0,.25)"/>` +
  `<path d="M12 9l1.3 2.7 2.9.3-2.2 2 .7 2.9L12 15.4 9.3 16.9l.7-2.9-2.2-2 2.9-.3z" fill="#fff"/></svg>`;
const EGG_COLORS = { 1: ["#59a9e0", "#7fc8f8"], 2: ["#5ba83a", "#8fd36b"], 5: ["#e08a24", "#f5a142"],
  7: ["#d9b62e", "#f4d35e"], 10: ["#8a5ccf", "#a77fe0"], 12: ["#c43c3c", "#e05252"] };
const RAID_COLORS = { 1: "#f29bb6", 3: "#f4c430", 5: "#8a8fa3", mega: "#c0392b", shadow: "#6b3fa0" };

// Tous les Pokémon disponibles (ceux que tu as aussi), dans le mode affiché
function sheetRows() {
  const now = [], soon = [];
  if (!howMap) return { now, soon };
  for (const e of entries) {
    if (!can(e)) continue;
    const missing = !marks().has(e.key);
    for (const h of (howMap.get(e.key) || []).filter(h => !shinyMode || h.shiny)) (h.start ? soon : now).push({ e, h, missing });
  }
  return { now, soon };
}

// Icône du haut : le jour, et un point quand un Pokémon qui te manque est disponible
// et pas encore vu dans la feuille (il part à l'ouverture, revient avec du neuf)
const SEEN_KEY = "pokedex-go-now-seen";
const missingNow = () => [...new Set(sheetRows().now.filter(r => r.missing).map(r => (shinyMode ? "s:" : "") + r.e.key))];
const seenNow = () => { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) || []); } catch { return new Set(); } };
window.updateNowDot = () => {
  const seen = seenNow();
  document.getElementById("nowDot").hidden = !missingNow().some(k => !seen.has(k));
};
// Pokémon pas encore vus à l'ouverture de la feuille : leur point reste jusqu'à la fermeture
let nowFresh = new Set();
function markNowSeen() {
  const seen = seenNow();
  for (const k of missingNow()) if (!seen.has(k)) nowFresh.add(k);
  for (const k of missingNow()) seen.add(k);
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch {}
  updateNowDot();
}

// Groupes d'une liste : [{icon, title, rows, showTier}] dans l'ordre d'affichage
function sheetGroups(rows) {
  const groups = [];
  const push = (icon, title, list, showTier = false) => { if (list.length) groups.push({ icon, title, list: list.sort((a, b) => b.missing - a.missing), showTier }); };
  const byStart = (a, b) => (a.h.start || 0) - (b.h.start || 0) || a.e.id - b.e.id;
  if (nowCat === "all" || nowCat === "raid") {
    const raids = rows.filter(r => r.h.src === "raid");
    const plain = raids.filter(r => !r.h.shadow);
    // 5★ (et plus), Méga, puis les autres niveaux du plus haut au plus bas
    const tiers = [...new Set(plain.map(r => r.h.detail))].sort((a, b) =>
      (a === "mega" ? 4.5 : +a || 0) > (b === "mega" ? 4.5 : +b || 0) ? -1 : 1);
    for (const tr of tiers) push(raidIcon(RAID_COLORS[tr] || RAID_COLORS[5]),
      tr === "mega" ? t("hRaidMega") : tr ? t("hRaidTier", { n: tr }) : t("hRaids"),
      plain.filter(r => r.h.detail === tr).sort(byStart));
    push(raidIcon(RAID_COLORS.shadow), t("hRaidShadow"),
      raids.filter(r => r.h.shadow).sort((a, b) => (+b.h.detail || 0) - (+a.h.detail || 0) || byStart(a, b)), true);
  }
  if (nowCat === "all" || nowCat === "egg") {
    const eggs = rows.filter(r => r.h.src === "egg");
    const kms = [...new Set(eggs.map(r => r.h.detail))].sort((a, b) => parseFloat(a) - parseFloat(b));
    for (const km of kms) {
      const c = EGG_COLORS[parseFloat(km)] || EGG_COLORS[5];
      push(eggIcon(c[0], c[1]), t("hEggKm", { km }), eggs.filter(r => r.h.detail === km).sort(byStart));
    }
  }
  if (nowCat === "all" || nowCat === "research") {
    const research = rows.filter(r => r.h.src === "research");
    // Dans l'ordre de Leek Duck (captures, lancers, combats…)
    const order = (duck.research || []).map(x => (x.text || "").replace(/<[^>]+>/g, "").trim());
    for (const task of [...new Set(research.map(r => r.h.detail))].sort((x, y) => order.indexOf(x) - order.indexOf(y))) push("", taskLabel(task), research.filter(r => r.h.detail === task).sort(byStart));
  }
  if (nowCat === "all" || nowCat === "wild") push("", t("hWild"), rows.filter(r => r.h.src === "wild").sort(byStart));
  if (nowCat === "all") {
    push("", t("hSpotlight"), rows.filter(r => r.h.src === "spotlight").sort(byStart));
    push("", t("hCday"), rows.filter(r => r.h.src === "cday").sort(byStart));
  }
  return groups;
}

function renderNow() {
  const { now, soon } = sheetRows();
  document.getElementById("nowTitle").textContent = t("nowTitle") + (shinyMode ? " ✦" : "");
  const tab = (attr, key, on, label) => `<button data-${attr}="${key}"${on ? ' class="on"' : ""}>${label}</button>`;
  document.getElementById("nowTabs").innerHTML =
    tab("p", "now", nowPane === "now", `${t("nowTab")} <span>${now.length}</span>`) +
    tab("p", "soon", nowPane === "soon", `${t("soonTab")} <span>${soon.length}</span>`);
  document.getElementById("nowCats").innerHTML =
    [["all", "catAll"], ["raid", "catRaids"], ["egg", "catEggs"], ["research", "catResearch"], ["wild", "catWild"]]
      .map(([k, key]) => tab("c", k, nowCat === k, t(key))).join("");
  const body = document.getElementById("nowBody");
  if (!howMap) { body.innerHTML = `<p class="now-empty">${t("nowOffline")}</p>`; return; }
  const groups = sheetGroups(nowPane === "now" ? now : soon);
  if (!groups.length) {
    // Leek Duck ne liste que les œufs et études du moment : pour Bientôt, on ne sait pas encore
    const unknown = nowPane === "soon" && (nowCat === "egg" || nowCat === "research");
    body.innerHTML = `<p class="now-empty">${t(unknown ? (nowCat === "egg" ? "soonEggsUnknown" : "soonResearchUnknown") : "nowNothing")}</p>`;
    return;
  }
  // Vignettes sans nom, six par rangée (calendrier-allege v1 : A1) ; le nom au survol
  body.innerHTML = groups.map(g =>
    `<div class="now-sub">${g.icon}${g.title}</div><div class="now-grid">` + g.list.map(({ e, missing }) => {
      const sp = spriteOf(e);
      return `<div class="now-cell${missing ? " missing" : ""}" title="${e.name}"><img loading="lazy" src="${shinyMode ? SPRITE_TINY_SHINY(sp) : SPRITE_TINY(sp)}" alt="${e.name}" ` +
        `data-sprite="${sp}" data-shiny="${shinyMode ? 1 : 0}" onerror="imgFallback(this)">` +
        (missing && nowFresh.has((shinyMode ? "s:" : "") + e.key) ? `<i class="now-dot"></i>` : "") + `</div>`;
    }).join("") + `</div>`).join("");
}

document.getElementById("nowBtn").addEventListener("click", () => {
  setMenu(false);
  nowPane = "now";
  nowCat = "all";
  nowFresh = new Set();
  markNowSeen();
  renderNow();
  nowDialog.showModal();
  loadDuck().then(() => { if (nowDialog.open) { markNowSeen(); renderNow(); } });
});
for (const id of ["nowTabs", "nowCats"]) document.getElementById(id).addEventListener("click", ev => {
  const b = ev.target.closest("button[data-p],button[data-c]");
  if (!b) return;
  if (b.dataset.p) nowPane = b.dataset.p;
  if (b.dataset.c) nowCat = b.dataset.c;
  renderNow();
});

document.getElementById("nowDay").textContent = new Date().getDate();
loadDuck();
