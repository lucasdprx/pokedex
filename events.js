// « En ce moment » : les Pokémon (manquants d'abord) qu'on peut avoir maintenant ou bientôt
// (raids, œufs, études de terrain, Heures vedettes, Journées Communauté).
// Données : ScrapedDuck, copie automatique de Leek Duck (https://github.com/bigfoott/ScrapedDuck).

const DUCK = "https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/";
const DUCK_KEY = "pokedex-go-events2";
const DUCK_AGE = 3 * 3600e3; // relu toutes les 3 h

let duck = null;      // données brutes reçues
let howMap = null;    // clé de carte → [{src, detail, start, end, shiny}] trié, du plus proche au plus loin

async function loadDuck(force) {
  try {
    const c = JSON.parse(localStorage.getItem(DUCK_KEY));
    // Copie locale lue une seule fois : la relire refait toute la grille (clignotement, attente)
    if (c && !howMap) { duck = c; buildHow(); }
    if (c && !force && Date.now() - c.time < DUCK_AGE) return;
  } catch {}
  try {
    const get = f => fetch(DUCK + f + ".json").then(r => { if (!r.ok) throw r.status; return r.json(); });
    const [raids, eggs, research, events] = await Promise.all(["raids", "eggs", "research", "events"].map(get));
    // Format changé chez Leek Duck : on garde l'ancienne liste plutôt qu'une liste vide
    if (![raids, eggs, research, events].every(Array.isArray)) throw "format";
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
    : h.src === "spotlight" ? t("spotlightOne") : t("cdayOne");
  return h.start ? base + " " + t("fromDay", { d: fmtDay(h.start) }) : base;
}

// Ligne de la carte (à la place des types) : comment l'avoir, ou « Pas en ce moment »
window.howToGet = e => {
  const list = howFor(e);
  if (!list) return null;
  if (!list.length) return null; // rien de connu : les types (il peut être sauvage sans qu'on le sache)
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

// Le calendrier suit le Pokédex (ou le Shiny), pas les collections Méga, Obscurs, Purifiés :
// filtrer sur Méga ne doit pas vider la liste des raids et des œufs
const calCan = e => e.available && (!shinyMode || e.shinyOut);
const calMarks = () => shinyMode ? shinyCaught : caught;
// Tous les Pokémon disponibles (ceux que tu as aussi), dans le mode affiché
function sheetRows() {
  const now = [], soon = [];
  if (!howMap) return { now, soon };
  for (const e of entries) {
    if (!calCan(e)) continue;
    const missing = !calMarks().has(e.key);
    for (const h of (howMap.get(e.key) || []).filter(h => !shinyMode || h.shiny)) (h.start ? soon : now).push({ e, h, missing });
  }
  return { now, soon };
}

// Icône du haut : le jour, et un point quand un Pokémon qui te manque est disponible
// et pas encore vu dans la feuille (il part à l'ouverture, revient avec du neuf)
const SEEN_KEY = "pokedex-go-now-seen";
const missingNow = () => [...new Set(sheetRows().now.filter(r => r.missing).map(r => (shinyMode ? "s:" : "") + r.e.key))];
const seenNow = () => { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) || []); } catch { return new Set(); } };
// Images du calendrier téléchargées en fond après le lancement : la feuille s'ouvre sans attendre
let nowPreloaded = false;
const nowImgs = [];
function preloadNow() {
  if (nowPreloaded || !howMap) return;
  nowPreloaded = true;
  renderNow(); // feuille prête avant le premier toucher
  const { now, soon } = sheetRows();
  const urls = new Set([...now, ...soon].map(({ e }) => (shinyMode ? SPRITE_TINY_SHINY : SPRITE_TINY)(spriteOf(e))));
  // Téléchargées et décodées, puis gardées en mémoire : la feuille les affiche sans travail
  setTimeout(() => urls.forEach(u => { const img = new Image(); img.crossOrigin = "anonymous"; img.src = u; img.decode().then(() => nowImgs.push(img), () => {}); }), 2000);
}
window.updateNowDot = () => {
  preloadNow();
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
  const push = (icon, title, list, showTier = false, kind = "") => { if (list.length) groups.push({ icon, title, list: list.sort((a, b) => b.missing - a.missing), showTier, kind }); };
  const byStart = (a, b) => (a.h.start || 0) - (b.h.start || 0) || a.e.id - b.e.id;
  if (nowCat === "all" || nowCat === "raid") {
    const raids = rows.filter(r => r.h.src === "raid");
    const plain = raids.filter(r => !r.h.shadow);
    // 5★ (et plus), Méga, puis les autres niveaux du plus haut au plus bas
    const tiers = [...new Set(plain.map(r => r.h.detail))].sort((a, b) =>
      (a === "mega" ? 4.5 : +a || 0) > (b === "mega" ? 4.5 : +b || 0) ? -1 : 1);
    for (const tr of tiers) push(raidIcon(RAID_COLORS[tr] || RAID_COLORS[5]),
      tr === "mega" ? t("hRaidMega") : tr ? t("hRaidTier", { n: tr }) : t("hRaids"),
      plain.filter(r => r.h.detail === tr).sort(byStart), false, tr === "mega" || +tr >= 5 ? "boss" : "");
    push(raidIcon(RAID_COLORS.shadow), t("hRaidShadow"),
      raids.filter(r => r.h.shadow).sort((a, b) => (+b.h.detail || 0) - (+a.h.detail || 0) || byStart(a, b)), true, "shadow");
  }
  if (nowCat === "all" || nowCat === "egg") {
    const eggs = rows.filter(r => r.h.src === "egg");
    const kms = [...new Set(eggs.map(r => r.h.detail))].sort((a, b) => parseFloat(a) - parseFloat(b));
    for (const km of kms) {
      const c = EGG_COLORS[parseFloat(km)] || EGG_COLORS[5];
      push(eggIcon(c[0], c[1]), t("hEggKm", { km }), eggs.filter(r => r.h.detail === km).sort(byStart), false, "egg");
    }
  }
  if (nowCat === "all" || nowCat === "research") {
    const research = rows.filter(r => r.h.src === "research");
    // Dans l'ordre de Leek Duck (captures, lancers, combats…)
    const order = (duck.research || []).map(x => (x.text || "").replace(/<[^>]+>/g, "").trim());
    for (const task of [...new Set(research.map(r => r.h.detail))].sort((x, y) => order.indexOf(x) - order.indexOf(y))) push("", taskLabel(task), research.filter(r => r.h.detail === task).sort(byStart));
  }
  if (nowCat === "all") {
    push("", t("hSpotlight"), rows.filter(r => r.h.src === "spotlight").sort(byStart));
    push("", t("hCday"), rows.filter(r => r.h.src === "cday").sort(byStart));
  }
  return groups;
}

// Ce dont dépend la feuille : la refaire seulement quand ça change
let nowDrawn = "";
const nowSig = () => [nowPane, nowCat, shinyMode, duck && duck.time, calMarks().size, document.documentElement.lang, nowFresh.size].join("|");
function renderNow() {
  nowDrawn = nowSig();
  const { now, soon } = sheetRows();
  document.getElementById("nowTitle").textContent = t("nowTitle") + (shinyMode ? " ✦" : "");
  const tab = (attr, key, on, label) => `<button data-${attr}="${key}"${on ? ' class="on"' : ""}>${label}</button>`;
  document.getElementById("nowTabs").innerHTML =
    tab("p", "now", nowPane === "now", `${t("nowTab")} <span>${now.length}</span>`) +
    tab("p", "soon", nowPane === "soon", `${t("soonTab")} <span>${soon.length}</span>`);
  document.getElementById("nowCats").innerHTML =
    [["all", "catAll"], ["raid", "catRaids"], ["egg", "catEggs"], ["research", "catResearch"]]
      .map(([k, key]) => tab("c", k, nowCat === k, t(key))).join("");
  const body = document.getElementById("nowBody");
  // Source muette : le dire, avec « Réessayer » ; liste trop vieille : la date en tête
  const retry = `<button class="now-retry" type="button">${t("retry")}</button>`;
  if (!howMap) { body.innerHTML = `<p class="now-empty">${t(navigator.onLine ? "nowDown" : "nowOffline")}</p>${retry}`; return; }
  const old = duck && Date.now() - duck.time > 24 * 3600e3
    ? `<p class="now-stale">${t("nowStale", { d: new Date(duck.time).toLocaleDateString(document.documentElement.lang) })}</p>${retry}` : "";
  const groups = sheetGroups(nowPane === "now" ? now : soon);
  if (!groups.length) {
    // Leek Duck ne liste que les œufs et études du moment : pour Bientôt, on ne sait pas encore
    const unknown = nowPane === "soon" && (nowCat === "egg" || nowCat === "research");
    body.innerHTML = old + `<p class="now-empty">${t(unknown ? (nowCat === "egg" ? "soonEggsUnknown" : "soonResearchUnknown") : "nowNothing")}</p>`;
    return;
  }
  // Vignettes sans nom, six par rangée (calendrier-allege v1 : A1) ; le nom au survol
  body.innerHTML = old + groups.map(g =>
    `<div class="now-sub ${g.kind}">${g.icon}${g.title}</div><div class="now-grid ${g.kind}">` + g.list.map(({ e, h, missing }) => {
      const sp = spriteOf(e), fresh = missing && nowFresh.has((shinyMode ? "s:" : "") + e.key);
      return `<div class="now-cell${missing ? " missing" : ""}${fresh ? " fresh" : ""}" title="${e.name}" data-key="${e.key}" role="button" tabindex="0"><img crossorigin="anonymous" src="${shinyMode ? SPRITE_TINY_SHINY(sp) : SPRITE_TINY(sp)}" alt="${e.name}" ` +
        `data-sprite="${sp}" data-shiny="${shinyMode ? 1 : 0}" onerror="imgFallback(this)">` +
        (fresh ? `<i class="now-dot"></i>` : "") + (h.start ? `<b>${fmtDay(h.start)}</b>` : "") + `</div>`;
    }).join("") + `</div>`).join("");
}

// Fermer (✕, Échap ou retour) : la feuille descend avant de disparaître
function closeNow(then) {
  if (nowDialog.classList.contains("closing")) return;
  nowDialog.classList.add("closing");
  setTimeout(() => { nowDialog.close(); nowDialog.classList.remove("closing"); then && then(); }, 250);
}
nowDialog.querySelector(".now-x").addEventListener("click", ev => { ev.preventDefault(); closeNow(); });
nowDialog.addEventListener("cancel", ev => { ev.preventDefault(); closeNow(); });

document.getElementById("nowBtn").addEventListener("click", () => {
  setMenu(false);
  nowPane = "now";
  nowCat = "all";
  // La feuille est préparée d'avance (preloadNow) : on ne la refait que si elle a changé,
  // sinon l'iPhone perd le début de la montée à la reconstruire
  const seen = seenNow();
  nowFresh = new Set(missingNow().filter(k => !seen.has(k)));
  if (nowFresh.size || nowSig() !== nowDrawn) renderNow();
  nowDialog.showModal();
  // Ouverture (calendrier-effets v1 : A2) : la feuille monte, les vignettes arrivent pendant la montée
  [...document.querySelectorAll("#nowBody .now-cell")].slice(0, 48).forEach((c, i) => { c.style.animationDelay = 0.05 + Math.floor(i / 6) * 0.04 + (i % 6) * 0.015 + "s"; });
  restartAnim(nowDialog, "opening");
  setTimeout(() => nowDialog.classList.remove("opening"), 900);
  // Après la montée : points vus, puis liste relue si elle a vieilli
  setTimeout(() => { markNowSeen(); loadDuck().then(() => { if (nowDialog.open && nowSig() !== nowDrawn) renderNow(); }); }, 600);
});
// Toucher une vignette : fermer la feuille et aller au Pokémon dans le Pokédex
document.getElementById("nowBody").addEventListener("click", ev => {
  const again = ev.target.closest(".now-retry");
  if (again) { again.disabled = true; loadDuck(true).then(renderNow); return; }
  const cell = ev.target.closest(".now-cell");
  if (!cell) return;
  // calendrier-effets v1 : G2, la feuille descend puis la carte s'allume
  closeNow(() => goToEntry(cell.dataset.key));
});
document.getElementById("nowBody").addEventListener("keydown", ev => {
  if ((ev.key === "Enter" || ev.key === " ") && ev.target.closest(".now-cell")) { ev.preventDefault(); ev.target.click(); }
});
for (const id of ["nowTabs", "nowCats"]) document.getElementById(id).addEventListener("click", ev => {
  const b = ev.target.closest("button[data-p],button[data-c]");
  if (!b) return;
  if (b.dataset.p) nowPane = b.dataset.p;
  if (b.dataset.c) nowCat = b.dataset.c;
  renderNow();
  restartAnim(document.getElementById("nowBody"), "fade");
});

document.getElementById("nowDay").textContent = new Date().getDate();
loadDuck();

// --- Fiche d'un Pokémon (fiche-pokemon v1 : A3 toucher le nom, B1 feuille en bas) ---
const ficheDialog = document.getElementById("ficheDialog");
let ficheKey = null;
// Toutes les formes du Pokémon (fiche-formes v1 : F3 grille, B1 sans boutons) : touchée, elle passe en grand
let ficheSel = 0;
function ficheForms(e) {
  if (e.icon) return [{ k: e.key, label: e.costume, img: e.icon, got: formSets.costume.has(e.key) }]
    .concat(e.iconShiny ? [{ k: e.key, label: "Shiny", img: e.iconShiny, shiny: 1, got: formSets.costumeShiny.has(e.key) }] : []);
  const out = [];
  for (const b of entries.filter(x => x.id === e.id)) {
    const pre = b.formLabel ? b.formLabel + " " : "";
    out.push({ k: b.key, label: b.formLabel || t("fNormal"), sp: spriteOf(b), got: caught.has(b.key) });
    if (b.shinyOut) out.push({ k: b.key, label: pre + "Shiny", sp: spriteOf(b), shiny: 1, got: shinyCaught.has(b.key) });
  }
  for (const m of megaEntries.filter(x => x.id === e.id))
    out.push({ k: m.key, label: m.name.replace(nameOf(e.id, ""), "").replace(/-\s*/, " ").replace(/\s+/g, " ").trim() || t("mega"), sp: spriteOf(m), got: formSets.mega.has(m.key) });
  const base = entries.find(x => x.id === e.id && !x.regional) || e;
  if (base.shadowOut) {
    out.push({ k: base.key, label: t("cShadow").replace(/s$/, ""), sp: spriteOf(base), cls: "shadow", got: formSets.shadow.has(base.key) });
    out.push({ k: base.key, label: t("cPurified").replace(/s$/, ""), sp: spriteOf(base), cls: "purified", got: formSets.purified.has(base.key) });
  }
  return out;
}
// Forme montrée à l'ouverture : celle de la collection d'où l'on vient
function ficheStart(forms, key) {
  const want = coll === "shadow" ? "shadow" : coll === "purified" ? "purified" : null;
  const i = forms.findIndex(f => f.k === key && (want ? f.cls === want : !f.cls && !!f.shiny === !!((shinyMode && coll === "dex") || coll === "costumeShiny")));
  return i < 0 ? 0 : i;
}
const formImg = (f, small) => `<img crossorigin="anonymous" src="${f.img ? f.img : (f.shiny ? (small ? SPRITE_TINY_SHINY : SPRITE_SMALL_SHINY) : (small ? SPRITE_TINY : SPRITE_SMALL))(f.sp)}" alt="" data-sprite="${f.sp}" data-shiny="${f.shiny ? 1 : 0}" onerror="imgFallback(this)">`;

// Évolutions (pogoapi) : la famille, avec les bonbons ; chargées à la première fiche
let evoKids = null, evoParent = null, evoLoad = null;
function loadEvos() {
  return evoLoad || (evoLoad = fetch("https://pogoapi.net/api/v1/pokemon_evolutions.json").then(r => r.json()).then(list => {
    evoKids = new Map(); evoParent = new Map();
    for (const p of list) for (const ev of p.evolutions || []) {
      const kids = evoKids.get(p.pokemon_id) || [];
      if (!kids.some(k => k.id === ev.pokemon_id)) kids.push({ id: ev.pokemon_id, candy: ev.candy_required || 0 });
      evoKids.set(p.pokemon_id, kids);
      if (!evoParent.has(ev.pokemon_id)) evoParent.set(ev.pokemon_id, p.pokemon_id);
    }
  }).catch(() => { evoLoad = null; }));
}
// Bonbon façon GO aux deux couleurs de la famille, lues dans l'image du premier de la famille
const candyCol = new Map();
function candySvg(root) {
  const c = candyCol.get(root) || ["#b7b7b7", "#e6e6e6"];
  // Rond, une bande courbe de la 2e couleur et un reflet, comme le bonbon de Pokémon GO
  return `<svg class="candy" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="${c[0]}" stroke="rgba(0,0,0,.25)" stroke-width=".8"/><path d="M2.2 11.6C5 9.4 8.4 5.6 9.6 1.2c2 .5 3.5 1.6 4.4 3.1C12 8.4 8.6 12 4.4 14.4c-1-.7-1.7-1.6-2.2-2.8z" fill="${c[1]}"/><ellipse cx="5.2" cy="4.6" rx="1.9" ry="1.2" transform="rotate(-35 5.2 4.6)" fill="#fff" opacity=".75"/></svg>`;
}
function readCandy(root) {
  if (candyCol.has(root)) return Promise.resolve();
  return new Promise(ok => {
    const img = new Image(); img.crossOrigin = "anonymous"; img.src = SPRITE_TINY(root);
    img.onload = () => {
      try {
        const cv = document.createElement("canvas"); cv.width = cv.height = 40;
        const g = cv.getContext("2d"); g.drawImage(img, 0, 0, 40, 40);
        const d = g.getImageData(0, 0, 40, 40).data, n = new Map();
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], gg = d[i + 1], b = d[i + 2], a = d[i + 3];
          const hi = Math.max(r, gg, b), lo = Math.min(r, gg, b);
          if (a < 200 || hi < 50 || lo > 225) continue; // fond, contours, reflets
          const q = (r >> 5) << 6 | (gg >> 5) << 3 | (b >> 5);
          const v = n.get(q) || [0, 0, 0, 0]; v[0]++; v[1] += r; v[2] += gg; v[3] += b; n.set(q, v);
        }
        const top = [...n.values()].sort((x, y) => y[0] - x[0]);
        const avg = v => [v[1] / v[0], v[2] / v[0], v[3] / v[0]];
        const col = v => `rgb(${avg(v).map(x => x | 0).join(",")})`;
        if (top[0]) {
          const m = avg(top[0]);
          const far = top.find(v => avg(v).reduce((s, x, i) => s + Math.abs(x - m[i]), 0) > 90) || top[1] || top[0];
          candyCol.set(root, [col(top[0]), col(far)]);
        }
      } catch {}
      ok();
    };
    img.onerror = () => ok();
  });
}
// Famille : normale, ou pour un costumé, seulement les membres qui portent le même costume
// (Bulbizarre → Herbizarre → Florizarre Halloween 2019) ; rien si le costume n'évolue pas
function evoHtml(e) {
  if (!evoKids) return "";
  const cos = e.ccode;
  const member = n => cos ? costumeEntries.find(x => x.id === n && x.ccode === cos)
    : entries.find(x => x.id === n && !x.regional);
  let root = e.id;
  while (evoParent.has(root) && member(evoParent.get(root))) root = evoParent.get(root);
  let candyRoot = root; while (evoParent.has(candyRoot)) candyRoot = evoParent.get(candyRoot);
  const kidsOf = n => (evoKids.get(n) || []).filter(k => member(k.id));
  if (!kidsOf(root).length) return "";
  const owned = m => cos ? formSets.costume.has(m.key) : caught.has(m.key);
  const node = n => {
    const m = member(n);
    if (!m) return "";
    const kids = kidsOf(n);
    const img = m.icon ? `<img crossorigin="anonymous" src="${m.icon}" alt="">`
      : `<img crossorigin="anonymous" src="${SPRITE_TINY(spriteOf(m))}" alt="" data-sprite="${spriteOf(m)}" data-shiny="0" onerror="imgFallback(this)">`;
    return `<div class="evo-step${kids.length > 3 ? " many" : ""}"><button class="evo-mon${n === e.id ? " on" : ""}${owned(m) ? "" : " miss"}" data-evo="${m.key}">` +
      `${img}${m.name}</button>` +
      (kids.length ? `<div class="evo-next">` + kids.map(k => `<div class="evo-branch"><b>${k.candy}${candySvg(candyRoot)}→</b>${node(k.id)}</div>`).join("") + `</div>` : "") + `</div>`;
  };
  return `<h3>${t("fEvo")}</h3><div class="fiche-evo">${node(root)}</div>`;
}

function renderFiche() {
  const e = byKey.get(ficheKey);
  if (!e) return;
  const how = (howMap && howMap.get(e.key)) || [];
  const forms = ficheForms(e);
  const f = forms[ficheSel] || forms[0] || { label: "", sp: spriteOf(e) };
  const wiki = LANG === "fr" ? "https://www.pokepedia.fr/" + encodeURIComponent(nameOf(e.id, "", "fr"))
    : "https://bulbapedia.bulbagarden.net/wiki/" + encodeURIComponent(nameOf(e.id, "", "en") + "_(Pokémon)");
  ficheDialog.innerHTML =
    `<form method="dialog"><button class="now-x fiche-x" aria-label="${t("close")}">✕</button></form>` +
    `<div class="fiche-hero"><div class="fiche-big ${f.cls || ""}">${formImg(f)}</div>` +
    `<div><div class="dex">${String(e.id).padStart(4, "0")}</div><h2>${nameOf(e.id, e.name)}</h2>` +
    `<div class="fiche-form">${f.label === t("fNormal") ? "" : f.label === "Shiny" && e.costume ? e.costume + " shiny" : f.label}</div><div class="fiche-types">` +
    e.types.map(ty => `<span style="color:${TYPE_COLOR[ty] || "#aaa"}">${typeName(ty)}</span>`).join(" ") + `</div></div></div>` +
    (forms.length > 1 ? `<h3>${t("fForms")}</h3><div class="fiche-forms">` + forms.map((x, i) =>
      `<button data-f="${i}" class="${i === ficheSel ? "on" : ""}${x.got ? "" : " miss"}${x.shiny ? " gold" : ""}${x.cls ? " " + x.cls : ""}">${formImg(x, true)}<span>${x.label}</span>${x.got ? `<i class="ok">✓</i>` : ""}</button>`).join("") + `</div>` : "") +
    evoHtml(e) +
    (how.length || zoneOf(e) ? `<h3>${t("fHow")}</h3><div class="fiche-how">` +
      (zoneOf(e) ? `<div>${t("onlyIn", { z: zoneOf(e) })}</div>` : "") +
      how.map(h => `<div>${howLabel({ ...h, start: null })}<b>${h.start ? t("fromDay", { d: fmtDay(h.start) }) : ""}</b></div>`).join("") + `</div>` : "") +
    `<a class="now-more" href="${wiki}" target="_blank" rel="noopener">${LANG === "fr" ? "Poképédia" : "Bulbapedia"} ↗</a>`;
}
window.openFiche = key => {
  ficheKey = key;
  const e = byKey.get(key);
  ficheSel = e ? ficheStart(ficheForms(e), key) : 0;
  renderFiche();
  if (!ficheDialog.open) ficheDialog.showModal();
  // Évolutions et couleur du bonbon arrivent après : la fiche se complète
  loadEvos().then(() => {
    if (!evoParent || !e) return;
    let root = e.id; while (evoParent.has(root)) root = evoParent.get(root);
    return readCandy(root);
  }).then(() => { if (ficheDialog.open && ficheKey === key) renderFiche(); });
};
ficheDialog.addEventListener("click", ev => {
  if (ev.target === ficheDialog) { ficheDialog.close(); return; } // toucher le fond ferme
  const f = ev.target.closest("[data-f]");
  if (f) { ficheSel = +f.dataset.f; renderFiche(); return; }
  const m = ev.target.closest("[data-evo]");
  if (m && m.dataset.evo !== ficheKey) openFiche(m.dataset.evo);
});

// --- Pokémon régionaux : la zone du monde où on les trouve (d'après Leek Duck, regional-pokemon) ---
// [fr, en] ; les autres langues prennent l'anglais
const Z = {
  asia: ["Asie", "Asia"], aus: ["Australie", "Australia"], eu: ["Europe", "Europe"], na: ["Amérique du Nord", "North America"],
  latam: ["Amérique latine", "Latin America"], tropics: ["Tropiques", "Tropics"], americas: ["Amériques", "Americas"],
  east: ["Europe, Afrique, Asie", "Europe, Africa, Asia"], africa: ["Afrique et Méditerranée", "Africa and Mediterranean"],
  nz: ["Nouvelle-Zélande", "New Zealand"], south: ["Hémisphère sud", "Southern Hemisphere"], usse: ["Sud-est des États-Unis", "Southeastern US"],
  north: ["Alaska, Canada, Russie", "Alaska, Canada, Russia"], apac: ["Asie-Pacifique", "Asia-Pacific"],
  emea: ["Europe, Moyen-Orient, Afrique, Inde", "Europe, Middle East, Africa, India"], egypt: ["Égypte et Grèce", "Egypt and Greece"],
  nyc: ["New York", "New York"], fr: ["France", "France"], mx: ["Mexique", "Mexico"], hi: ["Hawaï", "Hawaii"], uk: ["Royaume-Uni", "United Kingdom"],
  ssasia: ["Asie du Sud et du Sud-Est", "South and Southeast Asia"], split: ["Une moitié du monde", "Half of the world"],
};
const REGIONAL_ZONE = {
  83: "asia", 115: "aus", 122: "eu", 128: "na", 214: "latam", 222: "tropics", 313: "split", 314: "split", 324: "ssasia",
  335: "split", 336: "split", 337: "americas", 338: "east", 357: "africa", 369: "nz", 417: "north", 441: "south", 455: "usse",
  480: "apac", 481: "emea", 482: "americas", 511: "apac", 513: "emea", 515: "americas", 538: "split", 539: "split",
  556: "americas", 561: "egypt", 626: "nyc", 631: "split", 632: "split", 701: "mx", 707: "fr", 764: "hi",
  765: "split", 766: "split", 874: "uk",
};
// Zone d'un Pokémon régional (forme de base seulement : les formes d'Alola, Galar… sont partout)
window.zoneOf = e => {
  const z = !e.regional && Z[REGIONAL_ZONE[e.id]];
  return z ? (LANG === "fr" ? z[0] : z[1]) : null;
};
