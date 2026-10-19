// Traducción de toda la interfaz (es → en, pt, it) sin tocar los componentes.
// Los textos en español extraídos del código (scripts/i18n-extract.mjs) se traducen con
// scripts/i18n-translate.mjs a en/pt/it.json. En el navegador se sustituyen los nodos de texto y los
// atributos visibles; un MutationObserver traduce también lo que React pinte después. Los textos con
// variables se resuelven con plantillas ("Tu plan: {0}"). Volver a español restaura los originales.
import en from './en.json';
import pt from './pt.json';
import it from './it.json';

export const LANGUAGES = [
  { code: 'es', label: 'Español', short: 'ES', locale: 'es-VE' },
  { code: 'en', label: 'English', short: 'EN', locale: 'en-US' },
  { code: 'pt', label: 'Português', short: 'PT', locale: 'pt-BR' },
  { code: 'it', label: 'Italiano', short: 'IT', locale: 'it-IT' },
];
const DICTS = { en, pt, it };
const STORAGE_KEY = 'bankly.lang';
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE', 'NOSCRIPT']);
export const LANG_EVENT = 'bankly:lang';

const storage = {
  get: () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set: (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* sin almacenamiento: el idioma no se recordará */
    }
  },
};

function detectLang() {
  const saved = storage.get();
  if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  const browser = (navigator.language || 'es').slice(0, 2).toLowerCase();
  return LANGUAGES.some((l) => l.code === browser) ? browser : 'es';
}

let lang = detectLang();
export const getLang = () => lang;
export const getLocale = () => LANGUAGES.find((l) => l.code === lang)?.locale ?? 'es-VE';

// ---- Diccionarios compilados: exactos + plantillas con {n} ----------------------------------------
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const compiled = {};
function compile(code) {
  if (compiled[code]) return compiled[code];
  const exact = new Map();
  const patterns = [];
  for (const [src, dst] of Object.entries(DICTS[code] ?? {})) {
    if (!/\{\d+\}/.test(src)) {
      exact.set(src, dst);
      continue;
    }
    // Las plantillas casi sin texto fijo ("{0} {1}") coincidirían con todo: se descartan.
    if (src.replace(/\{\d+\}/g, '').replace(/[^\p{L}]/gu, '').length < 3) continue;
    const order = [...src.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]));
    const re = new RegExp(`^${escapeRe(src).replace(/\\\{\d+\\\}/g, '([\\s\\S]+?)')}$`);
    patterns.push({ re, order, dst, weight: src.length });
  }
  patterns.sort((a, b) => b.weight - a.weight);
  return (compiled[code] = { exact, patterns });
}

/** Traduce un texto en español al idioma actual (o devuelve el original si no hay traducción). */
export function translate(text, code = lang) {
  if (code === 'es' || !text) return text;
  const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const core = m[2].replace(/\s+/g, ' ');
  if (!core) return text;
  const { exact, patterns } = compile(code);
  let out = exact.get(core);
  if (out === undefined) {
    for (const p of patterns) {
      const hit = core.match(p.re);
      if (!hit) continue;
      out = p.dst.replace(/\{(\d+)\}/g, (_, i) => {
        const value = hit[p.order.indexOf(Number(i)) + 1] ?? '';
        return exact.get(value.trim()) ?? value; // las variables también se traducen si son textos conocidos
      });
      break;
    }
  }
  return out === undefined ? text : m[1] + out + m[3];
}

// ---- Aplicación sobre el DOM ----------------------------------------------------------------------
const originalText = new WeakMap(); // nodo de texto → texto original (español)
const appliedText = new WeakMap(); // nodo de texto → último valor puesto por el traductor
const originalAttrs = new WeakMap(); // elemento → { atributo: original }
const appliedAttrs = new WeakMap();

const skipped = (el) => !el || el.closest?.('[data-no-translate],[contenteditable="true"]') || SKIP_TAGS.has(el.tagName);

function processText(node) {
  if (skipped(node.parentElement)) return;
  const current = node.nodeValue;
  if (appliedText.get(node) !== current) originalText.set(node, current); // React u otro código lo cambió
  const source = originalText.get(node) ?? current;
  const out = translate(source);
  appliedText.set(node, out);
  if (out !== current) node.nodeValue = out;
}

function processAttrs(el) {
  if (skipped(el)) return;
  for (const attr of ATTRS) {
    if (!el.hasAttribute(attr)) continue;
    const current = el.getAttribute(attr);
    const origins = originalAttrs.get(el) ?? {};
    const applied = appliedAttrs.get(el) ?? {};
    if (applied[attr] !== current) origins[attr] = current;
    const out = translate(origins[attr] ?? current);
    applied[attr] = out;
    originalAttrs.set(el, origins);
    appliedAttrs.set(el, applied);
    if (out !== current) el.setAttribute(attr, out);
  }
}

function processTree(root) {
  if (root.nodeType === Node.TEXT_NODE) return processText(root);
  if (root.nodeType !== Node.ELEMENT_NODE || skipped(root)) return;
  processAttrs(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) processText(n);
    else processAttrs(n);
  }
}

let observer;
export function startTranslator() {
  document.documentElement.lang = lang;
  processTree(document.body);
  observer?.disconnect();
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') processText(m.target);
      else if (m.type === 'attributes') processAttrs(m.target);
      else m.addedNodes.forEach(processTree);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

/** Cambia el idioma de toda la interfaz (se recuerda en este navegador). */
export function setLang(code) {
  if (!LANGUAGES.some((l) => l.code === code) || code === lang) return;
  lang = code;
  storage.set(code);
  document.documentElement.lang = code;
  processTree(document.body);
  window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: code }));
}
