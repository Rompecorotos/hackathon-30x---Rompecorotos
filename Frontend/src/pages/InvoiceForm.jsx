import { useCallback, useRef, useState } from "react";
import { api } from "../lib/api";
import { extractInvoiceFromPdf } from "../lib/extractInvoice";
import { QrScanner } from "../components/QrScanner";
import { looksLikeImage, normalizeImage } from "../lib/image";

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------
// Cuatro formas de registrar una factura. En Imagen, PDF y QR la IA del backend
// lee los datos para autorrellenar; en todas, al registrar, la IA revisa si los
// datos son correctos (comparándolos con el documento o el QR) y puede rechazarlos
// explicando el motivo. La clave del LLM vive solo en el servidor.
const MAX_FILE_MB = 4;
const MODES = [
  { id: "manual", label: "Manual" },
  { id: "imagen", label: "Imagen" },
  { id: "pdf", label: "PDF" },
  { id: "qr", label: "Código QR" },
];
const ACCEPT_BY_MODE = {
  // Cualquier imagen: se convierte a JPG ≤ 4 MB en el navegador (lib/image.js).
  imagen: { types: [], input: "image/*", hint: "JPG, PNG o WebP" },
  pdf: { types: ["application/pdf"], input: "application/pdf,.pdf", hint: "PDF" },
};

// Paleta del proyecto
// azul #353755 · blanco #FFFFFF · gris #E0E4EE · verde #5BD3C7

// ---------------------------------------------------------------------------
// Contrato de POST /api/invoices/extract (multipart: source + file | qr).
//   Devuelve JSON (todos los campos opcionales):
//   { numero_factura, beneficiario, monto, moneda, fecha_vencimiento (YYYY-MM-DD), concepto }
// ---------------------------------------------------------------------------

const MONEDAS = ["USD", "COP", "MXN", "ARS", "BRL", "EUR"];

const INITIAL = {
  numero_factura: "",
  beneficiario: "",
  monto: "",
  moneda: "USD",
  fecha_vencimiento: "",
  concepto: "",
};

async function extractFromFile(file, mode) {
  try {
    return await api.extractInvoice(file, mode);
  } catch (aiError) {
    // Respaldo: los PDF con texto se pueden leer en el navegador sin IA
    if (mode === "pdf") return extractInvoiceFromPdf(file);
    const err = new Error("IMAGEN");
    err.userMessage = `${aiError.message} Completa o corrige los datos a mano.`;
    throw err;
  }
}

// Convierte la respuesta de extracción en los campos del formulario.
function toPatch(data) {
  const patch = {};
  if (data.numero_factura) patch.numero_factura = String(data.numero_factura);
  if (data.beneficiario) patch.beneficiario = String(data.beneficiario);
  if (data.monto != null && data.monto !== "" && !Number.isNaN(Number(data.monto))) patch.monto = String(data.monto);
  if (data.moneda && MONEDAS.includes(String(data.moneda).toUpperCase())) patch.moneda = String(data.moneda).toUpperCase();
  if (data.fecha_vencimiento && /^\d{4}-\d{2}-\d{2}$/.test(data.fecha_vencimiento)) patch.fecha_vencimiento = data.fecha_vencimiento;
  if (data.concepto) patch.concepto = String(data.concepto);
  return patch;
}

const Badge = ({ on }) =>
  on ? (
    <span className="rounded bg-[#5BD3C7]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5BD3C7]">
      autorrellenado
    </span>
  ) : null;

// Resultado de la revisión de la IA (aceptada, rechazada o sin revisar).
function ReviewBox({ review }) {
  if (!review) return null;
  const styles = {
    valida: { box: "border-[#5BD3C7]/50 bg-[#5BD3C7]/10", title: "text-[#5BD3C7]", label: "La IA validó la factura" },
    invalida: { box: "border-red-300/50 bg-red-400/10", title: "text-red-200", label: "La IA rechazó la factura" },
    no_revisada: { box: "border-amber-300/50 bg-amber-300/10", title: "text-amber-200", label: "Sin revisión de la IA" },
  }[review.verdict];
  return (
    <div role={review.verdict === "invalida" ? "alert" : "status"} className={`space-y-1 rounded-lg border px-3 py-2 text-sm ${styles.box}`}>
      <p className={`font-semibold ${styles.title}`}>{styles.label}</p>
      <p className="text-white/90">{review.explanation}</p>
      {review.problems?.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-white/80">
          {review.problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function InvoiceForm({ onCreated }) {
  const [mode, setMode] = useState("manual");
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [autofilled, setAutofilled] = useState(new Set());
  const [sourceFile, setSourceFile] = useState(null);
  const [qrText, setQrText] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok" | "error" | "info", text }
  const [review, setReview] = useState(null);
  const fileRef = useRef(null);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Si la persona edita un campo autorrellenado, deja de marcarse como tal.
    setAutofilled((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const resetSource = () => {
    setSourceFile(null);
    setQrText(null);
    setAutofilled(new Set());
    setMessage(null);
    setReview(null);
  };

  const changeMode = (next) => {
    if (next === mode) return;
    setMode(next);
    resetSource();
  };

  // Aplica los datos leídos por la IA (o el lector local) al formulario.
  const applyExtracted = useCallback((data) => {
    const patch = toPatch(data);
    const keys = Object.keys(patch);
    if (keys.length === 0) {
      setMessage({ type: "error", text: "No pude leer datos en esa factura. Completa los campos a mano." });
      return;
    }
    setForm((f) => ({ ...f, ...patch }));
    setAutofilled(new Set(keys));
    const missingDueDate = !patch.fecha_vencimiento;
    setErrors((e) => {
      const next = { ...e };
      keys.forEach((k) => delete next[k]);
      if (missingDueDate) next.fecha_vencimiento = "No se encontró en la factura: indícala a mano";
      return next;
    });
    setMessage({
      type: "info",
      text: `Datos autorrellenados${missingDueDate ? " (falta la fecha de vencimiento)" : ", incluida la fecha de vencimiento"}. Revísalos y corrige lo que haga falta: al registrar, la IA comprobará que coincidan con la factura.`,
    });
  }, []);

  // ---- Imagen / PDF -------------------------------------------------------
  async function handleFile(ev) {
    let file = ev.target.files?.[0];
    ev.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    setMessage(null);
    setReview(null);

    const accept = ACCEPT_BY_MODE[mode];
    if (mode === "imagen" ? !looksLikeImage(file) : !accept.types.includes(file.type)) {
      setMessage({ type: "error", text: `Formato no válido. Usa ${accept.hint}.` });
      return;
    }

    setExtracting(true);
    try {
      // Las fotos se convierten a JPG ≤ 4 MB; los PDF deben cumplir el límite tal cual.
      if (mode === "imagen") file = await normalizeImage(file);
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setMessage({ type: "error", text: `El archivo supera el máximo de ${MAX_FILE_MB} MB.` });
        return;
      }
      setSourceFile(file);
      applyExtracted(await extractFromFile(file, mode));
    } catch (e) {
      setMessage({ type: "error", text: e.userMessage || "No se pudo leer la factura. Puedes completar los campos a mano." });
      console.error(e);
    } finally {
      setExtracting(false);
    }
  }

  // ---- Código QR ----------------------------------------------------------
  const handleQr = useCallback(
    async (text) => {
      setQrText(text);
      setReview(null);
      setExtracting(true);
      try {
        applyExtracted(await api.extractInvoice(text, "qr"));
      } catch (e) {
        setMessage({ type: "error", text: `${e.message} Puedes completar los campos a mano; el QR se usará para la revisión.` });
      } finally {
        setExtracting(false);
      }
    },
    [applyExtracted],
  );

  // ---- Validación y registro ---------------------------------------------
  // Valida el formato aquí; la IA del backend decide si los datos son correctos.
  function validate() {
    const e = {};
    if (!form.numero_factura.trim()) e.numero_factura = "Escribe el número de factura";
    if (!form.beneficiario.trim()) e.beneficiario = "Escribe quién cobra";
    const monto = Number(form.monto);
    if (!form.monto || Number.isNaN(monto) || monto <= 0) e.monto = "El monto debe ser mayor a 0";
    if (!form.fecha_vencimiento) e.fecha_vencimiento = "Elige la fecha de vencimiento";
    setErrors(e);
    if ((mode === "imagen" || mode === "pdf") && !sourceFile) {
      setMessage({ type: "error", text: "Carga primero el archivo de la factura." });
      return false;
    }
    if (mode === "qr" && !qrText) {
      setMessage({ type: "error", text: "Escanea primero el código QR de la factura." });
      return false;
    }
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setMessage(null);
    setReview(null);
    if (!validate()) return;

    setSaving(true);
    let result;
    try {
      result = await api.createInvoice(
        {
          invoiceNumber: form.numero_factura.trim(),
          payee: form.beneficiario.trim(),
          amountCents: Math.round(Number(form.monto) * 100),
          currency: form.moneda,
          dueDate: form.fecha_vencimiento,
          concept: form.concepto.trim() || null,
        },
        { source: mode, file: sourceFile, qr: qrText },
      );
    } catch (error) {
      // Rechazo de la IA: se muestra su explicación y se deja corregir.
      if (error.data?.review) {
        setReview(error.data.review);
        return;
      }
      const f = error.fields ?? {};
      setErrors({
        numero_factura: f.invoiceNumber,
        beneficiario: f.payee,
        monto: f.amountCents,
        fecha_vencimiento: f.dueDate,
        concepto: f.concept,
      });
      setMessage({ type: "error", text: `No se pudo guardar: ${error.message}` });
      return;
    } finally {
      setSaving(false);
    }
    setReview(result.review);
    setMessage({ type: "ok", text: "Factura registrada. El agente la revisará pronto." });
    setForm(INITIAL);
    setErrors({});
    setAutofilled(new Set());
    setSourceFile(null);
    setQrText(null);
    if (onCreated) onCreated();
  }

  // ---- Estilos -----------------------------------------------------------
  const inputBase =
    "w-full rounded-lg bg-[#E0E4EE] px-3 py-2 text-sm text-[#353755] placeholder:text-[#353755]/50 focus:outline-none focus:ring-2 focus:ring-[#5BD3C7]";
  const inputClass = (k) => `${inputBase} ${autofilled.has(k) ? "ring-2 ring-[#5BD3C7]" : ""}`;
  const labelClass = "mb-1 flex items-center gap-2 text-sm font-medium text-white";
  const errClass = "mt-1 text-xs text-red-300";

  const msgClass = {
    ok: "bg-[#5BD3C7]/20 text-[#5BD3C7]",
    info: "bg-white/10 text-white",
    error: "bg-red-400/20 text-red-200",
  };

  const busy = saving || extracting;

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5 rounded-2xl bg-[#353755] p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-white">Registrar factura</h2>

        {/* --- Forma de registro --- */}
        <div role="tablist" aria-label="Forma de registro" className="grid grid-cols-4 gap-1 rounded-lg bg-white/10 p-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              disabled={busy}
              onClick={() => changeMode(m.id)}
              className={`rounded-md px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                mode === m.id ? "bg-[#5BD3C7] text-[#353755]" : "text-white/80 hover:bg-white/10"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* --- Origen de los datos según el modo --- */}
        {(mode === "imagen" || mode === "pdf") && (
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept={ACCEPT_BY_MODE[mode].input} onChange={handleFile} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="w-full rounded-lg bg-[#5BD3C7] px-4 py-2.5 text-sm font-semibold text-[#353755] transition hover:brightness-95 disabled:opacity-60"
            >
              {extracting ? "Leyendo factura..." : mode === "pdf" ? "Cargar PDF" : "Cargar imagen"}
            </button>
            <p className="text-xs text-white/70">
              {sourceFile ? `Archivo: ${sourceFile.name}` : `${ACCEPT_BY_MODE[mode].hint} · máx. ${MAX_FILE_MB} MB`}
            </p>
          </div>
        )}

        {mode === "qr" && (
          <div className="space-y-2">
            <QrScanner onDecode={handleQr} disabled={busy} />
            <p className="break-all text-xs text-white/70">
              {extracting ? "Leyendo datos del QR..." : qrText ? `QR leído: ${qrText.slice(0, 120)}${qrText.length > 120 ? "…" : ""}` : `Foto del QR: PNG o JPG · máx. ${MAX_FILE_MB} MB`}
            </p>
          </div>
        )}

        {mode === "manual" && (
          <p className="text-xs text-white/70">Completa los datos de la factura. Al registrar, la IA revisará que sean correctos.</p>
        )}

        {/* --- Datos (en todos los modos; sirven para corregir lo autorrellenado) --- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="numero_factura">
              Número de factura <Badge on={autofilled.has("numero_factura")} />
            </label>
            <input
              id="numero_factura"
              className={inputClass("numero_factura")}
              value={form.numero_factura}
              onChange={(e) => set("numero_factura", e.target.value)}
              placeholder="F-0042"
            />
            {errors.numero_factura && <p className={errClass}>{errors.numero_factura}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="beneficiario">
              Beneficiario (quien cobra) <Badge on={autofilled.has("beneficiario")} />
            </label>
            <input
              id="beneficiario"
              className={inputClass("beneficiario")}
              value={form.beneficiario}
              onChange={(e) => set("beneficiario", e.target.value)}
              placeholder="Don Pedro S.A."
            />
            {errors.beneficiario && <p className={errClass}>{errors.beneficiario}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="monto">
              Monto <Badge on={autofilled.has("monto")} />
            </label>
            <input
              id="monto"
              type="number"
              min="0"
              step="0.01"
              className={inputClass("monto")}
              value={form.monto}
              onChange={(e) => set("monto", e.target.value)}
              placeholder="300.00"
            />
            {errors.monto && <p className={errClass}>{errors.monto}</p>}
          </div>

          <div>
            <label className={labelClass} htmlFor="moneda">
              Moneda <Badge on={autofilled.has("moneda")} />
            </label>
            <select id="moneda" className={inputClass("moneda")} value={form.moneda} onChange={(e) => set("moneda", e.target.value)}>
              {MONEDAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="fecha_vencimiento">
              Fecha de vencimiento <Badge on={autofilled.has("fecha_vencimiento")} />
            </label>
            <input
              id="fecha_vencimiento"
              type="date"
              className={inputClass("fecha_vencimiento")}
              value={form.fecha_vencimiento}
              onChange={(e) => set("fecha_vencimiento", e.target.value)}
            />
            {errors.fecha_vencimiento && <p className={errClass}>{errors.fecha_vencimiento}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="concepto">
              Concepto (opcional) <Badge on={autofilled.has("concepto")} />
            </label>
            <textarea
              id="concepto"
              rows={3}
              className={inputClass("concepto")}
              value={form.concepto}
              onChange={(e) => set("concepto", e.target.value)}
              placeholder="100 manzanas"
            />
          </div>
        </div>

        {message && <p className={`rounded-lg px-3 py-2 text-sm ${msgClass[message.type]}`}>{message.text}</p>}
        <ReviewBox review={review} />

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#353755] transition hover:bg-[#E0E4EE] disabled:opacity-50"
        >
          {saving ? "La IA está revisando la factura..." : "Registrar factura"}
        </button>
      </form>
    </div>
  );
}
