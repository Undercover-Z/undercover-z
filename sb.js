/* ====================================================================
   UNDERCOVER Z — comptes et salons (Supabase)

   Ce fichier est le seul a connaitre Supabase. Il expose deux objets :

     Compte  : inscription, connexion, profil, deconnexion
     Salons  : creer / rejoindre un salon, lire l'etat, envoyer une action

   Toutes les fonctions renvoient { ok:true, ... } ou { ok:false, erreur:"..." }
   avec un message en francais, directement affichable a l'ecran.

   A charger APRES config.js et la bibliotheque supabase-js.
   ==================================================================== */

/* Pour tester plusieurs comptes sur le meme ordinateur : ajouter ?compte=2
   a l'adresse ouvre une session separee dans cet onglet (sinon tous les
   onglets d'un meme navigateur partagent le meme compte connecte). */
const _compteTest = new URLSearchParams(location.search).get("compte");
const _cleSession = "uz-auth" + (_compteTest ? "-" + _compteTest : "");

const SB = (window.EN_LIGNE_PRET && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: _cleSession }
    })
  : null;

/* ---------- messages d'erreur en francais ---------- */
function _traduire(err){
  const m = (err && err.message) ? err.message : String(err || "");
  const t = m.toLowerCase();
  if (t.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (t.includes("user already registered") || t.includes("already been registered")) return "Cette adresse a déjà un compte. Connecte-toi.";
  if (t.includes("password should be at least")) return "Le mot de passe doit faire au moins 6 caractères.";
  if (t.includes("unable to validate email") || t.includes("invalid email")) return "Cette adresse e-mail n'est pas valide.";
  if (t.includes("email not confirmed")) return "Il faut d'abord confirmer l'e-mail reçu.";
  if (t.includes("rate limit") || t.includes("too many")) return "Trop d'essais d'affilée. Attends une minute.";
  if (t.includes("failed to fetch") || t.includes("network")) return "Pas de connexion au serveur. Vérifie ta connexion internet.";
  if (t.includes("duplicate key")) return "Ce code existe deja.";
  return m || "Une erreur est survenue.";
}
const _ko = err => ({ ok:false, erreur:_traduire(err) });
const _horsLigne = { ok:false, erreur:"Le mode en ligne n'est pas configuré sur ce site." };

/* ====================================================================
   COMPTE
   ==================================================================== */
const Compte = {
  pret(){ return !!SB; },

  async session(){
    if (!SB) return null;
    const { data } = await SB.auth.getSession();
    return data.session || null;
  },

  /* { id, mail, pseudo, aura } ou null si personne n'est connecte */
  async moi(){
    const s = await this.session();
    if (!s) return null;
    const { data } = await SB.from("profils").select("pseudo,aura,parties,victoires").eq("id", s.user.id).maybeSingle();
    return {
      id: s.user.id,
      mail: s.user.email,
      pseudo: (data && data.pseudo) || (s.user.user_metadata && s.user.user_metadata.pseudo) || "Guerrier",
      aura: (data && data.aura) || "#ff8a00",
      parties: (data && data.parties) || 0,
      victoires: (data && data.victoires) || 0
    };
  },

  async inscrire({ mail, mdp, pseudo, aura }){
    if (!SB) return _horsLigne;
    const { data, error } = await SB.auth.signUp({
      email: mail, password: mdp,
      options: { data: { pseudo: pseudo || "", aura: aura || "#ff8a00" } }
    });
    if (error) return _ko(error);
    if (!data.session){
      return { ok:true, aConfirmer:true,
        message:"Compte créé. Ouvre l'e-mail de confirmation pour pouvoir jouer en ligne." };
    }
    /* le profil est cree par la base ; on s'assure juste du pseudo choisi */
    if (pseudo) await SB.from("profils").update({ pseudo, aura: aura || "#ff8a00" }).eq("id", data.user.id);
    return { ok:true, moi: await this.moi() };
  },

  async connecter({ mail, mdp }){
    if (!SB) return _horsLigne;
    const { error } = await SB.auth.signInWithPassword({ email: mail, password: mdp });
    if (error) return _ko(error);
    return { ok:true, moi: await this.moi() };
  },

  async deconnecter(){
    if (!SB) return _horsLigne;
    const { error } = await SB.auth.signOut();
    return error ? _ko(error) : { ok:true };
  },

  async majProfil(champs){
    if (!SB) return _horsLigne;
    const s = await this.session();
    if (!s) return { ok:false, erreur:"Personne n'est connecté." };
    const { error } = await SB.from("profils").update(champs).eq("id", s.user.id);
    return error ? _ko(error) : { ok:true };
  },

  /* appele a chaque connexion / deconnexion / rafraichissement de jeton */
  surChangement(fn){
    if (!SB) return () => {};
    const { data } = SB.auth.onAuthStateChange((_e, session) => fn(session));
    return () => data.subscription.unsubscribe();
  }
};

/* ====================================================================
   SALONS
   ==================================================================== */
const _ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // sans I, O, 0, 1 : illisibles a l'oral
function _code(){
  let s = "";
  for (let i = 0; i < 4; i++) s += _ALPHABET[Math.floor(Math.random() * _ALPHABET.length)];
  return "KI-" + s;
}

const Salons = {
  /* L'hote cree le salon et s'y inscrit. Renvoie { ok, code } */
  async creer(reglages){
    if (!SB) return _horsLigne;
    const moi = await Compte.moi();
    if (!moi) return { ok:false, erreur:"Connecte-toi pour créer un salon." };

    for (let essai = 0; essai < 6; essai++){
      const code = _code();
      const { error } = await SB.from("salons").insert({ code, hote: moi.id, reglages, etat: null, ouvert: true });
      if (!error){
        const r = await SB.from("joueurs_salon").insert({ salon: code, joueur: moi.id, pseudo: moi.pseudo, place: 0 });
        if (r.error) return _ko(r.error);
        return { ok:true, code, moi };
      }
      if (!String(error.message).toLowerCase().includes("duplicate")) return _ko(error);
    }
    return { ok:false, erreur:"Impossible de générer un code libre. Réessaie." };
  },

  async lire(code){
    if (!SB) return _horsLigne;
    const { data, error } = await SB.from("salons").select("code,hote,reglages,etat,ouvert").eq("code", code).maybeSingle();
    if (error) return _ko(error);
    if (!data) return { ok:false, erreur:"Aucun salon avec ce code." };
    return { ok:true, salon:data };
  },

  async rejoindre(code){
    if (!SB) return _horsLigne;
    const moi = await Compte.moi();
    if (!moi) return { ok:false, erreur:"Connecte-toi pour rejoindre un salon." };

    const r = await this.lire(code);
    if (!r.ok) return r;
    if (!r.salon.ouvert) return { ok:false, erreur:"La partie a déjà commencé dans ce salon." };

    const { data: deja } = await SB.from("joueurs_salon").select("place").eq("salon", code).eq("joueur", moi.id).maybeSingle();
    if (deja) return { ok:true, code, moi, place: deja.place, deja:true };

    const { data: liste } = await SB.from("joueurs_salon").select("place").eq("salon", code);
    const max = (r.salon.reglages && r.salon.reglages.players) || 12;
    if (liste && liste.length >= max) return { ok:false, erreur:"Ce salon est complet (" + max + " joueurs)." };

    const place = liste ? liste.length : 0;
    const { error } = await SB.from("joueurs_salon").insert({ salon: code, joueur: moi.id, pseudo: moi.pseudo, place });
    if (error) return _ko(error);
    return { ok:true, code, moi, place };
  },

  async joueurs(code){
    if (!SB) return _horsLigne;
    const { data, error } = await SB.from("joueurs_salon").select("joueur,pseudo,place").eq("salon", code).order("place");
    return error ? _ko(error) : { ok:true, joueurs:data };
  },

  async quitter(code){
    if (!SB) return _horsLigne;
    const moi = await Compte.moi();
    if (!moi) return { ok:true };
    const { error } = await SB.from("joueurs_salon").delete().eq("salon", code).eq("joueur", moi.id);
    return error ? _ko(error) : { ok:true };
  },

  /* hote seulement */
  async supprimer(code){
    if (!SB) return _horsLigne;
    const { error } = await SB.from("salons").delete().eq("code", code);
    return error ? _ko(error) : { ok:true };
  },

  async ecrireEtat(code, etat, options = {}){
    if (!SB) return _horsLigne;
    const champs = { etat };
    if (options.ouvert !== undefined) champs.ouvert = options.ouvert;
    const { error } = await SB.from("salons").update(champs).eq("code", code);
    return error ? _ko(error) : { ok:true };
  },

  async placerJoueur(code, joueurId, place){
    if (!SB) return _horsLigne;
    const { error } = await SB.from("joueurs_salon").update({ place }).eq("salon", code).eq("joueur", joueurId);
    return error ? _ko(error) : { ok:true };
  },

  /* L'hote distribue : une ligne par joueur, lisible seulement par lui */
  async distribuerCartes(code, cartes){
    if (!SB) return _horsLigne;
    await SB.from("cartes").delete().eq("salon", code);
    const { error } = await SB.from("cartes").insert(
      cartes.map(c => ({ salon: code, joueur: c.joueur, role: c.role, perso: c.perso || null }))
    );
    return error ? _ko(error) : { ok:true };
  },

  /* Chaque joueur ne peut lire que SA carte : la base l'impose, et on
     filtre aussi explicitement — ne jamais dependre d'une seule barriere. */
  async maCarte(code){
    if (!SB) return _horsLigne;
    const s = await Compte.session();
    if (!s) return { ok:false, erreur:"Personne n'est connecté." };
    const { data, error } = await SB.from("cartes")
      .select("role,perso").eq("salon", code).eq("joueur", s.user.id).maybeSingle();
    if (error) return _ko(error);
    return { ok:true, carte:data || null };
  },

  async envoyerAction(code, type, payload = {}){
    if (!SB) return _horsLigne;
    const moi = await Compte.session();
    if (!moi) return { ok:false, erreur:"Connecte-toi." };
    const { error } = await SB.from("actions").insert({ salon: code, joueur: moi.user.id, type, payload });
    return error ? _ko(error) : { ok:true };
  },

  /* hote seulement : rattrape les actions manquees apres une coupure */
  async actionsDepuis(code, dernierId = 0){
    if (!SB) return _horsLigne;
    const { data, error } = await SB.from("actions").select("id,joueur,type,payload").eq("salon", code).gt("id", dernierId).order("id");
    return error ? _ko(error) : { ok:true, actions:data };
  },

  /* ---------- temps reel ---------- */
  surSalon(code, fn){
    if (!SB) return () => {};
    const canal = SB.channel("salon:" + code)
      .on("postgres_changes", { event:"*", schema:"public", table:"salons", filter:"code=eq." + code },
          p => fn(p.new || null, p.eventType))
      .subscribe();
    return () => SB.removeChannel(canal);
  },

  surJoueurs(code, fn){
    if (!SB) return () => {};
    const canal = SB.channel("joueurs:" + code)
      .on("postgres_changes", { event:"*", schema:"public", table:"joueurs_salon", filter:"salon=eq." + code },
          () => fn())
      .subscribe();
    return () => SB.removeChannel(canal);
  },

  /* hote seulement : les actions des joueurs arrivent ici */
  surActions(code, fn){
    if (!SB) return () => {};
    const canal = SB.channel("actions:" + code)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"actions", filter:"salon=eq." + code },
          p => fn(p.new))
      .subscribe();
    return () => SB.removeChannel(canal);
  }
};

if (typeof window !== "undefined"){
  window.SB = SB;
  window.Compte = Compte;
  window.Salons = Salons;
}
