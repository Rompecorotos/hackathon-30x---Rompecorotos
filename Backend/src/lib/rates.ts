import 'server-only';
import https from 'node:https';
import tls from 'node:tls';
import { SECTIGO_DV_R36 } from '@/lib/certs';

// Tasas de cambio en Venezuela: oficiales del BCV (USD y EUR) y USDT en Binance P2P.

export type BcvRates = { usd: number; eur: number; valueDate: string | null; source: string };
export type BinanceRate = { buy: number; sell: number; average: number; ads: number; source: string };

const TIMEOUT_MS = 10_000;
const UA = 'Mozilla/5.0 (compatible; BanklyRates/1.0; +https://bankly-app.vercel.app)';

const parseVes = (s: string) => Number(s.trim().replace(/\./g, '').replace(',', '.'));
const median = (values: number[]) => {
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
};
const round = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

/** GET HTTPS verificando la cadena con las raíces de Node + el intermedio que el BCV no envía. */
function getBcvHtml(): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      'https://www.bcv.org.ve/',
      { headers: { 'user-agent': UA }, ca: [...tls.rootCertificates, SECTIGO_DV_R36], timeout: TIMEOUT_MS },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`BCV HTTP ${res.statusCode}`));
        }
        let html = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (html += chunk));
        res.on('end', () => resolve(html));
      },
    );
    req.on('timeout', () => req.destroy(new Error('BCV: tiempo de espera agotado')));
    req.on('error', reject);
  });
}

/** Web oficial del BCV (bcv.org.ve): bloques #dolar y #euro y la "Fecha Valor". */
async function fromBcvWebsite(): Promise<BcvRates> {
  const html = await getBcvHtml();
  const rate = (id: string) => {
    const m = html.match(new RegExp(`id="${id}"[\\s\\S]{0,600}?<strong[^>]*>\\s*([0-9.,]+)\\s*</strong>`));
    const n = m ? parseVes(m[1]) : NaN;
    if (!Number.isFinite(n) || n <= 0) throw new Error(`BCV: no se encontró la tasa ${id}`);
    return n;
  };
  const date = html.match(/Fecha Valor:[\s\S]{0,300}?content="([^"]+)"/)?.[1] ?? null;
  return { usd: round(rate('dolar')), eur: round(rate('euro')), valueDate: date, source: 'bcv.org.ve' };
}

/** Respaldo: ve.dolarapi.com replica las tasas oficiales del BCV. */
async function fromDolarApi(): Promise<BcvRates> {
  const get = async (path: string) => {
    const res = await fetch(`https://ve.dolarapi.com/v1/${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) throw new Error(`dolarapi HTTP ${res.status}`);
    return (await res.json()) as { promedio: number; fechaActualizacion: string };
  };
  const [usd, eur] = await Promise.all([get('dolares/oficial'), get('euros/oficial')]);
  if (!(usd.promedio > 0 && eur.promedio > 0)) throw new Error('dolarapi: tasas inválidas');
  return { usd: round(usd.promedio), eur: round(eur.promedio), valueDate: usd.fechaActualizacion ?? null, source: 've.dolarapi.com' };
}

export async function getBcvRates(): Promise<BcvRates> {
  try {
    return await fromBcvWebsite();
  } catch (error) {
    console.warn('[rates] Web del BCV no disponible, usando respaldo:', error instanceof Error ? error.message : error);
    return fromDolarApi();
  }
}

/** USDT/VES en Binance P2P: mediana de los 10 mejores anuncios de compra y de venta. */
export async function getBinanceUsdt(): Promise<BinanceRate> {
  const side = async (tradeType: 'BUY' | 'SELL') => {
    const res = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': UA },
      body: JSON.stringify({ asset: 'USDT', fiat: 'VES', tradeType, page: 1, rows: 10, payTypes: [], publisherType: null }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
    const body = (await res.json()) as { data?: { adv: { price: string } }[] };
    const prices = (body.data ?? []).map((d) => Number(d.adv.price)).filter((n) => Number.isFinite(n) && n > 0);
    if (prices.length < 3) throw new Error('Binance: pocos anuncios');
    return prices;
  };
  const [buy, sell] = await Promise.all([side('BUY'), side('SELL')]);
  const b = median(buy);
  const s = median(sell);
  return { buy: round(b, 2), sell: round(s, 2), average: round((b + s) / 2, 2), ads: buy.length + sell.length, source: 'p2p.binance.com' };
}
