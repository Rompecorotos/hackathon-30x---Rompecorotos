import { useEffect, useRef, useState } from "react";
import { looksLikeImage, normalizeImage } from "../lib/image";
import { decodeCanvas, decodeQrFromFile } from "../lib/qr";

/**
 * Lector de códigos QR: con la cámara o subiendo una foto del código (PNG/JPG, máx. 4 MB).
 * Llama a onDecode(texto, foto) al leer un código (foto: el archivo subido o un fotograma de la cámara).
 */
export function QrScanner({ onDecode, disabled }) {
  const videoRef = useRef(null);
  const fileRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);

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
              // Se entrega también el fotograma, por si el QR solo trae una referencia.
              canvas.toBlob(
                (blob) => onDecode(text, blob ? new File([blob], "captura-qr.jpg", { type: "image/jpeg" }) : null),
                "image/jpeg",
                0.9,
              );
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
    setReading(true);
    try {
      // La foto se lee en el navegador (no se sube): se usa la original para no perder nitidez.
      // Si el navegador no puede abrirla tal cual, se convierte a JPG primero.
      const text = await decodeQrFromFile(file).catch(async () => decodeQrFromFile(await normalizeImage(file)));
      if (text) onDecode(text, file);
      else setError("No se encontró ningún código QR en la foto. Encuadra solo el código, con buena luz y sin reflejos.");
    } catch (e) {
      setError(e.userMessage ?? "No se pudo leer la imagen.");
    } finally {
      setReading(false);
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
        <button type="button" disabled={disabled || scanning || reading} onClick={() => fileRef.current?.click()} className={button}>
          {reading ? "Leyendo QR..." : "Subir foto del QR"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
