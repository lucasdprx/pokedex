"""Boss de raid du moment : raids.json, lu directement sur la page Raids de Leek Duck (toutes les heures).

ScrapedDuck ne relit Leek Duck qu'une fois par jour : Zacian et Zamazenta, arrivés à 10 h, manquaient
jusqu'au lendemain. {"time": ISO, "raids": [{name, tier, image, canBeShiny, hours?}…]} (liste au format du raids.json de ScrapedDuck).
Lancé par .github/workflows/raids.yml. Une page vide (changée) ne remplace pas l'ancienne liste.
"""
import html, json, re, urllib.request
from datetime import datetime, timedelta, timezone

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


def parse_day(month, day):
    """« November 9 », « Nov. 9 », « Sept 9 » → date (année suivante si la date est loin dans le passé)."""
    m = month.rstrip(".")[:3].title()
    d = datetime.strptime(f"{m} {day} {year}", "%b %d %Y")
    if (d - datetime.now()).days < -180:
        d = d.replace(year=year + 1)
    elif (d - datetime.now()).days > 180:
        d = d.replace(year=year - 1)
    return d


for note in re.findall(r'<p class="note">(.*?)</p>', page, re.S):
    # Une note écrite autrement ne doit pas faire perdre la liste des boss
    try:
        note = html.unescape(re.sub(r"<[^>]+>", "", note))
        t = re.search(r"Raid Hours? from (\d+):(\d\d) ([ap])\.m\. to (\d+):(\d\d) ([ap])\.m\.", note)
        if not t:
            continue
        (sh, sm), (eh, em) = h24(*t.group(1, 2, 3)), h24(*t.group(4, 5, 6))
        for who, month, day in re.findall(r"([A-Z][\w' -]+?) on \w+day, ([A-Z][a-z]+\.?) (\d+)", note[t.end():]):
            who = re.sub(r"^(?:and |, )+", "", who.strip())
            d = parse_day(month, day)
            # Le boss dont le nom termine celui de la note (« Crowned Sword Zacian » → Zacian), mot entier ;
            # le plus long gagne (Black Kyurem plutôt que Kyurem) ; un obscur seulement si la note le dit
            shadow = "Shadow" in who
            cands = [r for r in out if r["name"].startswith("Shadow ") == shadow]
            base = lambda r: re.sub(r"\s*\(.*", "", r["name"]).replace("Shadow ", "")
            cands = [r for r in cands if base(r) and re.search(r"(^|\s)" + re.escape(base(r)) + r"$", who)]
            if not cands:
                continue
            best = max(len(base(r)) for r in cands)
            for r in cands:
                if len(base(r)) == best:
                    r.setdefault("hours", []).append([d.replace(hour=sh, minute=sm).isoformat(), d.replace(hour=eh, minute=em).isoformat()])
    except Exception as e:
        print("note ignorée :", e)
if len(out) < 3:
    raise SystemExit(f"page Raids illisible ({len(out)} boss) : raids.json gardé")
# Même liste qu'avant : on garde l'ancienne date tant qu'elle a moins de 6 h (pas une mise en ligne par heure)
now = datetime.now(timezone.utc)
try:
    old = json.load(open("raids.json", encoding="utf-8"))
    if isinstance(old, dict) and old.get("raids") == out and now - datetime.fromisoformat(old["time"]) < timedelta(hours=6):
        print("boss inchangés : raids.json gardé")
        raise SystemExit(0)
except (OSError, ValueError, KeyError, TypeError):
    pass
with open("raids.json", "w", encoding="utf-8") as f:
    # time : le site prend ScrapedDuck si ce fichier n'est plus mis à jour (script en panne)
    json.dump({"time": now.isoformat(timespec="seconds"), "raids": out}, f, ensure_ascii=False, separators=(",", ":"))
print(len(out), "boss :", ", ".join(f"{r['name']} ({r['tier']})" for r in out))
