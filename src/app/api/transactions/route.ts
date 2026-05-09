import { fail, ok, parseJsonBody } from "@/lib/api";
import { createTransaction, listTransactions } from "@/lib/repositories";
import { isPaymentStatus, validateProductId } from "@/lib/validation";

type CreateTransactionBody = {
  productId?: string;
  paymentStatus?: "pending" | "success" | "failed";
};

export async function GET() {
  const transactions = await listTransactions();
  return ok({ transactions });
}

export async function POST(request: Request) {
  const body = await parseJsonBody<CreateTransactionBody>(request);
  if (!body) {
    return fail("Invalid JSON body", 400);
  }

  const validation = await validateProductId(body.productId);
  if (!validation.valid) {
    return fail("Validation failed", 400, validation.message);
  }

  const paymentStatus = body.paymentStatus ?? "pending";
  if (!isPaymentStatus(paymentStatus)) {
    return fail("Validation failed", 400, "paymentStatus is invalid");
  }

  const product = validation.product;

  const transaction = await createTransaction({
    productId: product.id,
    amount: product.price,
    currency: product.currency,
    paymentStatus,
  });

  return ok({ transaction }, 201);
}
