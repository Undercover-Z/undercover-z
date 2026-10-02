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
  if (mode === "local") return partieLocale(reglages);
  throw new Error("Mode inconnu : " + mode + " (le mode en ligne n'est pas encore branché)");
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

if (typeof window !== "undefined") window.creerPartie = creerPartie;
if (typeof module !== "undefined") module.exports = { creerPartie };
