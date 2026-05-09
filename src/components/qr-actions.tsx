"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { t } from "@/i18n";

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
      pdf.text(t("qrActions.pdfTitle"), 40, 40);
      pdf.addImage(qrDataUrl, "PNG", 40, 60, 220, 220);
      pdf.setFontSize(10);
      pdf.text(qrUrl, 40, 300, { maxWidth: 520 });
      pdf.save(`qr-${qrId}.pdf`);
    } catch {
      setMessage(t("qrActions.pdfFailed"));
    } finally {
      setIsPdfLoading(false);
    }
  }

  async function handleSendEmail() {
    if (!canSendEmail) {
      setMessage(t("qrActions.enterEmail"));
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
        throw new Error(
          body.details ?? body.error ?? t("qrActions.emailFailed"),
        );
      }

      setMessage(t("qrActions.emailSent"));
      setEmail("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t("qrActions.emailFailed"),
      );
    } finally {
      setIsEmailLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          className="btn-secondary px-4 py-2 text-sm"
          onClick={handleDownloadPdf}
          type="button"
          disabled={isPdfLoading}
        >
          {isPdfLoading
            ? t("qrActions.generatingPdf")
            : t("qrActions.downloadPdf")}
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-stone-200 p-3">
        <p className="text-xs font-medium tracking-wide text-stone-600 uppercase">
          {t("qrActions.sendByEmail")}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500 outline-none ring-orange-500 focus:ring"
            placeholder="user@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={isEmailLoading}
            className="btn-secondary px-4 py-2 text-sm"
          >
            {isEmailLoading ? t("qrActions.sending") : t("qrActions.send")}
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
