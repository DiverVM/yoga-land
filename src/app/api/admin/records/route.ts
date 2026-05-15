import { ok } from "@/lib/api";
import {
  listTransactionsPaginated,
  listQrRecordsPaginated,
  listEmailLogsPaginated,
} from "@/lib/repositories";
import { isPaymentStatus, isDecisionStatus } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const txPageRaw = parseInt(searchParams.get("txPage") ?? "1", 10);
  const qrPageRaw = parseInt(searchParams.get("qrPage") ?? "1", 10);
  const emailPageRaw = parseInt(searchParams.get("emailPage") ?? "1", 10);

  const txPage = Number.isFinite(txPageRaw) && txPageRaw > 0 ? txPageRaw : 1;
  const qrPage = Number.isFinite(qrPageRaw) && qrPageRaw > 0 ? qrPageRaw : 1;
  const emailPage =
    Number.isFinite(emailPageRaw) && emailPageRaw > 0 ? emailPageRaw : 1;

  const txStatusRaw = searchParams.get("txStatus") ?? undefined;
  const qrDecisionRaw = searchParams.get("qrDecision") ?? undefined;
  const emailStatusRaw = searchParams.get("emailStatus") ?? undefined;

  const txStatus = isPaymentStatus(txStatusRaw) ? txStatusRaw : undefined;
  const qrDecision = isDecisionStatus(qrDecisionRaw)
    ? qrDecisionRaw
    : undefined;
  const emailStatus =
    emailStatusRaw === "sent" || emailStatusRaw === "failed"
      ? emailStatusRaw
      : undefined;

  const [transactions, qrRecords, emailLogs] = await Promise.all([
    listTransactionsPaginated({ page: txPage, paymentStatus: txStatus }),
    listQrRecordsPaginated({ page: qrPage, decisionStatus: qrDecision }),
    listEmailLogsPaginated({ page: emailPage, status: emailStatus }),
  ]);

  return ok({ transactions, qrRecords, emailLogs });
}
