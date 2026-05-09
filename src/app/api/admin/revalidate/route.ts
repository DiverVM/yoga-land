import { revalidateTag } from "next/cache";
import { ok } from "@/lib/api";

export const runtime = "nodejs";

export async function POST() {
  revalidateTag("products", "max");
  return ok({ revalidated: true, tag: "products" });
}
