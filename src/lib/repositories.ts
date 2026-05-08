import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { emailLogs, qrRecords, transactions } from "@/lib/db/schema";
import type {
  DecisionStatus,
  EmailLog,
  PaymentStatus,
  QrRecord,
  Transaction,
} from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function listTransactions(): Promise<Transaction[]> {
  return (await db.select().from(transactions).all()) as Transaction[];
}

export async function getTransactionById(
  id: string,
): Promise<Transaction | null> {
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .all();
  return (rows[0] as Transaction) ?? null;
}

type CreateTransactionInput = {
  productId: string;
  amount: number;
  currency: "USD";
  paymentStatus?: PaymentStatus;
  qrId?: string | null;
};

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction> {
  const timestamp = nowIso();
  const transaction: Transaction = {
    id: randomUUID(),
    productId: input.productId,
    amount: input.amount,
    currency: input.currency,
    paymentStatus: input.paymentStatus ?? "pending",
    qrId: input.qrId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(transactions).values(transaction).run();
  return transaction;
}

type UpdateTransactionInput = Partial<
  Pick<
    Transaction,
    "productId" | "amount" | "currency" | "paymentStatus" | "qrId"
  >
>;

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction | null> {
  await db
    .update(transactions)
    .set({ ...input, updatedAt: nowIso() })
    .where(eq(transactions.id, id))
    .run();

  return getTransactionById(id);
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const result = await db
    .delete(transactions)
    .where(eq(transactions.id, id))
    .run();
  return result.rowsAffected > 0;
}

// ─── QR Records ─────────────────────────────────────────────────────────────

export async function listQrRecords(): Promise<QrRecord[]> {
  return (await db.select().from(qrRecords).all()) as QrRecord[];
}

export async function getQrRecordById(id: string): Promise<QrRecord | null> {
  const rows = await db
    .select()
    .from(qrRecords)
    .where(eq(qrRecords.id, id))
    .all();
  return (rows[0] as QrRecord) ?? null;
}

type CreateQrRecordInput = {
  id?: string;
  transactionId: string;
  qrUrl: string;
  payload: string;
};

export async function createQrRecord(
  input: CreateQrRecordInput,
): Promise<QrRecord> {
  const timestamp = nowIso();
  const record: QrRecord = {
    id: input.id ?? randomUUID(),
    transactionId: input.transactionId,
    qrUrl: input.qrUrl,
    payload: input.payload,
    decisionStatus: "pending",
    decisionAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(qrRecords).values(record).run();
  return record;
}

type UpdateQrInput = Partial<
  Pick<QrRecord, "qrUrl" | "payload" | "decisionStatus" | "decisionAt">
>;

export async function updateQrRecord(
  id: string,
  input: UpdateQrInput,
): Promise<QrRecord | null> {
  await db
    .update(qrRecords)
    .set({ ...input, updatedAt: nowIso() })
    .where(eq(qrRecords.id, id))
    .run();

  return getQrRecordById(id);
}

export async function deleteQrRecord(id: string): Promise<boolean> {
  const result = await db.delete(qrRecords).where(eq(qrRecords.id, id)).run();
  return result.rowsAffected > 0;
}

export async function decideQrRecord(
  id: string,
  decision: Extract<DecisionStatus, "accepted" | "declined">,
): Promise<{ record: QrRecord | null; conflict: boolean }> {
  const now = nowIso();
  const result = await db
    .update(qrRecords)
    .set({ decisionStatus: decision, decisionAt: now, updatedAt: now })
    .where(and(eq(qrRecords.id, id), eq(qrRecords.decisionStatus, "pending")))
    .run();

  if (result.rowsAffected === 0) {
    const existing = await getQrRecordById(id);
    if (!existing) {
      return { record: null, conflict: false };
    }
    return { record: existing, conflict: true };
  }

  const record = await getQrRecordById(id);
  return { record, conflict: false };
}

// ─── Email Logs ──────────────────────────────────────────────────────────────

type CreateEmailLogInput = {
  to: string;
  qrId: string;
  status: "sent" | "failed";
};

export async function createEmailLog(
  input: CreateEmailLogInput,
): Promise<EmailLog> {
  const emailLog: EmailLog = {
    id: randomUUID(),
    to: input.to,
    qrId: input.qrId,
    status: input.status,
    createdAt: nowIso(),
  };

  await db.insert(emailLogs).values(emailLog).run();
  return emailLog;
}

export async function listEmailLogs(): Promise<EmailLog[]> {
  return (await db.select().from(emailLogs).all()) as EmailLog[];
}
