"""Liste des Pokémon costumés de GO : costumes.json, d'après les icônes du jeu (dépôt PokeMiners).

Une entrée par costume : n° de Pokédex, code, fichier de l'icône (et du shiny s'il existe), année, nom en
français et en anglais. Les formes qui ne sont pas des costumes (Zarbi, Morphéo, saisons de Vivaldaim…)
sont écartées ; les costumes d'une année future aussi (trouvés dans le code, pas encore sortis).
Lancé chaque jour par .github/workflows/pvp.yml.
"""
import datetime, json, re, urllib.request

TREE = "https://api.github.com/repos/PokeMiners/pogo_assets/git/trees/master?recursive=1"
DIR = "Images/Pokemon - 256x256/Addressable Assets/"  # le plus complet, 256 px
# Formes « f » qui sont des costumes : une année, ou un mot d'événement
COSTUME_F = re.compile(r"\d{4}|COSTUME|HAT|_STAR$|^POP_STAR|^ROCK_STAR|TSHIRT|FLYING_|WCS|KURTA|DOCTOR|HORIZONS|JEJU|"
                       r"KARIYUSHI|COPY|GOFEST|GOTOUR|TIARA|SCARF|CAP_|HELMET|GOGGLES|VISOR|ANNIV")

WORDS = {  # mot du code → (fr, en)
    "HALLOWEEN": ("Halloween", "Halloween"), "FALL": ("Halloween", "Halloween"), "HOLIDAY": ("Fêtes", "Holiday"),
    "WINTER": ("Hiver", "Winter"), "SPRING": ("Printemps", "Spring"), "SUMMER": ("Été", "Summer"),
    "ANNIVERSARY": ("Anniversaire", "Anniversary"), "ONE": ("1er", "1st"), "YEAR": ("", ""),
    "GOFEST": ("GO Fest", "GO Fest"), "GOTOUR": ("GO Tour", "GO Tour"), "WCS": ("Championnats du monde", "World Championships"),
    "COSTUME": ("Costume", "Costume"), "HAT": ("chapeau", "hat"), "ADVENTURE": ("Chapeau d'aventurier", "Adventure hat"),
    "GOGGLES": ("Lunettes", "Goggles"), "MONOCLE": ("Monocle", "Monocle"), "CAP": ("Casquette", "Cap"),
    "BLUE": ("bleue", "blue"), "RED": ("rouge", "red"), "YELLOW": ("jaune", "yellow"),
    "TIARA": ("Tiare", "Tiara"), "MTIARA": ("Tiare lune", "Moon tiara"), "STIARA": ("Tiare soleil", "Sun tiara"),
    "MSCARF": ("Écharpe lune", "Moon scarf"), "SSCARF": ("Écharpe soleil", "Sun scarf"),
    "FLYING": ("Pikachu volant", "Flying"), "5TH": ("5e anniversaire", "5th anniversary"), "OKINAWA": ("Okinawa", "Okinawa"),
    "ROCK": ("Rock star", "Rock star"), "POP": ("Pop star", "Pop star"), "STAR": ("", ""),
    "DOCTOR": ("Docteur", "Doctor"), "KURTA": ("Kurta", "Kurta"), "JEJU": ("Jeju", "Jeju"), "KARIYUSHI": ("Kariyushi", "Kariyushi"),
    "HORIZONS": ("Horizons", "Horizons"), "COPY": ("Clone", "Clone"), "VS": ("Duel", "Vs"), "TSHIRT": ("T-shirt", "T-shirt"),
    "DIWALI": ("Diwali", "Diwali"), "SWIM": ("Maillot", "Swimsuit"), "HELMET": ("casque", "helmet"), "GLASS": ("Casque de verre", "Glass helmet"),
    "VISOR": ("Visière", "Visor"), "FOSSIL": ("Fossile", "Fossil"), "TRAIN": ("Chef de gare", "Train conductor"), "CONDUCTOR": ("", ""),
    "PI": ("Pi", "Pi"), "NIGHTCAP": ("Bonnet de nuit", "Nightcap"), "ROYAL": ("Royal", "Royal"), "FASHION": ("Mode", "Fashion"),
    "GEMS": ("Gemmes", "Gems"), "BANDANA": ("Bandana", "Bandana"), "INSTINCT": ("Intuition", "Instinct"), "MYSTIC": ("Sagesse", "Mystic"),
    "VALOR": ("Bravoure", "Valor"), "SAFARI": ("Safari", "Safari"), "KANTO": ("Kanto", "Kanto"), "JOHTO": ("Johto", "Johto"),
    "HOENN": ("Hoenn", "Hoenn"), "SINNOH": ("Sinnoh", "Sinnoh"), "TCG": ("JCC", "TCG"), "INDONESIA": ("Indonésie", "Indonesia"),
    "MALAYSIA": ("Malaisie", "Malaysia"), "PHILIPPINE": ("Philippines", "Philippines"), "SINGAPORE": ("Singapour", "Singapore"),
    "TAIWAN": ("Taïwan", "Taiwan"), "THAILAND": ("Thaïlande", "Thailand"), "WILDAREA": ("Zone Sauvage", "Wild Area"),
    "JAN": ("Janvier", "January"), "FEB": ("Février", "February"), "APRIL": ("Avril", "April"), "MAY": ("Mai", "May"),
    "NOVEMBER": ("Novembre", "November"), "NOEVOLVE": ("", ""), "ANNIV": ("", ""),
}
COLORS = {"BLUE": ("bleu", "blue"), "RED": ("rouge", "red"), "YELLOW": ("jaune", "yellow")}
GENDER = {"GOGGLES": "es", "CAP": "e", "MONOCLE": ""}  # accord de la couleur en français

def label(code, lang):
    out, words = [], code.upper().split("_")
    if "ADVENTURE" in words and "HAT" in words:
        words.remove("HAT")
    if "GLASS" in words and "HELMET" in words:
        words.remove("HELMET")
    for i, w in enumerate(words):
        if w in COLORS:
            c = COLORS[w][0 if lang == "fr" else 1]
            g = GENDER.get(words[i - 1], "") if lang == "fr" else ""
            out.append(c + ("s" if g == "es" else "") if c.endswith("e") else c + g)
            continue
        if re.fullmatch(r"\d{4}", w):
            out.append(w)
        elif re.fullmatch(r"0?\d|[A-C]", w):
            out.append(w.lstrip("0") or w)
        elif w in WORDS:
            out.append(WORDS[w][0 if lang == "fr" else 1])
        else:
            out.append(w.capitalize())
    s = " ".join(x for x in out if x)
    return s[:1].upper() + s[1:]

tree = json.load(urllib.request.urlopen(urllib.request.Request(TREE, headers={"User-Agent": "pokedex-go"}), timeout=120))
files = {x["path"][len(DIR):] for x in tree["tree"] if x["path"].startswith(DIR) and x["path"].endswith(".icon.png")}
year_now = datetime.date.today().year
seen, out = set(), []
for f in sorted(files):
    m = re.fullmatch(r"pm(\d+)\.(?:f(\w+?)\.)?(?:c(\w+?)\.)?(?:g2\.)?icon\.png", f)
    if not m:
        continue
    dex, form, cos = int(m.group(1)), m.group(2), m.group(3)
    code = cos or form
    if not code or (not cos and not COSTUME_F.search(code)):
        continue
    years = [int(y) for y in re.findall(r"(?<!\d)(20\d\d)(?!\d)", code)]
    if years and max(years) > year_now:
        continue  # pas encore sorti
    key = (dex, code.upper().replace("_NOEVOLVE", ""))  # « _NOEVOLVE » : même costume, l'évolution le perd
    if key in seen:
        continue
    seen.add(key)
    base = f"pm{dex}." + (f"f{form}." if form else "") + (f"c{cos}." if cos else "")
    icon = base + "icon.png" if base + "icon.png" in files else base + "g2.icon.png"
    shiny = next((s for s in (base + "s.icon.png", base + "g2.s.icon.png") if s in files), None)
    out.append({"id": dex, "code": code, "icon": icon, "shiny": shiny, "year": max(years) if years else None,
                "fr": label(code, "fr"), "en": label(code, "en")})

with open("costumes.json", "w", encoding="utf-8") as fh:
    json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
print(len(out), "costumes,", len({c["id"] for c in out}), "espèces")
