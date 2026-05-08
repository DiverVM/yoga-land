"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";

type QrActionsProps = {
  qrId: string;
  qrUrl: string;
};

export function QrActions({ qrId, qrUrl }: QrActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState("");

  const canSendEmail = useMemo(() => email.trim().length > 0, [email]);

  async function handleCopy() {
    await navigator.clipboard.writeText(qrUrl);
    setMessage("QR URL copied to clipboard.");
  }

  async function handleDownloadPdf() {
    setIsPdfLoading(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      pdf.setFontSize(14);
      pdf.text("Yoga Land Mock QR", 40, 40);
      pdf.addImage(qrDataUrl, "PNG", 40, 60, 220, 220);
      pdf.setFontSize(10);
      pdf.text(qrUrl, 40, 300, { maxWidth: 520 });
      pdf.save(`qr-${qrId}.pdf`);

      setMessage("PDF downloaded.");
    } catch {
      setMessage("Failed to generate PDF.");
    } finally {
      setIsPdfLoading(false);
    }
  }

  function handleOpen() {
    window.open(qrUrl, "_blank", "noopener,noreferrer");
    setMessage("Opened QR URL in a new tab.");
  }

  async function handleSendEmail() {
    if (!canSendEmail) {
      setMessage("Enter an email address first.");
      return;
    }

    setIsEmailLoading(true);

    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ qrId, to: email.trim() }),
      });

      const body = (await response.json()) as {
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(body.details ?? body.error ?? "Email request failed");
      }

      setMessage("Mock email sent and logged.");
      setEmail("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Email request failed",
      );
    } finally {
      setIsEmailLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          className="rounded-lg border border-stone-900 px-4 py-2 text-sm font-medium transition hover:bg-stone-900 hover:text-white"
          onClick={handleCopy}
          type="button"
        >
          Copy
        </button>
        <button
          className="rounded-lg border border-stone-900 px-4 py-2 text-sm font-medium transition hover:bg-stone-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleDownloadPdf}
          type="button"
          disabled={isPdfLoading}
        >
          {isPdfLoading ? "Generating PDF..." : "Download PDF"}
        </button>
        <button
          className="rounded-lg border border-stone-900 px-4 py-2 text-sm font-medium transition hover:bg-stone-900 hover:text-white sm:col-span-2"
          onClick={handleOpen}
          type="button"
        >
          Open in new tab
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-stone-200 p-3">
        <p className="text-xs font-medium tracking-wide text-stone-600 uppercase">
          Send QR by email (mock)
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring"
            placeholder="user@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={isEmailLoading}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isEmailLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      {message ? (
        <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
