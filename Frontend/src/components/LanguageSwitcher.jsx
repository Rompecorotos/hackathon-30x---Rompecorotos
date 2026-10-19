import React, { useEffect, useRef, useState } from 'react';
import { getLang, LANG_EVENT, LANGUAGES, setLang } from '../i18n';

const Globe = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

/** Selector de idioma (ES / EN / PT / IT). Los nombres de idioma no se traducen. */
export const LanguageSwitcher = () => {
  const [lang, setCurrent] = useState(getLang());
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onLang = (e) => setCurrent(e.detail);
    window.addEventListener(LANG_EVENT, onLang);
    return () => window.removeEventListener(LANG_EVENT, onLang);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <div ref={ref} className="relative" data-no-translate>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Idioma / Language: ${current.label}`}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
      >
        <Globe />
        {current.short}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={l.code === lang}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                l.code === lang ? 'font-bold text-[#2B2E4A]' : 'text-slate-700'
              }`}
            >
              {l.label}
              <span className="text-xs text-slate-400">{l.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
