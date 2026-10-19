import { NextResponse } from 'next/server';
import { getBcvRates, getBinanceUsdt } from '@/lib/rates';

// Sincronización automática: Vercel regenera la respuesta como mucho cada 10 minutos (ISR),
// así que la consulta a BCV y Binance no se repite en cada visita.
export const revalidate = 600;
// São Paulo: Binance bloquea servidores de EE. UU.; además está cerca de Venezuela.
export const preferredRegion = 'gru1';

/** Tasas públicas: BCV (USD y EUR oficiales) y USDT en Binance P2P, en bolívares (VES). */
export async function GET() {
  const [bcv, binance] = await Promise.allSettled([getBcvRates(), getBinanceUsdt()]);
  const reason = (r: PromiseSettledResult<unknown>) =>
    r.status === 'rejected' ? (r.reason instanceof Error ? r.reason.message : String(r.reason)) : undefined;
  if (bcv.status === 'rejected') console.error('[rates] BCV:', reason(bcv));
  if (binance.status === 'rejected') console.error('[rates] Binance:', reason(binance));

  return NextResponse.json({
    currency: 'VES',
    bcv: bcv.status === 'fulfilled' ? bcv.value : null,
    binance: binance.status === 'fulfilled' ? binance.value : null,
    syncedAt: new Date().toISOString(),
    refreshSeconds: revalidate,
  });
}
