import { fail, ok, parseJsonBody } from "@/lib/api";
import { createEmailLog, getQrRecordById } from "@/lib/repositories";
import { isEmail } from "@/lib/validation";

type SendEmailBody = {
  qrId?: string;
  to?: string;
};

export async function POST(request: Request) {
  const body = await parseJsonBody<SendEmailBody>(request);
  if (!body) {
    return fail("Invalid JSON body", 400);
  }

  if (!body.qrId || !body.to) {
    return fail("Validation failed", 400, "qrId and to are required");
  }

  if (!isEmail(body.to)) {
    return fail("Validation failed", 400, "Invalid email address");
  }

  const qrRecord = await getQrRecordById(body.qrId);
  if (!qrRecord) {
    return fail("QR record not found", 404);
  }

  const emailLog = await createEmailLog({
    qrId: qrRecord.id,
    to: body.to,
    status: "sent",
  });

  return ok({ emailLog }, 201);
}
