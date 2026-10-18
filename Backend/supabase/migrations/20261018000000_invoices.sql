-- Facturas recibidas por el comercio (formulario /registroFact). El agente de pagos las revisa desde el estado "recibida".

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  invoice_number text not null
    constraint invoices_number_length check (char_length(btrim(invoice_number)) between 1 and 60),
  payee text not null
    constraint invoices_payee_length check (char_length(btrim(payee)) between 2 and 160),
  amount_cents bigint not null
    constraint invoices_amount_positive check (amount_cents > 0 and amount_cents <= 100000000000),
  currency text not null default 'USD'
    constraint invoices_currency_format check (currency ~ '^[A-Z]{3}$'),
  due_date date not null,
  concept text
    constraint invoices_concept_length check (char_length(concept) <= 500),
  status text not null default 'recibida'
    constraint invoices_status_valid check (status in ('recibida', 'aprobada', 'pagada', 'rechazada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Evita registrar dos veces la misma factura del mismo beneficiario.
create unique index invoices_owner_number_payee_key on public.invoices (owner_id, lower(payee), invoice_number);
create index invoices_owner_status_due_idx on public.invoices (owner_id, status, due_date);

create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

alter table public.invoices enable row level security;

revoke all on table public.invoices from anon, authenticated;
grant select, insert, delete on table public.invoices to authenticated;
-- Tras el alta solo cambian estado, vencimiento y concepto (importe y beneficiario son inmutables).
grant update (status, due_date, concept) on table public.invoices to authenticated;

create policy "invoices_owner_all" on public.invoices for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
