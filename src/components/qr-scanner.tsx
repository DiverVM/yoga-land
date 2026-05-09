"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type ScanResult = {
  kind: "success" | "conflict" | "error";
  message: string;
  qrId?: string;
};

/** Extract the QR record ID from a Yoga Land QR URL like `https://…/qr/<id>`. */
function extractQrId(text: string): string | null {
  try {
    const { pathname } = new URL(text);
    const m = pathname.match(/^\/qr\/([^/]+)$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function decodeQrFile(file: File): Promise<string> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Unable to read image."));
      element.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("Unable to process image.");
    }

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (!code) {
      throw new Error("QR code not found in the selected image.");
    }

    return code.data;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

async function decodeQrPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;

  if (pdf.numPages < 1) {
    throw new Error("PDF has no pages.");
  }

  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Unable to process PDF.");
  }

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });

  if (!code) {
    throw new Error("QR code not found on the first PDF page.");
  }

  return code.data;
}

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  /** When false the scan loop yields without decoding. */
  const activeRef = useRef(false);
  /** Stable reference to the current tick fn so scanAgain can restart it. */
  const tickRef = useRef<() => void>(() => {});

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [canUseLiveCamera, setCanUseLiveCamera] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function handleDetect(text: string) {
    const qrId = extractQrId(text);
    if (!qrId) {
      setResult({
        kind: "error",
        message: "Not a Yoga Land QR code.",
      });
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const res = await fetch(
        `/api/qr-records/${encodeURIComponent(qrId)}/accept`,
        { method: "POST" },
      );

      const body = (await res.json()) as {
        qrRecord?: { decisionStatus: string };
        error?: string;
        details?: string;
      };

      if (res.status === 409) {
        setResult({
          kind: "conflict",
          message: body.details ?? body.error ?? "QR was already decided.",
          qrId,
        });
      } else if (!res.ok) {
        throw new Error(body.details ?? body.error ?? "Accept failed.");
      } else {
        setResult({
          kind: "success",
          message: "QR accepted successfully!",
          qrId,
        });
      }
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Accept failed.",
      });
    } finally {
      setProcessing(false);
      // Resume scanning automatically after a brief cooldown so the same
      // code isn't immediately re-detected before the camera moves.
      setTimeout(() => {
        activeRef.current = true;
        requestAnimationFrame(tickRef.current);
      }, 2000);
    }
  }

  useEffect(() => {
    let stream: MediaStream | null = null;

    function tick() {
      if (!activeRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        activeRef.current = false; // pause during processing
        void handleDetect(code.data);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    tickRef.current = tick;

    // ── start camera ─────────────────────────────────────────────────────────
    async function start() {
      try {
        if (!window.isSecureContext) {
          setCanUseLiveCamera(false);
          setCameraError(
            "Live camera is blocked on Safari over http://192.168.x.x. Use HTTPS or the photo fallback below.",
          );
          return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          setCanUseLiveCamera(false);
          setCameraError(
            "This browser does not provide live camera access here. Use the photo fallback below.",
          );
          return;
        }

        // Try rear camera first; fall back to any camera (e.g. desktop webcam
        // or a device that rejects the facingMode constraint).
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;

        // Safari on iOS requires waiting for the loadedmetadata event before
        // calling play() and before videoWidth/Height are available.
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });

        await video.play();
        activeRef.current = true;
        tick();
      } catch (err) {
        setCanUseLiveCamera(false);
        setCameraError(
          err instanceof Error
            ? `${err.message}. You can still scan from a photo below.`
            : "Camera access denied. You can still scan from a photo below.",
        );
      }
    }

    start();

    return () => {
      activeRef.current = false;
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const text =
        file.type === "application/pdf"
          ? await decodeQrPdf(file)
          : await decodeQrFile(file);
      await handleDetect(text);
    } catch (err) {
      setResult({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Unable to process image.",
      });
    } finally {
      setProcessing(false);
    }
  }

  // ── render ──────────────────────────────────────────────────────────────────
  const bannerStyles: Record<ScanResult["kind"], string> = {
    success: "border-green-200 bg-green-50 text-green-800",
    conflict: "border-yellow-200 bg-yellow-50 text-yellow-800",
    error: "border-red-200 bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-4">
      {result && (
        <div
          className={`rounded-xl border p-4 text-sm ${bannerStyles[result.kind]}`}
        >
          <p className="font-semibold">
            {result.kind === "success" ? "✓" : "✗"} {result.message}
          </p>
          {result.qrId && (
            <div className="mt-1 space-y-1">
              <p className="font-mono text-xs opacity-60">{result.qrId}</p>
              <Link
                href={`/qr/${result.qrId}`}
                className="inline-block text-xs font-semibold underline underline-offset-2"
              >
                Open QR details
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Camera viewport */}
      {cameraError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Camera unavailable</p>
          <p className="mt-1 opacity-80">{cameraError}</p>
        </div>
      ) : null}

      {canUseLiveCamera ? (
        <>
          <div className="relative mx-auto aspect-4/3 w-full max-w-sm overflow-hidden rounded-2xl bg-black">
            {/* autoplay is required by Safari on iOS in addition to video.play() */}
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              muted
              playsInline
            />
            {/* Canvas used for frame decoding — visually hidden but NOT display:none
               because Safari won't capture pixels from a display:none canvas. */}
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="pointer-events-none absolute opacity-0"
            />

            {/* Keep aiming overlay visible between scans. */}
            {!processing && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 rounded-lg border-2 border-amber-400 opacity-80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
            )}

            {/* Processing spinner */}
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
        </>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
        <p className="font-semibold text-stone-900">Fallback scan</p>
        <p className="mt-1">
          If live camera is blocked, use the device camera or gallery to pick a
          QR image and it will be accepted automatically.
        </p>
        <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium text-stone-800 shadow-sm hover:bg-stone-100">
          Take photo / Choose image / Upload PDF
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
}
