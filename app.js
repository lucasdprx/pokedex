const TYPES_URL = "https://pogoapi.net/api/v1/pokemon_types.json";
const RELEASED_URL = "https://pogoapi.net/api/v1/released_pokemon.json";
const SHINY_URL = "https://pogoapi.net/api/v1/shiny_pokemon.json";
// PvPoke : liste tenue à jour très fréquemment (flag "released")
const PVP_URL = "pvp.json"; // gamemaster PvPoke réduit chaque jour (tools/pvp.py)

// Noms par langue (names.json, source PokeAPI, gardé hors ligne par sw.js).
let NAMES = null;
async function loadNames() {
  if (NAMES) return;
  try { NAMES = await (await fetch("names.json")).json(); } catch { /* repli : nom anglais */ }
}
// Le portugais du Brésil garde les noms anglais, comme dans le jeu
function nameOf(id, fallback, lang = LANG) {
  const l = lang === "pt" ? "en" : lang;
  return (NAMES && NAMES[l] && NAMES[l][id - 1]) || fallback || String(id);
}
// Noms français par n° de Pokédex national (source PokeAPI).

// Sprites des formes régionales : "{dex}_{FORME}" → id de sprite PokeAPI dédié.
const REGIONAL_SPRITES = {"19_ALOLA":10091,"20_ALOLA":10092,"26_ALOLA":10100,"27_ALOLA":10101,"28_ALOLA":10102,"37_ALOLA":10103,"38_ALOLA":10104,"50_ALOLA":10105,"51_ALOLA":10106,"52_ALOLA":10107,"53_ALOLA":10108,"74_ALOLA":10109,"75_ALOLA":10110,"76_ALOLA":10111,"88_ALOLA":10112,"89_ALOLA":10113,"103_ALOLA":10114,"105_ALOLA":10115,"52_GALARIAN":10161,"77_GALARIAN":10162,"78_GALARIAN":10163,"79_GALARIAN":10164,"80_GALARIAN":10165,"83_GALARIAN":10166,"110_GALARIAN":10167,"122_GALARIAN":10168,"144_GALARIAN":10169,"145_GALARIAN":10170,"146_GALARIAN":10171,"199_GALARIAN":10172,"222_GALARIAN":10173,"263_GALARIAN":10174,"264_GALARIAN":10175,"554_GALARIAN":10176,"555_GALARIAN_STANDARD":10177,"555_GALARIAN_ZEN":10178,"562_GALARIAN":10179,"618_GALARIAN":10180,"58_HISUIAN":10229,"59_HISUIAN":10230,"100_HISUIAN":10231,"101_HISUIAN":10232,"157_HISUIAN":10233,"211_HISUIAN":10234,"215_HISUIAN":10235,"503_HISUIAN":10236,"549_HISUIAN":10237,"570_HISUIAN":10238,"571_HISUIAN":10239,"628_HISUIAN":10240,"705_HISUIAN":10241,"706_HISUIAN":10242,"713_HISUIAN":10243,"724_HISUIAN":10244,"128_PALDEA_COMBAT":10250,"128_PALDEA_BLAZE":10251,"128_PALDEA_AQUA":10252,"194_PALDEA":10253};

// Forme de base par défaut pour les espèces sans forme "Normal" (source GAME_MASTER).
// Ex : Shaymin → Land, Giratina → Altered, Motmirage → Red, etc.
const DEFAULT_FORM = {"201":"A","327":"00","412":"PLANT","413":"PLANT","421":"OVERCAST","422":"WEST_SEA","423":"WEST_SEA","487":"ALTERED","492":"LAND","550":"RED_STRIPED","555":"STANDARD","585":"SPRING","586":"SPRING","641":"INCARNATE","642":"INCARNATE","645":"INCARNATE","647":"ORDINARY","648":"ARIA","664":"ARCHIPELAGO","665":"ARCHIPELAGO","666":"ARCHIPELAGO","669":"RED","670":"RED","671":"RED","676":"NATURAL","681":"SHIELD","710":"SMALL","711":"SMALL","718":"TEN_PERCENT","720":"CONFINED","741":"BAILE","745":"MIDDAY","746":"SOLO","774":"BLUE","778":"DISGUISED","849":"LOW_KEY","854":"PHONY","855":"PHONY","875":"ICE","876":"MALE","877":"FULL_BELLY","888":"HERO","889":"HERO","892":"SINGLE_STRIKE","905":"INCARNATE","925":"FAMILY_OF_FOUR","931":"GREEN","964":"ZERO","978":"CURLY","982":"TWO","1007":"APEX","1008":"ULTIMATE","1012":"COUNTERFEIT","1013":"UNREMARKABLE"};

// Régions (onglets Pokédex, comme dans Pokémon GO), par n° de Pokédex national
const REGIONS = [
  { name: "Kanto",  max: 151 },
  { name: "Johto",  max: 251 },
  { name: "Hoenn",  max: 386 },
  { name: "Sinnoh", max: 493 },
  { name: "Unys",   max: 649 },
  { name: "Kalos",  max: 721 },
  { name: "Alola",  max: 809 },
  { name: "Galar",  max: 898 },
  { name: "Hisui",  max: 905 },
  { name: "Paldea", max: 1025 },
];
const REGION_ORDER = REGIONS.map(r => r.name).concat("Inconnu");
function regionOf(id) {
  for (const r of REGIONS) if (id <= r.max) return r.name;
  return "Inconnu";
}
const ARTWORK_PATH = id => `raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
// Illustration réduite à 208 px en WebP par wsrv.nl (~13 Ko au lieu de ~145 Ko, gardée 1 an par le navigateur)
const SPRITE_SMALL = id => `https://wsrv.nl/?url=${ARTWORK_PATH(id)}&w=208&h=208&output=webp`;
const SPRITE = id => `https://${ARTWORK_PATH(id)}`;
const SPRITE_2D = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
// Versions chromatiques (shiny)
const ARTWORK_SHINY = id => `raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`;
const SPRITE_TINY = id => `https://wsrv.nl/?url=${ARTWORK_PATH(id)}&w=80&h=80&output=webp`;
const SPRITE_TINY_SHINY = id => `https://wsrv.nl/?url=${ARTWORK_SHINY(id)}&w=80&h=80&output=webp`;
const SPRITE_SMALL_SHINY = id => `https://wsrv.nl/?url=${ARTWORK_SHINY(id)}&w=208&h=208&output=webp`;
const SPRITE_SHINY = id => `https://${ARTWORK_SHINY(id)}`;
const SPRITE_2D_SHINY = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;

const STORE_KEY = "pokedex-go-caught";
const SHINY_KEY = "pokedex-go-shiny";
// Listes de Pokémon gardées dans le navigateur : affichage immédiat, et hors ligne
const CACHE_KEY = "pokedex-go-data";
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // au-delà, mise à jour en fond


// Couleurs des types, assombries pour rester lisibles en texte sur fond clair
const TYPE_COLOR = {
  Normal:"#7a7955", Fire:"#d0601a", Water:"#2f6fd6", Electric:"#b08a00",
  Grass:"#3f8f1c", Ice:"#2a9c97", Fighting:"#b8322c", Poison:"#93358f",
  Ground:"#a07a1d", Flying:"#6d55c9", Psychic:"#d83a6c", Bug:"#7a8c12",
  Rock:"#8f7a25", Ghost:"#61478f", Dragon:"#5a3fd0", Dark:"#5b4636",
  Steel:"#6b6b8a", Fairy:"#c4528c"
};
// Formes régionales en français, ajoutées au nom (« Rattata d'Alola »)
const FORM_FR = {
  ALOLA: "d'Alola", GALARIAN: "de Galar", GALARIAN_STANDARD: "de Galar",
  GALARIAN_ZEN: "de Galar (Mode Transe)", HISUIAN: "de Hisui", PALDEA: "de Paldea",
  PALDEA_COMBAT: "de Paldea (Combative)", PALDEA_BLAZE: "de Paldea (Flamboyante)",
  PALDEA_AQUA: "de Paldea (Aquatique)",
};
const TYPE_FR = {
  Normal:"Normal", Fire:"Feu", Water:"Eau", Electric:"Électrik", Grass:"Plante",
  Ice:"Glace", Fighting:"Combat", Poison:"Poison", Ground:"Sol", Flying:"Vol",
  Psychic:"Psy", Bug:"Insecte", Rock:"Roche", Ghost:"Spectre", Dragon:"Dragon",
  Dark:"Ténèbres", Steel:"Acier", Fairy:"Fée"
};

const els = {
  grid: document.getElementById("grid"),
  status: document.getElementById("status"),
  search: document.getElementById("search"),
  filter: document.getElementById("filter"),
  count: document.getElementById("count"),
  progress: document.getElementById("progress"),
  gens: document.getElementById("gens"),
};

let regionFilter = ""; // "" = toutes les régions

let entries = [];               // [{key, id, name, form, formLabel, types}]
let byKey = new Map();          // key → entrée, pour retrouver la carte cliquée
let caught = loadCaught();      // Set of keys (id + form)
let shinyCaught = loadCaught(SHINY_KEY); // shiny cochés, mêmes clés
let shinyMode = false;          // bascule Normal / Shiny
// Collections Méga / Obscurs / Purifiés (formes v1 : A1, choix à gauche du filtre) : mêmes clés que le Pokédex
const FORM_KEYS = { mega: "pokedex-go-mega", shadow: "pokedex-go-shadow", purified: "pokedex-go-purified" };
let formSets = Object.fromEntries(Object.entries(FORM_KEYS).map(([k, key]) => [k, loadCaught(key)]));
let coll = "dex";               // collection affichée
let megaEntries = [];           // cartes de la collection Méga
const pool = () => coll === "mega" ? megaEntries : entries;
// Illustration de chaque Méga (n° PokeAPI)
const MEGA_SPRITES = { 3: 10033, "6 X": 10034, "6 Y": 10035, 9: 10036, 15: 10090, 18: 10073, 65: 10037, 80: 10071, 94: 10038,
  115: 10039, 127: 10040, 130: 10041, 142: 10042, 181: 10045, 208: 10072, 212: 10046, 214: 10047, 229: 10048, 248: 10049,
  254: 10065, 257: 10050, 260: 10064, 282: 10051, 302: 10066, 303: 10052, 306: 10053, 308: 10054, 310: 10055, 319: 10070,
  323: 10087, 334: 10067, 354: 10056, 359: 10057, 362: 10074, 373: 10089, 376: 10076, 380: 10062, 381: 10063, 382: 10077,
  383: 10078, 384: 10079, 428: 10088, 445: 10058, 448: 10059, 460: 10060, 475: 10068, 531: 10069, 719: 10075 };
// Coches Méga d'avant (une par espèce, « 3_Normal ») → clés des cartes Méga
for (const k of [...formSets.mega]) if (/_Normal$/.test(k)) {
  formSets.mega.delete(k);
  formSets.mega.add(k.replace(/_Normal$/, k === "6_Normal" ? "_MEGA_X" : "_MEGA"));
}

function loadCaught(key = STORE_KEY) {
  try { return new Set(JSON.parse(localStorage.getItem(key)) || []); }
  catch { return new Set(); }
}
function saveLocal() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...caught]));
  localStorage.setItem(SHINY_KEY, JSON.stringify([...shinyCaught]));
  for (const [k, key] of Object.entries(FORM_KEYS)) localStorage.setItem(key, JSON.stringify([...formSets[k]]));
}
// Coche changée ici : gardée sur l'appareil, puis envoyée au compte (sync.js) s'il y en a un
const SYNC_KEY = "pokedex-go-sync";
function saveCaught() {
  saveLocal();
  localStorage.setItem(SYNC_KEY, "dirty");
  if (window.syncPush) syncPush();
}
// Pour sync.js : lire et remplacer les coches
window.marksApi = {
  get: () => ({ caught: [...caught], shiny: [...shinyCaught], ...Object.fromEntries(Object.entries(formSets).map(([k, v]) => [k, [...v]])) }),
  sets: () => ({ caught, shiny: shinyCaught, ...formSets }),
  set(c, s, forms = null) {
    caught = new Set(c);
    shinyCaught = new Set(s);
    if (forms) for (const k in FORM_KEYS) formSets[k] = new Set(forms[k] || []);
    saveLocal();
    if (entries.length) render();
  },
};
// Collection affichée : normale ou shiny
const marks = () => coll !== "dex" ? formSets[coll] : shinyMode ? shinyCaught : caught;
// Cochable dans la collection affichée : sorti dans GO (et son shiny aussi, en mode Shiny)
const can = e => coll !== "dex" ? e.available && !e.regional && (coll === "mega" ? e.megaOut : e.shadowOut)
  : e.available && (!shinyMode || e.shinyOut);
function prettyForm(f) {
  return (f || "").replace(/_/g, " ").trim();
}
// Minuscule + sans accents, pour une recherche tolérante
function normalize(s) {
  return (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function readCache() {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY));
    const ok = c && typeof c.time === "number" && Array.isArray(c.released) && Array.isArray(c.shiny) &&
               Array.isArray(c.data) && c.data.length > 0 &&
               c.data.every(e => e && typeof e.pokemon_id === "number" && Array.isArray(e.type));
    return ok ? c : null;
  } catch { return null; }
}
function writeCache(src) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), ...src })); }
  catch { /* mémoire pleine : on s'en passe */ }
}

let lastSrc = null; // données brutes, pour reconstruire les cartes au changement de langue
async function init() {
  await loadNames();
  const cached = readCache();
  if (cached) {
    try { buildEntries(cached); }
    catch { localStorage.removeItem(CACHE_KEY); return init(); } // copie abîmée : on retélécharge
    els.status.style.display = "none";
    render();
    if (Date.now() - cached.time < CACHE_MAX_AGE && cached.mega && typeof cached.mega[0] === "object") return; // sans liste Méga : copie d'avant, on relit
    // Données de plus d'un jour : mise à jour en fond, sans bloquer l'affichage
    try {
      const fresh = await fetchSources();
      writeCache(fresh);
      const changed = JSON.stringify(fresh.data) !== JSON.stringify(cached.data) ||
                      JSON.stringify(fresh.released) !== JSON.stringify(cached.released) ||
                      JSON.stringify(fresh.shiny) !== JSON.stringify(cached.shiny) ||
                      JSON.stringify(fresh.mega) !== JSON.stringify(cached.mega) ||
                      JSON.stringify(fresh.shadow) !== JSON.stringify(cached.shadow);
      if (changed) { buildEntries(fresh); render(); }
    } catch { /* hors ligne : on garde la copie */ }
    return;
  }

  els.status.style.display = "";
  els.status.innerHTML = `<div class="spinner"></div>${t("loading")}`;
  try {
    const fresh = await fetchSources();
    writeCache(fresh);
    buildEntries(fresh);
    els.status.style.display = "none";
    render();
  } catch (err) {
    els.status.innerHTML =
      `${t("loadFail")}<br><small>${err.message}</small>` +
      `<div class="retry"><button onclick="init()">${t("retry")}</button></div>`;
  }
}

// Télécharge les listes (pogoapi + PvPoke) → { data, released } bruts, avant tri en cartes
async function fetchSources() {
  const [resTypes, resRel, resPvp, resShiny] = await Promise.all([
    fetch(TYPES_URL), fetch(RELEASED_URL), fetch(PVP_URL).catch(() => null),
    fetch(SHINY_URL).catch(() => null),
  ]);
  // Méga et Obscurs sortis (n° de Pokédex) ; vides si pogoapi ne répond pas
  const ids = (url, pick) => fetch(url).then(r => r.ok ? r.json() : null)
    .then(d => d ? [...new Set(pick(d))].sort((a, b) => a - b) : []).catch(() => []);
  const [mega, shadow] = await Promise.all([
    fetch("https://pogoapi.net/api/v1/mega_pokemon.json").then(r => r.ok ? r.json() : [])
      .then(d => d.map(m => ({ id: m.pokemon_id, form: m.form, primal: /^Primal/.test(m.mega_name) }))
        .sort((a, b) => a.id - b.id || a.form.localeCompare(b.form))).catch(() => []),
    ids("https://pogoapi.net/api/v1/shadow_pokemon.json", d => Object.keys(d).map(Number)),
  ]);
  if (!resTypes.ok) throw new Error("HTTP " + resTypes.status);
  if (!resRel.ok) throw new Error("HTTP " + resRel.status);
  const data = await resTypes.json();
  // Disponibles dans GO (n° de Pokédex) = union pogoapi + PvPoke (plus à jour)
  const released = new Set(Object.keys(await resRel.json()).map(Number));
  if (resPvp && resPvp.ok) {
    try {
      const pvp = await resPvp.json();
      (pvp.pokemon || []).forEach(p => { if (p.released) released.add(p.dex); });
      // Comble les espèces manquantes de pogoapi (ex : 902 Paragruel) via PvPoke
      const typesDex = new Set(data.map(e => e.pokemon_id));
      const seen = new Set();
      (pvp.pokemon || []).forEach(p => {
        if (p.dex > 0 && p.dex <= 1025 && !typesDex.has(p.dex) && !seen.has(p.dex)) {
          seen.add(p.dex);
          data.push({
            pokemon_id: p.dex,
            pokemon_name: (p.speciesName || "").replace(/\s*\(.*\)$/, ""),
            form: "Normal",
            type: (p.types || []).filter(t => t && t !== "none")
                   .map(t => t.charAt(0).toUpperCase() + t.slice(1)),
          });
        }
      });
    } catch { /* PvPoke indispo : on garde pogoapi seul */ }
  }
  // Shiny sortis dans GO (n° de Pokédex) ; liste vide si pogoapi ne répond pas
  let shiny = [];
  if (resShiny && resShiny.ok) {
    try { shiny = Object.keys(await resShiny.json()).map(Number).sort((a, b) => a - b); } catch {}
  }
  return { data, released: [...released].sort((a, b) => a - b), shiny, mega, shadow };
}

// Données brutes → cartes (une par forme de base ou régionale)
function buildEntries(src) {
  lastSrc = src;
  const { data, released: releasedList, shiny: shinyList = [] } = src;
  const released = new Set(releasedList);
  const shinyOut = new Set(shinyList);
  const megaList = (src.mega || []).filter(m => typeof m === "object"); // ancienne copie : simples n°
  const megaOut = new Set(megaList.map(m => m.id)), shadowOut = new Set(src.shadow || []);
  // Espèces dont la forme de base est présente dans les données.
  // Certaines espèces (Palarticho, M. Glaquette…) n'existent QUE sous un nom "régional"
  // (Galarian) sans forme de base : c'est alors leur forme normale, à compter.
  const hasBaseForm = new Set();
  data.forEach(e => {
    if ((e.form || "Normal").toUpperCase() === (DEFAULT_FORM[e.pokemon_id] || "NORMAL"))
      hasBaseForm.add(e.pokemon_id);
  });
  const isRegionalForm = e => {
    const f = (e.form || "Normal").toUpperCase();
    return /^(ALOLA|GALAR|HISUI|PALDEA)/.test(f) && hasBaseForm.has(e.pokemon_id);
  };
  // data = [{form, pokemon_id, pokemon_name, type:[...]}, ...] → une carte par forme
  entries = data.filter(e => {
    const f = (e.form || "Normal").toUpperCase();
    const base = DEFAULT_FORM[e.pokemon_id] || "NORMAL"; // forme de base de l'espèce
    return f === base || isRegionalForm(e) ||
           (!hasBaseForm.has(e.pokemon_id) && /^(ALOLA|GALAR|HISUI|PALDEA)/.test(f));
  }).map(e => {
    const form = e.form || "Normal";
    const isBase = !isRegionalForm(e); // base = forme normale OU seule forme (régionale sans base)
    const formLabel = isBase ? "" : (FORM_FR[form.toUpperCase()] || prettyForm(form));
    const tpl = isBase ? "{n}" : ((FORM_NAMES[LANG] || FORM_NAMES.en)[form.toUpperCase()] || "{n} (" + prettyForm(form) + ")");
    const name = tpl.replace("{n}", nameOf(e.pokemon_id, e.pokemon_name));
    const region = regionOf(e.pokemon_id);
    const types = e.type || [];
    // Texte de recherche : noms dans toutes les langues + forme + région + types + n° (avec/sans zéros)
    const search = normalize([
      name, ...LANGS.map(([l]) => nameOf(e.pokemon_id, e.pokemon_name, l)),
      isBase ? "" : prettyForm(form), region, regionName(region),
      ...types.map(ty => typeName(ty) + " " + (TYPE_FR[ty] || ty)),
      e.pokemon_id, String(e.pokemon_id).padStart(4, "0"),
      released.has(e.pokemon_id) ? "" : "indisponible",
    ].join(" "));
    return {
      key: e.pokemon_id + "_" + form,
      id: e.pokemon_id,
      name, region, form, formLabel, types, search,
      regional: !isBase,           // formes régionales : non comptées dans le Pokédex
      available: released.has(e.pokemon_id), // disponible dans Pokémon GO ?
      shinyOut: shinyOut.has(e.pokemon_id),   // son shiny est sorti ?
      megaOut: megaOut.has(e.pokemon_id),     // a une Méga dans GO ?
      shadowOut: shadowOut.has(e.pokemon_id), // existe en Obscur (et donc Purifié) ?
    };
  }).sort((a, b) => a.id - b.id || a.regional - b.regional || a.form.localeCompare(b.form));
  // Collection Méga : une carte par Méga (Dracaufeu X et Y à part), avec son image
  megaEntries = megaList.map(m => {
    const base = entries.find(e => e.id === m.id && !e.regional);
    if (!base) return null;
    const x = m.form === "Normal" ? "" : " " + m.form;
    return { ...base, key: m.id + "_MEGA" + (x ? "_" + m.form : ""), form: "MEGA" + (x ? "_" + m.form : ""),
      name: t(m.primal ? "primalName" : "megaName", { n: base.name }) + x, sprite: MEGA_SPRITES[m.id + x] || base.id, regional: false };
  }).filter(Boolean);
  byKey = new Map(entries.concat(megaEntries).map(e => [e.key, e]));
  if (typeof buildHow === "function") buildHow();
}

// Entrées correspondant aux filtres actifs (région, recherche, capturé/manquant)
function filtered() {
  // Recherche multi-mots : chaque mot doit correspondre (nom, forme, région, type, n°)
  const terms = normalize(els.search.value).split(/\s+/).filter(Boolean);
  const mode = els.filter.value;
  return pool().filter(e => {
    if (mode === "caught" && !marks().has(e.key)) return false;
    if (mode === "missing" && (marks().has(e.key) || !can(e))) return false;
    if (mode === "unavailable" && can(e)) return false;
    // Manquant et disponible maintenant (raid, œuf, étude, sauvage… sans date de début) : events.js
    if (mode === "now" && !(window.howToGet && (howFor(e) || []).some(h => !h.start))) return false;
    if (regionFilter && e.region !== regionFilter) return false;
    if (coll !== "dex" && !can(e)) return false; // Méga / Obscurs / Purifiés : seulement ceux qui existent
    // Comparaison avec un ami : ce qu'il a et pas toi, ou l'inverse (formes de base)
    if (friend && (e.regional || !e.available || (friend.tab === 0 ? !friend.set.has(e.key) || caught.has(e.key) : !caught.has(e.key) || friend.set.has(e.key)))) return false;
    if (terms.length && !terms.every(t => e.search.includes(t))) return false;
    return true;
  });
}

const spriteOf = e => e.sprite || REGIONAL_SPRITES[e.id + "_" + e.form.toUpperCase()] || e.id;

function typesHtml(e) {
  if (!e.available) return `<span class="na">${t("unavailable")}</span>`;
  if (shinyMode && !e.shinyOut) return `<span class="na">${t("notOut")}</span>`;
  // Manquant : comment l'avoir (events.js), une fois la liste Leek Duck reçue
  const how = window.howToGet && howToGet(e);
  if (how) return how;
  // Pas encore attrapé : pas de types (ligne gardée vide pour la hauteur de la carte)
  if (!marks().has(e.key)) {
    const zone = coll === "dex" && window.zoneOf && zoneOf(e); // régional : où le trouver (regionaux v1 : A2)
    return zone ? `<span class="zone">${zone}</span>` : "&nbsp;";
  }
  return e.types.map(ty =>
    `<span style="color:${TYPE_COLOR[ty] || "#aaa"}">${typeName(ty)}</span>`
  ).join("");
}

// Image introuvable : wsrv.nl → illustration d'origine → petit sprite → rien
function imgFallback(img) {
  const id = img.dataset.sprite;
  const sh = img.dataset.shiny === "1";
  const step = Number(img.dataset.step || 0);
  img.dataset.step = step + 1;
  if (step === 0) img.src = sh ? SPRITE_SHINY(id) : SPRITE(id);
  else if (step === 1) img.src = sh ? SPRITE_2D_SHINY(id) : SPRITE_2D(id);
  else if (step === 2 && sh) img.src = SPRITE_SMALL(id); // pas d'image shiny : l'image normale
  else img.style.visibility = "hidden";
}

function render() {
  const list = filtered();
  const frag = document.createDocumentFragment();

  for (const e of list) {
    const spriteId = spriteOf(e);
    const card = document.createElement("div");
    card.className = "card" + (marks().has(e.key) ? " caught" : "") + (can(e) ? "" : " locked");
    card.dataset.key = e.key;
    card.tabIndex = 0;
    card.innerHTML =
      `<i class="ball-mark"></i>` +
      `<img loading="lazy" decoding="async" crossorigin="anonymous" src="${shinyMode ? SPRITE_SMALL_SHINY(spriteId) : SPRITE_SMALL(spriteId)}" alt="" draggable="false" ` +
        `data-sprite="${spriteId}" data-shiny="${shinyMode ? 1 : 0}" onerror="imgFallback(this)">` +
      `<div class="dex">${String(e.id).padStart(4, "0")}</div>` +
      `<div class="name">${e.name}</div>` +
      `<div class="types">${typesHtml(e)}</div>`;
    frag.appendChild(card);
  }
  els.grid.replaceChildren(frag);
  if (!list.length) els.grid.innerHTML = `<div class="status" style="grid-column:1/-1">${t("noResult")}</div>`;
  updateStats();
}

function toggle(key, card) {
  const set = marks();
  if (set.has(key)) set.delete(key);
  else set.add(key);
  saveCaught();
  // La fiche reste en place, même si elle ne correspond plus au filtre :
  // la liste ne se refait qu'au changement de filtre, de région ou de recherche
  card.classList.toggle("caught");
  card.querySelector(".types").innerHTML = typesHtml(byKey.get(key));
  const e = byKey.get(key), now = set.has(key);
  const done = r => pool().every(x => x.regional || !can(x) || x.region !== r || marks().has(x.key));
  const finished = now && done(e.region);
  card.classList.remove("pop", "shake");
  restartAnim(card, now ? "pop" : "shake");
  if (now && navigator.vibrate) navigator.vibrate(15);
  updateStats();
  if (finished) restartAnim(els.progress.parentNode, "shine");
  if (!now) undoToast(e, card);
}

function restartAnim(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

// Décocher : « Annuler » 4 s en bas
let undoTimer = null;
function undoToast(e, card) {
  const el = document.getElementById("toast");
  el.innerHTML = `${t("removed", { n: e.name })}<button class="undo">${t("undo")}</button>`;
  el.hidden = false;
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => { el.hidden = true; }, 4000);
  el.querySelector(".undo").onclick = () => {
    el.hidden = true;
    clearTimeout(undoTimer);
    if (!marks().has(e.key)) toggle(e.key, card);
  };
}

// --- Clics sur la grille : marquer capturé ---
els.grid.addEventListener("click", ev => {
  const card = ev.target.closest(".card");
  if (!card || bulkClick) return;
  // Le nom ouvre la fiche (events.js), le reste de la carte coche
  if (ev.target.closest(".name") && window.openFiche) { openFiche(card.dataset.key); return; }
  const e = byKey.get(card.dataset.key);
  if (can(e)) toggle(e.key, card);
});

els.grid.addEventListener("keydown", ev => {
  const card = ev.target;
  if (!card.classList || !card.classList.contains("card")) return;
  if (ev.key !== "Enter" && ev.key !== " ") return;
  ev.preventDefault();
  const e = byKey.get(card.dataset.key);
  if (can(e)) toggle(e.key, card);
});

// Pas de menu « enregistrer l'image » pendant l'appui long
els.grid.addEventListener("contextmenu", ev => {
  if (ev.target.closest(".card")) ev.preventDefault();
});

function updateStats() {
  // On ne compte que les formes de base disponibles (régionales et indisponibles exclues)
  const base = pool().filter(e => !e.regional && can(e));
  const total = base.length;
  const got = base.filter(e => marks().has(e.key)).length;
  const pct = total ? Math.round((got / total) * 100) : 0;
  els.count.textContent = `${got} / ${total}`;
  els.progress.style.width = pct + "%";
  renderGens();
  if (window.updateNowDot) { clearTimeout(nowDotTimer); nowDotTimer = setTimeout(updateNowDot, 300); }
}
var nowDotTimer = null; // var : utilisable avant cette ligne

function renderGens() {
  const tot = {}, cau = {};
  let totAll = 0, cauAll = 0;
  for (const e of pool()) {
    if (e.regional || !can(e)) continue;   // régionales et indisponibles non comptées
    tot[e.region] = (tot[e.region] || 0) + 1;
    totAll++;
    if (marks().has(e.key)) { cau[e.region] = (cau[e.region] || 0) + 1; cauAll++; }
  }
  // Les onglets sont reconstruits à chaque capture : garder la position de défilement
  const scroll = els.gens.scrollLeft;
  els.gens.innerHTML = "";
  if (friend) {
    const n = tab => entries.filter(e => !e.regional && e.available && (tab === 0 ? friend.set.has(e.key) && !caught.has(e.key) : caught.has(e.key) && !friend.set.has(e.key))).length;
    for (const tab of [0, 1]) {
      const b = document.createElement("button");
      b.className = "tab" + (friend.tab === tab ? " active" : "");
      b.innerHTML = `${t(tab ? "cmpMe" : "cmpHe", { n: friend.name })}<span>${n(tab)}</span>`;
      b.addEventListener("click", () => { friend.tab = tab; renderGens(); render(); window.scrollTo(0, 0); });
      els.gens.appendChild(b);
    }
    return;
  }
  const addTab = (label, c, t, region) => {
    const tab = document.createElement("button");
    tab.className = "tab" + (regionFilter === region ? " active" : "") + (c === t ? " done" : "") + (c === t && region ? " gold" : "");
    tab.innerHTML = `${regionName(label)}<span>${c}/${t}</span>`;
    tab.addEventListener("click", () => {
      regionFilter = region;
      render();
      window.scrollTo(0, 0);
    });
    els.gens.appendChild(tab);
  };
  addTab(t("all"), cauAll, totAll, "");
  for (const r of REGION_ORDER.filter(r => tot[r])) addTab(r, cau[r] || 0, tot[r], r);
  els.gens.scrollLeft = scroll;
}

// Mode Shiny (menu ⋯) : même grille, autre collection
function setShiny(on) {
  shinyMode = on;
  document.body.classList.toggle("shiny", on);
  document.getElementById("shinyCheck").textContent = on ? "✦" : "";
  render();
}
document.getElementById("shinyBtn").addEventListener("click", () => setShiny(!shinyMode));

// Textes fixes de la page (data-i18n, -ph, -aria)
function applyLang() {
  document.documentElement.lang = LANG;
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll("[data-i18n-ph]")) el.placeholder = t(el.dataset.i18nPh);
  for (const el of document.querySelectorAll("[data-i18n-aria]")) el.setAttribute("aria-label", t(el.dataset.i18nAria));
  document.getElementById("langCur").textContent = (LANGS.find(([c]) => c === LANG) || [, ""])[1];
  langMenu.innerHTML = LANGS.map(([code, label]) =>
    `<button data-lang="${code}"${code === LANG ? ' class="on"' : ""}>${label}</button>`).join("");
}

// Compte : son menu (connexion, langue), puis la liste des langues
const langMenu = document.getElementById("langMenu");
const acctBtn = document.getElementById("acct");
const acctMenu = document.getElementById("acctMenu");
function setAcctMenu(open) {
  acctMenu.hidden = !open;
  acctBtn.setAttribute("aria-expanded", open);
}
function setLangMenu(open) {
  langMenu.hidden = !open;
}
acctBtn.addEventListener("click", ev => {
  ev.stopPropagation();
  setMenu(false);
  setLangMenu(false);
  setAcctMenu(acctMenu.hidden);
});
document.getElementById("langBtn").addEventListener("click", ev => {
  ev.stopPropagation();
  setAcctMenu(false);
  setLangMenu(true);
});
document.addEventListener("click", ev => {
  if (!acctMenu.hidden && !acctMenu.contains(ev.target)) setAcctMenu(false);
});
langMenu.addEventListener("click", ev => {
  const b = ev.target.closest("button[data-lang]");
  if (!b) return;
  setLangMenu(false);
  if (b.dataset.lang === LANG) return;
  LANG = b.dataset.lang;
  localStorage.setItem(LANG_KEY, LANG);
  applyLang();
  if (lastSrc) { buildEntries(lastSrc); render(); }
});
document.addEventListener("click", ev => {
  if (!langMenu.hidden && !langMenu.contains(ev.target)) setLangMenu(false);
});
applyLang();

// --- Installer sur l'écran d'accueil (menu du compte) ---
// Android et PC : la fenêtre d'installation du navigateur. iPhone : les gestes de Safari.
// Déjà installé (plein écran) : rien.
const installBtn = document.getElementById("installBtn");
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const ua = navigator.userAgent;
const isIos = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
let installPrompt = null;
if (!standalone && isIos) installBtn.hidden = false;
addEventListener("beforeinstallprompt", ev => {
  ev.preventDefault();
  installPrompt = ev;
  if (!standalone) installBtn.hidden = false;
});
addEventListener("appinstalled", () => { installBtn.hidden = true; installPrompt = null; });

const ICON = {
  more: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5v10h14V11h-1"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
  add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
};
installBtn.addEventListener("click", async () => {
  setAcctMenu(false);
  if (installPrompt) {
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    return;
  }
  // Safari 26 et après : ⋯ en bas à droite, puis Partager, Plus, Sur l'écran d'accueil.
  // Avant : Partager au milieu de la barre du bas. Autres navigateurs : Partager en haut.
  const safari = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  const version = +(ua.match(/Version\/(\d+)/) || [, 0])[1];
  const recent = safari && version >= 26;
  const step = (icon, key) => `<li>${ICON[icon]}${t(key)}</li>`;
  document.getElementById("installSteps").innerHTML = recent
    ? `<li>${t("stepMore")}${ICON.more}</li>` + step("share", "stepShare") + step("down", "stepShowMore") + step("add", "stepHome")
    : step("share", "stepShare") + step("add", "stepHome");
  const arrow = document.getElementById("installArrow");
  arrow.hidden = !safari;
  arrow.classList.toggle("right", recent);
  document.getElementById("installDialog").showModal();
});

// Recherche : la grille se refait une fois la frappe posée, pas à chaque lettre
let searchTimer = null;
els.search.addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(render, 150); });
els.filter.addEventListener("change", render);

// --- Menu ⋯ ---
const menu = document.getElementById("menu");
const moreBtn = document.getElementById("more");
function setMenu(open) {
  menu.hidden = !open;
  moreBtn.setAttribute("aria-expanded", open);
}
moreBtn.addEventListener("click", ev => {
  ev.stopPropagation();
  setAcctMenu(false);
  setLangMenu(false);
  setMenu(menu.hidden);
});
menu.addEventListener("click", ev => {
  if (ev.target.closest("button, a")) setMenu(false);
});
document.addEventListener("click", ev => {
  if (!menu.hidden && !menu.contains(ev.target)) setMenu(false);
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape") setMenu(false);
});

// --- Export / Import de la progression ---
document.getElementById("export").addEventListener("click", () => {
  const payload = {
    app: "pokedex-go",
    version: 1,
    date: new Date().toISOString(),
    count: caught.size,
    caught: [...caught],
    shiny: [...shinyCaught],
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pokedex-go-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Importer → choix de la source en bas de l'écran
const sourceDialog = document.getElementById("sourceDialog");
document.getElementById("import").addEventListener("click", () => {
  setMenu(false);
  sourceDialog.returnValue = "";
  sourceDialog.showModal();
});
// Le sélecteur de fichiers s'ouvre dans le toucher même : Safari (iPhone) le bloque
// s'il part plus tard, depuis l'événement « close » de la fenêtre
const SOURCE_INPUT = { save: "importFile", genie: "genieFile", shots: "shotFiles" };
sourceDialog.addEventListener("click", ev => {
  const b = ev.target.closest("button[value]");
  if (!b || !SOURCE_INPUT[b.value]) return;
  document.getElementById(SOURCE_INPUT[b.value]).click();
});

// --- Import Poké Genie (CSV, export en français ou en anglais) ---
function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some(x => x !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some(x => x !== "")) rows.push(row);
  return rows;
}

// Une ligne Poké Genie (n°, forme) → la carte du site qui lui correspond
const REGION_PREFIX = { alola: "ALOLA", galar: "GALAR", hisui: "HISUI", paldea: "PALDEA" };
function genieKey(id, forme) {
  const same = entries.filter(e => e.id === id);
  if (!same.length) return null;
  const reg = Object.keys(REGION_PREFIX).find(r => normalize(forme).startsWith(r));
  if (reg) {
    const e = same.find(e => e.regional && e.form.toUpperCase().startsWith(REGION_PREFIX[reg]));
    if (e) return e.key;
  }
  // Forme normale, ou forme sans carte à part (Mâle, Marche, Totémique…) : la carte de base
  const base = same.find(e => !e.regional);
  return base ? base.key : null;
}

function readGenie(text) {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  const head = (rows.shift() || []).map(h => normalize(h).trim());
  const num = head.findIndex(h => h === "nombre pokemon" || h === "pokemon number");
  const form = head.findIndex(h => h === "forme" || h === "form");
  if (num < 0) throw new Error(t("notGenie"));
  const keys = new Set();
  for (const r of rows) {
    const k = genieKey(Number(r[num]), form >= 0 ? r[form] || "" : "");
    if (k) keys.add(k);
  }
  return { count: rows.length, keys: [...keys] };
}

// Liste des nouveaux, chacun décochable, puis Ajouter
const reviewDialog = document.getElementById("reviewDialog");
function askReview(source, count, fresh, doubt = new Set()) {
  const list = document.getElementById("reviewList");
  const addBtn = document.getElementById("reviewAdd");
  const n = fresh.length;
  document.getElementById("reviewTitle").textContent =
    n ? tn("new", n) : t("nothingNew");
  document.getElementById("reviewText").textContent = t("readCount", { src: source, n: count });
  document.getElementById("reviewCancel").hidden = false;
  list.innerHTML = fresh.map(e =>
    `<div class="rv-row${doubt.has(e.key) ? " off doubt" : ""}" data-key="${e.key}">` +
      `<img src="${SPRITE_SMALL(spriteOf(e))}" alt="" data-sprite="${spriteOf(e)}" onerror="imgFallback(this)">` +
      `<span class="rv-name">${e.name}</span>` +
      `<span class="rv-dex">${t("dex")}${String(e.id).padStart(4, "0")}</span>` +
      `<span class="rv-box">✓</span></div>`).join("");
  const update = () => {
    const on = list.querySelectorAll(".rv-row:not(.off)").length;
    addBtn.textContent = t("add", { n: on });
    addBtn.hidden = !n;
    addBtn.disabled = !on;
  };
  list.onclick = ev => {
    const row = ev.target.closest(".rv-row");
    if (row) { row.classList.toggle("off"); update(); }
  };
  document.getElementById("reviewCancel").textContent = n ? t("cancel") : t("close");
  update();
  reviewDialog.returnValue = "";
  reviewDialog.showModal();
  return new Promise(resolve => {
    reviewDialog.addEventListener("close", () => resolve(reviewDialog.returnValue === "add"
      ? [...list.querySelectorAll(".rv-row:not(.off)")].map(r => r.dataset.key) : []), { once: true });
  });
}

// --- Import de captures du Pokédex du jeu ---
// Chaque case montre son numéro (« 0722 ») : en couleur au-dessus = attrapé,
// silhouette bleue = vu seulement, rien = jamais vu. Tout est lu ici, dans le navigateur.
let ocrWorker = null;
async function getOcr() {
  if (ocrWorker) return ocrWorker;
  if (!window.Tesseract) await new Promise((ok, ko) => {
    const sc = document.createElement("script");
    sc.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    sc.onload = ok; sc.onerror = () => ko(new Error(t("noOcr")));
    document.head.appendChild(sc);
  });
  ocrWorker = await Tesseract.createWorker("eng");
  await ocrWorker.setParameters({ tessedit_char_whitelist: "0123456789" });
  return ocrWorker;
}

function loadImage(file) {
  return new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => ko(new Error(t("badImage")));
    img.src = URL.createObjectURL(file);
  });
}

// Part des pixels « en couleur » dans un rectangle : ni le fond de la case, ni la silhouette bleue
function colorShare(px, W, x0, y0, x1, y1, bg) {
  let n = 0, hit = 0;
  for (let y = Math.max(0, y0 | 0); y < Math.min(px.length / 4 / W, y1); y += 2) {
    for (let x = Math.max(0, x0 | 0); x < Math.min(W, x1); x += 2) {
      const i = (y * W + x) * 4, r = px[i], g = px[i + 1], b = px[i + 2];
      n++;
      const d = Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
      if (d < 70) continue;                          // fond de la case
      if (b > r + 35 && g > r + 15 && b >= g - 10) continue; // bleu-cyan : silhouette ou reflet
      hit++;
    }
  }
  return n ? hit / n : 0;
}

async function readShot(file) {
  const img = await loadImage(file);
  const W = img.naturalWidth, H = img.naturalHeight;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, W, H).data;
  // Lecture des numéros sur une copie en noir et blanc (le bleu clair du jeu se lit mal)
  const bw = document.createElement("canvas");
  bw.width = W; bw.height = H;
  const bctx = bw.getContext("2d");
  const bd = bctx.createImageData(W, H);
  for (let i = 0; i < px.length; i += 4) {
    const v = 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2] < 150 ? 0 : 255;
    bd.data[i] = bd.data[i + 1] = bd.data[i + 2] = v; bd.data[i + 3] = 255;
  }
  bctx.putImageData(bd, 0, 0);
  const { data } = await (await getOcr()).recognize(bw);
  const nums = (data.words || [])
    .map(w => ({ t: w.text.trim(), b: w.bbox, conf: w.confidence }))
    .filter(w => /^0\d{3}$/.test(w.t));
  // Largeur d'une case : 4 colonnes
  const cellW = W / 4.3;
  const out = [];
  for (const w of nums) {
    const id = Number(w.t);
    const cx = (w.b.x0 + w.b.x1) / 2, top = w.b.y0;
    // Les boutons du jeu cachent le bas de l'écran : on ignore ce qui est dessous
    if (top > H * 0.8) continue;
    const zoneTop = top - cellW * 0.95;
    // Couleur du fond de la case : juste à gauche du numéro
    const s = ((Math.max(0, w.b.y0 + 4) * W) + Math.max(0, (cx - cellW * 0.42) | 0)) * 4;
    const bg = [px[s], px[s + 1], px[s + 2]];
    const share = colorShare(px, W, cx - cellW * 0.4, zoneTop, cx + cellW * 0.4, top - 4, bg);
    // Image coupée par le haut de l'écran, ou numéro mal lu : à vérifier
    const doubt = zoneTop < H * 0.2 || w.conf < 70;
    out.push({ id, caught: share > 0.005, doubt });
  }
  URL.revokeObjectURL(img.src);
  return out;
}

document.getElementById("shotFiles").addEventListener("change", async ev => {
  const input = ev.target;
  const files = [...input.files];
  input.value = "";
  if (!files.length) return;
  // Pendant la lecture : la fenêtre de la liste, sans boutons
  document.getElementById("reviewTitle").textContent = t("reading");
  document.getElementById("reviewList").innerHTML = "";
  document.getElementById("reviewAdd").hidden = true;
  document.getElementById("reviewCancel").hidden = true;
  const step = document.getElementById("reviewText");
  reviewDialog.showModal();
  const seen = new Map(); // id → {caught, doubt}
  let read = 0;
  try {
    for (const [i, f] of files.entries()) {
      step.textContent = t("shotStep", { i: i + 1, n: files.length });
      for (const r of await readShot(f)) {
        read++;
        const prev = seen.get(r.id);
        // Vu net sur une capture, douteux sur une autre : le net l'emporte
        if (!prev || (prev.doubt && !r.doubt) || (!prev.caught && r.caught && !r.doubt))
          seen.set(r.id, r);
      }
    }
  } catch (err) {
    reviewDialog.close();
    alert(t("importFail") + err.message);
    return;
  }
  // Attendre la vraie fermeture : sinon cet événement « close » serait pris pour la réponse de la liste
  await new Promise(ok => { reviewDialog.addEventListener("close", ok, { once: true }); reviewDialog.close(); });
  const doubt = new Set();
  const fresh = [];
  for (const [id, r] of seen) {
    if (!r.caught) continue;
    const e = entries.find(e => e.id === id && !e.regional);
    if (!e || !e.available || caught.has(e.key)) continue;
    fresh.push(e);
    if (r.doubt) doubt.add(e.key);
  }
  fresh.sort((a, b) => a.id - b.id);
  const n = files.length;
  const add = await askReview(tn("shots", n), read, fresh, doubt);
  if (!add.length) return;
  add.forEach(k => caught.add(k));
  saveCaught();
  render();
});

document.getElementById("genieFile").addEventListener("change", ev => {
  const input = ev.target;
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    input.value = "";
    let res;
    try { res = readGenie(reader.result); }
    catch (err) { alert(t("importFail") + err.message); return; }
    // Import qui ne fait qu'ajouter : seulement les cartes pas encore cochées
    const fresh = res.keys.map(k => byKey.get(k)).filter(e => e && e.available && !caught.has(e.key))
      .sort((a, b) => a.id - b.id || a.regional - b.regional);
    const add = await askReview("Poké Genie", res.count, fresh);
    if (!add.length) return;
    add.forEach(k => caught.add(k));
    saveCaught();
    render();
  };
  reader.readAsText(file);
});

// Fenêtre Fusionner / Remplacer / Annuler. Échap ou Annuler : rien ne change.
const importDialog = document.getElementById("importDialog");
function askImport(n) {
  const here = caught.size;
  document.getElementById("importTitle").textContent = t("importN", { n });
  document.getElementById("importText").textContent =
    tn("here", here);
  importDialog.returnValue = "";
  importDialog.showModal();
  return new Promise(resolve => {
    importDialog.addEventListener("close", () => resolve(importDialog.returnValue || "cancel"), { once: true });
  });
}

document.getElementById("importFile").addEventListener("change", (ev) => {
  const input = ev.target;
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    input.value = ""; // permet de réimporter le même fichier
    let clean, cleanShiny = [];
    try {
      const data = JSON.parse(reader.result);
      const list = Array.isArray(data) ? data : data.caught;
      if (!Array.isArray(list)) throw new Error(t("badFormat"));
      clean = list.filter(k => typeof k === "string");
      cleanShiny = (Array.isArray(data.shiny) ? data.shiny : []).filter(k => typeof k === "string");
    } catch (err) {
      alert(t("importFail") + err.message);
      return;
    }
    // Rien de marqué ici : rien à perdre, on charge directement
    const choice = caught.size ? await askImport(clean.length) : "replace";
    if (choice === "cancel") return;
    caught = choice === "merge" ? new Set([...caught, ...clean]) : new Set(clean);
    shinyCaught = choice === "merge" ? new Set([...shinyCaught, ...cleanShiny]) : new Set(cleanShiny);
    saveCaught();
    render();
  };
  reader.readAsText(file);
});

init();

// Hors ligne (page + images déjà vues) : seulement une fois en ligne, pas depuis un fichier local
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js");
}

// Depuis le calendrier : aller à la carte d'un Pokémon dans le Pokédex
// (filtres et recherche retirés s'ils la cachent), puis un petit rebond pour la repérer
window.goToEntry = key => {
  const find = () => [...els.grid.children].find(c => c.dataset.key === key);
  if (!find()) {
    els.search.value = "";
    els.filter.value = "all";
    regionFilter = "";
    renderGens();
    render();
  }
  const card = find();
  if (!card) return;
  card.scrollIntoView({ block: "center" });
  setTimeout(() => restartAnim(card, "found"), 350);
};

// --- Cocher plusieurs cartes : appui long puis glisser (cocher-plusieurs v1 : A1) ---
// Les cartes traversées prennent l'état de la première ; « n cochés / Annuler » ensuite
let bulk = null, bulkTimer = null, bulkClick = false;
function bulkSet(card) {
  const key = card.dataset.key, e = byKey.get(key);
  if (!e || !can(e) || bulk.before.has(key)) return;
  const set = marks();
  bulk.before.set(key, set.has(key));
  bulk.on ? set.add(key) : set.delete(key);
  card.classList.toggle("caught", bulk.on);
  card.querySelector(".types").innerHTML = typesHtml(e);
  restartAnim(card, "found");
}
els.grid.addEventListener("pointerdown", ev => {
  const card = ev.target.closest(".card");
  if (!card || ev.button > 0 || ev.target.closest(".name")) return;
  const x0 = ev.clientX, y0 = ev.clientY;
  const cancel = m => { if (Math.hypot(m.clientX - x0, m.clientY - y0) > 10) stopWait(); };
  const stopWait = () => { clearTimeout(bulkTimer); removeEventListener("pointermove", cancel); };
  addEventListener("pointermove", cancel);
  addEventListener("pointerup", stopWait, { once: true });
  addEventListener("pointercancel", stopWait, { once: true });
  bulkTimer = setTimeout(() => {
    stopWait();
    const e = byKey.get(card.dataset.key);
    if (!e || !can(e)) return;
    bulk = { on: !marks().has(e.key), before: new Map() };
    bulkSet(card);
    if (navigator.vibrate) navigator.vibrate(15);
  }, 500);
});
const bulkMove = (x, y) => {
  const el = document.elementFromPoint(x, y), card = el && el.closest(".card");
  if (card && els.grid.contains(card)) bulkSet(card);
};
addEventListener("pointermove", ev => { if (bulk && ev.pointerType === "mouse") bulkMove(ev.clientX, ev.clientY); });
// Au doigt : la page ne défile pas pendant le glissé
addEventListener("touchmove", ev => {
  if (!bulk) return;
  ev.preventDefault();
  bulkMove(ev.touches[0].clientX, ev.touches[0].clientY);
}, { passive: false });
function bulkEnd() {
  if (!bulk) return;
  const done = bulk;
  bulk = null;
  bulkClick = true; // le clic qui suit le relâché ne recoche pas la carte
  setTimeout(() => { bulkClick = false; }, 400);
  saveCaught();
  updateStats();
  const el = document.getElementById("toast");
  el.innerHTML = `${t(done.on ? "bulkOn" : "bulkOff", { n: done.before.size })}<button class="undo">${t("undo")}</button>`;
  el.hidden = false;
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => { el.hidden = true; }, 4000);
  el.querySelector(".undo").onclick = () => {
    el.hidden = true;
    clearTimeout(undoTimer);
    const set = marks();
    for (const [k, had] of done.before) had ? set.add(k) : set.delete(k);
    saveCaught();
    render();
    updateStats();
  };
}
addEventListener("pointerup", bulkEnd);
addEventListener("touchend", bulkEnd);
addEventListener("pointercancel", () => { if (bulk && !("ontouchstart" in window)) bulkEnd(); });

// --- Notifications (notifications v1 : A1 menu, B1 une par jour) ---
// Chaque matin, tools/notify.py annonce les Pokémon manquants qui viennent d'arriver
const VAPID_PUBLIC = "BNNXFLnEOxzGfVWepJipU5OcaMIV7kmCKIaLQ2xdYr8r_iTM7zT5rDztGLkmeD8voCoZIYlk6TeHJbFw8ABgByA";
const NOTIF_KEY = "pokedex-go-notif";
const notifSw = document.getElementById("notifSw");
const pushOk = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
document.getElementById("notifBtn").hidden = !pushOk;
const showNotif = () => notifSw.classList.toggle("on", localStorage.getItem(NOTIF_KEY) === "on" && Notification.permission === "granted");
if (pushOk) showNotif();
function flash(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => { el.hidden = true; }, 4000);
}
document.getElementById("notifBtn").addEventListener("click", () => notifToggle().catch(err => flash(String(err && err.message || err))));
async function notifToggle() {
  // iPhone : la demande doit partir tout de suite après le toucher, avant toute attente
  const turningOn = !notifSw.classList.contains("on");
  if (turningOn && !(window.pushAccount && pushAccount())) { flash(t("notifLogin")); return; }
  const perm = turningOn ? await Notification.requestPermission() : null;
  const reg = await navigator.serviceWorker.ready;
  if (!turningOn) {
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    localStorage.setItem(NOTIF_KEY, "off");
    if (window.pushAccount && pushAccount()) savePushSub(null).catch(() => {});
    showNotif();
    return;
  }
  if (perm !== "granted") { flash(t("notifBlocked")); return; }
  const key = Uint8Array.from(atob(VAPID_PUBLIC.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  await savePushSub(sub.toJSON());
  localStorage.setItem(NOTIF_KEY, "on");
  showNotif();
}
// Toucher la notification ouvre le site avec ?now : on ouvre le calendrier
if (new URLSearchParams(location.search).has("now")) {
  history.replaceState(null, "", location.pathname);
  addEventListener("load", () => setTimeout(() => document.getElementById("nowBtn").click(), 300));
}

// --- Comparer avec un ami (ami v1 : A1 menu ⋯, B1 bandeau et deux onglets) ---
var friend = null; // {name, set, tab} — var : lu par filtered() défini plus haut
document.getElementById("shareBtn").addEventListener("click", async () => {
  setMenu(false);
  const url = window.shareLink && await shareLink().catch(() => null);
  if (!url) { flash(t("shareLogin")); return; }
  if (navigator.share && matchMedia("(pointer: coarse)").matches) navigator.share({ url }).catch(() => {});
  else { await navigator.clipboard.writeText(url).catch(() => {}); flash(t("linkCopied")); }
});
const friendId = new URLSearchParams(location.search).get("ami");
window.onSyncReady = async () => {
  if (!friendId || friend) return;
  const d = await loadFriend(friendId).catch(() => null);
  if (!d) { flash(t("cmpMissing")); return; }
  friend = { name: d.name || "?", set: new Set(d.caught || []), tab: 0 };
  document.getElementById("friendName").textContent = t("cmpWith", { n: friend.name });
  document.getElementById("friendBand").hidden = false;
  renderGens(); render();
};
if (window.loadFriend) onSyncReady();
document.getElementById("friendX").addEventListener("click", () => {
  friend = null;
  document.getElementById("friendBand").hidden = true;
  history.replaceState(null, "", location.pathname);
  renderGens(); render();
});

// Choix de la collection : Pokédex / Méga / Obscurs / Purifiés
document.getElementById("coll").addEventListener("change", ev => {
  coll = ev.target.value;
  document.body.dataset.coll = coll;
  if (coll !== "dex" && shinyMode) setShiny(false); // le Shiny ne vaut que pour le Pokédex
  updateStats();
  render();
});

// --- Thème (mode-sombre : B1 suit le téléphone, choix dans le menu ⋯ ; couleurs N3 bleu nuit foncé) ---
const THEME_KEY = "pokedex-go-theme";
const darkMq = matchMedia("(prefers-color-scheme: dark)");
function applyTheme() {
  const th = localStorage.getItem(THEME_KEY) || "auto";
  const dark = th === "dark" || (th === "auto" && darkMq.matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]').content = dark ? "#0b2130" : "#9fe3ec";
  document.getElementById("themeCur").textContent = t({ auto: "thAuto", light: "thLight", dark: "thDark" }[th]);
}
document.getElementById("themeBtn").addEventListener("click", () => {
  const th = localStorage.getItem(THEME_KEY) || "auto";
  localStorage.setItem(THEME_KEY, { auto: "light", light: "dark", dark: "auto" }[th]);
  applyTheme();
});
darkMq.addEventListener("change", applyTheme);
applyTheme();
