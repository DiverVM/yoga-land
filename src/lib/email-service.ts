import { Resend } from "resend";
import { t } from "@/i18n";
import { formatMoney } from "@/lib/format";
import { toQrDataUrl } from "@/lib/qr-service";

type SendQrEmailInput = {
  to: string;
  qrId: string;
  qrUrl: string;
  transactionId: string;
  transactionDate: string;
  productName: string;
  amount: number;
  currencyCode: string;
};

export type SendQrEmailResult =
  | { ok: true; providerId?: string }
  | { ok: false; error: string };

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  return new Resend(apiKey);
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? "delivered@resend.dev";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatTransactionDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-BY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getBase64ContentFromDataUrl(dataUrl: string) {
  const prefix = "base64,";
  const prefixIndex = dataUrl.indexOf(prefix);

  if (prefixIndex === -1) {
    throw new Error("Invalid QR data URL");
  }

  return dataUrl.slice(prefixIndex + prefix.length);
}

function buildEmailHtml(input: SendQrEmailInput, qrImageCid: string): string {
  const productName = escapeHtml(input.productName);
  const qrId = escapeHtml(input.qrId);
  const transactionId = escapeHtml(input.transactionId);
  const formattedPrice = escapeHtml(
    formatMoney(input.amount, input.currencyCode),
  );
  const formattedDate = escapeHtml(
    formatTransactionDate(input.transactionDate),
  );

  return `
  <div style="font-family: Arial, sans-serif; color: #1c1917; line-height: 1.6; background: #f5f5f4; padding: 24px;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 32px; border: 1px solid #e7e5e4;">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #ea580c;">Yoga Land</p>
      <h2 style="margin: 0 0 12px; font-size: 28px; line-height: 1.2;">${t("email.title")}</h2>
      <p style="margin: 0 0 24px; color: #57534e;">${t("email.subtitle")}</p>

      <div style="margin: 0 0 24px; text-align: center;">
        <img
          src="cid:${qrImageCid}"
          alt="Yoga Land QR code"
          width="220"
          height="220"
          style="display: inline-block; width: 220px; height: 220px; border-radius: 16px; border: 1px solid #e7e5e4; padding: 12px; background: #ffffff;"
        />
      </div>

      <div style="margin: 0 0 24px; border-radius: 16px; background: #fafaf9; border: 1px solid #e7e5e4; padding: 20px;">
        <p style="margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #1c1917;">${t("email.detailsTitle")}</p>
        <p style="margin: 0 0 6px; color: #44403c;"><strong>${t("email.course")}:</strong> ${productName}</p>
        <p style="margin: 0 0 6px; color: #44403c;"><strong>${t("email.price")}:</strong> ${formattedPrice}</p>
        <p style="margin: 0 0 6px; color: #44403c;"><strong>${t("email.transaction")}:</strong> ${transactionId}</p>
        <p style="margin: 0 0 6px; color: #44403c;"><strong>${t("email.purchasedAt")}:</strong> ${formattedDate}</p>
        <p style="margin: 0; color: #44403c;"><strong>${t("email.qrId")}:</strong> ${qrId}</p>
      </div>

      <p style="margin: 0; font-size: 13px; color: #78716c;">${t("email.footer")}</p>
    </div>
  </div>
  `;
}

function buildEmailText(input: SendQrEmailInput): string {
  return [
    t("email.textIntro"),
    "",
    t("email.textConfirmed"),
    "",
    `${t("email.course")}: ${input.productName}`,
    `${t("email.price")}: ${formatMoney(input.amount, input.currencyCode)}`,
    `${t("email.transaction")}: ${input.transactionId}`,
    `${t("email.purchasedAt")}: ${formatTransactionDate(input.transactionDate)}`,
    `${t("email.qrId")}: ${input.qrId}`,
    "",
    t("email.textUseQr"),
  ].join("\n");
}

export async function sendQrEmail(
  input: SendQrEmailInput,
): Promise<SendQrEmailResult> {
  try {
    const resend = getResendClient();
    const from = getFromEmail();
    const qrDataUrl = await toQrDataUrl(input.qrUrl);
    const qrImageCid = `qr-${input.qrId}@yoga-land`;
    const qrBase64Content = getBase64ContentFromDataUrl(qrDataUrl);

    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: t("email.subject", { course: input.productName }),
      html: buildEmailHtml(input, qrImageCid),
      text: buildEmailText(input),
      attachments: [
        {
          filename: `yoga-land-qr-${input.qrId}.png`,
          content: qrBase64Content,
          contentType: "image/png",
          contentId: qrImageCid,
        },
      ],
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    return { ok: true, providerId: result.data?.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Email provider error",
    };
  }
}
