import { revalidateTag } from "next/cache";
import { t } from "@/i18n";
import { fail, ok, parseJsonBody } from "@/lib/api";
import {
  getProductById,
  softDeleteProduct,
  updateProduct,
} from "@/lib/repositories";
import { validateProductUpdatePayload } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await getProductById(id);

  if (!product) {
    return fail(t("validation.unknownProductId", { productId: id }), 404);
  }

  return ok({ product: toAdminProduct(product) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await parseJsonBody<unknown>(request);

  if (!body) {
    return fail(t("common.invalidJsonBody"), 400);
  }

  const validation = validateProductUpdatePayload(body);
  if (!validation.valid) {
    return fail(t("common.validationFailed"), 400, validation.message);
  }

  const updated = await updateProduct(id, {
    name: validation.product.name,
    description: validation.product.description,
    price: validation.product.price,
    currencyCode: validation.product.currencyCode,
    active: validation.product.isVisible,
  });

  if (!updated) {
    return fail(t("validation.unknownProductId", { productId: id }), 404);
  }

  revalidateTag("products", "max");

  return ok({ product: toAdminProduct(updated) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const product = await softDeleteProduct(id);

  if (!product) {
    return fail(t("validation.unknownProductId", { productId: id }), 404);
  }

  revalidateTag("products", "max");

  return ok({ product: toAdminProduct(product) });
}
