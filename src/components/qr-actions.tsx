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

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const cardX = 32;
      const cardY = 32;
      const cardWidth = pageWidth - cardX * 2;
      const cardHeight = pageHeight - cardY * 2;
      const cardPadding = 32;
      const textX = cardX + cardPadding;
      const textWidth = cardWidth - cardPadding * 2;

      pdf.setFillColor(245, 245, 244);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 20, 20, "F");

      pdf.setDrawColor(231, 229, 228);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 20, 20, "S");

      pdf.setTextColor(234, 88, 12);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text("YOGA LAND", textX, cardY + cardPadding - 8);

      pdf.setTextColor(28, 25, 23);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.text(t("email.title"), textX, cardY + cardPadding + 24);

      pdf.setTextColor(87, 83, 78);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      const subtitleLines = pdf.splitTextToSize(t("email.subtitle"), textWidth);
      pdf.text(subtitleLines, textX, cardY + cardPadding + 48);

      const qrBoxSize = 220;
      const qrOuterSize = 244;
      const qrContainerX = cardX + (cardWidth - qrOuterSize) / 2;
      const qrContainerY = cardY + cardPadding + 76;

      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(
        qrContainerX,
        qrContainerY,
        qrOuterSize,
        qrOuterSize,
        16,
        16,
        "F",
      );
      pdf.setDrawColor(231, 229, 228);
      pdf.roundedRect(
        qrContainerX,
        qrContainerY,
        qrOuterSize,
        qrOuterSize,
        16,
        16,
        "S",
      );

      pdf.addImage(
        qrDataUrl,
        "PNG",
        qrContainerX + 12,
        qrContainerY + 12,
        qrBoxSize,
        qrBoxSize,
      );

      const detailsX = textX;
      const detailsY = qrContainerY + qrOuterSize + 24;
      const detailsWidth = textWidth;
      const detailsHeight = 186;

      pdf.setFillColor(250, 250, 249);
      pdf.roundedRect(
        detailsX,
        detailsY,
        detailsWidth,
        detailsHeight,
        16,
        16,
        "F",
      );
      pdf.setDrawColor(231, 229, 228);
      pdf.roundedRect(
        detailsX,
        detailsY,
        detailsWidth,
        detailsHeight,
        16,
        16,
        "S",
      );

      pdf.setTextColor(28, 25, 23);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(t("email.detailsTitle"), detailsX + 20, detailsY + 28);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(68, 64, 60);
      const lines = [
        `${t("email.course")}: ${productName}`,
        `${t("email.price")}: ${formatMoney(amount, currencyCode)}`,
        `${t("email.transaction")}: ${transactionId}`,
        `${t("email.purchasedAt")}: ${formatPdfTransactionDate(transactionDate)}`,
        ...(customerFullName
          ? [`${t("email.customerName")}: ${customerFullName}`]
          : []),
        `${t("email.qrId")}: ${qrId}`,
      ];

      let detailsLineY = detailsY + 50;
      for (const line of lines) {
        const wrapped = pdf.splitTextToSize(line, detailsWidth - 40);
        pdf.text(wrapped, detailsX + 20, detailsLineY);
        detailsLineY += wrapped.length * 14;
      }

      pdf.setTextColor(120, 113, 108);
      pdf.setFontSize(10);
      const footerLines = pdf.splitTextToSize(t("email.footer"), textWidth);
      pdf.text(footerLines, textX, detailsY + detailsHeight + 26);

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
