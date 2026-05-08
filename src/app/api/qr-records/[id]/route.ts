import { fail, ok, parseJsonBody } from "@/lib/api";
import {
  deleteQrRecord,
  getQrRecordById,
  updateQrRecord,
} from "@/lib/repositories";
import { isDecisionStatus } from "@/lib/validation";

type UpdateBody = {
  qrUrl?: string;
  payload?: string;
  decisionStatus?: "pending" | "accepted" | "declined";
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const qrRecord = await getQrRecordById(id);
  if (!qrRecord) {
    return fail("QR record not found", 404);
  }
  return ok({ qrRecord });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJsonBody<UpdateBody>(request);
  if (!body) {
    return fail("Invalid JSON body", 400);
  }

  if (body.decisionStatus && !isDecisionStatus(body.decisionStatus)) {
    return fail("Validation failed", 400, "decisionStatus is invalid");
  }

  const updated = await updateQrRecord(id, {
    qrUrl: body.qrUrl,
    payload: body.payload,
    decisionStatus: body.decisionStatus,
    decisionAt:
      body.decisionStatus && body.decisionStatus !== "pending"
        ? new Date().toISOString()
        : undefined,
  });

  if (!updated) {
    return fail("QR record not found", 404);
  }

  return ok({ qrRecord: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const deleted = await deleteQrRecord(id);
  if (!deleted) {
    return fail("QR record not found", 404);
  }
  return ok({ deleted: true });
}
