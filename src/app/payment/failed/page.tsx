import Link from "next/link";

type Props = {
  searchParams: Promise<{ transactionId?: string }>;
};

export default async function FailedPage({ searchParams }: Props) {
  const { transactionId } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-200 px-4 py-24">
      <main className="w-full max-w-xl space-y-5 rounded-3xl bg-white p-8 shadow-xl">
        <p className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold tracking-wide text-red-700 uppercase">
          Payment failed
        </p>
        <h1 className="text-3xl font-bold text-stone-900">
          Transaction was not completed
        </h1>
        <p className="text-sm text-stone-600">
          {transactionId
            ? `Transaction ID: ${transactionId}`
            : "No transaction ID was provided."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Try again
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            Open admin debug
          </Link>
        </div>
      </main>
    </div>
  );
}
