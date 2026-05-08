import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  productId: text("product_id").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency", { enum: ["USD"] }).notNull(),
  paymentStatus: text("payment_status", {
    enum: ["pending", "success", "failed"],
  }).notNull(),
  qrId: text("qr_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const qrRecords = sqliteTable("qr_records", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id").notNull(),
  qrUrl: text("qr_url").notNull(),
  payload: text("payload").notNull(),
  decisionStatus: text("decision_status", {
    enum: ["pending", "accepted", "declined"],
  }).notNull(),
  decisionAt: text("decision_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const emailLogs = sqliteTable("email_logs", {
  id: text("id").primaryKey(),
  to: text("to").notNull(),
  qrId: text("qr_id").notNull(),
  status: text("status", { enum: ["sent", "failed"] }).notNull(),
  createdAt: text("created_at").notNull(),
});
