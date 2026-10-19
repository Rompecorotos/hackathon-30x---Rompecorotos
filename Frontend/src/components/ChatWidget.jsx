import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { getLang } from '../i18n';

const MAX_CHARS = 2000;

const TOOL_LABELS = {
  'tool-resumenCobros': 'Calculando resumen de cobros',
  'tool-cobrosFallidos': 'Revisando cobros fallidos',
  'tool-proximosCobros': 'Consultando próximos cobros',
  'tool-buscarCliente': 'Buscando cliente',
  'tool-facturas': 'Revisando facturas',
};

const SUGGESTIONS = [
  '¿Cómo funcionan los reintentos inteligentes?',
  'Analiza mis cobros fallidos y sugiere reintentos',
  'Dame un resumen de mi negocio este mes',
];

// El backend devuelve {error} en JSON para fallos previos al stream (401, 429, 503...).
const readError = (error) => {
  try {
    return JSON.parse(error.message).error ?? error.message;
  } catch {
    return error.message || 'Ha ocurrido un error';
  }
};

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const { messages, sendMessage, status, error, stop, setMessages, clearError } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat', credentials: 'same-origin', headers: () => ({ 'x-lang': getLang() }) }),
  });
  const isBusy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const send = (text) => {
    const value = text.trim();
    if (!value || isBusy || value.length > MAX_CHARS) return;
    clearError();
    sendMessage({ text: value });
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex h-[min(560px,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between bg-[#2B2E4A] px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">Asistente Bankly</p>
              <p className="text-[11px] text-slate-300">Soporte y análisis de cobros · IA</p>
            </div>
            <div className="flex items-center gap-3">
              {messages.length > 0 && (
                <button type="button" onClick={() => { stop(); setMessages([]); clearError(); }} className="text-xs text-slate-300 hover:text-white">
                  Nueva
                </button>
              )}
              <button type="button" aria-label="Cerrar asistente" onClick={() => setIsOpen(false)} className="text-lg leading-none text-slate-300 hover:text-white">
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-slate-600">Hola 👋 Puedo resolver dudas sobre Bankly y analizar tus cobros.</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-xs text-slate-700 transition hover:border-[#5BD3C7] hover:bg-slate-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] space-y-1 rounded-2xl px-3 py-2 ${
                    m.role === 'user' ? 'bg-[#5BD3C7] text-[#2B2E4A]' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {m.parts.map((part, i) => {
                    // El texto lo escribe el usuario o la IA (ya en el idioma elegido): no se traduce.
                    if (part.type === 'text') return <p key={i} data-no-translate className="whitespace-pre-wrap">{part.text}</p>;
                    if (TOOL_LABELS[part.type]) {
                      const done = part.state === 'output-available' || part.state === 'output-error';
                      return (
                        <p key={i} className="text-[11px] italic text-slate-500">
                          {done ? '✓' : '…'} {TOOL_LABELS[part.type]}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}

            {status === 'submitted' && <p className="text-xs italic text-slate-500">Pensando…</p>}
            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {readError(error)}
              </p>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-slate-200 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={MAX_CHARS}
              placeholder="Escribe tu pregunta…"
              aria-label="Mensaje para el asistente"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#5BD3C7] focus:outline-none focus:ring-2 focus:ring-[#5BD3C7]/20"
            />
            {isBusy ? (
              <button type="button" onClick={stop} className="rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600">
                Detener
              </button>
            ) : (
              <button type="submit" disabled={!input.trim()} className="rounded-xl bg-[#5BD3C7] px-3 text-sm font-bold text-[#2B2E4A] disabled:opacity-50">
                Enviar
              </button>
            )}
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente IA'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1CB5C9] text-white shadow-lg shadow-[#1CB5C9]/30 transition hover:scale-105 hover:bg-[#169FB1]"
      >
        {isOpen ? (
          <span className="text-2xl leading-none">×</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden="true">
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 21v-4.03a48.527 48.527 0 0 1-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979Z" />
            <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
          </svg>
        )}
      </button>
    </div>
  );
};
