-- Uso del asistente IA: límite de peticiones por usuario (aplicado en /api/ai/chat).

-- Registro de uso del asistente IA (límite de peticiones por usuario para proteger la cuota gratuita).
create table public.ai_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index ai_requests_user_created_idx on public.ai_requests (user_id, created_at desc);

alter table public.ai_requests enable row level security;
revoke all on table public.ai_requests from anon, authenticated;
grant select, insert on table public.ai_requests to authenticated;

-- Sin UPDATE/DELETE: el usuario no puede borrar su historial para saltarse el límite.
create policy "ai_requests_select_own" on public.ai_requests for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "ai_requests_insert_own" on public.ai_requests for insert to authenticated
  with check ((select auth.uid()) = user_id);
