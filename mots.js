/* ====================================================================
   UNDERCOVER Z — BANQUE DE PERSOS
   Version 1 · 100 duos : 50 « pur manga » + 50 « crossover »

   ---- COMMENT MODIFIER CE FICHIER -----------------------------------
   Un duo s'écrit toujours dans cet ordre :
       [ perso des CIVILS , perso de l'INFILTRÉ , pourquoi ils se ressemblent ]

   • PUR_MANGA : les duos sont rangés par manga, les deux persos viennent
     du manga de la section. Pas besoin de répéter le nom du manga.
         ["Sasuke", "Itachi", "frères, Sharingan, cheveux noirs"]

   • CROSSOVER : chaque perso est suivi de la clé de son manga.
         ["Livaï", "snk", "Sasuke", "naruto", "beaux gosses froids..."]

   • Pour ajouter un manga : une ligne dans MANGAS, puis sa section dans
     PUR_MANGA. La clé (à gauche) ne doit jamais changer une fois utilisée.

   • Photos : trouvées automatiquement, pas besoin de les écrire ici.
         img/persos/<manga>/<nom-du-perso>.jpg
         ex. "Barbe Blanche" (One Piece) → img/persos/onepiece/barbe-blanche.jpg
     Photo absente = silhouette + nom du perso, le jeu tourne quand même.

   • Ne touche pas la partie MOTEUR, tout en bas du fichier.
   ==================================================================== */

const MANGAS = {
  naruto:      "Naruto",
  onepiece:    "One Piece",
  dbz:         "Dragon Ball Z",
  nanatsu:     "Seven Deadly Sins",
  bleach:      "Bleach",
  snk:         "L'Attaque des Titans",
  demonslayer: "Demon Slayer",
  kuroko:      "Kuroko no Basket",
  baki:        "Baki",
  jjk:         "Jujutsu Kaisen",
  mha:         "My Hero Academia"
};

/* ============ 50 DUOS « PUR MANGA » (un seul manga par duo) ============ */

const PUR_MANGA = {

  naruto: [
    ["Sasuke",   "Itachi",      "frères, Sharingan, cheveux noirs"],
    ["Naruto",   "Minato",      "blonds, Hokage, père et fils"],
    ["Kakashi",  "Obito",       "Sharingan, anciens coéquipiers"],
    ["Jiraya",   "Orochimaru",  "Sannin, longs cheveux, invocations animales"],
    ["Neji",     "Hinata",      "clan Hyûga, Byakugan, yeux blancs"]
  ],

  onepiece: [
    ["Luffy",         "Ace",          "frères, capitaines pirates, Fruits du Démon"],
    ["Zoro",          "Mihawk",       "grands épéistes, regard dur"],
    ["Kaido",         "Big Mom",      "Empereurs, géants, brutes"],
    ["Akainu",        "Aokiji",       "amiraux, Fruits Logia (magma / glace)"],
    ["Barbe Blanche", "Barbe Noire",  "Empereurs barbus, gros gabarits"]
  ],

  dbz: [
    ["Goku",    "Végéta",  "Saiyans, rivaux, cheveux en pics"],
    ["Gohan",   "Trunks",  "demi-Saiyans, jeunes, Super Saiyan"],
    ["Freezer", "Cell",    "méchants, transformations, tyrans"],
    ["Krilin",  "Yamcha",  "terriens, amis de Goku, moins puissants que les Saiyans"],
    ["Gotenks", "Végéto",  "fusions ultra-puissantes"]
  ],

  nanatsu: [
    ["Meliodas",    "Zeldris",    "frères démons, très forts"],
    ["Ban",         "King",       "Péchés Capitaux, meilleurs amis"],
    ["Diane",       "Elizabeth",  "les deux filles du groupe"],
    ["Merlin",      "Gowther",    "mages mystérieux, détachés"],
    ["Hendrickson", "Dreyfus",    "Chevaliers Sacrés, antagonistes"]
  ],

  bleach: [
    ["Ichigo",    "Renji",     "shinigamis, cheveux flashy, grands sabres"],
    ["Aizen",     "Gin",       "capitaines traîtres, sourire calme"],
    ["Kenpachi",  "Grimmjow",  "fous de combat, cheveux en pics"],
    ["Ulquiorra", "Byakuya",   "froids, impassibles, cheveux noirs"],
    ["Yoruichi",  "Soi Fon",   "rapides, combat rapproché, cheveux sombres"]
  ],

  snk: [
    ["Eren",   "Zeke",       "demi-frères, Titans, Jäger"],
    ["Mikasa", "Annie",      "guerrières froides, corps à corps"],
    ["Reiner", "Bertholdt",  "Guerriers, grands, Titans massifs"],
    ["Erwin",  "Hansi",      "commandants du Bataillon, stratèges"]
  ],

  demonslayer: [
    ["Rengoku", "Tengen",   "Piliers flamboyants, très expressifs"],
    ["Giyu",    "Obanai",   "Piliers froids, solitaires, cheveux noirs"],
    ["Daki",    "Gyutaro",  "frère et sœur, Lunes Supérieures"],
    ["Mitsuri", "Shinobu",  "Piliers féminins, gentilles en apparence"]
  ],

  kuroko: [
    ["Kagami",   "Aomine",         "les deux as, dunkeurs, caractère explosif"],
    ["Kuroko",   "Mayuzumi",       "joueurs invisibles, discrets"],
    ["Midorima", "Akashi",         "cerveaux, perfectionnistes, Génération des Miracles"],
    ["Kise",     "Murasakibara",   "Génération des Miracles, grands, talentueux"]
  ],

  baki: [
    ["Baki",        "Yujiro",         "père et fils, ultra-musclés"],
    ["Jack Hanma",  "Biscuit Oliva",  "colosses bruts"],
    ["Retsu Kaioh", "Doppo Orochi",   "maîtres d'arts martiaux"]
  ],

  jjk: [
    ["Gojo",   "Geto",     "meilleurs amis, anciens élèves, très forts"],
    ["Yuji",   "Megumi",   "première année, cheveux en pics, uniforme noir"],
    ["Sukuna", "Mahito",   "fléaux sadiques, sourire cruel"],
    ["Toji",   "Maki",     "sans énergie occulte, maîtres des armes"],
    ["Jogo",   "Hanami",   "fléaux de catégorie spéciale (feu / végétation)"]
  ],

  mha: [
    ["Bakugo",     "Todoroki",     "as de la classe, explosion / feu, fiers"],
    ["All Might",  "Endeavor",     "héros n°1, imposants, très forts"],
    ["Shigaraki",  "Dabi",         "Ligue des Vilains, peau abîmée"],
    ["Uraraka",    "Tsuyu",        "héroïnes de la 1-A, douces, amies"],
    ["Aizawa",     "Present Mic",  "profs de UA, héros pros, amis"]
  ]

};

/* ======== 50 DUOS « CROSSOVER » (deux mangas différents) ========
   [ perso civils , son manga , perso infiltré , son manga , ressemblance ] */

const CROSSOVER = [
  ["Livaï",          "snk",         "Sasuke",          "naruto",      "beaux gosses froids, ultra-forts, cheveux noirs"],
  ["All Might",      "mha",         "Escanor",         "nanatsu",     "ultra-musclés, très forts, forme maigre et forme musclée"],
  ["Gojo",           "jjk",         "Kakashi",         "naruto",      "cheveux blancs, yeux cachés, profs très forts"],
  ["Goku",           "dbz",         "Luffy",           "onepiece",    "héros naïfs, gloutons, fous d'aventure"],
  ["Naruto",         "naruto",      "Deku",            "mha",         "rêvent d'être n°1, partis de zéro"],
  ["Eren",           "snk",         "Ichigo",          "bleach",      "têtes brûlées, transformation, mère disparue"],
  ["Tanjiro",        "demonslayer", "Yuji",            "jjk",         "gentils, courageux, protègent leurs proches"],
  ["Végéta",         "dbz",         "Bakugo",          "mha",         "fiers, arrogants, rivaux du héros"],
  ["Sanji",          "onepiece",    "Meliodas",        "nanatsu",     "blonds, pervers, cuisinier / tavernier"],
  ["Zoro",           "onepiece",    "Inosuke",         "demonslayer", "épéistes multi-lames, fonceurs, têtes brûlées"],
  ["Mikasa",         "snk",         "Maki",            "jjk",         "guerrières aux cheveux noirs, très fortes, lames"],
  ["Zenitsu",        "demonslayer", "Usopp",           "onepiece",    "peureux, pleurnichards, courageux au final"],
  ["Rock Lee",       "naruto",      "Iida",            "mha",         "sérieux, rapides, travailleurs acharnés"],
  ["Shikamaru",      "naruto",      "Armin",           "snk",         "stratèges, cerveaux de l'équipe"],
  ["Sakura",         "naruto",      "Mitsuri",         "demonslayer", "cheveux roses, force monstrueuse, amoureuses"],
  ["Murasakibara",   "kuroko",      "Choji",           "naruto",      "grands gabarits, gloutons de snacks"],
  ["Midorima",       "kuroko",      "Uryu",            "bleach",      "lunettes, tsundere, tireurs précis"],
  ["Akashi",         "kuroko",      "Aizen",           "bleach",      "manipulateurs, calculateurs, charismatiques"],
  ["Yujiro",         "baki",        "Kaido",           "onepiece",    "créatures les plus fortes de leur monde, brutes"],
  ["Muzan",          "demonslayer", "Freezer",         "dbz",         "tyrans, formes multiples, impitoyables"],
  ["Madara",         "naruto",      "Sukuna",          "jjk",         "méchants légendaires, tout-puissants, arrogants"],
  ["Hansi",          "snk",         "Urahara",         "bleach",      "scientifiques excentriques, brillants, un peu fous"],
  ["Hinata",         "naruto",      "Orihime",         "bleach",      "timides, douces, rôle de soutien"],
  ["Jiraya",         "naruto",      "Tortue Géniale",  "dbz",         "vieux maîtres pervers, entraînent le héros"],
  ["Gaara",          "naruto",      "Todoroki",        "mha",         "cheveux roux/rouges, cernes ou cicatrice autour de l'œil, père toxique"],
  ["Ace",            "onepiece",    "Rengoku",         "demonslayer", "feu, grands frères souriants"],
  ["Chopper",        "onepiece",    "Panda",           "jjk",         "mascottes animales mignonnes qui parlent"],
  ["Nami",           "onepiece",    "Bulma",           "dbz",         "cerveaux de la bande, autoritaires, aiment l'argent"],
  ["Obito",          "naruto",      "Dabi",            "mha",         "visage cicatrisé, sombres, feu"],
  ["Hidan",          "naruto",      "Ban",             "nanatsu",     "immortels, cheveux argentés, grande gueule"],
  ["Grimmjow",       "bleach",      "Aomine",          "kuroko",      "cheveux bleus, arrogants, fauves"],
  ["Kuroko",         "kuroko",      "Muichiro",        "demonslayer", "discrets, effacés, cheveux clairs"],
  ["Nanami",         "jjk",         "Aizawa",          "mha",         "adultes épuisés, sarcastiques"],
  ["Mirko",          "mha",         "Yoruichi",        "bleach",      "rapides, peau mate, motif animal (lapin / chat)"],
  ["Gin",            "bleach",      "Shinobu",         "demonslayer", "sourire permanent, lame fine, poison"],
  ["Kenpachi",       "bleach",      "Akaza",           "demonslayer", "adorent se battre contre plus fort"],
  ["Toji",           "jjk",         "Baki",            "baki",        "humains purs sans pouvoirs magiques, ultra-entraînés"],
  ["Todo",           "jjk",         "Might Guy",       "naruto",      "gros bras, énergiques, discours sur l'amitié"],
  ["Nezuko",         "demonslayer", "Inumaki",         "jjk",         "bouche cachée ou marquée, parlent presque pas"],
  ["Kagami",         "kuroko",      "Kirishima",       "mha",         "cheveux rouges, grands cœurs, fonceurs"],
  ["Erwin",          "snk",         "Shanks",          "onepiece",    "chefs charismatiques, un bras en moins"],
  ["Annie",          "snk",         "Soi Fon",         "bleach",      "petites, froides, combat au corps à corps"],
  ["Hancock",        "onepiece",    "Merlin",          "nanatsu",     "beautés fatales, puissantes, sûres d'elles"],
  ["Barbe Blanche",  "onepiece",    "Yamamoto",        "bleach",      "vieux chefs ultra-puissants, respectés"],
  ["Orochimaru",     "naruto",      "All For One",     "mha",         "volent des corps / des pouvoirs, mentors maléfiques"],
  ["Gowther",        "nanatsu",     "Ulquiorra",       "bleach",      "sans émotions apparentes, cherchent à comprendre le cœur"],
  ["Tsunade",        "naruto",      "Unohana",         "bleach",      "médecins, cheffes, ultra-dangereuses"],
  ["Kisame",         "naruto",      "Jinbe",           "onepiece",    "hommes-requins, peau bleue, loyaux"],
  ["Chad",           "bleach",      "Gyomei",          "demonslayer", "colosses silencieux au grand cœur"],
  ["Kise",           "kuroko",      "Hawks",           "mha",         "blonds, charmeurs, populaires"]
];


/* ====================================================================
   MOTEUR — ne pas modifier
   ==================================================================== */

const DOSSIER_PHOTOS = "img/persos";
const EXT_PHOTO = "jpg";

function slug(nom){
  return nom.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function perso(nom, manga){
  return {
    nom,
    manga,
    mangaNom: MANGAS[manga] || manga,
    photo: `${DOSSIER_PHOTOS}/${manga}/${slug(nom)}.${EXT_PHOTO}`
  };
}

const DUOS = [];
let _id = 0;

for (const [manga, duos] of Object.entries(PUR_MANGA)){
  if (!MANGAS[manga]) console.warn(`mots.js : manga inconnu dans PUR_MANGA → "${manga}"`);
  for (const [civils, infiltre, note] of duos){
    DUOS.push({ id: ++_id, type: "pur", note, mangas: [manga],
      civils: perso(civils, manga), infiltre: perso(infiltre, manga) });
  }
}

for (const [civils, mc, infiltre, mi, note] of CROSSOVER){
  for (const m of [mc, mi]) if (!MANGAS[m]) console.warn(`mots.js : manga inconnu dans CROSSOVER → "${m}"`);
  DUOS.push({ id: ++_id, type: "crossover", note, mangas: [...new Set([mc, mi])],
    civils: perso(civils, mc), infiltre: perso(infiltre, mi) });
}

const BANQUE = {
  version: 1,
  mangas: MANGAS,
  duos: DUOS,

  /* Nombre de duos par manga, pour l'écran de sélection */
  compteParManga(type = "multivers"){
    const n = {};
    for (const cle of Object.keys(MANGAS)) n[cle] = 0;
    for (const d of DUOS) if (type === "multivers" || d.type === type)
      for (const m of d.mangas) n[m]++;
    return n;
  },

  /* Duos jouables : tous les persos du duo doivent venir d'un manga choisi.
     type : "pur" | "crossover" | "multivers" */
  filtrer({ mangas = Object.keys(MANGAS), type = "multivers" } = {}){
    const choisis = new Set(mangas);
    return DUOS.filter(d =>
      (type === "multivers" || d.type === type) &&
      d.mangas.every(m => choisis.has(m)));
  },

  /* Pioche mélangée. En ligne, l'hôte pioche et envoie le duo aux joueurs :
     passe une graine (seed) pour que tout le monde obtienne le même ordre. */
  pioche(options = {}){
    const paquet = this.filtrer(options);
    const rnd = options.seed != null ? semeur(options.seed) : Math.random;
    for (let i = paquet.length - 1; i > 0; i--){
      const j = Math.floor(rnd() * (i + 1));
      [paquet[i], paquet[j]] = [paquet[j], paquet[i]];
    }
    return paquet;
  }
};

/* Générateur aléatoire reproductible (mulberry32) */
function semeur(seed){
  let a = typeof seed === "string"
    ? [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)
    : seed | 0;
  return function(){
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

if (typeof window !== "undefined") window.BANQUE = BANQUE;
if (typeof module !== "undefined") module.exports = BANQUE;
