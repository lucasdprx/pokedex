"""Formes régionales sorties dans GO : forms.json, d'après pokemon-go-api (pogoapi n'est plus à jour :
Colimucus et Muplodocus de Hisui manquaient). L'appli ajoute celles que pogoapi n'a pas.

[{"pokemon_id": n°, "pokemon_name": nom anglais, "form": "Hisuian"…, "type": ["Steel", "Dragon"]}…]
Lancé chaque jour par .github/workflows/pvp.yml. Une liste trop courte ne remplace pas l'ancienne.
"""
import json, re, urllib.request

UA = {"User-Agent": "pokedex-go"}
dex = json.load(urllib.request.urlopen(urllib.request.Request(
    "https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json", headers=UA), timeout=120))
typ = lambda t: t["type"].replace("POKEMON_TYPE_", "").capitalize()
out = []
for p in dex:
    for k, f in (p.get("regionForms") or {}).items():
        suf = k[len(p["id"]) + 1:]
        # Seulement les formes qui ont une image dans le jeu (les autres ne sont pas sorties)
        if re.match(r"(ALOLA|GALARIAN|HISUIAN|PALDEA)", suf) and f.get("assets"):
            out.append({"pokemon_id": p["dexNr"], "pokemon_name": p["names"]["English"],
                        "form": suf.capitalize(),
                        "type": [typ(t) for t in (f.get("primaryType"), f.get("secondaryType")) if t]})
out.sort(key=lambda e: (e["pokemon_id"], e["form"]))
if len(out) < 40:
    raise SystemExit(f"liste trop courte ({len(out)}) : forms.json gardé")
with open("forms.json", "w", encoding="utf-8") as f:
    json.dump(out, f, separators=(",", ":"))
print(len(out), "formes régionales")
