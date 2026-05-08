import { ok } from "@/lib/api";
import { MOCK_PRODUCTS } from "@/lib/products";

export async function GET() {
  return ok({ products: MOCK_PRODUCTS });
}
