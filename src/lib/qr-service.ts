import QRCode from "qrcode";
import type { Transaction } from "@/lib/types";

type BuildQrPayloadInput = {
  transaction: Transaction;
  productName: string;
};

export type QrPayload = {
  transactionId: string;
  productId: string;
  productName: string;
  firstName: string | null;
  lastName: string | null;
  amount: number;
  currencyCode: string;
  paymentStatus: string;
  createdAt: string;
};

export function buildQrPayload(input: BuildQrPayloadInput): QrPayload {
  const { transaction, productName } = input;

  return {
    transactionId: transaction.id,
    productId: transaction.productId,
    productName,
    firstName: transaction.firstName,
    lastName: transaction.lastName,
    amount: transaction.amount,
    currencyCode: transaction.currencyCode,
    paymentStatus: transaction.paymentStatus,
    createdAt: transaction.createdAt,
  };
}

export function serializeQrPayload(payload: QrPayload) {
  return JSON.stringify(payload);
}

export async function toQrDataUrl(content: string) {
  return QRCode.toDataURL(content, {
    width: 320,
    margin: 2,
  });
}

export function buildQrDetailsUrl(origin: string, qrId: string) {
  return `${origin}/qr/${qrId}`;
}
