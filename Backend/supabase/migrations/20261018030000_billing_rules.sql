-- Reglas de cobro aplicadas en la base de datos (no se pueden saltar desde la API):
-- 1) Una suscripción no puede programarse con el próximo cobro ya vencido.
-- 2) Cada cobro (suscripción + fecha) admite como máximo 3 intentos y ninguno tras quedar cobrado.
--    El número de intento lo calcula la BD.
-- 3) Al registrar un cobro como "cobrado", el próximo cobro de la suscripción avanza solo.
-- 4) Registro de las facturas que la IA rechazó (para el contador del panel).

-- 1) Próximo cobro no vencido (solo al crear o al cambiar la fecha).
create or replace function public.check_next_charge_date()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Margen de 1 día: la BD está en UTC y en América "hoy" puede ser aún el día anterior.
  if new.next_charge_date < current_date - 1
     and (tg_op = 'INSERT' or new.next_charge_date is distinct from old.next_charge_date) then
    raise exception 'La fecha del próximo cobro ya está vencida: elige hoy o una fecha futura' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger subscriptions_check_next_charge_date
  before insert or update of next_charge_date on public.subscriptions
  for each row execute function public.check_next_charge_date();

-- 2) Límite de intentos y cobros duplicados.
alter table public.payments drop constraint payments_attempt_positive;
alter table public.payments add constraint payments_attempt_range check (attempt_number between 1 and 3) not valid;

create or replace function public.assign_payment_attempt()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_attempts integer;
  v_paid boolean;
begin
  -- Serializa los intentos del mismo cobro para que dos peticiones simultáneas no superen el límite.
  perform pg_advisory_xact_lock(hashtext(new.subscription_id::text || new.due_date::text));
  select count(*), coalesce(bool_or(status = 'succeeded'), false)
    into v_attempts, v_paid
    from public.payments
    where subscription_id = new.subscription_id and due_date = new.due_date;
  if v_paid then
    raise exception 'Este cobro ya figura como cobrado para esa fecha' using errcode = 'P0001';
  end if;
  if v_attempts >= 3 then
    raise exception 'Límite alcanzado: máximo 3 intentos de cobro por fecha' using errcode = 'P0001';
  end if;
  new.attempt_number := v_attempts + 1;
  return new;
end;
$$;

create trigger payments_assign_attempt
  before insert on public.payments
  for each row execute function public.assign_payment_attempt();

-- Un solo cobro "cobrado" por suscripción y fecha.
-- Antes, se eliminan los "cobrado" duplicados que ya existan (se conserva el registrado primero),
-- porque son registros repetidos por error y el índice no se podría crear con ellos.
delete from public.payments p
using public.payments keep
where p.status = 'succeeded' and keep.status = 'succeeded'
  and p.subscription_id = keep.subscription_id and p.due_date = keep.due_date
  and (p.created_at, p.id) > (keep.created_at, keep.id);

create unique index payments_one_success_per_due_date
  on public.payments (subscription_id, due_date) where status = 'succeeded';

-- 3) Avance automático del próximo cobro.
create or replace function public.advance_next_charge()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_sub public.subscriptions;
  v_step interval;
  v_next date;
begin
  if new.status <> 'succeeded' or (tg_op = 'UPDATE' and old.status = 'succeeded') then
    return new;
  end if;
  select * into v_sub from public.subscriptions where id = new.subscription_id;
  -- Solo avanza si se pagó el cobro programado (o uno posterior).
  if v_sub.id is null or new.due_date < v_sub.next_charge_date then
    return new;
  end if;
  v_step := case v_sub.billing_interval when 'weekly' then interval '7 days' when 'yearly' then interval '1 year' else interval '1 month' end;
  v_next := v_sub.next_charge_date;
  while v_next <= new.due_date loop
    v_next := (v_next + v_step)::date;
  end loop;
  update public.subscriptions set next_charge_date = v_next where id = v_sub.id;
  return new;
end;
$$;

create trigger payments_advance_next_charge
  after insert or update of status on public.payments
  for each row execute function public.advance_next_charge();

-- 4) Facturas rechazadas por la IA.
create table public.invoice_rejections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  invoice_number text not null constraint invoice_rejections_number_length check (char_length(invoice_number) <= 60),
  payee text not null constraint invoice_rejections_payee_length check (char_length(payee) <= 160),
  amount_cents bigint not null,
  currency text not null,
  source text not null constraint invoice_rejections_source_valid check (source in ('manual', 'imagen', 'pdf', 'qr')),
  reason text not null constraint invoice_rejections_reason_length check (char_length(reason) <= 1500),
  created_at timestamptz not null default now()
);

create index invoice_rejections_owner_created_idx on public.invoice_rejections (owner_id, created_at desc);

alter table public.invoice_rejections enable row level security;
revoke all on table public.invoice_rejections from anon, authenticated;
grant select, insert on table public.invoice_rejections to authenticated;

create policy "invoice_rejections_select_own" on public.invoice_rejections for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "invoice_rejections_insert_own" on public.invoice_rejections for insert to authenticated
  with check ((select auth.uid()) = owner_id);
