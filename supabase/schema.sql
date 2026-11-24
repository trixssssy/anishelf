-- AniShelf - schéma Supabase initial
-- À exécuter dans Supabase > SQL Editor, après création du projet.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'Otaku' check (char_length(username) between 3 and 24),
  bio text not null default '' check (char_length(bio) <= 500),
  avatar_url text,
  showcase_anime_ids bigint[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.anime_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anilist_id integer not null check (anilist_id > 0),
  status text not null check (status in ('plan','watch','done','drop')),
  rating smallint check (rating between 1 and 10),
  episodes_watched integer not null default 0 check (episodes_watched >= 0),
  notes text not null default '' check (char_length(notes) <= 2000),
  anime_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, anilist_id)
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 300),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  anilist_id integer not null check (anilist_id > 0),
  position integer not null default 0,
  anime_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (playlist_id, anilist_id)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light','dark','system')),
  palette text not null default 'original',
  group_sagas boolean not null default true,
  synopsis_language text not null default 'original' check (synopsis_language in ('original','fr')),
  updated_at timestamptz not null default now()
);

create index if not exists anime_lists_user_status_idx on public.anime_lists(user_id, status);
create index if not exists playlists_user_position_idx on public.playlists(user_id, position);
create index if not exists playlist_items_playlist_position_idx on public.playlist_items(playlist_id, position);

-- Création automatique du profil et des préférences lors de l'inscription.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), 'Otaku'))
  on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Triggers updated_at.
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists anime_lists_updated_at on public.anime_lists;
create trigger anime_lists_updated_at before update on public.anime_lists for each row execute procedure public.set_updated_at();
drop trigger if exists playlists_updated_at on public.playlists;
create trigger playlists_updated_at before update on public.playlists for each row execute procedure public.set_updated_at();
drop trigger if exists user_preferences_updated_at on public.user_preferences;
create trigger user_preferences_updated_at before update on public.user_preferences for each row execute procedure public.set_updated_at();

-- RLS : chaque compte ne peut accéder qu'à ses propres données.
alter table public.profiles enable row level security;
alter table public.anime_lists enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists "profile select own" on public.profiles;
create policy "profile select own" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "profile insert own" on public.profiles;
create policy "profile insert own" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "anime list own rows" on public.anime_lists;
create policy "anime list own rows" on public.anime_lists for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "playlists own rows" on public.playlists;
create policy "playlists own rows" on public.playlists for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "playlist items own rows" on public.playlist_items;
create policy "playlist items own rows" on public.playlist_items for all to authenticated
using (auth.uid() = user_id and exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid()))
with check (auth.uid() = user_id and exists (select 1 from public.playlists p where p.id = playlist_id and p.user_id = auth.uid()));

drop policy if exists "preferences own rows" on public.user_preferences;
create policy "preferences own rows" on public.user_preferences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Avatar public pour affichage, écriture limitée au dossier de l'utilisateur.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatar owner upload" on storage.objects;
create policy "avatar owner upload" on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar owner update" on storage.objects;
create policy "avatar owner update" on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar owner delete" on storage.objects;
create policy "avatar owner delete" on storage.objects for delete to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
