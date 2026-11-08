"""Pokémon Dynamax et Gigamax sortis dans GO : max.json, d'après la liste de Pokémon GO Hub,
complétée par les données du jeu (PokeMiners : Magmar manquait chez Hub), sauf ceux dont le combat Max
n'a pas encore commencé (calendrier Leek Duck).

{"dynamax": [n°…], "gigamax": [{"id": n°, "sprite": n° PokeAPI de l'image Gigamax}…]}. Une liste vide (page changée) ne remplace pas l'ancienne.
Lancé chaque jour par .github/workflows/pvp.yml.
"""
import json, re, urllib.request

URL = "https://db.pokemongohub.net/pokemon-list/category/dynamax"

req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0 (pokedex-go)"})
html = urllib.request.urlopen(req, timeout=60).read().decode("utf-8")
found = re.findall(r'href="/pokemon/(\d+)-(Dynamax|Gigantamax)', html)
out = {
    "dynamax": sorted({int(n) for n, k in found if k == "Dynamax"}),
    "gigamax": [],
}


def gmax_sprite(n):
    """N° PokeAPI de la forme Gigamax (son image), ou celui de l'espèce."""
    url = f"https://pokeapi.co/api/v2/pokemon-species/{n}"
    sp = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "pokedex-go"}), timeout=60))
    for v in sp["varieties"]:
        if v["pokemon"]["name"].endswith("-gmax") or "-gmax" in v["pokemon"]["name"]:
            return int(v["pokemon"]["url"].rstrip("/").split("/")[-1])
    return n


for n in sorted({int(n) for n, k in found if k == "Gigantamax"}):
    out["gigamax"].append({"id": n, "sprite": gmax_sprite(n)})
# Données du jeu : « breadOverrides » = a une forme Dynamax (BREAD_DOUGH_MODE = Gigamax)
try:
    gm = json.load(urllib.request.urlopen("https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json", timeout=120))
    dyna = set()
    for t in gm:
        m = re.match(r"EXTENDED_V(\d{4})_POKEMON_", t.get("templateId", ""))
        if m and any(b.get("breadMode") != "BREAD_DOUGH_MODE" for b in t["data"]["pokemonExtendedSettings"].get("breadOverrides", [])):
            dyna.add(int(m.group(1)))
    # Pas encore sortis : leur combat Max est annoncé pour plus tard
    from datetime import datetime
    names = json.load(open("names.json", encoding="utf-8"))
    en = {n.lower(): i + 1 for i, n in enumerate(names.get("en") or [])}
    ev = json.load(urllib.request.urlopen("https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.json", timeout=60))
    now = datetime.now().isoformat()
    first = {}
    for e in ev:
        mm = re.search(r"\b(?:Gigantamax|Eternamax|Dynamax) ([A-Z][\w'-]+)", e.get("name") or "")
        if mm and mm.group(1).lower() in en and e.get("start"):
            n = en[mm.group(1).lower()]
            first[n] = min(first.get(n, e["start"]), e["start"])
    later = {n for n, st in first.items() if st > now}
    out["dynamax"] = sorted(set(out["dynamax"]) | (dyna - later))
except Exception as e:
    print("données du jeu indisponibles :", e)
if len(out["dynamax"]) < 50:
    raise SystemExit(f"liste trop courte ({len(out['dynamax'])} Dynamax) : max.json gardé")
with open("max.json", "w", encoding="utf-8") as f:
    json.dump(out, f, separators=(",", ":"))
print(len(out["dynamax"]), "Dynamax,", len(out["gigamax"]), "Gigamax")
