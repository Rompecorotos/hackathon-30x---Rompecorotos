-- Plan de Bankly contratado por cada usuario (Starter / Pro). Enterprise se gestiona con ventas.
-- Los usuarios solo pueden LEER su plan; contratar, renovar o cambiar pasa por set_account_plan(),
-- que calcula las fechas en la BD para que nadie pueda alargar su periodo a mano.
-- Sin pasarela de pago: la activación es inmediata (modo demostración).

create table public.account_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan_id text not null
    constraint account_plans_plan_valid check (plan_id in ('starter', 'pro', 'enterprise')),
  current_period_start date not null,
  current_period_end date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_plans_period_valid check (current_period_end > current_period_start)
);

create trigger account_plans_set_updated_at before update on public.account_plans
  for each row execute function public.set_updated_at();

alter table public.account_plans enable row level security;
revoke all on table public.account_plans from anon, authenticated;
grant select on table public.account_plans to authenticated;

create policy "account_plans_select_own" on public.account_plans for select to authenticated
  using ((select auth.uid()) = user_id);

-- p_action: 'subscribe' (contratar), 'renew' (renovar 1 mes) o 'change' (cambiar de plan).
create or replace function public.set_account_plan(p_action text, p_plan text default null)
returns public.account_plans
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := current_date;
  v_row public.account_plans;
begin
  if v_uid is null then
    raise exception 'No autenticado' using errcode = '42501';
  end if;
  if p_action not in ('subscribe', 'renew', 'change') then
    raise exception 'Acción inválida' using errcode = '22023';
  end if;
  if p_action <> 'renew' and coalesce(p_plan, '') not in ('starter', 'pro') then
    raise exception 'Plan no disponible para contratación directa' using errcode = '22023';
  end if;

  select * into v_row from public.account_plans where user_id = v_uid for update;

  if p_action = 'subscribe' then
    if found and v_row.current_period_end >= v_today then
      raise exception 'Ya tienes un plan activo: usa renovar o cambiar' using errcode = 'P0001';
    end if;
    insert into public.account_plans (user_id, plan_id, current_period_start, current_period_end)
    values (v_uid, p_plan, v_today, (v_today + interval '1 month')::date)
    on conflict (user_id) do update
      set plan_id = excluded.plan_id,
          current_period_start = excluded.current_period_start,
          current_period_end = excluded.current_period_end
    returning * into v_row;
  elsif not found then
    raise exception 'No tienes un plan para renovar o cambiar' using errcode = 'P0002';
  elsif p_action = 'renew' then
    -- Suma un mes desde el final del periodo (o desde hoy si ya venció).
    update public.account_plans
      set current_period_start = least(current_period_start, v_today),
          current_period_end = (greatest(current_period_end, v_today) + interval '1 month')::date
      where user_id = v_uid
      returning * into v_row;
  else
    if v_row.plan_id = p_plan then
      raise exception 'Ya tienes ese plan' using errcode = 'P0001';
    end if;
    -- El cambio aplica desde hoy; si el plan estaba vencido, empieza un nuevo mes.
    update public.account_plans
      set plan_id = p_plan,
          current_period_start = case when current_period_end < v_today then v_today else current_period_start end,
          current_period_end = case when current_period_end < v_today then (v_today + interval '1 month')::date else current_period_end end
      where user_id = v_uid
      returning * into v_row;
  end if;

  return v_row;
end;
$$;

revoke execute on function public.set_account_plan(text, text) from public, anon;
grant execute on function public.set_account_plan(text, text) to authenticated;
