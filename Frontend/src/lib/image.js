// Normaliza fotos para subirlas: cualquier imagen que el navegador sepa abrir
// (JPG, PNG, WebP, GIF, BMP...) se convierte a JPG y se reduce hasta quedar por
// debajo del límite. Así una foto del móvil de 8 MB o un WebP de WhatsApp funcionan.

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB
const MAX_SIDE = 2400; // suficiente para leer facturas y QR con nitidez

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i;

export const looksLikeImage = (file) => file.type.startsWith('image/') || IMAGE_EXT.test(file.name);

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo abrir la imagen'));
    };
    img.src = url;
  });
}

const toBlob = (canvas, quality) => new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

/**
 * Devuelve un File JPG ≤ 4 MB listo para enviar.
 * Lanza un error con `userMessage` si el formato no se puede abrir (p. ej. HEIC en Chrome).
 */
export async function normalizeImage(file) {
  // PNG/JPG que ya cumplen el límite se envían tal cual (sin pérdida de calidad).
  if (['image/png', 'image/jpeg'].includes(file.type) && file.size <= MAX_UPLOAD_BYTES) return file;

  let img;
  try {
    img = await loadImage(file);
  } catch {
    const err = new Error('FORMATO');
    err.userMessage = 'No se pudo abrir esa imagen (HEIC u otro formato no compatible). Expórtala como JPG o PNG.';
    throw err;
  }

  let scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // fondo blanco para PNG/WebP transparentes
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await toBlob(canvas, attempt < 3 ? 0.9 - attempt * 0.1 : 0.7);
    if (blob && blob.size <= MAX_UPLOAD_BYTES) {
      const name = file.name.replace(/\.[^.]+$/, '') || 'factura';
      return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
    }
    if (attempt >= 2) scale *= 0.75; // primero baja la calidad, luego el tamaño
  }
  const err = new Error('TAMANO');
  err.userMessage = 'No se pudo reducir la imagen por debajo de 4 MB.';
  throw err;
}
