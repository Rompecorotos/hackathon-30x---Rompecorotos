-- Dominio de cobro recurrente: clientes -> suscripciones -> cobros, aislados por comercio (owner_id).
-- Las FK compuestas (id, owner_id) impiden en la propia BD enlazar datos de otro usuario.

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null
    constraint customers_name_length check (char_length(btrim(name)) between 2 and 120),
  email text not null
    constraint customers_email_format check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' and char_length(email) <= 254),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_id_owner_key unique (id, owner_id)
);

create unique index customers_owner_email_key on public.customers (owner_id, lower(email));

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  customer_id uuid not null,
  description text not null
    constraint subscriptions_description_length check (char_length(btrim(description)) between 2 and 200),
  amount_cents bigint not null
    constraint subscriptions_amount_positive check (amount_cents > 0 and amount_cents <= 100000000000),
  currency text not null default 'USD'
    constraint subscriptions_currency_format check (currency ~ '^[A-Z]{3}$'),
  billing_interval text not null default 'monthly'
    constraint subscriptions_interval_valid check (billing_interval in ('weekly', 'monthly', 'yearly')),
  status text not null default 'active'
    constraint subscriptions_status_valid check (status in ('active', 'paused', 'canceled')),
  next_charge_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_id_owner_key unique (id, owner_id),
  constraint subscriptions_customer_fk foreign key (customer_id, owner_id)
    references public.customers (id, owner_id) on delete cascade
);

create index subscriptions_customer_idx on public.subscriptions (customer_id);
create index subscriptions_owner_next_charge_idx on public.subscriptions (owner_id, status, next_charge_date);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subscription_id uuid not null,
  amount_cents bigint not null
    constraint payments_amount_positive check (amount_cents > 0 and amount_cents <= 100000000000),
  currency text not null
    constraint payments_currency_format check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'pending'
    constraint payments_status_valid check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  failure_reason text
    constraint payments_failure_reason_length check (char_length(failure_reason) <= 300),
  due_date date not null,
  attempt_number integer not null default 1
    constraint payments_attempt_positive check (attempt_number between 1 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_subscription_fk foreign key (subscription_id, owner_id)
    references public.subscriptions (id, owner_id) on delete cascade
);

create index payments_subscription_idx on public.payments (subscription_id);
create index payments_owner_status_due_idx on public.payments (owner_id, status, due_date desc);

-- updated_at (función creada en la migración de perfiles).
create trigger customers_set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- RLS: cada comercio gestiona exclusivamente sus propios datos.
alter table public.customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

revoke all on table public.customers, public.subscriptions, public.payments from anon, authenticated;
grant select, insert, update, delete on table public.customers, public.subscriptions, public.payments to authenticated;
-- owner_id, id y created_at no son modificables desde la API.
revoke update on table public.customers, public.subscriptions, public.payments from authenticated;
grant update (name, email) on table public.customers to authenticated;
grant update (description, amount_cents, currency, billing_interval, status, next_charge_date)
  on table public.subscriptions to authenticated;
grant update (status, failure_reason, due_date, attempt_number) on table public.payments to authenticated;

create policy "customers_owner_all" on public.customers for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "subscriptions_owner_all" on public.subscriptions for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "payments_owner_all" on public.payments for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
