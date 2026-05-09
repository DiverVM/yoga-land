import { fail, ok } from "@/lib/api";
import { decideQrRecord } from "@/lib/repositories";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function localizeDecisionStatus(status: string) {
  if (status === "pending") return "в ожидании";
  if (status === "accepted") return "принят";
  if (status === "declined") return "отклонен";
  return status;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const result = await decideQrRecord(id, "accepted");
  if (!result.record) {
    return fail("QR-запись не найдена", 404);
  }

  if (result.conflict) {
    return fail(
      "По QR-записи уже принято решение",
      409,
      `Текущий статус: ${localizeDecisionStatus(result.record.decisionStatus)}`,
    );
  }

  return ok({ qrRecord: result.record });
}
