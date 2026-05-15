"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { QrActions } from "@/components/qr-actions";
import { t } from "@/i18n";
import { formatMoney } from "@/lib/format";
import type { QrRecord, Transaction } from "@/lib/types";

type PageState = "loading" | "verifying" | "success" | "error" | "not-found";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transactionId");

  const [state, setState] = useState<PageState>("loading");
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [qrRecord, setQrRecord] = useState<QrRecord | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("not-found");
      return;
    }

    const loadPaymentStatus = async () => {
      try {
        // Fetch transaction
        const txResponse = await fetch(`/api/transactions/${transactionId}`);
        if (!txResponse.ok) {
          setState("not-found");
          return;
        }

        const txData = (await txResponse.json()) as {
          transaction: Transaction;
        };
        const tx = txData.transaction;
        setTransaction(tx);

        // If QR already created, we're done
        if (tx.qrId) {
          const qrResponse = await fetch(`/api/qr-records/${tx.qrId}`);
          if (qrResponse.ok) {
            const qrData = (await qrResponse.json()) as { qrRecord: QrRecord };
            const qr = qrData.qrRecord;
            setQrRecord(qr);
            const imageResponse = await fetch(
              `/api/qr-records/${tx.qrId}/image`,
            );
            if (imageResponse.ok) {
              const imageData = (await imageResponse.json()) as {
                imageUrl: string;
              };
              setQrDataUrl(imageData.imageUrl);
            }
            setState("success");
            return;
          }
        }

        // QR not yet created; poll for payment status
        if (!tx.orderId) {
          setErrorMessage("Ошибка: отсутствует номер заказа");
          setState("error");
          return;
        }

        setState("verifying");

        // Poll getOrderStatus every 2 seconds for up to 30 seconds
        let attempts = 0;
        const maxAttempts = 15;

        while (attempts < maxAttempts) {
          const statusResponse = await fetch("/api/payment/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: tx.orderId, transactionId }),
          });

          if (statusResponse.ok) {
            const statusData = (await statusResponse.json()) as {
              orderStatus: number;
              qrRecord?: QrRecord;
              imageUrl?: string;
            };

            // orderStatus: 0 = pending, 2 = success, other = failed
            if (statusData.orderStatus === 2) {
              // Success!
              setTransaction({ ...tx, qrId: statusData.qrRecord?.id ?? null });
              setQrRecord(statusData.qrRecord ?? null);
              setQrDataUrl(statusData.imageUrl ?? null);
              setState("success");
              return;
            } else if (statusData.orderStatus !== 0) {
              // Failed
              setErrorMessage("Платеж не прошел. Попробуйте еще раз.");
              setState("error");
              return;
            }
          }

          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        // Timeout
        setErrorMessage(
          "Время ожидания истекло. Платеж все еще обрабатывается. Попробуйте перезагрузить страницу.",
        );
        setState("error");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Неизвестная ошибка",
        );
        setState("error");
      }
    };

    void loadPaymentStatus();
  }, [transactionId]);

  if (state === "not-found") {
    return (
      <div className="min-h-screen bg-stone-100 px-4 py-24">
        <main className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-red-600">
            {t("common.notFound")}
          </h1>
          <Link href="/" className="btn-secondary px-4 py-2 text-sm">
            {t("common.backToLanding")}
          </Link>
        </main>
      </div>
    );
  }

  if (state === "loading" || state === "verifying") {
    return (
      <div className="min-h-screen bg-stone-100 px-4 py-24">
        <main className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl bg-white p-6 shadow-xl">
          <div className="space-y-4">
            <p className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase">
              {state === "loading" ? "Загрузка" : "Проверка статуса"}
            </p>
            <h1 className="text-2xl font-bold text-stone-900">
              {state === "loading"
                ? "Загрузка информации о платеже..."
                : "Проверяем статус платежа..."}
            </h1>
            <p className="text-sm text-stone-600">
              {state === "verifying"
                ? "Это может занять несколько секунд. Не закрывайте эту страницу."
                : ""}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen bg-stone-100 px-4 py-24">
        <main className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl bg-white p-6 shadow-xl">
          <div className="space-y-4">
            <p className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold tracking-wide text-red-700 uppercase">
              Ошибка
            </p>
            <h1 className="text-2xl font-bold text-red-600">
              {t("payment.failedTitle")}
            </h1>
            {errorMessage && (
              <p className="text-sm text-red-700">{errorMessage}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/")}
              className="btn-secondary px-4 py-2 text-sm"
            >
              {t("common.backToLanding")}
            </button>
            {transaction && (
              <Link
                href={`/?transactionId=${transaction.id}`}
                className="btn-primary px-4 py-2 text-sm"
              >
                Повторить попытку
              </Link>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Success state
  if (!transaction || !qrRecord || !qrDataUrl) {
    return (
      <div className="min-h-screen bg-stone-100 px-4 py-24">
        <main className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-red-600">
            {t("common.notFound")}
          </h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-24">
      <main className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl bg-white p-6 shadow-xl">
        <header className="space-y-2">
          <p className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold tracking-wide text-green-700 uppercase">
            {t("payment.successBadge")}
          </p>
          <h1 className="text-3xl font-bold text-stone-900">
            {t("payment.successTitle")}
          </h1>
          <p className="text-sm text-stone-600">
            {t("payment.transactionFor", {
              id: transaction.id,
              amount: formatMoney(transaction.amount, transaction.currencyCode),
            })}
          </p>
          <p className="text-sm text-stone-700">
            {t("payment.successSubtitle")}
          </p>
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
            <QrActions qrId={qrRecord.id} qrUrl={qrRecord.qrUrl} />
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link href="/" className="btn-secondary px-4 py-2 text-sm">
            {t("common.backToLanding")}
          </Link>
        </div>
      </main>
    </div>
  );
}
