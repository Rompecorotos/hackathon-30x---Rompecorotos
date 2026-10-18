import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { looksLikeImage, normalizeImage } from "../lib/image";


// Decodifica el QR de un canvas con la imagen ya dibujada.
function decodeCanvas(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data, width, height, { inversionAttempts: "attemptBoth" })?.data ?? null;
}

async function decodeImageFile(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  // Reducir imágenes muy grandes acelera la lectura sin perder el QR.
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return decodeCanvas(canvas);
}

/**
 * Lector de códigos QR: con la cámara o subiendo una foto del código (PNG/JPG, máx. 4 MB).
 * Llama a onDecode(texto) al leer un código.
 */
export function QrScanner({ onDecode, disabled }) {
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!scanning) return undefined;
    let stream;
    let frame;
    let cancelled = false;
    const canvas = document.createElement("canvas");

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const video = videoRef.current;
        video.srcObject = s;
        video.play();
        const tick = () => {
          if (cancelled) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext("2d").drawImage(video, 0, 0);
            const text = decodeCanvas(canvas);
            if (text) {
              setScanning(false);
              onDecode(text);
              return;
            }
          }
          frame = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch(() => {
        setError("No se pudo abrir la cámara. Revisa los permisos o sube una foto del código.");
        setScanning(false);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning, onDecode]);

  async function handleFile(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    setError("");
    if (!looksLikeImage(file)) return setError("Sube una foto (JPG, PNG o WebP) del código QR.");
    try {
      // Igual que en el modo Imagen: cualquier foto se convierte a JPG ≤ 4 MB.
      const text = await decodeImageFile(await normalizeImage(file));
      if (text) onDecode(text);
      else setError("No se encontró ningún código QR en la imagen. Prueba con una foto más nítida o recortada al código.");
    } catch (e) {
      setError(e.userMessage ?? "No se pudo leer la imagen.");
    }
  }

  const button =
    "flex-1 rounded-lg bg-[#5BD3C7] px-4 py-2.5 text-sm font-semibold text-[#353755] transition hover:brightness-95 disabled:opacity-60";

  return (
    <div className="space-y-2">
      {scanning && (
        <video ref={videoRef} className="aspect-video w-full rounded-lg bg-black object-cover" muted playsInline />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setError("");
            setScanning((s) => !s);
          }}
          className={button}
        >
          {scanning ? "Detener cámara" : "Escanear con cámara"}
        </button>
        <button type="button" disabled={disabled || scanning} onClick={() => fileRef.current?.click()} className={button}>
          Subir foto del QR
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
