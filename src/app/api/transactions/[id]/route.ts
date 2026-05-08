import { fail, ok, parseJsonBody } from "@/lib/api";
import {
  deleteTransaction,
  getTransactionById,
  updateTransaction,
} from "@/lib/repositories";
import { isPaymentStatus } from "@/lib/validation";

type UpdateBody = {
  paymentStatus?: "pending" | "success" | "failed";
  qrId?: string | null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const transaction = await getTransactionById(id);
  if (!transaction) {
    return fail("Transaction not found", 404);
  }
  return ok({ transaction });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJsonBody<UpdateBody>(request);
  if (!body) {
    return fail("Invalid JSON body", 400);
  }

  if (body.paymentStatus && !isPaymentStatus(body.paymentStatus)) {
    return fail("Validation failed", 400, "paymentStatus is invalid");
  }

  const updated = await updateTransaction(id, {
    paymentStatus: body.paymentStatus,
    qrId: body.qrId,
  });

  if (!updated) {
    return fail("Transaction not found", 404);
  }

  return ok({ transaction: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deleteTransaction(id);
  if (!deleted) {
    return fail("Transaction not found", 404);
  }
  return ok({ deleted: true });
}
