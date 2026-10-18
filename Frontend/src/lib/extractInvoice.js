// src/lib/extractInvoice.js
// Lee un PDF con texto real en el navegador y extrae los datos de la factura.
// No usa IA ni backend. Está ajustado al formato de las facturas de prueba:
//
//   Proveedor Frutas del Caribe
//   Factura F-0044
//   Vencimiento 2026-11-12
//   Moneda USD
//   Descripción Cantidad Precio Unit. Total
//   70 manzanas 70 3.00 200.00
//   Total a pagar: USD 200.00
//
// Requiere:  npm i pdfjs-dist

import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const MONEDAS = ["USD", "COP", "MXN", "ARS", "BRL", "EUR"];

// ---------------------------------------------------------------------------
// 1. PDF -> líneas de texto (agrupando por posición vertical)
// ---------------------------------------------------------------------------
async function pdfToLines(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const rows = [];
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const x = item.transform[4];
      const y = item.transform[5];
      let row = rows.find((r) => Math.abs(r.y - y) < 3);
      if (!row) {
        row = { y, items: [] };
        rows.push(row);
      }
      row.items.push({ x, str: item.str });
    }

    rows.sort((a, b) => b.y - a.y); // de arriba hacia abajo
    for (const r of rows) {
      r.items.sort((a, b) => a.x - b.x); // de izquierda a derecha
      const line = r.items
        .map((i) => i.str.trim())
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (line) lines.push(line);
    }
  }
  return lines;
}

// ---------------------------------------------------------------------------
// 2. Utilidades
// ---------------------------------------------------------------------------
function parseAmount(raw) {
  let s = String(raw)
    .replace(/[^\d.,]/g, "")
    .replace(/[.,]+$/, "");
  if (!s) return null;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");

  if (lastDot !== -1 && lastComma !== -1) {
    // "1.234,56" (coma decimal)  o  "1,234.56" (punto decimal)
    s =
      lastComma > lastDot
        ? s.replace(/\./g, "").replace(",", ".")
        : s.replace(/,/g, "");
  } else if (lastComma !== -1) {
    s = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, ""); // "1.234" -> miles
  }
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function toIsoDate(s) {
  let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[0];
  m = s.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/); // dd/mm/yyyy
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

// ---------------------------------------------------------------------------
// 3. Líneas -> datos de la factura
// ---------------------------------------------------------------------------
function parseInvoiceLines(lines) {
  const out = {};
  const text = lines.join("\n");

  // Número de factura: "Factura F-0044" (ignora "FACTURA COMERCIAL")
  let m = text.match(
    /\bFactura\s*(?:N[°ºo.]*\s*)?[:#]?\s*([A-Z]{1,5}-\d+|\d{3,})/i,
  );
  if (!m) m = text.match(/\b([A-Z]{1,3}-\d{3,})\b/);
  if (m) out.numero_factura = m[1].toUpperCase();

  // Beneficiario: "Proveedor Frutas del Caribe"
  for (const line of lines) {
    const b = line.match(
      /^(?:Proveedor|Beneficiario|Pagar a|Emisor)\s*[:\-]?\s+(.+)$/i,
    );
    if (b) {
      out.beneficiario = b[1].trim();
      break;
    }
  }

  // Fecha de vencimiento
  for (const line of lines) {
    const v = line.match(
      /(?:Vencimiento|Vence|Fecha\s+de\s+vencimiento|Fecha\s+l[ií]mite)\s*[:\-]?\s*(.+)$/i,
    );
    if (v) {
      const iso = toIsoDate(v[1]);
      if (iso) {
        out.fecha_vencimiento = iso;
        break;
      }
    }
  }

  // Monto total (y moneda si viene en esa línea). Solo mira líneas que EMPIEZAN con "Total",
  // para no confundirse con el encabezado de la tabla ("... Precio Unit. Total").
  let totalCurrency = null;
  for (const line of lines) {
    const t = line.match(
      /^(?:Total(?:\s+a\s+pagar)?|Monto(?:\s+total)?|Importe(?:\s+total)?)\s*[:\-]?\s*(?:([A-Z]{3})\s*)?\$?\s*([\d.,]+)/i,
    );
    if (t) {
      const amount = parseAmount(t[2]);
      if (amount !== null) {
        out.monto = amount;
        if (t[1]) totalCurrency = t[1].toUpperCase();
        break;
      }
    }
  }

  // Moneda: línea "Moneda USD", o la que acompañe al total, o cualquier código conocido
  for (const line of lines) {
    const c = line.match(/^Moneda\s*[:\-]?\s*([A-Za-z]{3})\b/i);
    if (c && MONEDAS.includes(c[1].toUpperCase())) {
      out.moneda = c[1].toUpperCase();
      break;
    }
  }
  if (!out.moneda && totalCurrency && MONEDAS.includes(totalCurrency))
    out.moneda = totalCurrency;
  if (!out.moneda) {
    const any = text.match(new RegExp(`\\b(${MONEDAS.join("|")})\\b`));
    if (any) out.moneda = any[1];
  }

  // Concepto: descripciones de la tabla (debajo de "Descripción ... Total")
  const headerIdx = lines.findIndex(
    (l) => /Descripci[oó]n/i.test(l) && /Total/i.test(l),
  );
  if (headerIdx !== -1) {
    const items = [];
    for (let i = headerIdx + 1; i < lines.length; i++) {
      if (/^Total/i.test(lines[i])) break;
      const row = lines[i].match(
        /^(.+?)\s+\d+(?:[.,]\d+)?\s+[\d.,]+\s+[\d.,]+$/,
      );
      if (row) items.push(row[1].trim());
    }
    if (items.length) out.concepto = items.join(", ");
  }

  return out;
}

// ---------------------------------------------------------------------------
// 4. Función pública
// ---------------------------------------------------------------------------
export async function extractInvoiceFromPdf(file) {
  const lines = await pdfToLines(file);

  // Útil para ajustar las expresiones regulares: abre F12 > Console y mira el texto leído.
  console.debug("Texto leído del PDF:", lines);

  if (lines.join("").length < 10) {
    const err = new Error("SIN_TEXTO");
    err.userMessage =
      "Este PDF no tiene texto seleccionable (parece un escaneo o una foto). Completa los datos a mano.";
    throw err;
  }

  return parseInvoiceLines(lines);
}
