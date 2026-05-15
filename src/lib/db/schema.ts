import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  currencyCode: text("currency_code", { enum: ["933"] }).notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull(),
  productId: text("product_id").notNull(),
  amount: integer("amount").notNull(),
  currencyCode: text("currency_code", { enum: ["933"] }).notNull(),
  paymentStatus: text("payment_status", {
    enum: ["pending", "success", "failed"],
  }).notNull(),
  orderId: text("order_id"),
  qrId: text("qr_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const qrRecords = sqliteTable(
  "qr_records",
  {
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
  },
  (table) => [
    index("qr_records_transaction_id_idx").on(table.transactionId),
    index("qr_records_decision_status_idx").on(table.decisionStatus),
  ],
);

export const emailLogs = sqliteTable(
  "email_logs",
  {
    id: text("id").primaryKey(),
    to: text("to").notNull(),
    qrId: text("qr_id").notNull(),
    status: text("status", { enum: ["sent", "failed"] }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("email_logs_qr_id_idx").on(table.qrId)],
);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  login: text("login").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin"] }).notNull(),
  createdAt: text("created_at").notNull(),
});
