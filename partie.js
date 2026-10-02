/* ====================================================================
   UNDERCOVER Z — LA COUTURE RÉSEAU
   L'écran de jeu ne parle JAMAIS au réseau ni au moteur directement :
   il passe toujours par l'objet rendu ici.

   Aujourd'hui  : mode "local"   → tout reste en mémoire sur l'appareil.
   Plus tard    : mode "enligne" → mêmes fonctions, mais chaque action est
                  envoyée au serveur et l'état revient par abonnement.
                  Seul ce fichier change. L'écran de jeu, lui, ne bouge pas.

   Les 5 fonctions à respecter des deux côtés :
     partie.etat()            l'état visible par tous
     partie.maCarte(joueur)   ce que CE joueur a le droit de voir
     partie.envoyer(action)   une action de joueur
     partie.surEtat(fn)       prévenu à chaque changement
     partie.quitter()
   ==================================================================== */

function creerPartie(mode, reglages){
  if (mode === "local")   return partieLocale(reglages);
  if (mode === "enligne") return partieEnLigne(reglages);
  throw new Error("Mode inconnu : " + mode);
}

function partieLocale(reglages){
  const jeu = creerJeu(reglages);
  const abonnes = [];
  const notifier = () => abonnes.forEach(fn => fn(jeu.etat));

  return {
    jeu,                                   // raccourci utile en local seulement
    etat: () => jeu.etat,
    maCarte: id => jeu.carte(id),
    surEtat(fn){ abonnes.push(fn); fn(jeu.etat); },
    quitter(){ abonnes.length = 0; },

    envoyer(action){
      let retour = null;
      switch (action.type){
        case "vu":          jeu.marquerVu(action.joueur); break;
        case "changerDuo":  retour = jeu.changerDuo(); break;
        case "demarrer":    jeu.demarrerManche(); break;
        case "tourSuivant": retour = jeu.tourSuivant(); break;
        case "trait":       jeu.ajouterTrait(action.joueur, action.points); break;
        case "eliminer":    retour = jeu.eliminer(action.cible); break;
        case "vote":        jeu.voter(action.votant, action.cible); break;
        case "resoudre":    retour = jeu.resoudreVote(); break;
        case "deviner":     retour = jeu.deviner(action.texte); break;
        case "continuer":   retour = jeu.continuer(); break;
        case "rejouer":     jeu.rejouer(); break;
        default: throw new Error("Action inconnue : " + action.type);
      }
      notifier();
      return retour;
    }
  };
}

/* ====================================================================
   MODE EN LIGNE

   Le principe, tenu de bout en bout : L'HOTE EST L'ARBITRE.
   - lui seul fait tourner le moteur de jeu (jeu.js) ;
   - lui seul ecrit l'etat public du salon et distribue les cartes ;
   - les autres joueurs n'envoient que des actions et lisent l'etat public.

   Personne ne peut donc fabriquer un etat de partie, et le secret des
   cartes est garanti par la base (chaque joueur ne lit que sa ligne).

   reglages attendus : { code, estHote, reglages, joueurs:[{joueur,pseudo,place}] }
   ==================================================================== */
function partieEnLigne({ code, estHote, reglages, joueurs }){
  const abonnes = [];
  let etatPublic = null;          // ce que tout le monde voit
  let maCarteLocale = null;
  let jeu = null;                 // seulement chez l'hote
  let arretSalon = null, arretActions = null;
  let moiId = null, maPlace = null;
  const places = joueurs.slice().sort((a,b) => a.place - b.place);

  const notifier = () => abonnes.forEach(fn => fn(etatPublic));
  const placeDe = uuid => {
    const j = places.find(p => p.joueur === uuid);
    return j ? places.indexOf(j) : null;
  };

  /* ---------- cote hote ---------- */
  /* L'etat complet (roles et duo compris) reste chez l'hote, dans son
     navigateur : il n'a rien a faire dans une table que tout le monde lit.
     C'est ce qui permet a l'hote de recharger sa page sans tout casser. */
  const CLE_LOCALE = "uz-partie-" + code;
  let dernierAction = 0;                 // derniere action deja appliquee
  function sauverLocalement(){
    try{ localStorage.setItem(CLE_LOCALE, JSON.stringify({ etat: jeu.etat, dernier: dernierAction })); }catch(_){}
  }
  function sauvegarde(){
    try{ return JSON.parse(localStorage.getItem(CLE_LOCALE) || "null"); }catch(_){ return null; }
  }

  /* Une ecriture refusee doit se voir tout de suite : sinon l'hote croit
     avoir lance la partie et personne ne recoit rien. */
  async function publier(options){
    etatPublic = jeu.etatPublic();
    const r = await Salons.ecrireEtat(code, etatPublic, options);
    if (!r.ok) throw new Error("L'etat de la partie n'a pas pu etre enregistre : " + r.erreur);
    sauverLocalement();
    notifier();
  }

  async function distribuer(){
    const cartes = places.map((p, i) => {
      const c = jeu.carte(i);
      return { joueur: p.joueur, role: c.role, perso: c.perso };
    });
    const r = await Salons.distribuerCartes(code, cartes);
    if (!r.ok) throw new Error("Les cartes n'ont pas pu etre distribuees : " + r.erreur);
    /* on verifie que la distribution est bien arrivee dans la base */
    const v = await Salons.maCarte(code);
    if (!v.ok || !v.carte) throw new Error("Les cartes ne sont pas lisibles apres distribution. Es-tu bien connecte avec le compte qui a cree le salon ?");
  }

  async function appliquer(action){
    const place = placeDe(action.joueur);
    if (place === null) return;
    const e = jeu.etat;
    const p = action.payload || {};

    switch (action.type){
      case "vu":
        jeu.marquerVu(place);
        if (jeu.tousOntVu()){ jeu.demarrerManche(); }
        break;

      case "changerDuo":
        if (e.phase === "distribution" && jeu.changerDuo()) await distribuer();
        break;

      case "indice":
        if (e.phase === "indices" && e.ordre[e.tourIdx] === place) jeu.tourSuivant();
        break;

      case "trait":
        if (e.phase === "dessin" && e.ordre[e.tourIdx] === place && Array.isArray(p.points)){
          jeu.ajouterTrait(place, p.points);
          jeu.tourSuivant();
        }
        break;

      case "vote":
        if (e.phase === "vote" && jeu.peutEtreVote(p.cible)){
          jeu.voter(place, p.cible);
          if (jeu.votantsRestants().length === 0) jeu.resoudreVote();
        }
        break;

      case "deviner":
        if (e.phase === "mrwhite" && e.elimine === place) jeu.deviner(p.texte || "");
        break;

      case "continuer":
        if (place === 0 && (e.phase === "revelation")) jeu.continuer();
        break;

      case "rejouer":
        if (place === 0 && e.phase === "fin"){ jeu.rejouer(); await distribuer(); }
        break;
    }
    await publier();
  }

  /* ---------- demarrage ---------- */
  async function demarrer(){
    const session = await Compte.session();
    moiId = session && session.user.id;
    maPlace = placeDe(moiId);

    if (estHote){
      /* une partie deja en cours dans ce salon ? on la reprend au lieu
         d'en relancer une (cas de l'hote qui recharge sa page) */
      const r = await Salons.lire(code);
      const dejaEnCours = r.ok && r.salon.etat && r.salon.etat.phase !== "fin";
      const memo = dejaEnCours ? sauvegarde() : null;
      const sauve = memo && memo.etat ? memo.etat : null;
      if (memo && memo.dernier) dernierAction = memo.dernier;

      jeu = creerJeu({
        joueurs: places.map(p => p.pseudo),
        undercover: reglages.uc, mrwhite: reglages.mw,
        mode: reglages.mode, tours: reglages.tours,
        mangas: reglages.mangas, duoType: reglages.duoType,
        changementPerso: reglages.changementPerso
      }, sauve);

      if (dejaEnCours && !jeu.reprise){
        throw new Error("Une partie est en cours dans ce salon mais elle ne peut pas etre reprise depuis cet appareil. Termine-la sur l'appareil d'origine, ou cree un nouveau salon.");
      }
      if (!jeu.reprise) await distribuer();
      await publier({ ouvert: false });            // le salon se ferme : la partie a commence

      /* rattrape les actions manquees (coupure reseau, page rechargee),
         sans rejouer celles qui sont deja prises en compte */
      const vieilles = await Salons.actionsDepuis(code, dernierAction);
      if (vieilles.ok) for (const a of vieilles.actions){ dernierAction = a.id; await appliquer(a); }
      arretActions = Salons.surActions(code, a => {
        if (a.id > dernierAction){ dernierAction = a.id; appliquer(a); }
      });
    } else {
      const r = await Salons.lire(code);
      if (r.ok && r.salon.etat){ etatPublic = r.salon.etat; notifier(); }
      arretSalon = Salons.surSalon(code, salon => {
        if (salon && salon.etat){ etatPublic = salon.etat; notifier(); }
      });
    }

    const c = await Salons.maCarte(code);
    if (c.ok) maCarteLocale = c.carte;
  }

  const pret = demarrer();

  return {
    pret,
    estHote,
    maPlace: () => maPlace,
    etat: () => etatPublic,
    maCarte: () => maCarteLocale,

    async rechargerCarte(){
      const c = await Salons.maCarte(code);
      if (c.ok) maCarteLocale = c.carte;
      return maCarteLocale;
    },

    /* tout le monde passe par ici : l'hote applique, les autres envoient */
    async envoyer(action){
      if (estHote){
        await appliquer({ joueur: moiId, type: action.type, payload: action });
      } else {
        await Salons.envoyerAction(code, action.type, action);
      }
    },

    surEtat(fn){ abonnes.push(fn); if (etatPublic) fn(etatPublic); },

    quitter(){
      if (arretSalon) arretSalon();
      if (arretActions) arretActions();
      abonnes.length = 0;
    }
  };
}

if (typeof window !== "undefined") window.creerPartie = creerPartie;
if (typeof module !== "undefined") module.exports = { creerPartie };
