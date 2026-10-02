-- ====================================================================
-- UNDERCOVER Z — la base de donnees du mode en ligne
--
-- A COLLER UNE SEULE FOIS dans Supabase : SQL Editor -> New query -> Run.
-- Relancer ce fichier plus tard ne casse rien (tout est "if not exists").
--
-- L'idee : l'hote est l'arbitre. Lui seul ecrit l'etat de la partie.
-- Les autres envoient des actions et lisent l'etat PUBLIC.
-- Le secret du jeu tient a une seule regle, celle de la table "cartes" :
-- chaque joueur ne peut lire QUE sa propre ligne.
-- ====================================================================


-- 1 · PROFILS --------------------------------------------------------
create table if not exists profils (
  id        uuid primary key references auth.users on delete cascade,
  pseudo    text not null,
  aura      text default '#ff8a00',
  parties   int default 0,
  victoires int default 0,
  cree_le   timestamptz default now()
);
alter table profils enable row level security;

drop policy if exists "profils lisibles" on profils;
create policy "profils lisibles" on profils
  for select to authenticated using (true);

drop policy if exists "chacun gere son profil" on profils;
create policy "chacun gere son profil" on profils
  for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- le profil se cree tout seul a l'inscription
create or replace function public.creer_profil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profils (id, pseudo, aura)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'pseudo',''), 'Guerrier_' || substr(new.id::text, 1, 4)),
    coalesce(nullif(new.raw_user_meta_data->>'aura',''), '#ff8a00')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists au_nouveau_joueur on auth.users;
create trigger au_nouveau_joueur after insert on auth.users
  for each row execute function public.creer_profil();


-- 2 · SALONS ---------------------------------------------------------
create table if not exists salons (
  code     text primary key,              -- ex. KI-7F3Q
  hote     uuid not null references auth.users on delete cascade,
  reglages jsonb not null,                -- joueurs, mangas, tours, mode...
  etat     jsonb,                         -- etat PUBLIC : aucun role, aucun perso secret
  ouvert   boolean default true,          -- false = la partie a commence
  cree_le  timestamptz default now()
);
alter table salons enable row level security;

drop policy if exists "salons lisibles" on salons;
create policy "salons lisibles" on salons
  for select to authenticated using (true);

drop policy if exists "l hote gere son salon" on salons;
create policy "l hote gere son salon" on salons
  for all to authenticated using (auth.uid() = hote) with check (auth.uid() = hote);


-- 3 · LES JOUEURS D'UN SALON -----------------------------------------
create table if not exists joueurs_salon (
  salon     text not null references salons(code) on delete cascade,
  joueur    uuid not null references auth.users on delete cascade,
  pseudo    text not null,
  place     int,
  entre_le  timestamptz default now(),
  primary key (salon, joueur)
);
alter table joueurs_salon enable row level security;

drop policy if exists "liste des joueurs lisible" on joueurs_salon;
create policy "liste des joueurs lisible" on joueurs_salon
  for select to authenticated using (true);

drop policy if exists "chacun s inscrit lui meme" on joueurs_salon;
create policy "chacun s inscrit lui meme" on joueurs_salon
  for insert to authenticated with check (auth.uid() = joueur);

drop policy if exists "sortir du salon" on joueurs_salon;
create policy "sortir du salon" on joueurs_salon
  for delete to authenticated using (
    auth.uid() = joueur or auth.uid() = (select hote from salons where code = salon)
  );

drop policy if exists "l hote place les joueurs" on joueurs_salon;
create policy "l hote place les joueurs" on joueurs_salon
  for update to authenticated using (
    auth.uid() = (select hote from salons where code = salon)
  );


-- 4 · LES CARTES SECRETES --------------------------------------------
create table if not exists cartes (
  salon  text not null references salons(code) on delete cascade,
  joueur uuid not null references auth.users on delete cascade,
  role   text not null,                   -- civil | undercover | mrwhite
  perso  jsonb,                           -- null pour Mr. White
  primary key (salon, joueur)
);
alter table cartes enable row level security;

-- LA regle qui protege tout le jeu
drop policy if exists "je ne vois que ma carte" on cartes;
create policy "je ne vois que ma carte" on cartes
  for select to authenticated using (auth.uid() = joueur);

-- L'hote distribue et efface, mais ne LIT pas les cartes des autres :
-- seule la regle du dessus s'applique a la lecture, pour tout le monde.
drop policy if exists "l hote distribue" on cartes;
create policy "l hote distribue" on cartes
  for insert to authenticated with check (
    auth.uid() = (select hote from salons where code = salon)
  );

drop policy if exists "l hote efface les cartes" on cartes;
create policy "l hote efface les cartes" on cartes
  for delete to authenticated using (
    auth.uid() = (select hote from salons where code = salon)
  );


-- 5 · LES ACTIONS DES JOUEURS ----------------------------------------
create table if not exists actions (
  id      bigserial primary key,
  salon   text not null references salons(code) on delete cascade,
  joueur  uuid not null references auth.users on delete cascade,
  type    text not null,                  -- vu | trait | vote | deviner | ...
  payload jsonb,
  cree_le timestamptz default now()
);
alter table actions enable row level security;

drop policy if exists "chacun envoie ses actions" on actions;
create policy "chacun envoie ses actions" on actions
  for insert to authenticated with check (auth.uid() = joueur);

-- seul l'hote lit les actions : les votes ne doivent pas fuiter
drop policy if exists "l hote lit les actions" on actions;
create policy "l hote lit les actions" on actions
  for select to authenticated using (
    auth.uid() = (select hote from salons where code = salon)
  );

create index if not exists actions_salon_id on actions (salon, id);


-- 6 · DROITS D'ACCES DE L'API ----------------------------------------
-- Ces GRANT rendent le schema utilisable par supabase-js meme si l'option
-- "Automatically expose new tables" est decochee dans les reglages du projet.
-- Ils n'ouvrent rien : c'est RLS, au-dessus, qui decide ligne par ligne.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  profils, salons, joueurs_salon, cartes, actions to authenticated;
grant usage, select on sequence actions_id_seq to authenticated;


-- 7 · TEMPS REEL -----------------------------------------------------
-- sans ca, personne n'est prevenu des changements
do $$ begin
  alter publication supabase_realtime add table salons;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table joueurs_salon;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table actions;
exception when duplicate_object then null; end $$;


-- 8 · MENAGE ---------------------------------------------------------
-- a appeler de temps en temps (ou via un cron Supabase) :
--   select menage_salons();
create or replace function public.menage_salons() returns void
language sql security definer set search_path = public as $$
  delete from salons where cree_le < now() - interval '12 hours';
$$;
