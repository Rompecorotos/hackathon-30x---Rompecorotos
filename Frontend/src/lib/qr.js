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

// jsQR sobre la imagen completa a varias resoluciones y sobre recortes centrales.
function withJsQr(bitmap) {
  const { width: W, height: H } = bitmap;
  const regions = [
    [0, 0, W, H],
    [W * 0.15, H * 0.15, W * 0.7, H * 0.7],
    [W * 0.25, H * 0.25, W * 0.5, H * 0.5],
  ];
  for (const [sx, sy, sw, sh] of regions) {
    for (const maxSide of [1200, 800, 1800, 500]) {
      const scale = Math.min(4, maxSide / Math.max(sw, sh));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sw * scale));
      canvas.height = Math.max(1, Math.round(sh * scale));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = scale < 1;
      ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      const text = decodeCanvas(canvas);
      if (text) return text;
    }
  }
  return null;
}

let zxingReady;
async function withZxing(file) {
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
    const results = await readBarcodes(file, { formats: ['QRCode'], tryHarder: true, tryInvert: true, tryRotate: true, tryDownscale: true, maxNumberOfSymbols: 1 });
    return results.find((r) => r.isValid && r.text)?.text ?? null;
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
    return (await withNativeDetector(bitmap)) ?? withJsQr(bitmap) ?? (await withZxing(file));
  } finally {
    bitmap.close?.();
  }
}
