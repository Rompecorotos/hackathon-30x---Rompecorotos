-- Perfiles de usuario (1:1 con auth.users). Las credenciales viven en Supabase Auth.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null
    constraint profiles_full_name_length check (char_length(btrim(full_name)) between 2 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Datos públicos del perfil de cada usuario autenticado.';

-- Mantener updated_at al día.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crear el perfil automáticamente al registrarse (metadato full_name del signUp).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(new.raw_user_meta_data ->> 'full_name', ''));
begin
  if char_length(v_name) < 2 then
    v_name := btrim(split_part(coalesce(new.email, ''), '@', 1));
  end if;
  v_name := left(v_name, 120);
  if char_length(v_name) < 2 then
    v_name := v_name || repeat('_', 2 - char_length(v_name));
  end if;
  insert into public.profiles (id, full_name)
  values (new.id, v_name);
  return new;
end;
$$;

-- Solo debe ejecutarlo el trigger, nunca la API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: cada usuario solo ve y edita su propio perfil.
-- Sin políticas de INSERT/DELETE: el alta la hace el trigger y la baja el ON DELETE CASCADE.
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
