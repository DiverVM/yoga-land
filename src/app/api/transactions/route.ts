import { t } from "@/i18n";
import { fail, ok, parseJsonBody } from "@/lib/api";
import { createTransaction, listTransactions } from "@/lib/repositories";
import { isPaymentStatus, normalizeOptionalName } from "@/lib/validation";
import { validateProductId } from "@/lib/validation.server";

type CreateTransactionBody = {
  productId?: string;
  firstName?: string;
  lastName?: string;
  paymentStatus?: "pending" | "success" | "failed";
};

export async function GET() {
  const transactions = await listTransactions();
  return ok({ transactions });
}

export async function POST(request: Request) {
  const body = await parseJsonBody<CreateTransactionBody>(request);
  if (!body) {
    return fail(t("common.invalidJsonBody"), 400);
  }

  const validation = await validateProductId(body.productId);
  if (!validation.valid) {
    return fail(t("common.validationFailed"), 400, validation.message);
  }

  const paymentStatus = body.paymentStatus ?? "pending";
  if (!isPaymentStatus(paymentStatus)) {
    return fail(
      t("common.validationFailed"),
      400,
      t("validation.paymentStatusInvalid"),
    );
  }

  const product = validation.product;
  const firstName = normalizeOptionalName(body.firstName);
  const lastName = normalizeOptionalName(body.lastName);

  const transaction = await createTransaction({
    productId: product.id,
    firstName,
    lastName,
    amount: product.price,
    currencyCode: product.currencyCode,
    paymentStatus,
  });

  return ok({ transaction }, 201);
}
