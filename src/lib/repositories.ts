import { and, count, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import {
  emailLogs,
  products,
  qrRecords,
  transactions,
  users,
} from "@/lib/db/schema";
import type {
  DecisionStatus,
  EmailLog,
  PaginatedResult,
  PaymentStatus,
  Product,
  QrRecord,
  Transaction,
  User,
} from "@/lib/types";

const PAGE_LIMIT = 10;

function nowIso() {
  return new Date().toISOString();
}

// ─── Products ────────────────────────────────────────────────────────────────

export const listProducts = unstable_cache(
  async (): Promise<Product[]> => {
    return (await db
      .select()
      .from(products)
      .where(eq(products.active, true))
      .orderBy(products.name)
      .all()) as Product[];
  },
  ["products-active"],
  { tags: ["products"], revalidate: 3600 },
);

export const getAllProducts = unstable_cache(
  async (): Promise<Product[]> => {
    return (await db
      .select()
      .from(products)
      .orderBy(products.name)
      .all()) as Product[];
  },
  ["products-all"],
  { tags: ["products"], revalidate: 3600 },
);

export const getProductById = unstable_cache(
  async (id: string): Promise<Product | null> => {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .all();
    return (rows[0] as Product) ?? null;
  },
  ["products-by-id"],
  { tags: ["products"], revalidate: 3600 },
);

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
  currency: "BYN";
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

export async function listTransactionsPaginated(params: {
  page: number;
  paymentStatus?: PaymentStatus;
}): Promise<PaginatedResult<Transaction>> {
  const { page, paymentStatus } = params;
  const offset = (page - 1) * PAGE_LIMIT;
  const where = paymentStatus
    ? eq(transactions.paymentStatus, paymentStatus)
    : undefined;

  const [data, [countRow]] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(where)
      .orderBy(desc(transactions.createdAt))
      .limit(PAGE_LIMIT)
      .offset(offset)
      .all(),
    db.select({ total: count() }).from(transactions).where(where).all(),
  ]);

  return {
    data: data as Transaction[],
    total: countRow?.total ?? 0,
    page,
    limit: PAGE_LIMIT,
  };
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

export async function listQrRecordsPaginated(params: {
  page: number;
  decisionStatus?: DecisionStatus;
}): Promise<PaginatedResult<QrRecord>> {
  const { page, decisionStatus } = params;
  const offset = (page - 1) * PAGE_LIMIT;
  const where = decisionStatus
    ? eq(qrRecords.decisionStatus, decisionStatus)
    : undefined;

  const [data, [countRow]] = await Promise.all([
    db
      .select()
      .from(qrRecords)
      .where(where)
      .orderBy(desc(qrRecords.createdAt))
      .limit(PAGE_LIMIT)
      .offset(offset)
      .all(),
    db.select({ total: count() }).from(qrRecords).where(where).all(),
  ]);

  return {
    data: data as QrRecord[],
    total: countRow?.total ?? 0,
    page,
    limit: PAGE_LIMIT,
  };
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

export async function listEmailLogsPaginated(params: {
  page: number;
  status?: "sent" | "failed";
}): Promise<PaginatedResult<EmailLog>> {
  const { page, status } = params;
  const offset = (page - 1) * PAGE_LIMIT;
  const where = status ? eq(emailLogs.status, status) : undefined;

  const [data, [countRow]] = await Promise.all([
    db
      .select()
      .from(emailLogs)
      .where(where)
      .orderBy(desc(emailLogs.createdAt))
      .limit(PAGE_LIMIT)
      .offset(offset)
      .all(),
    db.select({ total: count() }).from(emailLogs).where(where).all(),
  ]);

  return {
    data: data as EmailLog[],
    total: countRow?.total ?? 0,
    page,
    limit: PAGE_LIMIT,
  };
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUserByLogin(login: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.login, login))
    .all();
  return (rows[0] as User) ?? null;
}
