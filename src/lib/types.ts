export type Currency = "USD";

export type PaymentStatus = "pending" | "success" | "failed";

export type DecisionStatus = "pending" | "accepted" | "declined";

export type Product = {
  id: string;
  name: string;
  price: number;
  currency: Currency;
};

export type Transaction = {
  id: string;
  productId: string;
  amount: number;
  currency: Currency;
  paymentStatus: PaymentStatus;
  qrId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QrRecord = {
  id: string;
  transactionId: string;
  qrUrl: string;
  payload: string;
  decisionStatus: DecisionStatus;
  decisionAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmailLog = {
  id: string;
  to: string;
  qrId: string;
  status: "sent" | "failed";
  createdAt: string;
};

export type MockDbSchema = {
  transactions: Transaction[];
  qrRecords: QrRecord[];
  emailLogs: EmailLog[];
};

export type ErrorResponse = {
  error: string;
  details?: string;
};
