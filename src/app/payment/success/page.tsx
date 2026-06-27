import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { QrActions } from "@/components/qr-actions";
import { t } from "@/i18n";
import { formatMoney } from "@/lib/format";
import { finalizePayment } from "@/lib/payment-finalization-service";
import { getRequestOrigin } from "@/lib/request-origin";
import { toQrDataUrl } from "@/lib/qr-service";
import { createEmailAccessToken } from "@/lib/session";
import {
  getProductById,
  getQrRecordById,
  getTransactionById,
} from "@/lib/repositories";
import type { QrRecord, Transaction } from "@/lib/types";

type SuccessPageProps = {
  searchParams: Promise<{
    transactionId?: string | string[];
  }>;
};

type PaymentPageShellProps = {
  children: ReactNode;
};

type PaymentErrorViewProps = {
  transaction: Transaction | null;
  errorMessage: string;
};

type PaymentPendingViewProps = {
  transactionId: string;
};

type PaymentSuccessViewProps = {
  transaction: Transaction;
  qrRecord: QrRecord;
  qrDataUrl: string;
  productName: string;
  emailToken: string;
};

const EMAIL_ACCESS_TOKEN_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

function getEmailTokenExpiresAt(createdAt: string) {
  const createdAtMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdAtMs)) {
    return null;
  }

  return createdAtMs + EMAIL_ACCESS_TOKEN_MAX_AGE_MS;
}

function PaymentPageShell({ children }: PaymentPageShellProps) {
  return (
    <div className="min-h-screen bg-stone-100 px-4 py-24">
      <main className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl bg-white p-6 shadow-xl">
        {children}
      </main>
    </div>
  );
}

function PaymentNotFoundView() {
  return (
    <PaymentPageShell>
      <div className="space-y-4">
        <p className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-wide text-amber-800 uppercase">
          {t("payment.failedBadge")}
        </p>
        <h1 className="text-3xl font-bold text-stone-900">
          {t("payment.pageNotFoundTitle")}
        </h1>
        <p className="text-sm text-stone-600">
          {t("payment.pageNotFoundBody")}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="btn-primary px-4 py-2 text-sm">
          {t("common.backToLanding")}
        </Link>
      </div>
    </PaymentPageShell>
  );
}

function PaymentPendingView({ transactionId }: PaymentPendingViewProps) {
  return (
    <PaymentPageShell>
      <div className="space-y-4">
        <p className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase">
          {t("payment.processingBadge")}
        </p>
        <h1 className="text-2xl font-bold text-stone-900">
          {t("payment.processingTitle")}
        </h1>
        <p className="text-sm text-stone-600">
          {t("payment.processingSubtitle")}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/payment/success?transactionId=${transactionId}`}
          className="btn-primary px-4 py-2 text-sm"
        >
          {t("payment.refreshStatus")}
        </Link>
        <Link href="/" className="btn-secondary px-4 py-2 text-sm">
          {t("common.backToLanding")}
        </Link>
      </div>
    </PaymentPageShell>
  );
}

function PaymentErrorView({
  transaction,
  errorMessage,
}: PaymentErrorViewProps) {
  return (
    <PaymentPageShell>
      <div className="space-y-4">
        <p className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold tracking-wide text-red-700 uppercase">
          {t("payment.failedBadge")}
        </p>
        <h1 className="text-2xl font-bold text-red-600">
          {t("payment.failedTitle")}
        </h1>
        <p className="text-sm text-red-700">{errorMessage}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className="btn-secondary px-4 py-2 text-sm">
          {t("common.backToLanding")}
        </Link>
        {transaction ? (
          <Link href="/" className="btn-primary px-4 py-2 text-sm">
            {t("payment.tryAgain")}
          </Link>
        ) : null}
      </div>
    </PaymentPageShell>
  );
}

function PaymentSuccessView({
  transaction,
  qrRecord,
  qrDataUrl,
  productName,
  emailToken,
}: PaymentSuccessViewProps) {
  const customerFullName = [transaction.firstName, transaction.lastName]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(" ");

  return (
    <PaymentPageShell>
      <header className="space-y-2">
        <p className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold tracking-wide text-green-700 uppercase">
          {t("payment.successBadge")}
        </p>
        <h1 className="text-3xl font-bold text-stone-900">
          {t("payment.successTitle")}
        </h1>
        <p className="text-sm text-stone-600">
          {t("payment.transactionFor", {
            id: transaction.orderNumber,
            amount: formatMoney(transaction.amount, transaction.currencyCode),
          })}
        </p>
        <p className="text-sm text-stone-700">{t("payment.successSubtitle")}</p>
        {customerFullName ? (
          <p className="text-sm text-stone-700">
            {t("email.customerName")}: {customerFullName}
          </p>
        ) : null}
      </header>

      <section className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="rounded-2xl border border-stone-200 p-4">
          <Image
            src={qrDataUrl}
            alt="Generated QR code"
            width={220}
            height={220}
            className="h-auto w-full"
            unoptimized
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            {t("payment.nextStepsTitle")}
          </p>
          <p className="text-sm text-emerald-800">
            {t("payment.nextStepsBody")}
          </p>
          <QrActions
            qrId={qrRecord.id}
            emailToken={emailToken}
            qrUrl={qrRecord.qrUrl}
            transactionId={transaction.id}
            transactionDate={transaction.createdAt}
            productName={productName}
            amount={transaction.amount}
            currencyCode={transaction.currencyCode}
            firstName={transaction.firstName}
            lastName={transaction.lastName}
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/" className="btn-secondary px-4 py-2 text-sm">
          {t("common.backToLanding")}
        </Link>
      </div>
    </PaymentPageShell>
  );
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const resolvedSearchParams = await searchParams;
  const transactionId = Array.isArray(resolvedSearchParams.transactionId)
    ? resolvedSearchParams.transactionId[0]
    : resolvedSearchParams.transactionId;

  if (!transactionId) {
    return <PaymentNotFoundView />;
  }

  const transaction = await getTransactionById(transactionId);
  if (!transaction) {
    return <PaymentNotFoundView />;
  }

  let currentTransaction = transaction;
  const currentProduct = await getProductById(currentTransaction.productId);
  if (!currentProduct) {
    return <PaymentNotFoundView />;
  }

  let qrRecord: QrRecord | null = null;
  let qrDataUrl: string | null = null;
  let pageErrorMessage: string | null = null;
  let isPending = false;

  if (currentTransaction.qrId) {
    qrRecord = await getQrRecordById(currentTransaction.qrId);
    if (qrRecord) {
      qrDataUrl = await toQrDataUrl(qrRecord.qrUrl);
    }
  }

  if (!qrRecord) {
    if (!currentTransaction.orderId) {
      return (
        <PaymentErrorView
          transaction={currentTransaction}
          errorMessage={t("payment.missingOrderId")}
        />
      );
    }

    try {
      const origin = await getRequestOrigin();
      const result = await finalizePayment({
        transaction: currentTransaction,
        product: currentProduct,
        origin,
      });

      if (result.orderStatus === 0) {
        isPending = true;
      } else if (
        result.orderStatus !== 2 ||
        !result.qrRecord ||
        !result.imageUrl
      ) {
        pageErrorMessage = t("payment.paymentFailedMessage");
      } else {
        currentTransaction = {
          ...currentTransaction,
          paymentStatus: "success",
          qrId: result.qrRecord.id,
        };
        qrRecord = result.qrRecord;
        qrDataUrl = result.imageUrl;
      }
    } catch (error) {
      pageErrorMessage =
        error instanceof Error ? error.message : t("common.unknownError");
    }
  }

  if (pageErrorMessage) {
    return (
      <PaymentErrorView
        transaction={currentTransaction}
        errorMessage={pageErrorMessage}
      />
    );
  }

  if (isPending) {
    return <PaymentPendingView transactionId={transactionId} />;
  }

  if (!qrRecord || !qrDataUrl) {
    return <PaymentNotFoundView />;
  }

  const emailTokenExpiresAt = getEmailTokenExpiresAt(
    currentTransaction.createdAt,
  );
  if (emailTokenExpiresAt === null) {
    return (
      <PaymentErrorView
        transaction={currentTransaction}
        errorMessage={t("common.unknownError")}
      />
    );
  }

  const emailToken = await createEmailAccessToken({
    qrId: qrRecord.id,
    transactionId: currentTransaction.id,
    expiresAt: emailTokenExpiresAt,
  });

  return (
    <PaymentSuccessView
      transaction={currentTransaction}
      qrRecord={qrRecord}
      qrDataUrl={qrDataUrl}
      productName={currentProduct.name}
      emailToken={emailToken}
    />
  );
}
