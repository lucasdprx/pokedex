"""Notification du matin : les Pokémon qui manquent à chaque personne et qui viennent d'arriver.

Lit ScrapedDuck (raids, œufs, études, Heures vedettes, Journées Communauté en cours, combats Max
d'aujourd'hui et de demain), puis pour
chaque compte abonné (users/<uid>.pushSub) envoie une seule notification qui les liste.
Un Pokémon n'est annoncé qu'une fois : users/<uid>.pushSent garde ce qui l'a déjà été.
Lancé chaque matin par .github/workflows/notify.yml.

Secrets : FIREBASE_SA (clé JSON d'un compte de service Firebase), VAPID_PRIVATE.
"""
import json, os, re, urllib.request
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import firebase_admin
from firebase_admin import credentials, firestore
from pywebpush import webpush, WebPushException

DUCK = "https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/"
SITE = "https://pokedex-go.pages.dev/"
REGIONAL = {"Alolan": "Alola", "Galarian": "Galarian", "Hisuian": "Hisuian", "Paldean": "Paldea"}
REG_PREFIX = tuple(REGIONAL.values())
TEXT = {
    "fr": ("{n} Pokémon qui te manque", "{n} Pokémon qui te manquent", " et "),
    "en": ("{n} Pokémon you're missing", "{n} Pokémon you're missing", " and "),
}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (pokedex notify)"})
    return json.loads(urllib.request.urlopen(req, timeout=60).read().decode("utf-8"))


def when(s):
    if not s:
        return None
    d = datetime.fromisoformat(s.replace("Z", "+00:00"))
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def dex_of(img):
    m = re.search(r"(?:pm|pokemon_icon_|poke_capture_0*)(\d+)", img or "")
    return int(m.group(1)) if m else 0


# --- Ce qu'on peut avoir maintenant : (n°, forme régionale ou None) → comment ---
now = datetime.now(timezone.utc)
avail = {}


def add(name, img, how):
    dex = dex_of(img)
    if not dex:
        return
    name = name or ""
    reg = next((f for w, f in REGIONAL.items() if w in name), None)
    # Méga et Obscurs : comparés à leur collection (mega, shadow), pas au Pokédex normal
    kind = "mega" if re.match(r"(Mega|Primal) ", name) else "shadow" if name.startswith("Shadow ") else None
    mform = (re.search(r" ([XY])$", name) or [None, ""])[1] if kind == "mega" else ""
    # Obscur : sa forme régionale compte (Rattata d'Alola obscur ≠ Rattata obscur)
    avail.setdefault((dex, None if kind == "mega" else reg, kind, mform), how)


events = get(DUCK + "events.json")


def tier(s):
    if re.search(r"mega", s or "", re.I):
        return "mega"
    m = re.search(r"(\d)-star", s or "", re.I)
    return m.group(1) if m else ""


# Raids : raids.json du site (page Raids de Leek Duck, relue chaque heure), corrigé par le calendrier comme
# sur le site (events.js) : le calendrier l'emporte pour son niveau, les boss dont la période est finie sont retirés
bare = lambda n: re.sub(r"\s*\(.*$", "", re.sub(r"^Shadow ", "", n or "")).lower()
live, ended = {}, set()
for ev in events:
    bosses = ((ev.get("extraData") or {}).get("raidbattles") or {}).get("bosses") or []
    if not bosses:
        continue
    k = (bool(re.search("shadow", ev.get("name") or "", re.I)), tier(ev.get("name")) or "5")
    start, end = when(ev.get("start")), when(ev.get("end"))
    if end and end < now:
        ended.update(k + (bare(b.get("name")),) for b in bosses)
    elif start and start <= now:
        live.setdefault(k, []).extend(bosses)
try:
    own = json.load(open("raids.json", encoding="utf-8"))
    # Ancien format (liste) ou fichier plus mis à jour depuis 12 h (tools/raids.py en panne) : ScrapedDuck
    if isinstance(own, list) or now - when(own["time"]) > timedelta(hours=12):
        raise ValueError("raids.json trop vieux")
    raids = own["raids"]
except Exception:
    raids = get(DUCK + "raids.json")
for r in raids:
    k = (r["name"].startswith("Shadow "), tier(r.get("tier")))
    if k not in live and k + (bare(r["name"]),) not in ended:
        add(r["name"], r.get("image"), ("raid", r.get("tier", "")))
for (shadow, t), bosses in live.items():
    for b in bosses:
        name = b.get("name") or ""
        add(("Shadow " if shadow and not name.startswith("Shadow ") else "") + ("Mega " if t == "mega" and not re.match(r"(Mega|Primal) ", name) else "") + name,
            b.get("image"), ("raid", t))
# Team GO Rocket : l'obscur capturé après le combat (comparé à la collection Obscurs)
for x in get(DUCK + "rocketLineups.json"):
    for p in (x.get("firstPokemon") or []) + (x.get("secondPokemon") or []) + (x.get("thirdPokemon") or []):
        if p.get("isEncounter"):
            add("Shadow " + p["name"], p.get("image"), ("rocket", (x.get("name") or "", x.get("title") or "", x.get("type") or "")))
for g in get(DUCK + "eggs.json"):
    add(g["name"], g.get("image"), ("egg", g.get("eggType", "")))
for task in get(DUCK + "research.json"):
    for r in task.get("rewards", []):
        add(r["name"], r.get("image"), ("research", ""))
for ev in events:
    start, end = when(ev.get("start")), when(ev.get("end"))
    if not start or start > now or (end and end < now):
        continue
    x = ev.get("extraData") or {}
    for p in (x.get("spotlight") or {}).get("list", []):
        add(p["name"], p.get("image"), ("spotlight", ""))
    for p in (x.get("communityday") or {}).get("spawns", []):
        add(p["name"], p.get("image"), ("cday", ""))

# Combats Max d'aujourd'hui et de demain (heure de Paris ; Leek Duck donne l'heure locale) : prévenir la veille
names = json.load(open("names.json", encoding="utf-8"))
EN_DEX = {n.lower(): i + 1 for i, n in enumerate(names.get("en") or [])}
today = datetime.now(ZoneInfo("Europe/Paris")).date()
maxes = {}  # (n°, "dyna" | "giga") → (jour, heures ou "", fin)
for ev in events:
    # Seulement les combats Max (pas une étude « Gigantamax Machamp Power Up! »)
    m = ev.get("eventType") in ("max-battles", "max-mondays") and re.search(r"\b(Gigantamax|Eternamax|Dynamax) ([A-Z][\w'-]+)", ev.get("name") or "")
    s, e = ev.get("start"), ev.get("end")
    if not m or not s or not e or m.group(2).lower() not in EN_DEX:
        continue
    s, e = datetime.fromisoformat(s[:19]), datetime.fromisoformat(e[:19])
    if s.date() > today + timedelta(days=1) or e.date() < today:
        continue
    hours = f"{s.hour} h–{e.hour} h" if s.date() == e.date() else ""
    maxes.setdefault((EN_DEX[m.group(2).lower()], "dyna" if m.group(1) == "Dynamax" else "giga"), (max(s.date(), today), hours, e.date()))

# Nouveautés à venir (tools/debuts.py) : annoncées une fois, puis rappelées la veille (nouveautes v1 : C3)
REG_NAME = {"ALOLA": "Alola", "GALARIAN": "Galarian", "HISUIAN": "Hisuian", "PALDEA": "Paldea"}
try:
    debuts = [x for x in json.load(open("debuts.json", encoding="utf-8"))["debuts"] if x["start"][:10] > today.isoformat()]
except Exception as e:
    print("debuts.json illisible :", e)
    debuts = []

HOW_FR = {"raid": "en raid", "egg": "en œuf", "research": "en étude", "spotlight": "en Heure vedette", "cday": "en Journée Communauté"}
TYPE_FR = {"normal": "Normal", "fire": "Feu", "water": "Eau", "electric": "Électrik", "grass": "Plante", "ice": "Glace",
           "fighting": "Combat", "poison": "Poison", "ground": "Sol", "flying": "Vol", "psychic": "Psy", "bug": "Insecte",
           "rock": "Roche", "ghost": "Spectre", "dragon": "Dragon", "dark": "Ténèbres", "steel": "Acier", "fairy": "Fée"}


def rocket_how(lang, who):
    """« chez un Sbire Ténèbres », « chez Giovanni » / « from a Dark Grunt », « from Giovanni »."""
    name, title, ty = who
    fr = lang == "fr"
    if "Grunt" not in title:
        return f"chez {name}" if fr else f"from {name}"
    if ty:
        return f"chez un Sbire {TYPE_FR.get(ty, ty)}" if fr else f"from a {ty.capitalize()} Grunt"
    return "chez un Sbire" if fr else "from a Grunt"


HOW_EN = {"raid": "in raids", "egg": "in eggs", "research": "in research", "spotlight": "in Spotlight Hour", "cday": "on Community Day"}


def max_when(lang, day, hours, end):
    """« demain 6 h–21 h », « aujourd'hui », « jusqu'au 15/11 »."""
    fr = lang == "fr"
    if not hours and day == today:
        return (f"jusqu'au {end:%d/%m}" if fr else f"until {end:%m/%d}")
    w = ("aujourd'hui" if fr else "today") if day == today else ("demain" if fr else "tomorrow")
    return f"{w} {hours}" if hours else w


def new_when(lang, day):
    """Nouveauté : « nouveau demain », « nouveau le 28/11 » / « new tomorrow », « new on 11/28 »."""
    fr = lang == "fr"
    if day == today + timedelta(days=1):
        return "nouveau demain" if fr else "new tomorrow"
    return f"nouveau le {day:%d/%m}" if fr else f"new on {day:%m/%d}"


# Espèces qui n'existent que sous une forme « régionale » (Palarticho = 865_Galarian) : c'est leur carte de base
try:
    _forms = {}
    for e in json.load(open("dex.json", encoding="utf-8"))["data"]:
        _forms.setdefault(e["pokemon_id"], []).append(e.get("form") or "Normal")
    ONLY_REGIONAL = {d for d, fs in _forms.items() if all(f.startswith(REG_PREFIX) for f in fs)}
except Exception:
    ONLY_REGIONAL = {862, 863, 865, 866, 867}


def has(caught, dex, reg):
    """La personne a-t-elle ce Pokémon ? Forme de base : n'importe quelle forme non régionale."""
    for k in caught:
        d, _, form = k.partition("_")
        if d != str(dex):
            continue
        if reg and form.startswith(reg):
            return True
        if not reg and (dex in ONLY_REGIONAL or not form.startswith(REG_PREFIX)):
            return True
    return False


def has_form(d, dex, kind, mform, reg=None):
    """La Méga (clé « 6_MEGA_X ») ou l'Obscur (clé « 9_Normal ») est-il coché dans sa collection ?"""
    if kind == "mega":
        keys = {f"{dex}_MEGA" + (f"_{mform}" if mform else "")}
        if not mform:
            keys.add(f"{dex}_Normal")  # anciennes coches Méga
        return bool(keys & set(d.get("mega") or []))
    if kind == "dyna":
        return any(k.partition("_")[0] == str(dex) for k in d.get("dynamax") or [])
    if kind == "giga":
        return f"{dex}_GIGAMAX" in set(d.get("gigamax") or [])
    return has(d.get("shadow") or [], dex, reg)


def label(dex, reg, lang, kind=None, mform=""):
    lst = names.get(lang) or names.get("en") or []
    n = lst[dex - 1] if 0 < dex <= len(lst) else str(dex)
    if kind == "mega":
        return (f"Méga-{n}" if lang == "fr" else f"Mega {n}") + (f" {mform}" if mform else "")
    if kind == "shadow":
        return f"{label(dex, reg, lang)} obscur" if lang == "fr" else f"Shadow {label(dex, reg, lang)}"
    if kind in ("dyna", "giga"):
        if kind == "giga" and dex == 890:  # Éthernatos : Infinimax
            return f"{n} Infinimax" if lang == "fr" else f"Eternamax {n}"
        return f"{n} {'Dynamax' if kind == 'dyna' else ('Gigamax' if lang == 'fr' else 'Gigantamax')}"
    if not reg:
        return n
    fr = {"Alola": "d'Alola", "Galarian": "de Galar", "Hisuian": "de Hisui", "Paldea": "de Paldea"}
    en = {"Alola": "Alolan", "Galarian": "Galarian", "Hisuian": "Hisuian", "Paldea": "Paldean"}
    return f"{n} {fr[reg]}" if lang == "fr" else f"{en[reg]} {n}"


# --- Envoi ---
firebase_admin.initialize_app(credentials.Certificate(json.loads(os.environ["FIREBASE_SA"])))
db = firestore.client()
vapid = os.environ["VAPID_PRIVATE"]
print(len(avail), "Pokémon disponibles maintenant")
for snap in db.collection("users").stream():
    d = snap.to_dict()
    if not d.get("pushSub"):
        print(snap.id, ": pas abonné")
        continue
    caught = d.get("caught") or []
    missing = {}
    for (dex, reg, kind, mform), how in avail.items():
        got = has_form(d, dex, kind, mform, reg) if kind else has(caught, dex, reg)
        if not got:
            k = f"{dex}_{reg or ''}" + (f"_{kind}{mform}" if kind else "")
            missing[k] = (dex, reg, how, kind, mform)
    for (dex, kind), (day, hours, end) in maxes.items():
        if not has_form(d, dex, kind, ""):
            missing[f"max_{dex}_{kind}_{day}"] = (dex, None, ("max", (day, hours, end)), kind, "")
    for x in debuts:
        dex, reg, kind, mform = x["dex"], REG_NAME.get(x["reg"]), x["kind"] or None, x["mform"]
        got = (has(d.get("shiny") or [], dex, reg) if x["shiny"] else
               has_form(d, dex, kind, mform, reg) if kind else has(caught, dex, reg))
        if got:
            continue
        day = datetime.fromisoformat(x["start"][:19]).date()
        k = f"new_{dex}_{x['reg']}_{x['kind']}{mform}{'_s' if x['shiny'] else ''}"
        missing[k] = (dex, reg, ("new", (day, x["shiny"])), kind, mform)
        if day == today + timedelta(days=1):
            missing[k + "_eve"] = (dex, reg, ("new", (day, x["shiny"])), kind, mform)
    sent = set(d.get("pushSent") or [])
    test = os.environ.get("TEST") == "true"  # lancé à la main avec « test » : tout annoncer, sans rien noter
    fresh = [v for k, v in missing.items() if test or k not in sent]
    upd = {"pushSent": sorted(missing)}  # repartis : annoncés à nouveau s'ils reviennent
    # Premier matin après l'abonnement : on note ce qui est déjà là, sans tout annoncer
    print(snap.id, f": {len(missing)} manquants dispo, {len(fresh)} nouveaux, test={test}, premier passage={'pushSent' not in d}")
    if fresh and ("pushSent" in d or test):
        lang = "fr" if d.get("pushLang") == "fr" else "en"
        one, many, et = TEXT[lang]
        hows = HOW_FR if lang == "fr" else HOW_EN
        # Combats Max d'abord : ils ne durent que quelques heures
        fresh.sort(key=lambda v: {"max": 0, "new": 1}.get(v[2][0], 2))  # nouveautés ensuite : rares et datées
        # Une nouveauté annoncée et rappelée le même matin (annonce la veille) : une seule fois
        seen_new, uniq = set(), []
        for v in fresh:
            if v[2][0] == "new":
                if (v[0], v[1], v[3], v[4], v[2][1]) in seen_new:
                    continue
                seen_new.add((v[0], v[1], v[3], v[4], v[2][1]))
            uniq.append(v)
        fresh = uniq
        parts = [f"{label(dex, reg, lang, kind, mform)}" + (" shiny" if how[0] == "new" and how[1][1] else "") + " " +
                 (max_when(lang, *how[1]) if how[0] == "max" else rocket_how(lang, how[1]) if how[0] == "rocket"
                  else new_when(lang, how[1][0]) if how[0] == "new" else hows[how[0]])
                 for dex, reg, how, kind, mform in fresh[:4]]
        body = (", ".join(parts[:-1]) + et + parts[-1]) if len(parts) > 1 else parts[0]
        if len(fresh) > 4:
            body += "…"
        msg = {"title": (one if len(fresh) == 1 else many).format(n=len(fresh)), "body": body,
               "icon": f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/{fresh[0][0]}.png"}
        try:
            webpush(json.loads(d["pushSub"]), json.dumps(msg, ensure_ascii=False), vapid_private_key=vapid,
                    vapid_claims={"sub": "mailto:darpeixlucas@gmail.com"})
            print(snap.id, ": envoyé →", msg["title"], "/", msg["body"])
        except WebPushException as e:
            if e.response is not None and e.response.status_code in (404, 410):
                upd["pushSub"] = None  # appareil désabonné
            print(snap.id, "échec", e)
    if test:
        upd.pop("pushSent")
    if upd:
        snap.reference.update(upd)
