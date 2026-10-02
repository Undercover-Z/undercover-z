/* ====================================================================
   UNDERCOVER Z — branchement a Supabase

   A REMPLIR avec les deux valeurs de TON projet Supabase :
   Dashboard -> Project Settings -> API
     • Project URL        -> SUPABASE_URL
     • anon public (key)  -> SUPABASE_ANON_KEY

   Ces deux valeurs sont PUBLIQUES : le navigateur de chaque joueur les
   telecharge, c'est prevu ainsi. La securite ne vient pas du secret de
   la cle mais des regles RLS posees par supabase.sql.

   A L'INVERSE, la cle "service_role" ne doit JAMAIS figurer ici ni dans
   aucun fichier du site : elle contourne toutes les regles.

   Tant que ce fichier n'est pas rempli, le jeu fonctionne normalement
   en local et le mode en ligne s'affiche comme indisponible.
   ==================================================================== */

const SUPABASE_URL      = "";   // ex. "https://abcdefghijkl.supabase.co"
const SUPABASE_ANON_KEY = "";   // ex. "eyJhbGciOiJIUzI1NiIsInR5cCI6..."

const EN_LIGNE_PRET = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (typeof window !== "undefined"){
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  window.EN_LIGNE_PRET = EN_LIGNE_PRET;
}
