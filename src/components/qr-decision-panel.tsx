"use client";

import { useActionState } from "react";
import { submitDecisionAction, type QrDecisionState } from "@/lib/actions/qr";
import { t } from "@/i18n";

type QrDecisionPanelProps = {
  qrId: string;
  initialStatus: "pending" | "accepted" | "declined";
};

export function QrDecisionPanel({ qrId, initialStatus }: QrDecisionPanelProps) {
  const acceptAction = submitDecisionAction.bind(null, qrId, "accept");
  const declineAction = submitDecisionAction.bind(null, qrId, "decline");

  const [acceptState, dispatchAccept, isAccepting] = useActionState<
    QrDecisionState,
    FormData
  >(acceptAction, null);
  const [declineState, dispatchDecline, isDeclining] = useActionState<
    QrDecisionState,
    FormData
  >(declineAction, null);

  const isSubmitting = isAccepting || isDeclining;
  const message = acceptState?.message ?? declineState?.message ?? null;

  // After a successful decision, server revalidates the page so initialStatus
  // passed from the parent server component will reflect the updated DB value
  // on the next render. We derive displayStatus from action results if available.
  const resolvedStatus =
    acceptState && !acceptState.isError
      ? "accepted"
      : declineState && !declineState.isError
        ? "declined"
        : initialStatus;

  const statusLabel =
    resolvedStatus === "pending"
      ? t("admin.pending")
      : resolvedStatus === "accepted"
        ? t("admin.accepted")
        : t("admin.declined");

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 p-4">
      <p className="text-sm text-stone-600">
        {t("qrDecision.currentDecision")}:{" "}
        <span className="font-semibold text-stone-900">{statusLabel}</span>
      </p>
      {resolvedStatus === "pending" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <form action={dispatchAccept}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-secondary w-full px-4 py-2 text-sm"
            >
              {t("qrDecision.accept")}
            </button>
          </form>
          <form action={dispatchDecline}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-secondary w-full px-4 py-2 text-sm"
            >
              {t("qrDecision.decline")}
            </button>
          </form>
        </div>
      ) : null}
      {message ? (
        <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm text-stone-700">
          {message}
        </p>
      ) : null}
    </div>
  );
}
