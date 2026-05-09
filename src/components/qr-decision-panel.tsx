"use client";

import { useState } from "react";
import { t } from "@/i18n";

type QrDecisionPanelProps = {
  qrId: string;
  initialStatus: "pending" | "accepted" | "declined";
};

export function QrDecisionPanel({ qrId, initialStatus }: QrDecisionPanelProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const statusLabel =
    status === "pending"
      ? t("admin.pending")
      : status === "accepted"
        ? t("admin.accepted")
        : t("admin.declined");

  async function submitDecision(decision: "accept" | "decline") {
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/qr-records/${qrId}/${decision}`, {
        method: "POST",
      });

      const body = (await response.json()) as {
        qrRecord?: { decisionStatus: "pending" | "accepted" | "declined" };
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(
          body.details ?? body.error ?? t("qrDecision.updateFailed"),
        );
      }

      if (body.qrRecord) {
        setStatus(body.qrRecord.decisionStatus);
      }

      setMessage(
        decision === "accept"
          ? t("qrDecision.accepted")
          : t("qrDecision.declined"),
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : t("qrDecision.updateFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const disabled = isSubmitting || status !== "pending";

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 p-4">
      <p className="text-sm text-stone-600">
        {t("qrDecision.currentDecision")}:{" "}
        <span className="font-semibold text-stone-900">{statusLabel}</span>
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => submitDecision("accept")}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("qrDecision.accept")}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => submitDecision("decline")}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("qrDecision.decline")}
        </button>
      </div>
      {message ? (
        <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
