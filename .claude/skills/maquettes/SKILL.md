---
name: maquettes
description: Faire choisir une interface de Pokédex GO à l'utilisateur sur maquettes avant de la coder — une page HTML de variantes numérotées (vrais cadres, vrais textes, animées ou interactives si l'écran l'est), vue sur son téléphone par « Aperçu de l'appli » ou dans un navigateur, votes 👍/👎 et remarques renvoyés à Claude, une capture par variante, puis le choix gardé. À utiliser pour tout nouvel écran ou changement visible, quand il demande « fais-moi des maquettes », « montre-moi avant de coder », hésite entre plusieurs designs, ou avant de coder toute nouvelle interface — sans attendre qu'il dise « maquettes », y compris au milieu d'un autre skill (une vue, un costume, une fonction) qui mène à un changement visible.
metadata:
  template: maquettes
  template-version: 1.8.3
  template-from: 83e492bcbf0bcffa
---

# Maquettes (Pokédex GO)

L'utilisateur choisit sur pièces : un écran ne se code qu'après son choix sur maquettes.
Tout vit dans `maquettes/` : un dossier par sujet (`maquettes/<sujet>/`), une page par tour
(`v1.html`, `v2.html`… ; un tour de retouches = nouvelle page, l'ancienne reste). Un sujet = une
question précise (`emote-non-lu`, `notes-taches`), pas une partie de l'appli : le sommaire reste
lisible et deux sessions n'écrivent pas dans le même dossier. Commun :
`common/mock.css` (habillage, cadres), `common/mock.js` (mise à l'échelle, `?only=`, votes, envoi ;
**à charger en dernier**), `serve.py` (port 5197).
Une session dans un worktree (`.claude/worktrees/<nom>/`) écrit ses pages dans le `maquettes/` de
son worktree : le serveur du dépôt principal les sert aussi et y écrit leurs retours, sans copie.
Maquetter une autre appli que celle de la session : avec son skill maquettes et dans son dossier.

## 1. Comprendre, regarder

- Lire le code actuel de l'écran concerné, le `CLAUDE.md` et la mémoire : choix déjà faits, goûts.
- **Lire `~/.claude/ui-slop.md`** s'il existe (sa liste de ce qu'il refuse dans une interface).
- Regarder le vrai, pas un souvenir. Avant toute variante, l'en-tête de la page dit trois choses :
  - **Référence** : comment deux ou trois applis (jeux, sites) qui font déjà la chose s'y prennent,
    vues pour de vrai (sa vidéo ou ses captures, l'appli ouverte sur le téléphone ou le PC, une
    recherche), gestes et durées compris, sources en liens. S'il en cite une, celle-là d'abord.
    Elle sert à regarder, pas à calquer : la copie fidèle perd presque toujours face à une variante
    dans le style propre de Pokédex GO, qu'il y en ait au moins une.
  - **Aujourd'hui** : ce que fait Pokédex GO maintenant, lu dans le code, et ce qui y manque.
  - **La scène** : un moment concret de sa vie où la fonction sert (qui, quoi, pourquoi maintenant),
    le même sur tous les cadres.
- Puis lister les questions à trancher. N'en garder que celles dont la réponse change ce qui sera
  codé et qu'il ne trancherait pas les yeux fermés ; chercher aussi celles qui ne se voient pas à
  l'écran (règles, son, ce qui compte ou non, ce qui arrive en cas d'échec). Ce qui n'a qu'une
  réponse sensée, ou une suite d'écrans sans alternative, tient en une ligne de l'en-tête
  (« Sans question : … »), pas dans une section à voter. Une question de libellé seule ne fait pas
  une section.
- Un moyen technique (quel service, quelle bibliothèque, quel protocole) ne se vote pas : il juge le
  résultat (« en un clic »), Claude tranche et l'écrit dans « Sans question ».
- Avant de montrer une variante, vérifier qu'elle se code (limites de la plateforme, des composants,
  d'une API) : une variante votée puis infaisable coûte un tour.
<!-- local:regarder -->
- Le vrai écran : `index.html` (appli d'une seule page, styles et script dedans), ouvert dans Edge
  ou installé sur le téléphone (PWA, `manifest.webmanifest`, `sw.js`). Données réelles :
  `pokedex-go-*.json` (progression exportée). Essais déjà faits : `maquettes/interface.html`,
  `maquettes/index-avant-A.html`.
<!-- /local -->
<!-- local:gouts -->
- Couleurs et police de `index.html` (`--bg #1a1a2e`, `--card #16213e`, `--accent #e94560`,
  `--accent2 #4ecca3`, `system-ui`), reprises dans `common/mock.css`. Vrais Pokémon et vrais
  chiffres de sa progression, jamais d'exemples inventés.
<!-- /local -->

## 2. La page

- Un en-tête (ce qui change, ce qui manque ou est provisoire), une **section** par question à trancher
  (l'écran, le chemin pour y aller, les mots…), 2 à 5 variantes **vraiment différentes** par section,
  pas des nuances : `<div class="variant" data-id="E1">` avec `.vhead` (`.vid` + `.vname`), `.vdesc` (ce qui change et
  pourquoi, une ou deux phrases), puis le cadre `.phone`. Modèle : `exemple/v1.html` du kit, ou la
  dernière page faite.
- Le numéro du tour se prend juste avant d'écrire (`ls <sujet>/v*.html`, le premier libre) : ne
  jamais écrire sur un `v<N>` qui existe, une autre session peut y travailler.
- Les classes du kit sont réservées (`page`, `row`, `stack`, `stage`, `variant`, `vhead`, `vid`,
  `vname`, `vdesc`, `phone`, `screen`, `card`, `toggle`, `vote`, `send`… : voir `common/mock.css`) :
  celles de la page portent un préfixe à elle (`rg-page`, pas `page`). Son script tient dans une
  fonction (`(() => { … })()`) : un `const top` ou `name` global casse la page (`window.top`).
- Pages et scripts s'écrivent avec Write ou Edit, jamais par heredoc bash (apostrophes, `\`).
- Une question qui change le code se pose dans une section, jamais seulement dans `#global` (il n'y
  répond presque jamais) : ses réponses en variantes, sans cadre si ce sont des mots, celle que Claude
  prendrait sans réponse marquée « (par défaut) » dans son `.vname`.
- Retoucher un écran qui existe : une variante « Actuel » (`X0`) dans chaque section (elle gagne
  souvent), et toute l'info de l'écran actuel gardée, sauf si c'est la question. Parmi les variantes,
  toujours la plus directe.
- Une question de règle ou de comportement (quand Claude écrit, ce qui se passe si…) se montre
  aussi : une scène concrète par variante (ce qui arrive, avant/après, sur le vrai écran), pas une
  phrase à interpréter.
- La scène part du vrai état d'avant (clavier ouvert, l'écran d'où l'on vient) et passe par les
  états que la fonction croisera (en mouvement, deux gestes de suite, un autre habillage, une longue
  attente à sa vraie durée), pas seulement le moment idéal : les bugs d'après le code venaient de là.
- Médias et contenus réels : une vidéo se joue ; un texte qu'écrira un modèle est écrit par ce modèle
  (son vrai prompt), sinon la variante dit que c'est une cible.
- Même moment et mêmes données sur tous les cadres d'une section ; vrais textes (ses projets, ses
  contenus), rien de « Lorem ». Les couleurs, polices et images sont celles de Pokédex GO : pas de
  palette inventée.
- Prévoir la croissance : un écran qui liste du contenu appelé à grossir le montre plein (vrais
  éléments, dire comment ça tient), pas seulement avec ceux d'aujourd'hui.
- Si l'écran réagit (choix, onglets), la maquette réagit. S'il bouge, elle bouge : scénario court qui
  boucle, avec une barre de **moments clés** en haut (un bouton par étape, « ▶ En boucle ») qui fige
  tous les cadres au même instant, et `?at=<ms>` pour les captures : comparable d'un coup d'œil. Une
  fonction qui se déroule dans le temps (filmer, envoyer, une transition) n'est jamais montrée figée,
  et un « Ralenti » aide à juger un mouvement court.
- **Un geste se joue.** Quand la question est un geste (maintenir, glisser, pincer, toucher deux
  fois), le cadre y répond sur la page (événements pointeur, au doigt sur le téléphone comme à la
  souris) : il l'essaie au lieu de juger un dessin du geste.
- **Où ça va ? Le laisser placer.** Quand la question est une place (un objet dans la scène, un bouton
  sur l'écran), ne pas dessiner cinq suppositions : lui donner l'objet à faire glisser sur le vrai écran.
  `<img class="place" data-name="objet" data-x="800" data-y="700" data-scale="1">` dans un `.stage` (x, y =
  son point d'ancrage en pixels du cadre, le bas au milieu par défaut) se déplace au doigt ou à la souris ;
  `data-scale` ajoute sous le cadre un curseur de taille (`data-scale-min` / `-max`) et « Remettre ». Le kit
  le garde par page et l'envoie avec les remarques (« P1 placement objet : x=… y=… taille=… (data-info) »).
  Chaque changement déclenche `mockplace` (remonte, `detail {variant, name, x, y, scale}`) : la page
  l'écoute pour régler la taille selon la perspective, le refléter dans un autre cadre, et écrire dans
  `el.dataset.info` ce dont le code aura besoin (la position réelle sous l'objet, par exemple).
- En bas : `<textarea id="global">` (remarque libre) et `<button id="send">`.
- `?only=E1` n'affiche que ce cadre (captures).

## 3. Relire, vérifier, capturer

- **Relire la page en critique avant de la montrer**, et refaire ce qui ne passe pas :
  - l'en-tête a sa référence vue pour de vrai, l'aujourd'hui et la scène ;
  - chaque section pose une question qui compte, avec au moins deux réponses vraiment différentes
    (jamais une seule proposition « à valider ») ;
  - ce qui bouge bouge, ce qui se touche se touche ;
  - chaque remarque du tour d'avant se voit, à tous les moments du scénario ;
  - la console n'a pas d'erreur (une section vide = une erreur JS) ;
  - comparée à une page qu'il a aimée (le dernier tour retenu de ce projet, ou d'un autre projet de
    la marketplace : `variantes.md` du template), elle n'est ni moins soignée ni moins vivante.

- Serveur : `curl -s http://127.0.0.1:5197/qui` doit écrire le chemin de ce `maquettes/`. Rien :
  lancer `serve.py` détaché, depuis le dépôt principal (Windows `pythonw maquettes/serve.py`, macOS
  et Linux `nohup python3 maquettes/serve.py >/dev/null 2>&1 &`) et revérifier. Un autre chemin ou
  une autre réponse : le port est pris par un autre projet ou un autre serveur, prendre un port libre
  (`PORT` de `serve.py` et ce skill). Les pages ne se montrent que par ce serveur : ouvertes en
  fichier, par un serveur statique, le serveur de dev du projet ou un panneau d'aperçu, les votes ne
  vont nulle part.
- Une page longue à préparer (images à rendre) s'écrit `v<N>.brouillon.html` : le sommaire ne la
  montre qu'une fois renommée `v<N>.html`, quand tout est prêt.
- Regarder la page entière, pas seulement les cadres : les captures `?only=` n'ont ni l'en-tête ni
  les sections, un conflit de style s'y cache. Une capture sans `?only=` à la largeur du téléphone :
  Edge sans fenêtre ne descend pas sous 492 px (plus étroit, la capture est rognée et montre un faux
  débordement), donc la page dans une iframe de 412 px, depuis un fichier local (`$TEMP/tel.html` :
  `<body style=margin:0><iframe src="http://127.0.0.1:5197/<sujet>/v<N>.html" width=412
  height=900 style=border:0>`), capturé avec `--window-size=412,900`. Corriger ce qui déborde.
- Une capture par variante dans `<sujet>/captures/v<N>/<id>.png` (Edge sans fenêtre, profil à part) :
  ```bash
  E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  "$E" --headless=new --disable-gpu --user-data-dir="$TEMP/mock-shot" --hide-scrollbars \
    --force-device-scale-factor=2 --window-size=384,770 --virtual-time-budget=3000 \
    --screenshot="$(cygpath -w $PWD/E1.png)" "http://127.0.0.1:5197/<sujet>/v1.html?only=E1"
  ```
  Un écran large peut passer en JPEG de 1200 px (PIL) pour garder le dépôt léger. Les lire (Read) pour
  vérifier, et les mettre dans la réponse (`![E1](C:\…\E1.png)`, une par ligne) : il peut suivre
  depuis son téléphone. Elles accompagnent la page (étape 4), elles ne la remplacent pas.

## 4. Lui montrer, puis attendre ses réponses SUR LE SITE

- **Le message donne le lien de la page à chaque tour**, nu et seul sur sa ligne :
  http://127.0.0.1:5197/<sujet>/v<N>.html (jamais entre backticks : il ne se toucherait plus).
  Touché dans Clawd Code sur le téléphone, il s'ouvre dans l'Aperçu de l'appli (0.91.2 et après) ;
  sur le PC, dans le navigateur. Les captures n'en sont qu'un aperçu, jamais à la place du lien.
- L'Aperçu ne liste que les serveurs qui tournent : `/qui` répond avant d'envoyer le message
  (étape 3). Il ouvre le sommaire (`/`), qui montre en grand ce qui attend son vote (le dernier tour
  d'un sujet, sans retours), puis le reste par jour, en vignettes (la capture de la variante aimée).
- **Le site est le canal de décision.** Ne pas reposer les mêmes choix par AskUserQuestion. Finir le
  tour sur les captures, où voter et « vote sur la page, puis dis-moi quand tu as envoyé tes
  retours ». Une question qui n'est pas sur les écrans va aussi dans la page (une section de
  variantes en mots).
- Il vote, écrit, touche « Envoyer mes retours à Claude » : ça s'ajoute au `retours.txt` du dossier
  de la page (horodaté). **Au message suivant, lire d'abord la fin de ce fichier**, même s'il n'en
  parle pas. Un envoi que le serveur n'a pas pris le dit sur le bouton et lui donne le texte à
  coller dans la session (`Page : …` puis une ligne par variante) : il se lit comme un envoi, et le
  serveur se répare (étape 3) avant le tour suivant.

**Lire les retours**
- Un envoi est l'état complet de la page : un nouvel envoi de la même page remplace le précédent
  (`--- … (remplace 14:02)`). Seul le dernier compte.
- Net : un seul 👍 dans la section. Deux 👍 dans une section, ou un « – » (remarque sans pouce), ne
  sont pas un choix : au tour suivant, sauf deux variantes qui s'ajoutent sans conflit (le dire).
- Un 👍 avec une remarque précise qui se code telle quelle (un seuil, « moins foncé », une condition)
  est net : coder, et le message dit comment la remarque est prise. Un 👍 qui demande d'imaginer
  (« mais », « plutôt », « j'imaginais », « trouve mieux », une autre idée) est un changement : nouveau
  tour. « X par défaut, Y à un tap » est un choix net. « Combine E1 et E3 » = un nouveau tour.
- Son message contredit ses votes (« j'aime rien » avec des 👍), ou une remarque pose une question :
  le dire et répondre avant de coder.
- Une section laissée sans vote : le message suivant dit le choix « (par défaut) » pris, jamais en
  silence.
- Rien de nouveau dans `retours.txt` alors qu'il dit avoir voté : ne pas coder ; regarder
  `maquettes/retours.log` (reçu, ignoré, dans quel dossier) et `/qui`, le lui dire, et lui demander
  ce que dit le bouton (le texte à coller s'il y est).

**Des tours qui vont vite**
- Un tour de retouches ne remontre que ce qui reste ouvert, les choix faits déjà dedans (dits en
  tête). Un sujet voté par morceaux montre dans ce tour l'écran entier assemblé.
- Une remarque qu'on peut lire de deux façons : une variante par lecture, il tranche d'un coup d'œil.
- « Pas clair », « pas intuitif » : étudier la règle sous l'écran et montrer ce qu'elle fait avec
  les vrais chiffres, pas une nouvelle mise en page.
- « Ça fait X » (« ça fait IA ») sans dire pourquoi : une section d'hypothèses de cause à voter.
- Tout refusé : lui demander pourquoi en une ligne, puis partir dans d'autres directions.

## 5. Coder ce qui a été voté

- Avant, dans le message (pas un tour) : ce qui sera codé, variante par variante. Rien d'une
  variante non retenue : un détail qu'il n'a pas choisi n'entre pas. Un écart forcé par le code se dit
  avant de coder ; il ne passe par un tour que s'il change ce qu'il voit.
- Un changement visible qui n'était sur aucune maquette (un bouton en plus, une suppression) se
  maquette ou se demande, jamais ajouté en douce.
- Après : chaque choix et chaque remarque cochés un par un, et une capture du vrai écran à côté de la
  variante retenue dans la réponse (même moment, mêmes données) : sans elle, c'est lui qui trouve les
  écarts.

## 6. Garder le choix

`retours.txt` est un brouillon, hors git (`maquettes/.gitignore`) : le choix se garde comme suit.
<!-- local:garder -->
- `maquettes/` est hors git (`.gitignore` du projet) : le choix se garde dans le commit du code
  (message en anglais, « mockup maquettes/<sujet>/v<N>: E2, L1 »).
<!-- /local -->
- Un goût nouveau ou un refus net va dans la mémoire (et dans `~/.claude/ui-slop.md` si c'est du
  « slop »).
