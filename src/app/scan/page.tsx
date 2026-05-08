import Link from "next/link";
import { QrScanner } from "@/components/qr-scanner";

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-amber-50 px-4 py-10">
      <main className="mx-auto w-full max-w-lg space-y-6">
        <header className="space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-stone-900">QR Scanner</h1>
          <p className="text-sm text-stone-600">
            Point the camera at a Yoga Land QR code to accept it automatically,
            or use a photo if Safari blocks live camera access on local HTTP.
          </p>
        </header>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-xl">
          <QrScanner />
        </div>
      </main>
    </div>
  );
}
