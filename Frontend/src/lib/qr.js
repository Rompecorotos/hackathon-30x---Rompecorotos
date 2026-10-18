// Lectura robusta de códigos QR desde fotos (borrosas, inclinadas, hechas a una pantalla o con el QR pequeño).
// Cascada: BarcodeDetector nativo → jsQR en varias escalas/recortes → ZXing (WebAssembly, carga diferida).
import jsQR from 'jsqr';

/** Decodifica un QR de un canvas ya dibujado (usado también por la cámara). */
export function decodeCanvas(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data, width, height, { inversionAttempts: 'attemptBoth' })?.data ?? null;
}

async function withNativeDetector(bitmap) {
  if (!('BarcodeDetector' in window)) return null;
  try {
    const formats = await window.BarcodeDetector.getSupportedFormats();
    if (!formats.includes('qr_code')) return null;
    const [code] = await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(bitmap);
    return code?.rawValue ?? null;
  } catch {
    return null;
  }
}

// Estira el contraste (gris + normalización min/max) para fotos apagadas o con reflejos suaves.
function enhanceContrast(canvas) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  let min = 255;
  let max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    d[i] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const range = Math.max(1, max - min);
  for (let i = 0; i < d.length; i += 4) {
    const v = ((d[i] - min) * 255) / range;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function drawRegion(bitmap, [sx, sy, sw, sh], maxSide) {
  const scale = Math.min(4, maxSide / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = scale < 1;
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// jsQR sobre la imagen completa, recortes centrales, mitades y cuadrantes (el QR de una
// factura suele estar en una esquina), a varias resoluciones y con contraste mejorado.
function withJsQr(bitmap) {
  const { width: W, height: H } = bitmap;
  const regions = [
    [0, 0, W, H],
    [W * 0.15, H * 0.15, W * 0.7, H * 0.7],
    [W * 0.25, H * 0.25, W * 0.5, H * 0.5],
    [W / 2, H / 2, W / 2, H / 2],
    [0, H / 2, W / 2, H / 2],
    [W / 2, 0, W / 2, H / 2],
    [0, 0, W / 2, H / 2],
    [0, H / 2, W, H / 2],
    [W / 2, 0, W / 2, H],
  ];
  for (const region of regions) {
    for (const maxSide of [1000, 1600, 700, 2200]) {
      const canvas = drawRegion(bitmap, region, maxSide);
      const text = decodeCanvas(canvas) ?? decodeCanvas(enhanceContrast(canvas));
      if (text) return text;
    }
  }
  return null;
}

let zxingReady;
async function withZxing(file, bitmap) {
  try {
    zxingReady ??= (async () => {
      const [{ prepareZXingModule, readBarcodes }, { default: wasmUrl }] = await Promise.all([
        import('zxing-wasm/reader'),
        import('zxing-wasm/reader/zxing_reader.wasm?url'),
      ]);
      // El .wasm se sirve desde la propia app (sin depender de un CDN).
      prepareZXingModule({ overrides: { locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasmUrl : prefix + path) } });
      return readBarcodes;
    })();
    const readBarcodes = await zxingReady;
    const base = { formats: ['QRCode'], tryHarder: true, tryInvert: true, tryRotate: true, tryDownscale: true, maxNumberOfSymbols: 1 };
    const first = (results) => results.find((r) => r.isValid && r.text)?.text ?? null;
    // 1) foto original; 2) versión reducida a 1600 px con dos binarizadores distintos.
    const original = first(await readBarcodes(file, base));
    if (original) return original;
    const small = drawRegion(bitmap, [0, 0, bitmap.width, bitmap.height], 1600);
    const imageData = small.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, small.width, small.height);
    for (const binarizer of ['LocalAverage', 'GlobalHistogram']) {
      const text = first(await readBarcodes(imageData, { ...base, binarizer }));
      if (text) return text;
    }
    return null;
  } catch (error) {
    console.error('[qr] ZXing no disponible:', error);
    zxingReady = undefined;
    return null;
  }
}

/** Lee el texto de un QR a partir de una foto. Devuelve null si no encuentra ninguno. */
export async function decodeQrFromFile(file) {
  const bitmap = await createImageBitmap(file);
  try {
    return (await withNativeDetector(bitmap)) ?? withJsQr(bitmap) ?? (await withZxing(file, bitmap));
  } finally {
    bitmap.close?.();
  }
}
