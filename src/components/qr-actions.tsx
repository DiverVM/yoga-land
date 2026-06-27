"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { t } from "@/i18n";
import { formatMoney } from "@/lib/format";
import type { CurrencyCode } from "@/lib/types";

type QrActionsProps = {
  qrId: string;
  qrUrl: string;
  transactionId: string;
  transactionDate: string;
  productName: string;
  amount: number;
  currencyCode: CurrencyCode;
  firstName: string | null;
  lastName: string | null;
};

function formatPdfTransactionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-BY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function QrActions({
  qrId,
  qrUrl,
  transactionId,
  transactionDate,
  productName,
  amount,
  currencyCode,
  firstName,
  lastName,
}: QrActionsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState("");

  const canSendEmail = useMemo(() => email.trim().length > 0, [email]);
  const customerFullName = useMemo(
    () => [firstName, lastName].filter(Boolean).join(" "),
    [firstName, lastName],
  );

  async function handleDownloadPdf() {
    setIsPdfLoading(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 320,
        margin: 2,
      });

      const formattedPrice = formatMoney(amount, currencyCode);
      const formattedDate = formatPdfTransactionDate(transactionDate);

      const rows: [string, string][] = [
        [t("email.course"), productName],
        [t("email.price"), formattedPrice],
        [t("email.transaction"), transactionId],
        [t("email.purchasedAt"), formattedDate],
        ...(customerFullName
          ? ([[t("email.customerName"), customerFullName]] as [
              string,
              string,
            ][])
          : []),
        [t("email.qrId"), qrId],
      ];

      // Render to canvas using system fonts (supports Cyrillic)
      const scale = 2;
      const W = 595;
      const H = 842;
      const canvas = document.createElement("canvas");
      canvas.width = W * scale;
      canvas.height = H * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);

      const PAD = 48;
      let y = PAD;

      // Brand
      ctx.font = "bold 11px Arial, sans-serif";
      ctx.fillStyle = "#ea580c";
      ctx.fillText("YOURMOOV", PAD, y);
      y += 28;

      // Title
      ctx.font = "bold 26px Arial, sans-serif";
      ctx.fillStyle = "#1c1917";
      ctx.fillText(t("email.title"), PAD, y);
      y += 36;

      // Subtitle
      ctx.font = "13px Arial, sans-serif";
      ctx.fillStyle = "#57534e";
      y = wrapText(ctx, t("email.subtitle"), PAD, y, W - PAD * 2, 20);
      y += 20;

      // QR image
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
      });
      const qrSize = 220;
      ctx.drawImage(qrImg, (W - qrSize) / 2, y, qrSize, qrSize);
      y += qrSize + 28;

      // Details box
      const rowH = 26;
      const boxPadX = 20;
      const boxPadY = 16;
      const boxH = boxPadY + 28 + rows.length * rowH + boxPadY;
      const boxX = PAD;
      const boxW = W - PAD * 2;

      ctx.fillStyle = "#fafaf9";
      ctx.strokeStyle = "#e7e5e4";
      ctx.lineWidth = 1;
      roundedRect(ctx, boxX, y, boxW, boxH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = "bold 15px Arial, sans-serif";
      ctx.fillStyle = "#1c1917";
      ctx.fillText(t("email.detailsTitle"), boxX + boxPadX, y + boxPadY + 15);

      let rowY = y + boxPadY + 15 + rowH;
      for (const [label, value] of rows) {
        const labelText = `${label}: `;
        ctx.font = "bold 13px Arial, sans-serif";
        ctx.fillStyle = "#44403c";
        const labelW = ctx.measureText(labelText).width;
        ctx.fillText(labelText, boxX + boxPadX, rowY);
        ctx.font = "13px Arial, sans-serif";
        ctx.fillText(value, boxX + boxPadX + labelW, rowY);
        rowY += rowH;
      }

      y += boxH + 24;

      // Footer
      ctx.font = "11px Arial, sans-serif";
      ctx.fillStyle = "#78716c";
      wrapText(ctx, t("email.footer"), PAD, y, W - PAD * 2, 16);

      // Save as PDF directly (no dialog)
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      pdf.addImage(imgData, "JPEG", 0, 0, W, H);
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
