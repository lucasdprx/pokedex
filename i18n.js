// Textes du site dans les 9 langues de Pokémon GO.
// Noms des Pokémon : names.json (PokeAPI). Types et régions : noms officiels.
// Menus et messages : traduits sans relecture par un locuteur natif.

const LANGS = [
  ["fr", "Français"], ["en", "English"], ["de", "Deutsch"], ["es", "Español"], ["it", "Italiano"],
  ["pt", "Português"], ["ja", "日本語"], ["ko", "한국어"], ["zh", "中文"],
];

const TYPE_NAMES = {
  fr: {Normal:"Normal",Fighting:"Combat",Flying:"Vol",Poison:"Poison",Ground:"Sol",Rock:"Roche",Bug:"Insecte",Ghost:"Spectre",Steel:"Acier",Fire:"Feu",Water:"Eau",Grass:"Plante",Electric:"Électrik",Psychic:"Psy",Ice:"Glace",Dragon:"Dragon",Dark:"Ténèbres",Fairy:"Fée"},
  en: {Normal:"Normal",Fighting:"Fighting",Flying:"Flying",Poison:"Poison",Ground:"Ground",Rock:"Rock",Bug:"Bug",Ghost:"Ghost",Steel:"Steel",Fire:"Fire",Water:"Water",Grass:"Grass",Electric:"Electric",Psychic:"Psychic",Ice:"Ice",Dragon:"Dragon",Dark:"Dark",Fairy:"Fairy"},
  de: {Normal:"Normal",Fighting:"Kampf",Flying:"Flug",Poison:"Gift",Ground:"Boden",Rock:"Gestein",Bug:"Käfer",Ghost:"Geist",Steel:"Stahl",Fire:"Feuer",Water:"Wasser",Grass:"Pflanze",Electric:"Elektro",Psychic:"Psycho",Ice:"Eis",Dragon:"Drache",Dark:"Unlicht",Fairy:"Fee"},
  es: {Normal:"Normal",Fighting:"Lucha",Flying:"Volador",Poison:"Veneno",Ground:"Tierra",Rock:"Roca",Bug:"Bicho",Ghost:"Fantasma",Steel:"Acero",Fire:"Fuego",Water:"Agua",Grass:"Planta",Electric:"Eléctrico",Psychic:"Psíquico",Ice:"Hielo",Dragon:"Dragón",Dark:"Siniestro",Fairy:"Hada"},
  it: {Normal:"Normale",Fighting:"Lotta",Flying:"Volante",Poison:"Veleno",Ground:"Terra",Rock:"Roccia",Bug:"Coleottero",Ghost:"Spettro",Steel:"Acciaio",Fire:"Fuoco",Water:"Acqua",Grass:"Erba",Electric:"Elettro",Psychic:"Psico",Ice:"Ghiaccio",Dragon:"Drago",Dark:"Buio",Fairy:"Folletto"},
  pt: {Normal:"Normal",Fighting:"Lutador",Flying:"Voador",Poison:"Venenoso",Ground:"Terrestre",Rock:"Pedra",Bug:"Inseto",Ghost:"Fantasma",Steel:"Aço",Fire:"Fogo",Water:"Água",Grass:"Planta",Electric:"Elétrico",Psychic:"Psíquico",Ice:"Gelo",Dragon:"Dragão",Dark:"Sombrio",Fairy:"Fada"},
  ja: {Normal:"ノーマル",Fighting:"かくとう",Flying:"ひこう",Poison:"どく",Ground:"じめん",Rock:"いわ",Bug:"むし",Ghost:"ゴースト",Steel:"はがね",Fire:"ほのお",Water:"みず",Grass:"くさ",Electric:"でんき",Psychic:"エスパー",Ice:"こおり",Dragon:"ドラゴン",Dark:"あく",Fairy:"フェアリー"},
  ko: {Normal:"노말",Fighting:"격투",Flying:"비행",Poison:"독",Ground:"땅",Rock:"바위",Bug:"벌레",Ghost:"고스트",Steel:"강철",Fire:"불꽃",Water:"물",Grass:"풀",Electric:"전기",Psychic:"에스퍼",Ice:"얼음",Dragon:"드래곤",Dark:"악",Fairy:"페어리"},
  zh: {Normal:"一般",Fighting:"格鬥",Flying:"飛行",Poison:"毒",Ground:"地面",Rock:"岩石",Bug:"蟲",Ghost:"幽靈",Steel:"鋼",Fire:"火",Water:"水",Grass:"草",Electric:"電",Psychic:"超能力",Ice:"冰",Dragon:"龍",Dark:"惡",Fairy:"妖精"},
};

// Régions : clé interne (français) → nom affiché
const REGION_NAMES = {
  en: { Unys: "Unova", Inconnu: "Unknown" },
  de: { Unys: "Einall", Inconnu: "Unbekannt" },
  es: { Unys: "Teselia", Inconnu: "Desconocida" },
  it: { Unys: "Unima", Inconnu: "Sconosciuta" },
  pt: { Unys: "Unova", Inconnu: "Desconhecida" },
  ja: { Kanto:"カントー", Johto:"ジョウト", Hoenn:"ホウエン", Sinnoh:"シンオウ", Unys:"イッシュ", Kalos:"カロス", Alola:"アローラ", Galar:"ガラル", Hisui:"ヒスイ", Paldea:"パルデア", Inconnu:"不明" },
  ko: { Kanto:"관동", Johto:"성도", Hoenn:"호연", Sinnoh:"신오", Unys:"하나", Kalos:"칼로스", Alola:"알로라", Galar:"가라르", Hisui:"히스이", Paldea:"팔데아", Inconnu:"알 수 없음" },
  zh: { Kanto:"關都", Johto:"城都", Hoenn:"豐緣", Sinnoh:"神奧", Unys:"合眾", Kalos:"卡洛斯", Alola:"阿羅拉", Galar:"伽勒爾", Hisui:"洗翠", Paldea:"帕底亞", Inconnu:"不明" },
};

// Formes régionales : {n} = nom du Pokémon
const FORM_NAMES = {
  fr: { ALOLA:"{n} d'Alola", GALARIAN:"{n} de Galar", GALARIAN_STANDARD:"{n} de Galar", GALARIAN_ZEN:"{n} de Galar (Mode Transe)", HISUIAN:"{n} de Hisui", PALDEA:"{n} de Paldea", PALDEA_COMBAT:"{n} de Paldea (Combative)", PALDEA_BLAZE:"{n} de Paldea (Flamboyante)", PALDEA_AQUA:"{n} de Paldea (Aquatique)" },
  en: { ALOLA:"Alolan {n}", GALARIAN:"Galarian {n}", GALARIAN_STANDARD:"Galarian {n}", GALARIAN_ZEN:"Galarian {n} (Zen Mode)", HISUIAN:"Hisuian {n}", PALDEA:"Paldean {n}", PALDEA_COMBAT:"Paldean {n} (Combat Breed)", PALDEA_BLAZE:"Paldean {n} (Blaze Breed)", PALDEA_AQUA:"Paldean {n} (Aqua Breed)" },
  de: { ALOLA:"Alola-{n}", GALARIAN:"Galar-{n}", GALARIAN_STANDARD:"Galar-{n}", GALARIAN_ZEN:"Galar-{n} (Trance-Modus)", HISUIAN:"Hisui-{n}", PALDEA:"Paldea-{n}", PALDEA_COMBAT:"Paldea-{n} (Gefechtsrasse)", PALDEA_BLAZE:"Paldea-{n} (Flammenrasse)", PALDEA_AQUA:"Paldea-{n} (Flutenrasse)" },
  es: { ALOLA:"{n} de Alola", GALARIAN:"{n} de Galar", GALARIAN_STANDARD:"{n} de Galar", GALARIAN_ZEN:"{n} de Galar (Modo Daruma)", HISUIAN:"{n} de Hisui", PALDEA:"{n} de Paldea", PALDEA_COMBAT:"{n} de Paldea (Raza Combatiente)", PALDEA_BLAZE:"{n} de Paldea (Raza Ardiente)", PALDEA_AQUA:"{n} de Paldea (Raza Acuática)" },
  it: { ALOLA:"{n} di Alola", GALARIAN:"{n} di Galar", GALARIAN_STANDARD:"{n} di Galar", GALARIAN_ZEN:"{n} di Galar (Stato Zen)", HISUIAN:"{n} di Hisui", PALDEA:"{n} di Paldea", PALDEA_COMBAT:"{n} di Paldea (Razza Combattiva)", PALDEA_BLAZE:"{n} di Paldea (Razza Infuocata)", PALDEA_AQUA:"{n} di Paldea (Razza Acquatica)" },
  pt: { ALOLA:"{n} de Alola", GALARIAN:"{n} de Galar", GALARIAN_STANDARD:"{n} de Galar", GALARIAN_ZEN:"{n} de Galar (Modo Zen)", HISUIAN:"{n} de Hisui", PALDEA:"{n} de Paldea", PALDEA_COMBAT:"{n} de Paldea (Raça de Combate)", PALDEA_BLAZE:"{n} de Paldea (Raça Chamejante)", PALDEA_AQUA:"{n} de Paldea (Raça Aquática)" },
  ja: { ALOLA:"{n}（アローラのすがた）", GALARIAN:"{n}（ガラルのすがた）", GALARIAN_STANDARD:"{n}（ガラルのすがた）", GALARIAN_ZEN:"{n}（ガラル・ダルマモード）", HISUIAN:"{n}（ヒスイのすがた）", PALDEA:"{n}（パルデアのすがた）", PALDEA_COMBAT:"{n}（パルデア・コンバット種）", PALDEA_BLAZE:"{n}（パルデア・ブレイズ種）", PALDEA_AQUA:"{n}（パルデア・ウォーター種）" },
  ko: { ALOLA:"{n}(알로라폼)", GALARIAN:"{n}(가라르폼)", GALARIAN_STANDARD:"{n}(가라르폼)", GALARIAN_ZEN:"{n}(가라르 달마모드)", HISUIAN:"{n}(히스이폼)", PALDEA:"{n}(팔데아폼)", PALDEA_COMBAT:"{n}(팔데아 컴뱃종)", PALDEA_BLAZE:"{n}(팔데아 블레이즈종)", PALDEA_AQUA:"{n}(팔데아 워터종)" },
  zh: { ALOLA:"{n}（阿羅拉的樣子）", GALARIAN:"{n}（伽勒爾的樣子）", GALARIAN_STANDARD:"{n}（伽勒爾的樣子）", GALARIAN_ZEN:"{n}（伽勒爾・達摩模式）", HISUIAN:"{n}（洗翠的樣子）", PALDEA:"{n}（帕底亞的樣子）", PALDEA_COMBAT:"{n}（帕底亞・鬥戰種）", PALDEA_BLAZE:"{n}（帕底亞・火熾種）", PALDEA_AQUA:"{n}（帕底亞・水瀾種）" },
};

// Menus et messages. {n}, {i}, {src} = valeurs insérées.
const UI = {
  fr: {
    normal: "Normal", shiny: "✦ Shiny", collection: "Collection", menu: "Menu", language: "Langue",
    export: "Exporter", import: "Importer",
    search: "Rechercher", searchLabel: "Rechercher par nom, n°, type, région ou forme",
    filter: "Filtre", fAll: "Tous", fCaught: "Capturés", fMissing: "Manquants", fUnavailable: "Indisponibles",
    regions: "Régions", all: "Toutes",
    loading: "Récupération des Pokémon de Pokémon GO…", loadFail: "Échec du chargement des Pokémon.", retry: "Réessayer",
    cry: "Écouter le cri", noResult: "Aucun résultat.", unavailable: "Indisponible", notOut: "Pas encore sorti", dex: "N°",
    srcSave: "Sauvegarde du site", srcShots: "Captures du Pokédex", cancel: "Annuler", close: "Fermer",
    merge: "Fusionner", replace: "Remplacer", add: "Ajouter {n}",
    newOne: "1 nouveau", newMany: "{n} nouveaux", nothingNew: "Rien de nouveau", readCount: "{src}, {n} Pokémon lus",
    reading: "Lecture des captures…", shotStep: "Capture {i} sur {n}", shotsOne: "1 capture", shotsMany: "{n} captures",
    importFail: "Échec de l'import : ", notGenie: "ce fichier n'est pas un export Poké Genie", badFormat: "format invalide",
    noOcr: "lecteur de texte introuvable (hors ligne ?)", badImage: "image illisible",
    importN: "Importer {n} Pokémon", hereOne: "{n} est déjà marqué ici.", hereMany: "{n} sont déjà marqués ici.",
  },
  en: {
    normal: "Normal", shiny: "✦ Shiny", collection: "Collection", menu: "Menu", language: "Language",
    export: "Export", import: "Import",
    search: "Search", searchLabel: "Search by name, number, type, region or form",
    filter: "Filter", fAll: "All", fCaught: "Caught", fMissing: "Missing", fUnavailable: "Unavailable",
    regions: "Regions", all: "All",
    loading: "Loading Pokémon GO Pokémon…", loadFail: "Couldn't load the Pokémon.", retry: "Retry",
    cry: "Play cry", noResult: "No results.", unavailable: "Unavailable", notOut: "Not released yet", dex: "#",
    srcSave: "Site backup", srcShots: "Pokédex screenshots", cancel: "Cancel", close: "Close",
    merge: "Merge", replace: "Replace", add: "Add {n}",
    newOne: "1 new", newMany: "{n} new", nothingNew: "Nothing new", readCount: "{src}, {n} Pokémon read",
    reading: "Reading screenshots…", shotStep: "Screenshot {i} of {n}", shotsOne: "1 screenshot", shotsMany: "{n} screenshots",
    importFail: "Import failed: ", notGenie: "this file isn't a Poké Genie export", badFormat: "invalid format",
    noOcr: "text reader unavailable (offline?)", badImage: "unreadable image",
    importN: "Import {n} Pokémon", hereOne: "{n} is already marked here.", hereMany: "{n} are already marked here.",
  },
  de: {
    normal: "Normal", shiny: "✦ Schillernd", collection: "Sammlung", menu: "Menü", language: "Sprache",
    export: "Exportieren", import: "Importieren",
    search: "Suchen", searchLabel: "Nach Name, Nummer, Typ, Region oder Form suchen",
    filter: "Filter", fAll: "Alle", fCaught: "Gefangen", fMissing: "Fehlend", fUnavailable: "Nicht verfügbar",
    regions: "Regionen", all: "Alle",
    loading: "Pokémon aus Pokémon GO werden geladen…", loadFail: "Die Pokémon konnten nicht geladen werden.", retry: "Erneut versuchen",
    cry: "Ruf abspielen", noResult: "Keine Ergebnisse.", unavailable: "Nicht verfügbar", notOut: "Noch nicht erschienen", dex: "Nr.",
    srcSave: "Sicherung der Seite", srcShots: "Pokédex-Screenshots", cancel: "Abbrechen", close: "Schließen",
    merge: "Zusammenführen", replace: "Ersetzen", add: "{n} hinzufügen",
    newOne: "1 neues", newMany: "{n} neue", nothingNew: "Nichts Neues", readCount: "{src}, {n} Pokémon gelesen",
    reading: "Screenshots werden gelesen…", shotStep: "Screenshot {i} von {n}", shotsOne: "1 Screenshot", shotsMany: "{n} Screenshots",
    importFail: "Import fehlgeschlagen: ", notGenie: "diese Datei ist kein Poké-Genie-Export", badFormat: "ungültiges Format",
    noOcr: "Texterkennung nicht verfügbar (offline?)", badImage: "Bild nicht lesbar",
    importN: "{n} Pokémon importieren", hereOne: "{n} ist hier schon markiert.", hereMany: "{n} sind hier schon markiert.",
  },
  es: {
    normal: "Normal", shiny: "✦ Variocolor", collection: "Colección", menu: "Menú", language: "Idioma",
    export: "Exportar", import: "Importar",
    search: "Buscar", searchLabel: "Buscar por nombre, número, tipo, región o forma",
    filter: "Filtro", fAll: "Todos", fCaught: "Capturados", fMissing: "Pendientes", fUnavailable: "No disponibles",
    regions: "Regiones", all: "Todas",
    loading: "Cargando los Pokémon de Pokémon GO…", loadFail: "No se pudieron cargar los Pokémon.", retry: "Reintentar",
    cry: "Escuchar el grito", noResult: "Sin resultados.", unavailable: "No disponible", notOut: "Aún no ha salido", dex: "N.º",
    srcSave: "Copia del sitio", srcShots: "Capturas de la Pokédex", cancel: "Cancelar", close: "Cerrar",
    merge: "Combinar", replace: "Reemplazar", add: "Añadir {n}",
    newOne: "1 nuevo", newMany: "{n} nuevos", nothingNew: "Nada nuevo", readCount: "{src}, {n} Pokémon leídos",
    reading: "Leyendo las capturas…", shotStep: "Captura {i} de {n}", shotsOne: "1 captura", shotsMany: "{n} capturas",
    importFail: "Error al importar: ", notGenie: "este archivo no es una exportación de Poké Genie", badFormat: "formato no válido",
    noOcr: "lector de texto no disponible (¿sin conexión?)", badImage: "imagen ilegible",
    importN: "Importar {n} Pokémon", hereOne: "{n} ya está marcado aquí.", hereMany: "{n} ya están marcados aquí.",
  },
  it: {
    normal: "Normale", shiny: "✦ Cromatico", collection: "Collezione", menu: "Menu", language: "Lingua",
    export: "Esporta", import: "Importa",
    search: "Cerca", searchLabel: "Cerca per nome, numero, tipo, regione o forma",
    filter: "Filtro", fAll: "Tutti", fCaught: "Catturati", fMissing: "Mancanti", fUnavailable: "Non disponibili",
    regions: "Regioni", all: "Tutte",
    loading: "Caricamento dei Pokémon di Pokémon GO…", loadFail: "Impossibile caricare i Pokémon.", retry: "Riprova",
    cry: "Ascolta il verso", noResult: "Nessun risultato.", unavailable: "Non disponibile", notOut: "Non ancora uscito", dex: "N.",
    srcSave: "Backup del sito", srcShots: "Screenshot del Pokédex", cancel: "Annulla", close: "Chiudi",
    merge: "Unisci", replace: "Sostituisci", add: "Aggiungi {n}",
    newOne: "1 nuovo", newMany: "{n} nuovi", nothingNew: "Niente di nuovo", readCount: "{src}, {n} Pokémon letti",
    reading: "Lettura degli screenshot…", shotStep: "Screenshot {i} di {n}", shotsOne: "1 screenshot", shotsMany: "{n} screenshot",
    importFail: "Importazione non riuscita: ", notGenie: "questo file non è un'esportazione di Poké Genie", badFormat: "formato non valido",
    noOcr: "lettore di testo non disponibile (offline?)", badImage: "immagine illeggibile",
    importN: "Importa {n} Pokémon", hereOne: "{n} è già segnato qui.", hereMany: "{n} sono già segnati qui.",
  },
  pt: {
    normal: "Normal", shiny: "✦ Brilhante", collection: "Coleção", menu: "Menu", language: "Idioma",
    export: "Exportar", import: "Importar",
    search: "Pesquisar", searchLabel: "Pesquisar por nome, número, tipo, região ou forma",
    filter: "Filtro", fAll: "Todos", fCaught: "Capturados", fMissing: "Faltando", fUnavailable: "Indisponíveis",
    regions: "Regiões", all: "Todas",
    loading: "Carregando os Pokémon do Pokémon GO…", loadFail: "Não foi possível carregar os Pokémon.", retry: "Tentar de novo",
    cry: "Ouvir o grito", noResult: "Nenhum resultado.", unavailable: "Indisponível", notOut: "Ainda não lançado", dex: "Nº",
    srcSave: "Backup do site", srcShots: "Capturas da Pokédex", cancel: "Cancelar", close: "Fechar",
    merge: "Mesclar", replace: "Substituir", add: "Adicionar {n}",
    newOne: "1 novo", newMany: "{n} novos", nothingNew: "Nada de novo", readCount: "{src}, {n} Pokémon lidos",
    reading: "Lendo as capturas…", shotStep: "Captura {i} de {n}", shotsOne: "1 captura", shotsMany: "{n} capturas",
    importFail: "Falha ao importar: ", notGenie: "este arquivo não é uma exportação do Poké Genie", badFormat: "formato inválido",
    noOcr: "leitor de texto indisponível (sem conexão?)", badImage: "imagem ilegível",
    importN: "Importar {n} Pokémon", hereOne: "{n} já está marcado aqui.", hereMany: "{n} já estão marcados aqui.",
  },
  ja: {
    normal: "通常", shiny: "✦ 色違い", collection: "コレクション", menu: "メニュー", language: "言語",
    export: "エクスポート", import: "インポート",
    search: "検索", searchLabel: "名前・番号・タイプ・地方・すがたで検索",
    filter: "フィルター", fAll: "すべて", fCaught: "捕まえた", fMissing: "未捕獲", fUnavailable: "未実装",
    regions: "地方", all: "すべて",
    loading: "Pokémon GO のポケモンを読み込み中…", loadFail: "ポケモンを読み込めませんでした。", retry: "再試行",
    cry: "鳴き声を聞く", noResult: "結果なし。", unavailable: "未実装", notOut: "未実装の色違い", dex: "No.",
    srcSave: "サイトのバックアップ", srcShots: "図鑑のスクリーンショット", cancel: "キャンセル", close: "閉じる",
    merge: "統合", replace: "置き換え", add: "{n} 匹を追加",
    newOne: "新しく 1 匹", newMany: "新しく {n} 匹", nothingNew: "新しいポケモンはいません", readCount: "{src}、{n} 匹を読み取り",
    reading: "スクリーンショットを読み取り中…", shotStep: "{n} 枚中 {i} 枚目", shotsOne: "スクリーンショット 1 枚", shotsMany: "スクリーンショット {n} 枚",
    importFail: "インポートに失敗しました：", notGenie: "Poké Genie のエクスポートではありません", badFormat: "形式が正しくありません",
    noOcr: "文字認識を読み込めません（オフライン？）", badImage: "画像を読み取れません",
    importN: "{n} 匹をインポート", hereOne: "ここではすでに {n} 匹にチェック済みです。", hereMany: "ここではすでに {n} 匹にチェック済みです。",
  },
  ko: {
    normal: "일반", shiny: "✦ 이로치", collection: "컬렉션", menu: "메뉴", language: "언어",
    export: "내보내기", import: "가져오기",
    search: "검색", searchLabel: "이름, 번호, 타입, 지방, 폼으로 검색",
    filter: "필터", fAll: "전체", fCaught: "잡음", fMissing: "못 잡음", fUnavailable: "미출시",
    regions: "지방", all: "전체",
    loading: "Pokémon GO 포켓몬을 불러오는 중…", loadFail: "포켓몬을 불러오지 못했습니다.", retry: "다시 시도",
    cry: "울음소리 듣기", noResult: "결과 없음.", unavailable: "미출시", notOut: "아직 출시되지 않음", dex: "No.",
    srcSave: "사이트 백업", srcShots: "도감 스크린샷", cancel: "취소", close: "닫기",
    merge: "합치기", replace: "바꾸기", add: "{n}마리 추가",
    newOne: "새로운 포켓몬 1마리", newMany: "새로운 포켓몬 {n}마리", nothingNew: "새로운 포켓몬 없음", readCount: "{src}, 포켓몬 {n}마리 읽음",
    reading: "스크린샷 읽는 중…", shotStep: "{n}장 중 {i}번째", shotsOne: "스크린샷 1장", shotsMany: "스크린샷 {n}장",
    importFail: "가져오기 실패: ", notGenie: "Poké Genie 내보내기 파일이 아닙니다", badFormat: "잘못된 형식",
    noOcr: "문자 인식을 불러올 수 없습니다 (오프라인?)", badImage: "이미지를 읽을 수 없습니다",
    importN: "포켓몬 {n}마리 가져오기", hereOne: "여기에는 이미 {n}마리가 체크되어 있습니다.", hereMany: "여기에는 이미 {n}마리가 체크되어 있습니다.",
  },
  zh: {
    normal: "一般", shiny: "✦ 異色", collection: "收藏", menu: "選單", language: "語言",
    export: "匯出", import: "匯入",
    search: "搜尋", searchLabel: "依名稱、編號、屬性、地區或樣子搜尋",
    filter: "篩選", fAll: "全部", fCaught: "已捕捉", fMissing: "未捕捉", fUnavailable: "未推出",
    regions: "地區", all: "全部",
    loading: "正在載入 Pokémon GO 的寶可夢…", loadFail: "無法載入寶可夢。", retry: "重試",
    cry: "聆聽叫聲", noResult: "沒有結果。", unavailable: "未推出", notOut: "尚未推出", dex: "No.",
    srcSave: "網站備份", srcShots: "圖鑑截圖", cancel: "取消", close: "關閉",
    merge: "合併", replace: "取代", add: "新增 {n} 隻",
    newOne: "新的 1 隻", newMany: "新的 {n} 隻", nothingNew: "沒有新的寶可夢", readCount: "{src}，已讀取 {n} 隻寶可夢",
    reading: "正在讀取截圖…", shotStep: "第 {i} 張，共 {n} 張", shotsOne: "1 張截圖", shotsMany: "{n} 張截圖",
    importFail: "匯入失敗：", notGenie: "這不是 Poké Genie 的匯出檔", badFormat: "格式無效",
    noOcr: "無法載入文字辨識（離線？）", badImage: "無法讀取圖片",
    importN: "匯入 {n} 隻寶可夢", hereOne: "這裡已勾選 {n} 隻。", hereMany: "這裡已勾選 {n} 隻。",
  },
};

// Langue au premier lancement : celle du téléphone, sinon l'anglais
const LANG_KEY = "pokedex-go-lang";
function startLang() {
  const saved = localStorage.getItem(LANG_KEY);
  if (UI[saved]) return saved;
  for (const l of navigator.languages || [navigator.language || ""]) {
    const code = (l || "").slice(0, 2).toLowerCase();
    if (UI[code]) return code;
  }
  return "en";
}
let LANG = startLang();

function t(key, vars = {}) {
  const s = (UI[LANG] && UI[LANG][key]) ?? UI.fr[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}
// Pluriel simple : clé + "One" ou "Many"
const tn = (key, n, vars = {}) => t(key + (n === 1 ? "One" : "Many"), { n, ...vars });
const typeName = ty => (TYPE_NAMES[LANG] || TYPE_NAMES.en)[ty] || ty;
const regionName = r => (REGION_NAMES[LANG] || {})[r] || r;
