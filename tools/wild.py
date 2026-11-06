"""Pokémon sauvages des événements en cours ou à venir, lus sur les pages de Leek Duck : wild.json.

ScrapedDuck donne la liste des événements, mais pas leur partie « Spawns » : on la lit ici.
Les événements liés à une ville (Wild Area, Night Out) sont ignorés. Lancé chaque jour par .github/workflows/pvp.yml.
"""
import json, re, urllib.request
from datetime import datetime, timezone

EVENTS = "https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.json"
SKIP = {"go-battle-league", "raid-battles", "raid-hour", "pokemon-spotlight-hour", "max-mondays", "research", "community-day"}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (pokedex wild list)"})
    return urllib.request.urlopen(req, timeout=60).read().decode("utf-8")


def when(s):
    if not s:
        return None
    d = datetime.fromisoformat(s.replace("Z", "+00:00"))
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


now = datetime.now(timezone.utc)
out = []
for ev in json.loads(get(EVENTS)):
    end = when(ev.get("end"))
    if ev.get("eventType") in SKIP or (end and end < now):
        continue
    link = ev.get("link", "")
    if ("wild-area" in link and "global" not in link) or "night-out" in link:
        continue
    try:
        html = get(ev["link"])
    except Exception:
        continue
    i = html.find('id="spawns"')
    if i < 0:
        continue
    j = html.find("<h2", i + 10)
    part = html[i:j if j > 0 else None]
    for li in re.findall(r'<li class="pkmn-list-item".*?</li>', part, re.S):
        name = re.search(r'class="pkmn-name">([^<]+)', li)
        img = re.search(r'<img src="([^"]+)"', li)
        if name and img:
            out.append({"name": name.group(1).strip(), "image": img.group(1), "canBeShiny": "shiny-icon" in li,
                        "event": ev.get("name", ""), "start": ev.get("start"), "end": ev.get("end")})

with open("wild.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
print(len(out), "Pokémon sauvages")
