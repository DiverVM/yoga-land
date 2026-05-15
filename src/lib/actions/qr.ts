"use server";

import { revalidatePath } from "next/cache";
import { decideQrRecord } from "@/lib/repositories";
import { t } from "@/i18n";

export type QrDecisionState = {
  message: string;
  isError: boolean;
} | null;

export async function submitDecisionAction(
  qrId: string,
  decision: "accept" | "decline",
  _prevState: QrDecisionState,
): Promise<QrDecisionState> {
  const result = await decideQrRecord(
    qrId,
    decision === "accept" ? "accepted" : "declined",
  );

  if (!result.record) {
    return { message: t("qrDecision.updateFailed"), isError: true };
  }

  if (result.conflict) {
    return { message: t("qrDecision.updateFailed"), isError: true };
  }

  revalidatePath(`/admin/qr/${qrId}`);

  return {
    message:
      decision === "accept"
        ? t("qrDecision.accepted")
        : t("qrDecision.declined"),
    isError: false,
  };
}
