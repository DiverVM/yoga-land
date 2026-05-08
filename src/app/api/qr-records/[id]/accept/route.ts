import { fail, ok } from "@/lib/api";
import { decideQrRecord } from "@/lib/repositories";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const result = await decideQrRecord(id, "accepted");
  if (!result.record) {
    return fail("QR record not found", 404);
  }

  if (result.conflict) {
    return fail(
      "QR record was already decided",
      409,
      `Current status: ${result.record.decisionStatus}`,
    );
  }

  return ok({ qrRecord: result.record });
}
