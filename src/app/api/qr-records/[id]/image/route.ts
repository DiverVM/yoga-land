import { fail, ok } from "@/lib/api";
import { getQrRecordById } from "@/lib/repositories";
import { toQrDataUrl } from "@/lib/qr-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const qrRecord = await getQrRecordById(id);
  if (!qrRecord) {
    return fail("QR record not found", 404);
  }

  const imageUrl = await toQrDataUrl(qrRecord.qrUrl);

  return ok({ imageUrl });
}
