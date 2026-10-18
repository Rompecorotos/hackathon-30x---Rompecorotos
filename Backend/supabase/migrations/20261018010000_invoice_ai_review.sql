-- Revisión con IA de cada factura antes de registrarla y origen de los datos.
-- Las facturas que la IA considera incorrectas no se guardan; aquí queda el veredicto de las aceptadas
-- ('valida') o 'no_revisada' si la IA no estaba disponible.

alter table public.invoices
  add column ai_verdict text not null default 'no_revisada'
    constraint invoices_ai_verdict_valid check (ai_verdict in ('valida', 'no_revisada')),
  add column ai_explanation text
    constraint invoices_ai_explanation_length check (char_length(ai_explanation) <= 1500),
  add column source text not null default 'manual'
    constraint invoices_source_valid check (source in ('manual', 'imagen', 'pdf', 'qr'));

-- Las columnas nuevas no son editables tras el alta: el GRANT de UPDATE sigue limitado a status, due_date y concept.
