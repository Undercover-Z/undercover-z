/* ====================================================================
   UNDERCOVER Z — MOTEUR DE JEU
   Les règles, et rien que les règles : aucun HTML, aucun réseau ici.

   Tout l'état de la partie tient dans un seul objet (etat), sérialisable
   en JSON : c'est lui qui circulera entre les joueurs le jour où le mode
   en ligne sera branché.

   Règles appliquées
   - Les civils partagent un perso, les undercover en ont un proche,
     Mr. White n'a rien. Une partie peut n'avoir que des Mr. White.
   - Une manche = 1 à 3 tours (chacun donne un indice ou pose un trait à
     chaque tour), puis un seul vote.
   - Un civil parle toujours en premier (Mr. White n'a aucun mot : le
     faire commencer serait injouable pour lui).
   - Après élimination : si plus aucun intrus, les civils gagnent ; les
     intrus ne gagnent que s'il ne reste qu'un civil ou aucun. Éliminer un
     innocent ne met donc pas fin à la partie tant qu'il reste 2 civils.
   - Mr. White éliminé a droit à une tentative : s'il devine le perso des
     civils, les intrus gagnent sur le fil.
   - Égalité au vote : second tour entre les ex æquo. Nouvelle égalité :
     personne n'est éliminé.
   ==================================================================== */

function _melange(liste, rnd = Math.random){
  const a = [...liste];
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function _normaliser(txt){
  return String(txt).toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

/* etatSauve : pour reprendre une partie en cours (l'hote qui recharge sa
   page en ligne). On repart de l'etat complet, duo et roles compris. */
function creerJeu(reglages, etatSauve){
  const rnd = Math.random;
  const paquet = BANQUE.pioche({ mangas: reglages.mangas, type: reglages.duoType });
  if (!paquet.length) throw new Error("Aucun duo disponible avec ces mangas");
  let indexDuo = 0;

  const etat = {
    phase: "distribution",   // distribution · indices · dessin · vote · revelation · mrwhite · fin
    manche: 1,
    tour: 1,                 // tour en cours dans la manche
    toursParManche: Math.min(3, Math.max(1, reglages.tours || 1)),
    mode: reglages.mode,     // "voix" | "dessin"
    changementPerso: !!reglages.changementPerso,
    duo: null,
    joueurs: reglages.joueurs.map((nom, i) => ({ id: i, nom, role: "civil", vivant: true, aVu: false })),
    ordre: [],
    tourIdx: 0,
    votes: {},
    exAequo: null,
    secondTour: false,
    traits: [],
    elimine: null,
    motDevine: null,
    gagnant: null            // "civils" | "intrus"
  };

  const joueur   = id => etat.joueurs.find(j => j.id === id);
  const vivants  = () => etat.joueurs.filter(j => j.vivant);
  const intrus   = () => vivants().filter(j => j.role !== "civil");

  function distribuer(){
    etat.duo = paquet[indexDuo % paquet.length];
    etat.joueurs.forEach(j => { j.role = "civil"; j.vivant = true; j.aVu = false; });
    const ids = _melange(etat.joueurs.map(j => j.id), rnd);
    let k = 0;
    for (let i = 0; i < reglages.undercover; i++) joueur(ids[k++]).role = "undercover";
    for (let i = 0; i < reglages.mrwhite;    i++) joueur(ids[k++]).role = "mrwhite";
    Object.assign(etat, { phase:"distribution", manche:1, tour:1, traits:[], votes:{},
      exAequo:null, secondTour:false, elimine:null, motDevine:null, gagnant:null, tourIdx:0, ordre:[] });
    etat.tirage = (etat.tirage || 0) + 1;   // sert aux joueurs en ligne pour relire leur carte
  }

  function ordreDeParole(){
    const ordre = _melange(vivants().map(j => j.id), rnd);
    const civil = ordre.findIndex(id => joueur(id).role === "civil");
    if (civil > 0) [ordre[0], ordre[civil]] = [ordre[civil], ordre[0]];
    etat.ordre = ordre;
    etat.tourIdx = 0;
  }

  function demarrerManche(){
    ordreDeParole();
    etat.tour = 1;
    etat.phase = etat.mode === "dessin" ? "dessin" : "indices";
    etat.votes = {}; etat.exAequo = null; etat.secondTour = false; etat.elimine = null;
  }

  function finDePartie(){
    const i = intrus().length, c = vivants().length - i;
    if (i === 0){ etat.gagnant = "civils"; etat.phase = "fin"; return "civils"; }
    if (c <= 1){ etat.gagnant = "intrus"; etat.phase = "fin"; return "intrus"; }
    return null;
  }

  if (etatSauve && etatSauve.duo && Array.isArray(etatSauve.joueurs)){
    Object.assign(etat, etatSauve);        // on reprend la partie telle quelle
  } else {
    distribuer();
  }

  return {
    etat,
    reprise: !!(etatSauve && etatSauve.duo),

    /* ---- distribution ---- */
    carte(id){
      const j = joueur(id);
      if (!j) return null;
      return {
        nom: j.nom, role: j.role,
        perso: j.role === "mrwhite" ? null : (j.role === "civil" ? etat.duo.civils : etat.duo.infiltre)
      };
    },
    marquerVu(id){ const j = joueur(id); if (j) j.aVu = true; },
    tousOntVu(){ return etat.joueurs.every(j => j.aVu); },
    changerDuo(){
      if (etat.phase !== "distribution" || !etat.changementPerso) return false;
      indexDuo++;
      etat.duo = paquet[indexDuo % paquet.length];
      etat.joueurs.forEach(j => j.aVu = false);   // tout le monde revoit sa carte
      etat.tirage = (etat.tirage || 0) + 1;
      return true;
    },

    /* ---- manche ---- */
    demarrerManche,
    joueurActuel(){ return joueur(etat.ordre[etat.tourIdx]) || null; },
    tourSuivant(){
      if (etat.tourIdx < etat.ordre.length - 1){ etat.tourIdx++; return false; }
      if (etat.tour < etat.toursParManche){        // un tour de plus avant le vote
        etat.tour++; etat.tourIdx = 0; return false;
      }
      etat.phase = "vote"; etat.tourIdx = 0; etat.votes = {};
      return true;                                 // on passe au vote
    },
    ajouterTrait(id, points){ etat.traits.push({ joueur: id, points }); },

    /* ---- vote à main levée (local) ----
       Tout le monde pointe du doigt en même temps dans la vraie vie, puis on
       désigne l'éliminé sur l'appareil. Passer null = personne n'est éliminé. */
    eliminer(cible){
      if (cible === null || cible === undefined){
        etat.elimine = null; etat.votes = {}; etat.secondTour = false; etat.exAequo = null;
        etat.phase = "revelation";
        return { personne: true };
      }
      const j = joueur(cible);
      if (!j || !j.vivant) return null;
      j.vivant = false;
      etat.elimine = j.id; etat.votes = {}; etat.secondTour = false; etat.exAequo = null;
      etat.phase = j.role === "mrwhite" ? "mrwhite" : "revelation";
      return { elimine: j.id, role: j.role };
    },

    /* ---- vote compté (utilisé par le mode en ligne : chacun clique sur son
       propre écran, en même temps) ---- */
    peutEtreVote(id){
      const j = joueur(id);
      if (!j || !j.vivant) return false;
      return etat.secondTour && etat.exAequo ? etat.exAequo.includes(id) : true;
    },
    voter(votant, cible){ etat.votes[votant] = cible; },
    votantsRestants(){ return vivants().filter(j => etat.votes[j.id] === undefined); },
    resoudreVote(){
      const compte = {};
      for (const cible of Object.values(etat.votes)) compte[cible] = (compte[cible] || 0) + 1;
      const scores = Object.values(compte);
      if (!scores.length){ etat.elimine = null; etat.phase = "revelation"; return { personne: true }; }
      const max = Math.max(...scores);
      const top = Object.keys(compte).map(Number).filter(id => compte[id] === max);

      if (top.length > 1){
        if (!etat.secondTour){
          etat.secondTour = true; etat.exAequo = top; etat.votes = {}; etat.phase = "vote";
          return { egalite: true, exAequo: top };
        }
        etat.secondTour = false; etat.exAequo = null; etat.elimine = null; etat.phase = "revelation";
        return { personne: true };
      }

      const j = joueur(top[0]);
      j.vivant = false;
      etat.elimine = j.id; etat.secondTour = false; etat.exAequo = null;
      etat.phase = j.role === "mrwhite" ? "mrwhite" : "revelation";
      return { elimine: j.id, role: j.role };
    },
    compteVotes(){
      const compte = {};
      for (const cible of Object.values(etat.votes)) compte[cible] = (compte[cible] || 0) + 1;
      return compte;
    },

    /* ---- Mr. White ---- */
    deviner(texte){
      const bon = _normaliser(texte) === _normaliser(etat.duo.civils.nom);
      etat.motDevine = bon;
      if (bon){ etat.gagnant = "intrus"; etat.phase = "fin"; return true; }
      etat.phase = "revelation";
      return false;
    },

    /* ---- etat PUBLIC (mode en ligne) ----
       C'est le seul etat qui circule entre les joueurs. Il ne contient
       jamais le duo ni le role de quelqu'un encore en vie : sinon il
       suffirait d'ouvrir la console pour savoir qui est l'intrus.
       Un joueur elimine, lui, est revele a tout le monde. */
    etatPublic(){
      const fini = etat.phase === "fin";
      return {
        phase: etat.phase, manche: etat.manche, tour: etat.tour, tirage: etat.tirage || 1,
        toursParManche: etat.toursParManche, mode: etat.mode,
        changementPerso: etat.changementPerso,
        ordre: etat.ordre, tourIdx: etat.tourIdx,
        traits: etat.traits,
        elimine: etat.elimine, motDevine: etat.motDevine, gagnant: etat.gagnant,
        vus: etat.joueurs.filter(j => j.aVu).map(j => j.id),
        nbVotes: Object.keys(etat.votes).length,
        nbVotants: vivants().length,
        joueurs: etat.joueurs.map(j => ({
          id: j.id, nom: j.nom, vivant: j.vivant,
          role: (fini || !j.vivant) ? j.role : null
        })),
        /* le perso d'un joueur elimine est devoile, comme autour d'une table */
        persoElimine: (etat.elimine !== null && etat.duo)
          ? (joueur(etat.elimine).role === "civil" ? etat.duo.civils
            : joueur(etat.elimine).role === "undercover" ? etat.duo.infiltre : null)
          : null,
        duo: fini ? etat.duo : null
      };
    },

    /* ---- suite ---- */
    continuer(){
      const fin = finDePartie();
      if (fin) return fin;
      etat.manche++;
      demarrerManche();
      return null;
    },
    rejouer(){ indexDuo++; distribuer(); },
    duosRestants(){ return paquet.length; }
  };
}

if (typeof window !== "undefined") window.creerJeu = creerJeu;
if (typeof module !== "undefined") module.exports = { creerJeu };
