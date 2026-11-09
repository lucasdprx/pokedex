"""Boss de raid du moment : raids.json, lu directement sur la page Raids de Leek Duck (toutes les heures).

ScrapedDuck ne relit Leek Duck qu'une fois par jour : Zacian et Zamazenta, arrivés à 10 h, manquaient
jusqu'au lendemain. Même forme que le raids.json de ScrapedDuck : [{name, tier, image, canBeShiny}…].
Lancé par .github/workflows/raids.yml. Une page vide (changée) ne remplace pas l'ancienne liste.
"""
import html, json, re, urllib.request
from datetime import datetime

req = urllib.request.Request("https://leekduck.com/raid-bosses/", headers={"User-Agent": "Mozilla/5.0 (pokedex-go)"})
page = urllib.request.urlopen(req, timeout=60).read().decode("utf-8")
out = []
for block in page.split('<div class="tier">')[1:]:
    tier = re.search(r'class="tier-label">([^<]+)<', block)
    if not tier:
        continue
    for card in re.split(r'<div class="card[" ]', block)[1:]:
        img = re.search(r'<div class="boss-img[^>]*><img src="([^"]+)"', card)
        name = re.search(r'<p class="name[^"]*">([^<]+)</p>', card)
        if img and name:
            out.append({"name": html.unescape(name.group(1)).strip(), "tier": html.unescape(tier.group(1)).strip(),
                        "image": img.group(1), "canBeShiny": "shiny-icon" in card})
# Heures de raids écrites dans la note d'un niveau : « Raid Hours from 6:00 p.m. to 7:00 p.m. local time:
# Crowned Sword Zacian on Monday, November 9, and Crowned Shield Zamazenta on Tuesday, November 10. »
# → "hours": [["2026-11-09T18:00:00", "2026-11-09T19:00:00"]] sur le boss (heure locale, comme Leek Duck)
def h24(h, m, ap):
    return (int(h) % 12 + (12 if ap == "p" else 0)), int(m)
year = datetime.now().year
for note in re.findall(r'<p class="note">(.*?)</p>', page, re.S):
    note = html.unescape(re.sub(r"<[^>]+>", "", note))
    t = re.search(r"Raid Hours? from (\d+):(\d\d) ([ap])\.m\. to (\d+):(\d\d) ([ap])\.m\.", note)
    if not t:
        continue
    (sh, sm), (eh, em) = h24(*t.group(1, 2, 3)), h24(*t.group(4, 5, 6))
    for who, month, day in re.findall(r"([A-Z][\w' -]+?) on \w+day, (\w+) (\d+)", note[t.end():]):
        d = datetime.strptime(f"{month} {day} {year}", "%B %d %Y")
        for r in out:
            base = re.sub(r"\s*\(.*", "", r["name"]).replace("Shadow ", "")
            if base and base in who:
                r.setdefault("hours", []).append([d.replace(hour=sh, minute=sm).isoformat(), d.replace(hour=eh, minute=em).isoformat()])
if len(out) < 3:
    raise SystemExit(f"page Raids illisible ({len(out)} boss) : raids.json gardé")
with open("raids.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(len(out), "boss :", ", ".join(f"{r['name']} ({r['tier']})" for r in out))
