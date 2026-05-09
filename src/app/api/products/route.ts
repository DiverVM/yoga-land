import { ok } from "@/lib/api";
import { listProducts } from "@/lib/repositories";

export async function GET() {
  const products = await listProducts();
  return ok({ products });
}
