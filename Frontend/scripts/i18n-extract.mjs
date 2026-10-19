// Extrae los textos visibles en español del frontend (y los mensajes del backend que llegan a la UI)
// a src/i18n/es.json. Los textos con variables (`Tu plan: ${x}`) se guardan como plantillas "Tu plan: {0}".
// Uso: node scripts/i18n-extract.mjs   (desde Frontend/)
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const traverse = traverseModule.default ?? traverseModule;
const ROOTS = ['src', '../Backend/src'];
// Prompts de la IA y helpers internos: no son texto de interfaz.
const SKIP_FILES = [/[\\/]lib[\\/]ai[\\/]/, /[\\/]lib[\\/]certs\.ts$/, /[\\/]i18n[\\/]/, /[\\/]lib[\\/]rates\.ts$/];
// Atributos/propiedades que nunca contienen texto para personas.
const SKIP_PROPS = new Set(['className', 'class', 'href', 'to', 'src', 'type', 'id', 'name', 'role', 'key', 'rel', 'target', 'method',
  'accept', 'autoComplete', 'inputMode', 'viewBox', 'd', 'fill', 'stroke', 'strokeLinecap', 'strokeLinejoin', 'fillRule', 'clipRule',
  'xmlns', 'mode', 'path', 'api', 'credentials', 'facingMode', 'mediaType', 'contentType', 'errcode', 'dateStyle', 'timeStyle']);
const SKIP_CALLEES = /^(console\.|require$|import$|fetch$|request$|new URL|URL$|Error$|document\.|window\.|localStorage\.|sessionStorage\.|navigator\.|matchMedia|createElement|getElementById|querySelector|addEventListener|removeEventListener|dispatchEvent|setAttribute|getModifierState|toLocale|padStart|replace|split|join|startsWith|endsWith|includes|match|test|from$|select$|eq$|order$|rpc$|ilike$|gte$|lte$|or$|append$|get$|set$|has$|delete$|getItem|setItem|removeItem|Event$|encodeURIComponent|filter$|toBlob|getContext|readBarcodes|prepareZXingModule|z\.|regex$|enum$|strictObject$)/;

const strings = new Set();

const looksLikeText = (s) => {
  const t = s.trim();
  if (t.length < 2 || !/[A-Za-zÁÉÍÓÚÑáéíóúñ¿¡]/.test(t)) return false;
  if (/^(https?:|mailto:|tel:|\/|#|data:|image\/|application\/|text\/)/.test(t)) return false;
  if (/^[\w.-]+@[\w.-]+$/.test(t)) return false; // emails
  if (/^[a-z][a-zA-Z0-9_]*$/.test(t)) return false; // identificadores (camelCase/minúsculas sin espacios)
  if (/^[A-Z0-9_]+$/.test(t) && t.length <= 4) return false; // códigos tipo USD, VES
  // Listas de clases Tailwind: todos los tokens con aspecto de clase y al menos uno con "-" o ":".
  const tokens = t.split(/\s+/);
  if (tokens.every((x) => /^[!a-zA-Z0-9:[\]#/.%_()-]+$/.test(x)) && tokens.some((x) => /[-:[]/.test(x) && /^[!a-z]/.test(x))) return false;
  if (!/\s/.test(t) && t.includes('/')) return false; // rutas/módulos (p. ej. zxing-wasm/reader/...)
  if (/^[a-z_]+(\.[a-z_]+)+$/.test(t)) return false; // rutas tipo a.b.c
  return true;
};

function calleeName(node) {
  if (!node) return '';
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression') return `${calleeName(node.object)}.${node.property?.name ?? ''}`.replace(/^\./, '');
  return '';
}

function skipContext(path) {
  const parent = path.parent;
  if (parent.type === 'ImportDeclaration' || parent.type === 'ExportAllDeclaration' || parent.type === 'ExportNamedDeclaration') return true;
  if (parent.type === 'JSXAttribute' && SKIP_PROPS.has(parent.name.name)) return true;
  if ((parent.type === 'ObjectProperty' || parent.type === 'Property') && parent.key === path.node) return true;
  if ((parent.type === 'ObjectProperty' || parent.type === 'Property') && SKIP_PROPS.has(parent.key?.name ?? parent.key?.value)) return true;
  // Dentro de className={`...`} o de llamadas técnicas.
  for (let p = path.parentPath; p; p = p.parentPath) {
    if (p.node.type === 'JSXAttribute' && SKIP_PROPS.has(p.node.name.name)) return true;
    if (p.node.type === 'CallExpression') {
      const name = calleeName(p.node.callee);
      if (SKIP_CALLEES.test(name) || /^(console|z)\./.test(name)) return true;
      if (/^(t|useTranslation)$/.test(name)) return false;
    }
    if (p.node.type === 'NewExpression' && /^(Error|URL|RegExp|Event|File|Blob)$/.test(calleeName(p.node.callee))) return true;
    if (p.node.type === 'TSTypeAnnotation' || p.node.type === 'TSLiteralType') return true;
    if (p.node.type === 'BinaryExpression' && ['===', '!==', '==', '!='].includes(p.node.operator)) return true;
    if (p.node.type === 'SwitchCase') return true;
  }
  return false;
}

function addTemplate(quasis) {
  const text = quasis.map((q, i) => q.value.cooked + (i < quasis.length - 1 ? `{${i}}` : '')).join('');
  if (looksLikeText(text.replace(/\{\d+\}/g, ''))) strings.add(text.replace(/\s+/g, ' ').trim());
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(jsx?|tsx?)$/.test(entry) && !SKIP_FILES.some((r) => r.test(full))) extract(full);
  }
}

function extract(file) {
  const code = readFileSync(file, 'utf8');
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  traverse(ast, {
    JSXText(path) {
      // El texto de JSX siempre es interfaz: se aceptan también palabras sueltas ("inteligente").
      const t = path.node.value.replace(/\s+/g, ' ').trim();
      if (t.length >= 2 && /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(t)) strings.add(t);
    },
    StringLiteral(path) {
      if (skipContext(path)) return;
      const t = path.node.value.replace(/\s+/g, ' ').trim();
      if (looksLikeText(t) && t.length <= 600) strings.add(t);
    },
    TemplateLiteral(path) {
      if (skipContext(path) || path.parent.type === 'TaggedTemplateExpression') return;
      addTemplate(path.node.quasis);
    },
  });
}

for (const root of ROOTS) walk(root);

// Mensajes de los triggers de la BD que la API devuelve tal cual (raise exception '...').
const MIGRATIONS = '../Backend/supabase/migrations';
for (const f of readdirSync(MIGRATIONS).filter((x) => x.endsWith('.sql'))) {
  for (const m of readFileSync(join(MIGRATIONS, f), 'utf8').matchAll(/raise exception '([^']+)'/g)) strings.add(m[1]);
}
const sorted = [...strings].sort((a, b) => a.localeCompare(b, 'es'));
mkdirSync('src/i18n', { recursive: true });
writeFileSync('src/i18n/es.json', JSON.stringify(sorted, null, 2) + '\n');
console.log(`${sorted.length} textos extraídos de ${ROOTS.map((r) => relative('.', r)).join(', ')} → src/i18n/es.json`);
