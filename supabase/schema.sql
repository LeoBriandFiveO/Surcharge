-- Schéma Supabase de Surcharge.
-- À coller dans Supabase > SQL Editor > New query, puis "Run".

-- ---------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 30),
  display_name text,
  created_at timestamptz not null default now()
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null,
  rep_min int not null default 8 check (rep_min > 0),
  rep_max int not null default 12 check (rep_max >= rep_min),
  increment numeric not null default 2.5 check (increment >= 0),
  created_at timestamptz not null default now()
);

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  position int not null default 0,
  sets int not null default 3 check (sets > 0)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  routine_id uuid references public.routines (id) on delete set null,
  title text not null,
  note text,
  is_public boolean not null default true,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  set_index int not null,
  weight numeric not null default 0,
  reps int not null,
  created_at timestamptz not null default now(),
  unique (workout_id, exercise_id, set_index)
);

create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.kudos (
  workout_id uuid not null references public.workouts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (workout_id, user_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index on public.workout_sets (user_id, exercise_id, created_at desc);
create index on public.workouts (user_id, finished_at desc);

-- ---------------------------------------------------------------
-- Création automatique du profil à l'inscription
-- ---------------------------------------------------------------

create schema if not exists private;
grant usage on schema private to authenticated;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || left(new.id::text, 8)),
    new.raw_user_meta_data ->> 'username'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- App entre amis : pas de validation d'e-mail, on peut se connecter tout de suite.
create function private.auto_confirm_email()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

create trigger auto_confirm_email
  before insert on auth.users
  for each row execute function private.auto_confirm_email();

-- ---------------------------------------------------------------
-- Règles de visibilité : je vois mes données, et les séances
-- publiques des personnes que je suis.
-- ---------------------------------------------------------------

create function private.is_following(target uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.follows
    where follower_id = auth.uid() and following_id = target
  );
$$;

create function private.can_view_workout(wid uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workouts w
    where w.id = wid
      and (w.user_id = auth.uid() or (w.is_public and private.is_following(w.user_id)))
  );
$$;

revoke execute on function private.is_following(uuid) from public, anon;
revoke execute on function private.can_view_workout(uuid) from public, anon;
revoke execute on function private.handle_new_user() from public, anon, authenticated;
revoke execute on function private.auto_confirm_email() from public, anon, authenticated;
grant execute on function private.is_following(uuid) to authenticated;
grant execute on function private.can_view_workout(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;
alter table public.follows enable row level security;
alter table public.kudos enable row level security;
alter table public.comments enable row level security;

create policy "profils visibles" on public.profiles
  for select to authenticated using (true);
create policy "modifier mon profil" on public.profiles
  for update to authenticated using (id = auth.uid());

create policy "voir exercices" on public.exercises
  for select to authenticated using (user_id = auth.uid() or private.is_following(user_id));
create policy "gérer mes exercices" on public.exercises
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "gérer mes programmes" on public.routines
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "gérer exercices de mes programmes" on public.routine_exercises
  for all to authenticated
  using (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid()));

create policy "voir séances" on public.workouts
  for select to authenticated
  using (user_id = auth.uid() or (is_public and private.is_following(user_id)));
create policy "gérer mes séances" on public.workouts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "voir séries" on public.workout_sets
  for select to authenticated using (private.can_view_workout(workout_id));
create policy "gérer mes séries" on public.workout_sets
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "voir abonnements" on public.follows
  for select to authenticated using (true);
create policy "suivre" on public.follows
  for insert to authenticated with check (follower_id = auth.uid());
create policy "ne plus suivre" on public.follows
  for delete to authenticated using (follower_id = auth.uid());

create policy "voir kudos" on public.kudos
  for select to authenticated using (private.can_view_workout(workout_id));
create policy "donner kudos" on public.kudos
  for insert to authenticated with check (user_id = auth.uid() and private.can_view_workout(workout_id));
create policy "retirer kudos" on public.kudos
  for delete to authenticated using (user_id = auth.uid());

create policy "voir commentaires" on public.comments
  for select to authenticated using (private.can_view_workout(workout_id));
create policy "commenter" on public.comments
  for insert to authenticated with check (user_id = auth.uid() and private.can_view_workout(workout_id));
create policy "supprimer mon commentaire" on public.comments
  for delete to authenticated using (user_id = auth.uid());
