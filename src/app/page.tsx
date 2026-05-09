import Link from "next/link";
import { cookies } from "next/headers";
import { CheckoutPanel } from "@/components/checkout-panel";
import { listProducts } from "@/lib/repositories";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export default async function Home() {
  const [products, cookieStore] = await Promise.all([
    listProducts(),
    cookies(),
  ]);
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAdmin = session?.role === "admin";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#ffedd5_35%,_#fed7aa_70%,_#fdba74_100%)] px-4 py-12 text-stone-900">
      <div className="pointer-events-none absolute -left-20 top-12 h-60 w-60 rounded-full bg-orange-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-8 h-72 w-72 rounded-full bg-amber-400/35 blur-3xl" />

      <main className="relative grid w-full max-w-6xl gap-8 rounded-3xl border border-stone-800/10 bg-white/80 p-6 shadow-2xl shadow-orange-950/20 backdrop-blur md:grid-cols-2 md:p-10">
        <section className="flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Yoga classes, booked in seconds.
            </h1>
            <p className="max-w-md text-base leading-7 text-stone-700">
              Choose a course, complete your purchase, and receive a scannable
              QR code that confirms your booking at the door.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-900/10 bg-white p-5 shadow-lg shadow-stone-900/5 md:p-6">
          <CheckoutPanel products={products} />
        </section>
      </main>
    </div>
  );
}
