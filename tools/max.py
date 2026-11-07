"""Pokémon Dynamax et Gigamax sortis dans GO : max.json, d'après la liste de Pokémon GO Hub.

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
if len(out["dynamax"]) < 50:
    raise SystemExit(f"liste trop courte ({len(out['dynamax'])} Dynamax) : max.json gardé")
with open("max.json", "w", encoding="utf-8") as f:
    json.dump(out, f, separators=(",", ":"))
print(len(out["dynamax"]), "Dynamax,", len(out["gigamax"]), "Gigamax")
