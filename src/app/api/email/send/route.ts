import { fail, ok, parseJsonBody } from "@/lib/api";
import { sendQrEmail } from "@/lib/email-service";
import {
  createEmailLog,
  getProductById,
  getQrRecordById,
  getTransactionById,
} from "@/lib/repositories";
import { verifyEmailAccessToken } from "@/lib/session";
import { isEmail } from "@/lib/validation";

type SendEmailBody = {
  qrId?: string;
  to?: string;
  token?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<SendEmailBody>(request);
  if (!body) {
    return fail("Invalid JSON body", 400);
  }

  if (!body.qrId || !body.to || !body.token) {
    return fail("Validation failed", 400, "qrId and to are required");
  }

  if (!isEmail(body.to)) {
    return fail("Validation failed", 400, "Invalid email address");
  }

  const emailAccess = await verifyEmailAccessToken(body.token);
  if (!emailAccess) {
    return fail("Forbidden", 403, "Invalid or expired email token");
  }

  if (emailAccess.qrId !== body.qrId) {
    return fail("Forbidden", 403, "Token does not match QR record");
  }

  const qrRecord = await getQrRecordById(body.qrId);
  if (!qrRecord) {
    return fail("QR record not found", 404);
  }

  if (emailAccess.transactionId !== qrRecord.transactionId) {
    return fail("Forbidden", 403, "Token does not match transaction");
  }

  const transaction = await getTransactionById(qrRecord.transactionId);
  if (!transaction) {
    return fail("Transaction not found", 404);
  }

  const product = await getProductById(transaction.productId);
  if (!product) {
    return fail("Product not found", 404);
  }

  const sendResult = await sendQrEmail({
    qrId: qrRecord.id,
    to: body.to,
    qrUrl: qrRecord.qrUrl,
    transactionId: transaction.id,
    transactionDate: transaction.createdAt,
    firstName: transaction.firstName,
    lastName: transaction.lastName,
    productName: product.name,
    amount: transaction.amount,
    currencyCode: transaction.currencyCode,
  });

  const emailLog = await createEmailLog({
    qrId: qrRecord.id,
    to: body.to,
    status: sendResult.ok ? "sent" : "failed",
  });

  if (!sendResult.ok) {
    return fail("Email delivery failed", 502, sendResult.error);
  }

  return ok({ emailLog, providerId: sendResult.providerId }, 201);
}
