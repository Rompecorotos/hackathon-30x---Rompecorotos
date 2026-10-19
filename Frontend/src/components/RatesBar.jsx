import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getLocale } from '../i18n';

const REFRESH_MS = 5 * 60 * 1000;
const ves = (n) => n.toLocaleString(getLocale(), { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Rate = ({ label, value, title }) => (
  <span className="flex items-baseline gap-1.5 whitespace-nowrap" title={title}>
    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">{label}</span>
    <span className="font-bold text-white">Bs. {value}</span>
  </span>
);

/** Barra de tasas: BCV (USD y EUR oficiales) y USDT en Binance P2P, sincronizadas automáticamente. */
export const RatesBar = () => {
  const [rates, setRates] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(
    () =>
      api
        .getRates()
        .then((data) => {
          setRates(data);
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
  const synced = rates?.syncedAt ? new Date(rates.syncedAt).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className="w-full bg-[#2B2E4A] text-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-x-6 gap-y-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#5BD3C7]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#5BD3C7]" aria-hidden="true" />
          Tasas del día
        </span>
        {bcv ? (
          <>
            <Rate label="Dólar BCV" value={ves(bcv.usd)} title={`Tasa oficial del BCV · fuente: ${bcv.source}`} />
            <Rate label="Euro BCV" value={ves(bcv.eur)} title={`Tasa oficial del BCV · fuente: ${bcv.source}`} />
          </>
        ) : (
          <span className="text-xs text-slate-400">BCV no disponible</span>
        )}
        {binance ? (
          <Rate
            label="USDT Binance"
            value={ves(binance.average)}
            title={`Binance P2P · compra Bs. ${ves(binance.buy)} · venta Bs. ${ves(binance.sell)}`}
          />
        ) : (
          <span className="text-xs text-slate-400">Binance no disponible</span>
        )}
        {synced && <span className="ml-auto shrink-0 text-[11px] text-slate-400">Sincronizado {synced}</span>}
      </div>
    </div>
  );
};
