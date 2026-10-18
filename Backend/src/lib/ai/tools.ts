import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { tool } from 'ai';
import { z } from 'zod';

/*
 * Herramientas del agente de pagos. Son de SOLO LECTURA y usan el cliente de
 * Supabase del usuario: RLS garantiza que la IA solo vea los datos de ese comercio.
 */

const MONTHLY_FACTOR: Record<string, number> = { weekly: 52 / 12, monthly: 1, yearly: 1 / 12 };

const money = (cents: number, currency: string) => `${(cents / 100).toFixed(2)} ${currency}`;

const isoDay = (offsetDays = 0) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

type CustomerRef = { name: string; email: string } | null;

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) {
    console.error('[ai-tools] Error de consulta:', result.error.message);
    throw new Error('No se pudieron consultar los datos');
  }
  return result.data as T;
}

export function createBillingTools(supabase: SupabaseClient) {
  return {
    resumenCobros: tool({
      description:
        'Resumen del negocio: cobros por estado e importe en un periodo, tasa de éxito, MRR (ingreso mensual recurrente) y número de suscripciones por estado.',
      inputSchema: z.object({
        dias: z.number().int().min(1).max(365).default(30).describe('Periodo hacia atrás en días'),
      }),
      execute: async ({ dias }) => {
        const payments = check(
          await supabase
            .from('payments')
            .select('amount_cents, currency, status')
            .gte('due_date', isoDay(-dias))
            .lte('due_date', isoDay())
            .limit(5000),
        ) as { amount_cents: number; currency: string; status: string }[];
        const subs = check(
          await supabase.from('subscriptions').select('amount_cents, currency, billing_interval, status').limit(5000),
        ) as { amount_cents: number; currency: string; billing_interval: string; status: string }[];

        const porEstado: Record<string, { cantidad: number; importes: Record<string, number> }> = {};
        for (const p of payments) {
          const bucket = (porEstado[p.status] ??= { cantidad: 0, importes: {} });
          bucket.cantidad++;
          bucket.importes[p.currency] = (bucket.importes[p.currency] ?? 0) + Number(p.amount_cents);
        }
        const exitosos = porEstado.succeeded?.cantidad ?? 0;
        const fallidos = porEstado.failed?.cantidad ?? 0;

        const mrr: Record<string, number> = {};
        const suscripciones: Record<string, number> = {};
        for (const s of subs) {
          suscripciones[s.status] = (suscripciones[s.status] ?? 0) + 1;
          if (s.status === 'active') {
            mrr[s.currency] = (mrr[s.currency] ?? 0) + Number(s.amount_cents) * (MONTHLY_FACTOR[s.billing_interval] ?? 1);
          }
        }

        return {
          periodo: `${isoDay(-dias)} a ${isoDay()}`,
          cobrosPorEstado: Object.fromEntries(
            Object.entries(porEstado).map(([estado, b]) => [
              estado,
              { cantidad: b.cantidad, importe: Object.entries(b.importes).map(([c, v]) => money(v, c)) },
            ]),
          ),
          tasaExito: exitosos + fallidos ? `${((exitosos / (exitosos + fallidos)) * 100).toFixed(1)}%` : 'sin datos',
          mrr: Object.entries(mrr).map(([c, v]) => money(Math.round(v), c)),
          suscripciones,
        };
      },
    }),

    cobrosFallidos: tool({
      description: 'Lista los cobros fallidos recientes con cliente, motivo del fallo y número de intento.',
      inputSchema: z.object({
        dias: z.number().int().min(1).max(365).default(30),
        limite: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ dias, limite }) => {
        const rows = check(
          await supabase
            .from('payments')
            .select('id, amount_cents, currency, failure_reason, due_date, attempt_number, subscription:subscriptions(description, status, customer:customers(name, email))')
            .eq('status', 'failed')
            .gte('due_date', isoDay(-dias))
            .order('due_date', { ascending: false })
            .limit(limite),
        ) as unknown as {
          id: string;
          amount_cents: number;
          currency: string;
          failure_reason: string | null;
          due_date: string;
          attempt_number: number;
          subscription: { description: string; status: string; customer: CustomerRef } | null;
        }[];
        return rows.map((p) => ({
          cliente: p.subscription?.customer?.name ?? 'desconocido',
          email: p.subscription?.customer?.email,
          suscripcion: p.subscription?.description,
          estadoSuscripcion: p.subscription?.status,
          importe: money(Number(p.amount_cents), p.currency),
          vencimiento: p.due_date,
          intento: p.attempt_number,
          motivo: p.failure_reason ?? 'sin motivo registrado',
        }));
      },
    }),

    proximosCobros: tool({
      description: 'Suscripciones activas con cobro programado en los próximos días.',
      inputSchema: z.object({ dias: z.number().int().min(1).max(90).default(7) }),
      execute: async ({ dias }) => {
        const rows = check(
          await supabase
            .from('subscriptions')
            .select('description, amount_cents, currency, billing_interval, next_charge_date, customer:customers(name, email)')
            .eq('status', 'active')
            .gte('next_charge_date', isoDay())
            .lte('next_charge_date', isoDay(dias))
            .order('next_charge_date')
            .limit(100),
        ) as unknown as {
          description: string;
          amount_cents: number;
          currency: string;
          billing_interval: string;
          next_charge_date: string;
          customer: CustomerRef;
        }[];
        return rows.map((s) => ({
          cliente: s.customer?.name,
          suscripcion: s.description,
          importe: money(Number(s.amount_cents), s.currency),
          periodicidad: s.billing_interval,
          fecha: s.next_charge_date,
        }));
      },
    }),

    buscarCliente: tool({
      description: 'Busca clientes por nombre o email y devuelve sus suscripciones y últimos cobros.',
      inputSchema: z.object({ texto: z.string().min(2).max(100).describe('Nombre o email (parcial)') }),
      execute: async ({ texto }) => {
        // Quitar caracteres con significado en la sintaxis de filtros de PostgREST.
        const term = texto.replace(/[,()*%\\:"]/g, ' ').trim();
        if (term.length < 2) return [];
        const rows = check(
          await supabase
            .from('customers')
            .select('name, email, subscriptions(description, amount_cents, currency, status, next_charge_date, payments(status, amount_cents, currency, due_date, failure_reason, attempt_number))')
            .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
            .limit(5),
        ) as unknown as {
          name: string;
          email: string;
          subscriptions: {
            description: string;
            amount_cents: number;
            currency: string;
            status: string;
            next_charge_date: string;
            payments: { status: string; amount_cents: number; currency: string; due_date: string; failure_reason: string | null; attempt_number: number }[];
          }[];
        }[];
        return rows.map((c) => ({
          cliente: c.name,
          email: c.email,
          suscripciones: c.subscriptions.map((s) => ({
            descripcion: s.description,
            importe: money(Number(s.amount_cents), s.currency),
            estado: s.status,
            proximoCobro: s.next_charge_date,
            ultimosCobros: s.payments
              .sort((a, b) => b.due_date.localeCompare(a.due_date))
              .slice(0, 10)
              .map((p) => ({
                estado: p.status,
                importe: money(Number(p.amount_cents), p.currency),
                vencimiento: p.due_date,
                intento: p.attempt_number,
                motivo: p.failure_reason ?? undefined,
              })),
          })),
        }));
      },
    }),
  };
}
