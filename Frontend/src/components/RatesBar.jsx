import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { getLocale } from '../i18n';

const REFRESH_MS = 5 * 60 * 1000;
const ves = (n) => n.toLocaleString(getLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Tendencia respecto a la sincronización anterior: ▲ sube, ▼ baja.
const TREND = {
  up: { icon: '▲', color: 'text-emerald-400', flash: 'bankly-flash-up' },
  down: { icon: '▼', color: 'text-red-400', flash: 'bankly-flash-down' },
};

const Rate = ({ label, value, trend, title, flashKey }) => (
  <span
    key={flashKey}
    title={title}
    className={`flex items-baseline gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 ${trend ? TREND[trend].flash : ''}`}
  >
    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">{label}</span>
    <span className="font-bold tabular-nums text-white">Bs. {value}</span>
    {trend && <span className={`text-[10px] ${TREND[trend].color}`}>{TREND[trend].icon}</span>}
  </span>
);

const Dot = () => <span className="text-slate-500" aria-hidden="true">•</span>;

/** Cinta animada de tasas: BCV (USD y EUR oficiales) y USDT en Binance P2P, sincronizadas automáticamente. */
export const RatesBar = () => {
  const [rates, setRates] = useState(null);
  const [failed, setFailed] = useState(false);
  const [trends, setTrends] = useState({});
  const [syncCount, setSyncCount] = useState(0);
  const previous = useRef(null);

  const load = useCallback(
    () =>
      api
        .getRates()
        .then((data) => {
          const prev = previous.current;
          const compare = (a, b) => (a == null || b == null || a === b ? null : b > a ? 'up' : 'down');
          if (prev) {
            setTrends({
              usd: compare(prev.bcv?.usd, data.bcv?.usd),
              eur: compare(prev.bcv?.eur, data.bcv?.eur),
              usdt: compare(prev.binance?.average, data.binance?.average),
            });
          }
          previous.current = data;
          setRates(data);
          setSyncCount((n) => n + 1);
          setFailed(false);
        })
        .catch(() => setFailed(true)),
    [],
  );

  useEffect(() => {
    load();
    const timer = setInterval(() => document.visibilityState === 'visible' && load(), REFRESH_MS);
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  if (!rates && !failed) return null;

  const { bcv, binance } = rates ?? {};
  const synced = rates?.syncedAt
    ? new Date(rates.syncedAt).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' })
    : null;

  const items = (
    <>
      {bcv ? (
        <>
          <Rate flashKey={`usd-${syncCount}`} label="Dólar BCV" value={ves(bcv.usd)} trend={trends.usd} title={`Tasa oficial del BCV · fuente: ${bcv.source}`} />
          <Dot />
          <Rate flashKey={`eur-${syncCount}`} label="Euro BCV" value={ves(bcv.eur)} trend={trends.eur} title={`Tasa oficial del BCV · fuente: ${bcv.source}`} />
        </>
      ) : (
        <span className="whitespace-nowrap text-xs text-slate-400">BCV no disponible</span>
      )}
      <Dot />
      {binance ? (
        <>
          <Rate flashKey={`usdt-${syncCount}`} label="USDT Binance" value={ves(binance.average)} trend={trends.usdt} title="Binance P2P · promedio entre compra y venta" />
          <span className="whitespace-nowrap text-[11px] text-slate-400">
            Compra Bs. {ves(binance.buy)} · Venta Bs. {ves(binance.sell)}
          </span>
        </>
      ) : (
        <span className="whitespace-nowrap text-xs text-slate-400">Binance no disponible</span>
      )}
      <Dot />
    </>
  );

  return (
    <div className="w-full bg-[#2B2E4A] text-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2 sm:px-6 lg:px-8">
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#5BD3C7]">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5BD3C7] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5BD3C7]" />
          </span>
          Tasas del día
        </span>

        {/* Cinta: el contenido va duplicado para que el bucle sea continuo; se pausa al pasar el ratón. */}
        <div
          className="bankly-ticker-viewport relative min-w-0 flex-1 overflow-hidden"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)' }}
          tabIndex={0}
          aria-label="Cotizaciones del día (se pausa al pasar el ratón)"
        >
          <div className="bankly-ticker flex w-max items-center">
            <div className="flex items-center gap-4 pr-4">{items}</div>
            <div className="flex items-center gap-4 pr-4" aria-hidden="true">
              {items}
            </div>
          </div>
        </div>

        {synced && <span className="hidden shrink-0 text-[11px] text-slate-400 sm:inline">Sincronizado {synced}</span>}
      </div>
    </div>
  );
};
