import { revalidateTag } from "next/cache";
import { t } from "@/i18n";
import { fail, ok, parseJsonBody } from "@/lib/api";
import { createProduct, getAllProducts } from "@/lib/repositories";
import { validateProductCreatePayload } from "@/lib/validation";

export const runtime = "nodejs";

type AdminProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  currencyCode: "933";
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

function toAdminProduct(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  currencyCode: "933";
  active: boolean;
  createdAt: string;
  updatedAt: string;
}): AdminProduct {
  const { active, ...rest } = product;
  return {
    ...rest,
    isVisible: active,
  };
}

export async function GET() {
  const products = await getAllProducts();
  return ok({ products: products.map(toAdminProduct) });
}

export async function POST(request: Request) {
  const body = await parseJsonBody<unknown>(request);
  if (!body) {
    return fail(t("common.invalidJsonBody"), 400);
  }

  const validation = validateProductCreatePayload(body);
  if (!validation.valid) {
    return fail(t("common.validationFailed"), 400, validation.message);
  }

  try {
    const created = await createProduct({
      id: validation.product.id,
      name: validation.product.name,
      description: validation.product.description,
      price: validation.product.price,
      currencyCode: validation.product.currencyCode,
      active: validation.product.isVisible,
    });

    revalidateTag("products", "max");

    return ok({ product: toAdminProduct(created) }, 201);
  } catch (error) {
    const details =
      error instanceof Error ? error.message : t("common.unknownError");
    return fail(t("common.unknownError"), 500, details);
  }
}
