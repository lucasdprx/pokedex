"""Liste des Pokémon de chaque collection : dex.json, croisée chaque jour depuis plusieurs sources.

Aucune source n'est à jour seule (pogoapi s'est arrêté : Boréas obscur, Colimucus de Hisui, des centaines
de shiny manquaient). On les croise ici, une fois par jour, et le site ne lit plus que dex.json :
- cartes (espèces et formes régionales, types) : pogoapi, complété par pokemon-go-api et PvPoke ;
- sorties : pogoapi ∪ PvPoke (par forme) ∪ shiny Leek Duck ∪ ce que Leek Duck donne aujourd'hui ;
- shiny : liste shiny de Leek Duck (dates passées), par espèce et par forme régionale, ∪ pogoapi ;
- obscurs : PvPoke (par forme) ∪ pogoapi.

{"data": [{pokemon_id, pokemon_name, form, type}], "released": [n°], "unreleasedForms": ["555_GALARIAN_ZEN"],
 "shiny": [n°], "shinyForms": ["705_HISUIAN"], "shadow": [n°], "shadowForms": ["19_ALOLA"], "time": ISO}
Une source qui ne répond pas garde sa part de l'ancien dex.json ; une liste trop courte ne remplace rien.
Lancé chaque jour par .github/workflows/pvp.yml.
"""
import json, re, urllib.request
from datetime import datetime, timezone

UA = {"User-Agent": "Mozilla/5.0 (pokedex-go)"}
REG = re.compile(r"^(ALOLA|GALARIAN|HISUIAN|PALDEA)")


def get(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120))


def tryget(url, what):
    try:
        return get(url)
    except Exception as e:
        print(what, "indisponible :", e)
        return None


try:
    old = json.load(open("dex.json", encoding="utf-8"))
except Exception:
    old = {}

types = tryget("https://pogoapi.net/api/v1/pokemon_types.json", "pogoapi types")
rel = tryget("https://pogoapi.net/api/v1/released_pokemon.json", "pogoapi sortis")
psh = tryget("https://pogoapi.net/api/v1/shiny_pokemon.json", "pogoapi shiny")
pshadow = tryget("https://pogoapi.net/api/v1/shadow_pokemon.json", "pogoapi obscurs")
pvp = tryget("https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json", "PvPoke")
pga = tryget("https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json", "pokemon-go-api")
ld = tryget("https://leekduck.com/shiny/pms.json", "shiny Leek Duck")
duck = {f: tryget(f"https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/{f}.json", f) or []
        for f in ("raids", "eggs", "research", "events")}
today = datetime.now().strftime("%Y/%m/%d")

# --- Cartes ---
data = [dict(e) for e in types] if types else [dict(e) for e in old.get("data", [])]
have = {(e["pokemon_id"], (e.get("form") or "Normal").upper()) for e in data}
ids = {e["pokemon_id"] for e in data}
tname = lambda t: t["type"].replace("POKEMON_TYPE_", "").capitalize()
for p in pga or []:
    n = p["dexNr"]
    tys = [tname(t) for t in (p.get("primaryType"), p.get("secondaryType")) if t]
    if n not in ids and 0 < n <= 1025:  # espèce absente de pogoapi (Paragruel…)
        data.append({"pokemon_id": n, "pokemon_name": p["names"]["English"], "form": "Normal", "type": tys})
        ids.add(n)
    for k, f in (p.get("regionForms") or {}).items():
        suf = k[len(p["id"]) + 1:]
        # Formes régionales qui ont une image dans le jeu ; leur sortie est vérifiée plus bas
        if REG.match(suf) and f.get("assets") and (n, suf) not in have:
            data.append({"pokemon_id": n, "pokemon_name": p["names"]["English"], "form": suf.capitalize(),
                         "type": [tname(t) for t in (f.get("primaryType"), f.get("secondaryType")) if t]})
            have.add((n, suf))
# Encore absente (Paragruel, rangé par formes chez pokemon-go-api) : PvPoke
for p in (pvp or {}).get("pokemon", []):
    n = p.get("dex", 0)
    if 0 < n <= 1025 and n not in ids:
        data.append({"pokemon_id": n, "pokemon_name": re.sub(r"\s*\(.*\)$", "", p.get("speciesName", "")), "form": "Normal",
                     "type": [t.capitalize() for t in p.get("types", []) if t and t != "none"]})
        ids.add(n)
data.sort(key=lambda e: (e["pokemon_id"], (e.get("form") or "Normal") != "Normal", e.get("form") or ""))

# --- Shiny Leek Duck : « pm705.fHISUIAN » → (705, "HISUIAN") ; « pm25 » → (25, "") ; costumes « .c » à part ---
ld_ok = [x for x in (ld or []) if (x.get("released_date") or "9999") <= today]
ld_forms = set()
for x in ld_ok:
    m = re.match(r"pm(\d+)(?:\.([cf])(.+))?$", x.get("aa_fn") or "")
    if m:
        ld_forms.add((int(m.group(1)), m.group(2) or "", m.group(3) or ""))
# Espèce shiny : son image de base, ou une forme qui n'est ni régionale, ni Méga, ni Gigamax, ni un costume (année, n°)
plain = lambda kind, f: kind == "" or (kind == "f" and not REG.match(f) and not re.match(r"(MEGA|PRIMAL|GIGANTAMAX|ETERNAMAX)", f) and not re.search(r"\d", f))
ld_species = {n for n, kind, f in ld_forms if plain(kind, f)}
shiny_forms = sorted({f"{n}_{f}" for n, kind, f in ld_forms if kind == "f" and REG.match(f)})
if ld is None:
    ld_species, shiny_forms = set(old.get("shiny", [])), old.get("shinyForms", [])
shiny = sorted(ld_species | {int(k) for k in (psh or {})})

# --- Sorties ---
released = {int(k) for k in (rel or {})} if rel else set(old.get("released", []))
pv = (pvp or {}).get("pokemon", [])
released |= {p["dex"] for p in pv if p.get("released") and 0 < p["dex"] <= 1025}
released |= ld_species | {n for n, _, _ in ld_forms}
# Ce que Leek Duck donne aujourd'hui (raids, œufs, études, événements) est sorti
duck_names = [r.get("name", "") for r in duck["raids"] + duck["eggs"]] + \
             [r.get("name", "") for t in duck["research"] for r in t.get("rewards", [])]
dex_of = lambda img: int((re.search(r"(?:pm|pokemon_icon_|poke_capture_0*)(\d+)", img or "") or [0, 0])[1])
for r in duck["raids"] + duck["eggs"] + [r for t in duck["research"] for r in t.get("rewards", [])]:
    if dex_of(r.get("image")):
        released.add(dex_of(r.get("image")))

# Forme régionale sortie ? PvPoke (« sliggoo_hisuian », « tauros_blaze »), shiny Leek Duck, ou citée aujourd'hui.
# Mots PvPoke d'une forme : GALARIAN_ZEN → galarian + zen ; PALDEA_BLAZE → blaze (PvPoke n'écrit pas « paldea »)
WORD = {"ALOLA": "alolan", "GALARIAN": "galarian", "HISUIAN": "hisuian", "PALDEA": ""}
ADJ = {"ALOLA": "Alolan", "GALARIAN": "Galarian", "HISUIAN": "Hisuian", "PALDEA": "Paldean"}


def pvp_words(form):
    parts = form.upper().split("_")
    return {w for w in [WORD.get(parts[0], parts[0].lower())] + [x.lower() for x in parts[1:]] if w}


def pvp_match(n, form):
    want = pvp_words(form)
    return [p for p in pv if p["dex"] == n and not p["speciesId"].endswith("_shadow")
            and want <= set(p["speciesId"].split("_")[1:]) and len(p["speciesId"].split("_")) > 1]


en_names = {}
for e in data:
    en_names.setdefault(e["pokemon_id"], e.get("pokemon_name") or "")
unreleased = []
from_pogoapi = {(e["pokemon_id"], (e.get("form") or "").upper()) for e in (types or [])}
for e in data:
    form = (e.get("form") or "Normal").upper()
    n = e["pokemon_id"]
    if not REG.match(form) or not any(x["pokemon_id"] == n and (x.get("form") or "Normal").upper() != form for x in data):
        continue  # forme de base, ou seule forme de l'espèce (Palarticho) : suit l'espèce
    m = pvp_match(n, form)
    seen_today = any(ADJ[REG.match(form).group(1)] in nm and en_names[n] in nm for nm in duck_names)
    ok = any(p.get("released") for p in m) or (n, "f", form) in ld_forms or seen_today
    # Inconnue de PvPoke et déjà chez pogoapi : on garde l'avis de pogoapi (sortie)
    if not m and (n, form) in from_pogoapi and pvp is not None:
        ok = True
    if pvp is None and not ok:
        ok = f"{n}_{form}" not in old.get("unreleasedForms", [])
    if not ok:
        unreleased.append(f"{n}_{form}")

# --- Obscurs : espèce (sans forme régionale) et formes régionales à part ---
sh = [p for p in pv if p["speciesId"].endswith("_shadow") and p.get("released")]
REG_WORDS = {"alolan": "ALOLA", "galarian": "GALARIAN", "hisuian": "HISUIAN", "paldea": "PALDEA",
             "aqua": "PALDEA", "blaze": "PALDEA", "combat": "PALDEA"}
shadow, shadow_forms = set(), set()
for p in sh:
    words = p["speciesId"].split("_")[1:-1]
    reg = next((REG_WORDS[w] for w in words if w in REG_WORDS), None)
    (shadow_forms.add(f'{p["dex"]}_{reg}') if reg else shadow.add(p["dex"]))
if pvp is None:
    shadow, shadow_forms = set(old.get("shadow", [])), set(old.get("shadowForms", []))
shadow |= {int(k) for k in (pshadow or {})}

out = {"time": datetime.now(timezone.utc).isoformat(timespec="seconds"), "data": data,
       "released": sorted(released), "unreleasedForms": sorted(unreleased), "shiny": shiny, "shinyForms": shiny_forms,
       "shadow": sorted(shadow), "shadowForms": sorted(shadow_forms)}
if len(data) < 1000 or len(released) < 800 or len(shiny) < 700 or len(shadow) < 200:
    raise SystemExit(f"liste trop courte ({len(data)} cartes, {len(released)} sorties, {len(shiny)} shiny, {len(shadow)} obscurs) : dex.json gardé")
with open("dex.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(len(data), "cartes,", len(released), "sorties,", len(shiny), "shiny,", len(shiny_forms), "formes shiny,",
      len(shadow), "obscurs,", len(shadow_forms), "formes obscures ; formes pas sorties :", unreleased)
