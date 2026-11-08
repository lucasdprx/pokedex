"""Réduit le gamemaster de PvPoke (plusieurs Mo) à ce dont le Pokédex a besoin : pvp.json.

Par n° de Pokédex : sorti dans GO ou non, nom et types de la première forme.
Et "shadow" : les n° dont la forme obscure est sortie (pogoapi n'est plus à jour).
Lancé chaque jour par .github/workflows/pvp.yml.
"""
import json, urllib.request

URL = "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json"
gm = json.load(urllib.request.urlopen(URL, timeout=60))
out = {}
for p in gm.get("pokemon", []):
    dex = p.get("dex", 0)
    if not 0 < dex <= 1025:
        continue
    row = out.setdefault(dex, {"dex": dex, "speciesName": p.get("speciesName", ""),
                               "types": p.get("types", []), "released": False})
    row["released"] = row["released"] or bool(p.get("released"))
shadow = sorted({p["dex"] for p in gm.get("pokemon", []) if p.get("speciesId", "").endswith("_shadow") and p.get("released")})
# Formes régionales sorties en obscur : "19_ALOLA" (Rattata d'Alola obscur)
REG = {"alolan": "ALOLA", "galarian": "GALARIAN", "hisuian": "HISUIAN", "paldea": "PALDEA"}
shadow_forms = sorted({f'{p["dex"]}_{t}' for p in gm.get("pokemon", []) if p.get("speciesId", "").endswith("_shadow") and p.get("released")
                       for w, t in REG.items() if f"_{w}" in p["speciesId"]})
with open("pvp.json", "w", encoding="utf-8") as f:
    json.dump({"pokemon": [out[k] for k in sorted(out)], "shadow": shadow, "shadowForms": shadow_forms}, f, ensure_ascii=False, separators=(",", ":"))
