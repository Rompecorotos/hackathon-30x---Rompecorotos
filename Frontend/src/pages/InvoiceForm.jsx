import { useRef, useState } from "react";
import { supabase, supabaseReady } from "../lib/supabase";

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------
// Mientras la Edge Function no exista, true: datos de prueba 
const USE_MOCK = true;
const EDGE_FUNCTION = "extraer-factura";
const MAX_FILE_MB = 10;
const ACCEPTED = ["application/pdf", "image/png", "image/jpeg"];

// Paleta del proyecto
// azul #353755 · blanco #FFFFFF · gris #E0E4EE · verde #5BD3C7

// ---------------------------------------------------------------------------
// Contrato de la Edge Function "extraer-factura":
//   Recibe: FormData con el campo "file" (PDF o imagen).
//   Devuelve JSON (todos los campos opcionales):
//   {
//     "numero_factura": "F-0042",
//     "beneficiario": "Don Pedro S.A.",
//     "monto": 300,
//     "moneda": "USD",
//     "fecha_vencimiento": "2026-11-05",   // formato YYYY-MM-DD
//     "concepto": "100 manzanas"
//   }
// La clave del LLM vive como secreto dentro de la Edge Function, nunca aquí.
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

async function extractFromFile(file) {
  if (USE_MOCK || !supabaseReady) {
    await new Promise((r) => setTimeout(r, 1500));
    return {
      numero_factura: "F-0042",
      beneficiario: "Don Pedro S.A.",
      monto: 300,
      moneda: "USD",
      fecha_vencimiento: "2026-11-05",
      concepto: "100 manzanas",
    };
  }
  const body = new FormData();
  body.append("file", file);
  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION, {
    body,
  });
  if (error) throw error;
  return data;
}

export default function InvoiceForm({ onCreated }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [autofilled, setAutofilled] = useState(new Set());
  const [fileName, setFileName] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok" | "error" | "info", text }
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

  // ---- Carga de archivo + autorrelleno -----------------------------------
  async function handleFile(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = ""; // permite volver a elegir el mismo archivo
    if (!file) return;
    setMessage(null);

    if (!ACCEPTED.includes(file.type)) {
      setMessage({
        type: "error",
        text: "Formato no válido. Usa PDF, PNG o JPG.",
      });
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setMessage({
        type: "error",
        text: `El archivo supera los ${MAX_FILE_MB} MB.`,
      });
      return;
    }

    setFileName(file.name);
    setExtracting(true);
    try {
      const data = await extractFromFile(file);

      const patch = {};
      if (data.numero_factura)
        patch.numero_factura = String(data.numero_factura);
      if (data.beneficiario) patch.beneficiario = String(data.beneficiario);
      if (
        data.monto !== undefined &&
        data.monto !== "" &&
        !Number.isNaN(Number(data.monto))
      )
        patch.monto = String(data.monto);
      if (data.moneda && MONEDAS.includes(String(data.moneda).toUpperCase()))
        patch.moneda = String(data.moneda).toUpperCase();
      if (
        data.fecha_vencimiento &&
        /^\d{4}-\d{2}-\d{2}$/.test(data.fecha_vencimiento)
      )
        patch.fecha_vencimiento = data.fecha_vencimiento;
      if (data.concepto) patch.concepto = String(data.concepto);

      const keys = Object.keys(patch);
      if (keys.length === 0) {
        setMessage({
          type: "error",
          text: "No pude leer datos en esa factura. Completa los campos a mano.",
        });
        return;
      }

      setForm((f) => ({ ...f, ...patch }));
      setAutofilled(new Set(keys));
      setErrors((e) => {
        const next = { ...e };
        keys.forEach((k) => delete next[k]);
        return next;
      });
      setMessage({
        type: "info",
        text: "Datos autorrellenados. Revísalos y corrige lo que haga falta antes de registrar.",
      });
    } catch (e) {
      setMessage({
        type: "error",
        text: "No se pudo leer la factura. Puedes completar los campos a mano.",
      });
      console.error(e);
    } finally {
      setExtracting(false);
    }
  }

  // ---- Validación y registro ---------------------------------------------
  // Solo valida que los datos estén bien escritos.
  // NO decide si se paga: eso lo hace el agente.
  function validate() {
    const e = {};
    if (!form.numero_factura.trim())
      e.numero_factura = "Escribe el número de factura";
    if (!form.beneficiario.trim()) e.beneficiario = "Escribe quién cobra";
    const monto = Number(form.monto);
    if (!form.monto || Number.isNaN(monto) || monto <= 0)
      e.monto = "El monto debe ser mayor a 0";
    if (!form.fecha_vencimiento)
      e.fecha_vencimiento = "Elige la fecha de vencimiento";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setMessage(null);
    if (!validate()) return;

    setSaving(true);
    const payload = {
      numero_factura: form.numero_factura.trim(),
      beneficiario: form.beneficiario.trim(),
      monto: Number(form.monto),
      moneda: form.moneda,
      fecha_vencimiento: form.fecha_vencimiento,
      concepto: form.concepto.trim() || null,
      estado: "recibida", // el agente la tomará desde aquí
    };

    let error = null;
    if (supabaseReady) {
      ({ error } = await supabase.from("facturas").insert(payload));
    } else {
      // Modo demo: no hay Supabase, solo mostramos lo que se guardaría.
      await new Promise((r) => setTimeout(r, 600));
      console.log("Factura (modo demo, no guardada):", payload);
    }
    setSaving(false);

    if (error) {
      setMessage({
        type: "error",
        text: `No se pudo guardar: ${error.message}`,
      });
      return;
    }
    setMessage({
      type: "ok",
      text: supabaseReady
        ? "Factura registrada. El agente la revisará pronto."
        : "Modo demo: la factura no se guardó (aún no hay Supabase). Mira la consola.",
    });
    setForm(INITIAL);
    setErrors({});
    setAutofilled(new Set());
    setFileName(null);
    if (onCreated) onCreated();
  }

  // ---- Estilos -----------------------------------------------------------
  const inputBase =
    "w-full rounded-lg bg-[#E0E4EE] px-3 py-2 text-sm text-[#353755] placeholder:text-[#353755]/50 focus:outline-none focus:ring-2 focus:ring-[#5BD3C7]";
  const inputClass = (k) =>
    `${inputBase} ${autofilled.has(k) ? "ring-2 ring-[#5BD3C7]" : ""}`;
  const labelClass =
    "mb-1 flex items-center gap-2 text-sm font-medium text-white";
  const errClass = "mt-1 text-xs text-red-300";

  const Badge = ({ k }) =>
    autofilled.has(k) ? (
      <span className="rounded bg-[#5BD3C7]/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5BD3C7]">
        autorrellenado
      </span>
    ) : null;

  const msgClass = {
    ok: "bg-[#5BD3C7]/20 text-[#5BD3C7]",
    info: "bg-white/10 text-white",
    error: "bg-red-400/20 text-red-200",
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-xl space-y-5 rounded-2xl bg-[#353755] p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold text-white">Registrar factura</h2>

        {/* --- Opción 1: cargar archivo --- */}
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={extracting}
            className="w-full rounded-lg bg-[#5BD3C7] px-4 py-2.5 text-sm font-semibold text-[#353755] transition hover:brightness-95 disabled:opacity-60"
          >
            {extracting ? "Leyendo factura..." : "Cargar factura"}
          </button>
          <p className="text-xs text-white/70">
            {fileName
              ? `Archivo: ${fileName}`
              : `PDF, PNG o JPG · máx. ${MAX_FILE_MB} MB`}
          </p>
        </div>

        {/* --- Separador --- */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-xs text-white/70">
            o completa los datos manualmente
          </span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        {/* --- Opción 2: manual (también sirve para corregir lo autorrellenado) --- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="numero_factura">
              Número de factura <Badge k="numero_factura" />
            </label>
            <input
              id="numero_factura"
              className={inputClass("numero_factura")}
              value={form.numero_factura}
              onChange={(e) => set("numero_factura", e.target.value)}
              placeholder="F-0042"
            />
            {errors.numero_factura && (
              <p className={errClass}>{errors.numero_factura}</p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="beneficiario">
              Beneficiario (quien cobra) <Badge k="beneficiario" />
            </label>
            <input
              id="beneficiario"
              className={inputClass("beneficiario")}
              value={form.beneficiario}
              onChange={(e) => set("beneficiario", e.target.value)}
              placeholder="Don Pedro S.A."
            />
            {errors.beneficiario && (
              <p className={errClass}>{errors.beneficiario}</p>
            )}
          </div>

          <div>
            <label className={labelClass} htmlFor="monto">
              Monto <Badge k="monto" />
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
              Moneda <Badge k="moneda" />
            </label>
            <select
              id="moneda"
              className={inputClass("moneda")}
              value={form.moneda}
              onChange={(e) => set("moneda", e.target.value)}
            >
              {MONEDAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="fecha_vencimiento">
              Fecha de vencimiento <Badge k="fecha_vencimiento" />
            </label>
            <input
              id="fecha_vencimiento"
              type="date"
              className={inputClass("fecha_vencimiento")}
              value={form.fecha_vencimiento}
              onChange={(e) => set("fecha_vencimiento", e.target.value)}
            />
            {errors.fecha_vencimiento && (
              <p className={errClass}>{errors.fecha_vencimiento}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="concepto">
              Concepto (opcional) <Badge k="concepto" />
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

        {message && (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${msgClass[message.type]}`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || extracting}
          className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#353755] transition hover:bg-[#E0E4EE] disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Registrar factura"}
        </button>
      </form>
    </div>
  );
}
