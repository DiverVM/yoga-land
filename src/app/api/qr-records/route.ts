import { fail, ok, parseJsonBody } from "@/lib/api";
import {
  getTransactionById,
  createQrRecord,
  listQrRecords,
} from "@/lib/repositories";

type CreateBody = {
  transactionId?: string;
  qrUrl?: string;
  payload?: string;
};

export async function GET() {
  const qrRecords = await listQrRecords();
  return ok({ qrRecords });
}

export async function POST(request: Request) {
  const body = await parseJsonBody<CreateBody>(request);
  if (!body) {
    return fail("Invalid JSON body", 400);
  }

  if (!body.transactionId || !body.qrUrl || !body.payload) {
    return fail(
      "Validation failed",
      400,
      "transactionId, qrUrl and payload are required",
    );
  }

  const transaction = await getTransactionById(body.transactionId);
  if (!transaction) {
    return fail("Transaction not found", 404);
  }

  const qrRecord = await createQrRecord({
    transactionId: body.transactionId,
    qrUrl: body.qrUrl,
    payload: body.payload,
  });

  return ok({ qrRecord }, 201);
}
