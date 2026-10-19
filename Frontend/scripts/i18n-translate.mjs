// Traduce src/i18n/es.json a inglés, portugués e italiano con Gemini (solo los textos que falten).
// Uso (desde Frontend/): GOOGLE_GENERATIVE_AI_API_KEY=... node scripts/i18n-translate.mjs
// Tras añadir textos nuevos: node scripts/i18n-extract.mjs && node scripts/i18n-translate.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
if (!KEY) throw new Error('Falta GOOGLE_GENERATIVE_AI_API_KEY');

const LANGS = { en: 'English', pt: 'Brazilian Portuguese', it: 'Italian' };
const BATCH = 90;
const source = JSON.parse(readFileSync('src/i18n/es.json', 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const instructions = (lang) => `You translate the user interface of "Bankly", a fintech web app for recurring payments, automatic direct debit, invoices and AI, from Spanish into ${lang}.
Rules:
- Return ONLY a JSON object mapping each Spanish input string (exactly as given, as the key) to its translation.
- Keep placeholders like {0}, {1} exactly, in the position that is natural in ${lang}.
- Keep brand and product names unchanged: Bankly, BCV, Binance, USDT, Smart Retries, WhatsApp, Gemini, PDF, QR, API, MRR, PCI-DSS, SLA.
- Keep currency codes, numbers, symbols, emojis, punctuation style (¿¡ only in Spanish) and capitalization style (Title Case stays Title Case).
- Use concise, natural UI wording, a professional tone and the polite/formal register where the language has one.
- "Bs." is the Venezuelan bolívar abbreviation: keep it.`;

async function translateBatch(lang, batch, attempt = 1) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instructions(LANGS[lang]) }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(batch) }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    }),
  });
  if (res.status === 429 && attempt <= 5) {
    await sleep(15_000 * attempt);
    return translateBatch(lang, batch, attempt + 1);
  }
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  return JSON.parse(body.candidates[0].content.parts[0].text);
}

for (const lang of Object.keys(LANGS)) {
  const file = `src/i18n/${lang}.json`;
  const current = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const missing = source.filter((s) => !current[s]);
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    const result = await translateBatch(lang, batch);
    let ok = 0;
    for (const s of batch) {
      const tr = result[s];
      // Solo se acepta si conserva los mismos marcadores {n}.
      const ph = (x) => (x.match(/\{\d+\}/g) ?? []).sort().join();
      if (typeof tr === 'string' && tr.trim() && ph(tr) === ph(s)) {
        current[s] = tr;
        ok++;
      }
    }
    console.log(`${lang}: ${ok}/${batch.length} traducidos (lote ${i / BATCH + 1})`);
    await sleep(4000);
  }
  // Se eliminan entradas de textos que ya no existen y se ordena por la clave en español.
  const clean = Object.fromEntries(source.filter((s) => current[s]).map((s) => [s, current[s]]));
  writeFileSync(file, JSON.stringify(clean, null, 2) + '\n');
  console.log(`${lang}: ${Object.keys(clean).length}/${source.length} textos → ${file}`);
}
