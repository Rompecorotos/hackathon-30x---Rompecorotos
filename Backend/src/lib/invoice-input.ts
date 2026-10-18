import 'server-only';
import { assertAllowedOrigin, HttpError } from '@/lib/http';

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB
export const MAX_QR_CHARS = 4000;

export type InvoiceSource = 'manual' | 'imagen' | 'pdf' | 'qr';
export type InvoiceDocument = { bytes: Uint8Array; mediaType: string };

const TYPES_BY_SOURCE: Record<'imagen' | 'pdf', string[]> = {
  imagen: ['image/png', 'image/jpeg'],
  pdf: ['application/pdf'],
};

export const isMultipart = (request: Request) =>
  (request.headers.get('content-type') ?? '').toLowerCase().startsWith('multipart/form-data');

/** Lee el multipart (protegido por Origin) y devuelve el formulario. */
export async function readMultipart(request: Request): Promise<FormData> {
  assertAllowedOrigin(request, true);
  try {
    return await request.formData();
  } catch {
    throw new HttpError(400, 'Formulario multipart inválido');
  }
}

/** Valida el archivo subido (tipo según origen y máximo 4 MB). */
export async function readDocument(file: FormDataEntryValue | null, source: InvoiceSource): Promise<InvoiceDocument | null> {
  if (file === null) return null;
  if (!(file instanceof File)) throw new HttpError(422, 'Archivo inválido', { file: 'Sube un archivo válido' });
  if (source !== 'imagen' && source !== 'pdf') throw new HttpError(422, 'Este modo no admite archivos');
  if (!TYPES_BY_SOURCE[source].includes(file.type)) {
    throw new HttpError(415, source === 'pdf' ? 'El archivo debe ser un PDF' : 'La imagen debe ser PNG o JPG');
  }
  if (file.size === 0) throw new HttpError(422, 'El archivo está vacío');
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, 'El archivo supera el máximo de 4 MB');
  return { bytes: new Uint8Array(await file.arrayBuffer()), mediaType: file.type };
}

/** Valida el texto leído de un código QR. */
export function readQr(value: FormDataEntryValue | null): string | null {
  if (value === null) return null;
  const text = String(value).trim();
  if (!text) throw new HttpError(422, 'El código QR está vacío');
  if (text.length > MAX_QR_CHARS) throw new HttpError(413, 'El contenido del QR es demasiado largo');
  return text;
}

export function readSource(value: FormDataEntryValue | null): InvoiceSource {
  const source = String(value ?? 'manual');
  if (!['manual', 'imagen', 'pdf', 'qr'].includes(source)) throw new HttpError(422, 'Origen de factura inválido');
  return source as InvoiceSource;
}
