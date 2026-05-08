import Link from "next/link";
import { CheckoutPanel } from "@/components/checkout-panel";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#ffedd5_35%,_#fed7aa_70%,_#fdba74_100%)] px-4 py-12 text-stone-900">
      <div className="pointer-events-none absolute -left-20 top-12 h-60 w-60 rounded-full bg-orange-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-8 h-72 w-72 rounded-full bg-amber-400/35 blur-3xl" />

      <main className="relative grid w-full max-w-6xl gap-8 rounded-3xl border border-stone-800/10 bg-white/80 p-6 shadow-2xl shadow-orange-950/20 backdrop-blur md:grid-cols-2 md:p-10">
        <section className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <p className="inline-block rounded-full border border-stone-900/20 bg-white px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase">
              Yoga Land v1 Mock
            </p>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Payments to QR in one flow.
            </h1>
            <p className="max-w-md text-base leading-7 text-stone-700">
              Choose a product, run a mocked payment, and generate a scannable
              QR code that opens transaction details on any mobile device.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/admin"
              className="rounded-full border border-stone-900 px-4 py-2 font-medium transition hover:bg-stone-900 hover:text-white"
            >
              Open Admin Debug
            </Link>
            <Link
              href="/scan"
              className="rounded-full border border-amber-600 px-4 py-2 font-medium text-amber-700 transition hover:bg-amber-600 hover:text-white"
            >
              Scan QR Code
            </Link>
            <span className="rounded-full border border-stone-900/20 bg-stone-100 px-4 py-2 font-medium text-stone-700">
              Mock DB: JSON File
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-900/10 bg-white p-5 shadow-lg shadow-stone-900/5 md:p-6">
          <CheckoutPanel />
        </section>
      </main>
    </div>
  );
}
