import { ok } from "@/lib/api";
import {
  listEmailLogs,
  listQrRecords,
  listTransactions,
} from "@/lib/repositories";

export async function GET() {
  const [transactions, qrRecords, emailLogs] = await Promise.all([
    listTransactions(),
    listQrRecords(),
    listEmailLogs(),
  ]);

  return ok({
    transactions,
    qrRecords,
    emailLogs,
  });
}
