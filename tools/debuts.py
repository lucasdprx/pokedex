"""Pokémon qui font bientôt leur début dans Pokémon GO : debuts.json, lu par « Bientôt » et la notification du matin.

Sources :
- pages des événements à venir de Leek Duck (liste ScrapedDuck) : les phrases « X makes its Pokémon GO debut »,
  « Dynamax Dialga and Dynamax Palkia make their debuts », et les listes sous un titre « … Debut(s) » ;
- liste shiny de Leek Duck : les shiny datés dans le futur ;
- rubrique « Max Battles » des événements en cours et à venir : « max » (Registeel le 11/11 dans « Into the Wild »).

{"time": ISO, "debuts": [{"dex", "reg" ("" ou ALOLA…), "kind" ("" espèce, "dyna", "giga", "mega", "shadow"),
  "mform" (X, Y ou ""), "shiny" (seulement le shiny), "sprite" (n° PokeAPI de l'image ou null), "start" (heure locale),
  "event", "link"}]}
Une source en panne garde la part de l'ancien fichier. Lancé chaque jour par .github/workflows/pvp.yml.
"""
import html as H, json, re, urllib.request
from datetime import datetime, timezone

UA = {"User-Agent": "Mozilla/5.0 (pokedex-go)"}
NOW = datetime.now().strftime("%Y-%m-%dT%H:%M")


def get(url, raw=False):
    r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
    return r.decode("utf-8") if raw else json.loads(r)


try:
    _o = json.load(open("debuts.json", encoding="utf-8"))
    old, old_max = _o["debuts"], _o.get("max", [])
except Exception:
    old, old_max = [], []
names = json.load(open("names.json", encoding="utf-8"))["en"]
dex = json.load(open("dex.json", encoding="utf-8"))
released, shiny = set(dex["released"]), set(dex["shiny"])
EN = {n: i + 1 for i, n in enumerate(names)}
# Noms les plus longs d'abord : « Mewtwo » avant « Mew »
NAME_RE = re.compile(r"(?<![\w-])(" + "|".join(re.escape(n) for n in sorted(EN, key=len, reverse=True)) + r")(?![\w-])")
REG = {"Alolan": "ALOLA", "Galarian": "GALARIAN", "Hisuian": "HISUIAN", "Paldean": "PALDEA"}
KIND = [("Gigantamax", "giga"), ("Eternamax", "giga"), ("Dynamax", "dyna"), ("Mega Evolution", "mega"), ("Mega", "mega"),
        ("Primal", "mega"), ("Shadow", "shadow")]


def kind_of(text):
    for w, k in KIND:
        if re.search(rf"\b{w}\b", text):
            return k
    return ""


def found_in(text, default=""):
    """Pokémon cités dans une phrase de début, avec leur forme (mot juste avant le nom, sinon celui de la phrase)."""
    out = []
    whole = kind_of(re.sub(NAME_RE, "", text)) or default  # « makes its Dynamax debut », « Mega Evolution debuts of »
    shiny_only = bool(re.search(r"\bShiny\b", text)) and not re.search(r"lucky|chance", text, re.I)
    for m in NAME_RE.finditer(text):
        before = text[max(0, m.start() - 30):m.start()].split()
        before = before[-2:] if before else []
        k = next((kd for w, kd in KIND if " ".join(before).endswith(w)), "") or whole
        reg = REG.get(before[-1], "") if before else ""
        mform = (re.match(r"\s([XY])\b", text[m.end():]) or [None, ""])[1] if k == "mega" else ""
        out.append((EN[m.group(1)], reg, k, mform, shiny_only and k == ""))
    return out


def sentences(t):
    return re.split(r"(?<=[.!?])\s+", t)


def text_of(s):
    return " ".join(H.unescape(re.sub(r"<[^>]+>", " ", s)).split())


def sprite(n, k, mform):
    """Image PokeAPI de la forme Gigamax ou Méga (son n°), sinon None : le site prend l'espèce."""
    if k not in ("giga", "mega"):
        return None
    try:
        sp = get(f"https://pokeapi.co/api/v2/pokemon-species/{n}")
    except Exception:
        return None
    want = "-gmax" if k == "giga" else "-mega" + (f"-{mform.lower()}" if mform else "")
    for v in sp["varieties"]:
        nm = v["pokemon"]["name"]
        if nm.endswith(want) or (k == "mega" and not mform and nm.endswith("-primal")):
            return int(v["pokemon"]["url"].rstrip("/").split("/")[-1])
    return None


out, ok_pages = {}, True
try:
    events = get("https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.json")
except Exception as e:
    print("événements indisponibles :", e)
    events, ok_pages = [], False
maxb, ok_max = {}, ok_pages  # combats Max listés dans la page d'un événement (Registeel dans « Into the Wild »)
MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December"


def max_section(ev, body):
    """Rubrique « Max Battles » d'un événement : « Five-Star Max Battles: Wednesday, November 11 » → Registeel ce jour-là ;
    un niveau sans date (« One-Star Max Battles ») → tout l'événement, sauf si son texte ne cite qu'un jour
    (« Eternamax Eternatus … on November 21 »). Sous-titres <h2> ou <h3> jusqu'à la rubrique suivante (Research…)."""
    i = body.find('id="max-battles"')
    if i < 0:
        return
    sec = body[i:]
    j = sec.find('class="event-section-header', 40)
    sec = sec[:j] if j > 0 else sec
    y0 = int(ev["start"][:4])
    for part in re.split(r"(?=<h[23]\b)", sec)[1:]:
        head = text_of((re.match(r"<h[23][^>]*>(.*?)</h[23]>", part, re.S) or [None, ""])[1])
        start, end = ev["start"][:19], (ev.get("end") or ev["start"])[:19]
        m = re.search(rf"({MONTHS}) (\d{{1,2}})\b", head)
        m = m.groups() if m else None
        if not m:  # premier paragraphe qui ne cite qu'un jour (pas « Saturday, November 14, and Sunday, November 15 »)
            days = re.findall(rf"({MONTHS}) (\d{{1,2}})\b", text_of((re.search(r"(?s)<p>(.*?)</p>", part) or [None, ""])[1]))
            m = days[0] if len(set(days)) == 1 else None
        if m:
            day = datetime.strptime(f"{m[0]} {m[1]} {y0}", "%B %d %Y")
            if day.strftime("%Y-%m-%d") < ev["start"][:10]:
                day = day.replace(year=y0 + 1)  # événement à cheval sur deux années
            start, end = day.strftime("%Y-%m-%dT00:00:00"), day.strftime("%Y-%m-%dT23:59:59")
        if end[:16] <= NOW:
            continue
        for it in re.findall(r'class="pkmn-name">(.*?)</div>', part, re.S):
            it = text_of(it)
            nm = NAME_RE.search(it)
            if not nm:
                continue
            k = "giga" if re.search(r"Gigantamax|Eternamax", it + " " + head) else "dyna"
            key = (EN[nm.group(1)], k, start[:10])
            maxb.setdefault(key, {"dex": key[0], "kind": k, "start": start, "end": end, "event": ev.get("name") or ""})


for ev in events:
    if (ev.get("end") or "9999")[:16] <= NOW:
        continue
    try:
        page = get(ev["link"], raw=True)
    except Exception as e:
        print("page indisponible :", ev["link"], e)
        ok_pages = ok_max = False
        continue
    body = re.sub(r"(?s)<(script|style|svg)\b.*?</\1>", "", page[page.find("<body"):])
    max_section(ev, body)
    if (ev.get("start") or "")[:16] <= NOW:
        continue  # déjà commencé : ses nouveautés ne sont plus « à venir »
    # Une section = un titre <h2> et ce qui suit jusqu'au titre suivant
    for sec in re.split(r"(?=<h2\b)", body):
        head = text_of((re.match(r"<h2[^>]*>(.*?)</h2>", sec, re.S) or [None, ""])[1])
        hits = []
        if re.search(r"\bDebuts?\b", head):
            # Liste d'images sous le titre (« Pokémon Debuts » : Maschiff, Mabosstiff…), sinon le titre lui-même
            items = [text_of(x) for x in re.findall(r'class="pkmn-name">(.*?)</div>', sec, re.S)]
            for it in items or [head]:
                hits += found_in(it, kind_of(head))
        for s in sentences(text_of(sec)):
            # Une proposition à la fois : « Regidrago … debut, and Meltan … debut » ; pas « has debuted »
            for c in re.split(r",\s+and\s+|;\s+", s):
                if re.search(r"\bdebuts?\b", c) and not re.search(r"\b(has|have|had|previously)\b", c):
                    hits += found_in(c)
        for n, reg, k, mform, sh in hits:
            if k == "" and not sh and n in released and not reg:
                continue  # espèce déjà sortie : un début de forme qu'on ne suit pas (noyau de Météno)
            if sh and n in shiny:
                continue
            key = (n, reg, k, mform, sh)
            if key not in out or ev["start"] < out[key]["start"]:
                out[key] = {"dex": n, "reg": reg, "kind": k, "mform": mform, "shiny": sh, "start": ev["start"][:19],
                            "event": ev.get("name") or "", "link": ev["link"]}

# Shiny datés dans le futur (« pm36.fMEGA » le 28/11 : Méga-Mélodelfe shiny)
ok_shiny = True
try:
    for x in get("https://leekduck.com/shiny/pms.json"):
        m = re.match(r"pm(\d+)(?:\.f(MEGA(?:_([XY]))?|ALOLA|GALARIAN|HISUIAN|PALDEA\w*))?$", x.get("aa_fn") or "")
        d = (x.get("released_date") or "").replace("/", "-")
        if not m or not d or d <= NOW[:10]:
            continue
        f = m.group(2) or ""
        k = "mega" if f.startswith("MEGA") else ""
        key = (int(m.group(1)), "" if k else f, k, m.group(3) or "", True)
        out.setdefault(key, {"dex": key[0], "reg": key[1], "kind": k, "mform": key[3], "shiny": True,
                             "start": d + "T00:00:00", "event": "", "link": "https://leekduck.com/shiny/"})
except Exception as e:
    print("shiny Leek Duck indisponible :", e)
    ok_shiny = False

# Source en panne : ses débuts d'hier restent (s'ils sont encore à venir)
for o in old:
    if o["start"][:16] > NOW and ((not ok_pages and o["event"]) or (not ok_shiny and not o["event"])):
        out.setdefault((o["dex"], o["reg"], o["kind"], o["mform"], o["shiny"]), o)
prev = {(o["dex"], o["reg"], o["kind"], o["mform"]): o.get("sprite") for o in old}
for (n, reg, k, mform, sh), v in out.items():
    v["sprite"] = prev.get((n, reg, k, mform)) or sprite(n, k, mform)
res = sorted(out.values(), key=lambda v: (v["start"], v["dex"]))
# Combats Max : une page en panne garde ceux d'hier encore en cours ou à venir
if not ok_max:
    for o in old_max:
        if o["end"][:16] > NOW:
            maxb.setdefault((o["dex"], o["kind"], o["start"][:10]), o)
mres = sorted(maxb.values(), key=lambda v: (v["start"], v["dex"]))
with open("debuts.json", "w", encoding="utf-8") as f:
    json.dump({"time": datetime.now(timezone.utc).isoformat(timespec="seconds"), "debuts": res, "max": mres},
              f, ensure_ascii=False, separators=(",", ":"))
for v in mres:
    print("max", v["start"][:10], v["end"][:10], v["dex"], names[v["dex"] - 1], v["kind"], "←", v["event"])
for v in res:
    print(v["start"][:10], v["dex"], names[v["dex"] - 1], v["reg"], v["kind"], v["mform"], "shiny" if v["shiny"] else "", "←", v["event"])
