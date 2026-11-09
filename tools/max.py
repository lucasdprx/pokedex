"""Pokémon Dynamax et Gigamax sortis dans GO : max.json. Les données du jeu (PokeMiners) disent qui a une
forme Max ; la liste de Pokémon GO Hub et le calendrier Leek Duck disent qui est sorti.

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
# Données du jeu (PokeMiners) : « breadOverrides » = formes Max de chaque Pokémon
# (BREAD_MODE = Dynamax, BREAD_DOUGH_MODE(_2) = Gigamax). Elles font foi : un Pokémon listé par Hub
# sans données Max dans le jeu (Créhelf, Meltan…) n'est pas gardé.
try:
    gm = json.load(urllib.request.urlopen("https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json", timeout=120))
    dyna, dough = set(), set()
    for t in gm:
        m = re.match(r"EXTENDED_V(\d{4})_POKEMON_", t.get("templateId", ""))
        if not m:
            continue
        modes = {b.get("breadMode") for b in t["data"]["pokemonExtendedSettings"].get("breadOverrides", [])}
        if "BREAD_MODE" in modes:
            dyna.add(int(m.group(1)))
        if modes & {"BREAD_DOUGH_MODE", "BREAD_DOUGH_MODE_2"}:
            dough.add(int(m.group(1)))
    # Pas encore sortis : le premier combat Max listé est à venir, et Hub ne l'a pas encore
    # (un Pokémon qui revient, déjà chez Hub, reste)
    from datetime import datetime
    names = json.load(open("names.json", encoding="utf-8"))
    en = {n.lower(): i + 1 for i, n in enumerate(names.get("en") or [])}
    ev = json.load(urllib.request.urlopen("https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.json", timeout=60))
    now = datetime.now().isoformat()
    first, past_giga = {}, set()
    for e in ev:
        if e.get("eventType") not in ("max-battles", "max-mondays"):
            continue
        mm = re.search(r"(Gigantamax|Eternamax|Dynamax) ([A-Z][\w'-]+)", e.get("name") or "")
        if mm and mm.group(1).lower() != "eternamax" and mm.group(2).lower() in en and e.get("start"):
            n = en[mm.group(2).lower()]
            first[n] = min(first.get(n, e["start"]), e["start"])
            if mm.group(1) == "Gigantamax" and e["start"] <= now:
                past_giga.add(n)
    hub = set(out["dynamax"])
    later = {n for n, st in first.items() if st > now and n not in hub}
    out["dynamax"] = sorted(dyna - later)
    # Gigamax : Hub ou un combat Gigamax déjà passé, et une forme Gigamax dans le jeu (Duralugon n'en a pas)
    giga = (({g["id"] for g in out["gigamax"]} | past_giga) & dough)
    out["gigamax"] = [g for g in out["gigamax"] if g["id"] in giga] +                      [{"id": n, "sprite": gmax_sprite(n)} for n in sorted(giga - {g["id"] for g in out["gigamax"]})]
    out["gigamax"].sort(key=lambda g: g["id"])
except Exception as e:
    print("données du jeu indisponibles :", e)
if len(out["dynamax"]) < 50:
    raise SystemExit(f"liste trop courte ({len(out['dynamax'])} Dynamax) : max.json gardé")
with open("max.json", "w", encoding="utf-8") as f:
    json.dump(out, f, separators=(",", ":"))
print(len(out["dynamax"]), "Dynamax,", len(out["gigamax"]), "Gigamax")
