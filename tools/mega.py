"""Méga et Primo sorties dans GO : mega.json, d'après pokemon-go-api (pogoapi n'est plus à jour :
Méga-Dracolosse et Méga-Mewtwo manquaient).

[{"id": n°, "form": "Normal" | "X" | "Y", "primal": bool, "sprite": n° PokeAPI de l'image}…]
Lancé chaque jour par .github/workflows/pvp.yml. Une liste trop courte ne remplace pas l'ancienne.
"""
import json, urllib.request

UA = {"User-Agent": "pokedex-go"}
get = lambda u: json.load(urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=120))
dex = get("https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json")
out = []
for p in dex:
    for k in (p.get("megaEvolutions") or {}):
        form = "X" if k.endswith("_X") else "Y" if k.endswith("_Y") else "Normal"
        out.append({"id": p["dexNr"], "form": form, "primal": k.endswith("_PRIMAL"), "sprite": p["dexNr"]})
# Image : la variété « -mega(-x|-y) » ou « -primal » de PokeAPI
for m in out:
    try:
        sp = get(f"https://pokeapi.co/api/v2/pokemon-species/{m['id']}")
        want = ("-primal",) if m["primal"] else ((f"-mega-{m['form'].lower()}",) if m["form"] != "Normal" else ("-mega",))
        for v in sp["varieties"]:
            if v["pokemon"]["name"].endswith(want):
                m["sprite"] = int(v["pokemon"]["url"].rstrip("/").split("/")[-1])
    except Exception as e:
        print(m["id"], "sans image :", e)
out.sort(key=lambda m: (m["id"], m["form"]))
if len(out) < 40:
    raise SystemExit(f"liste trop courte ({len(out)}) : mega.json gardé")
with open("mega.json", "w", encoding="utf-8") as f:
    json.dump(out, f, separators=(",", ":"))
print(len(out), "Méga")
