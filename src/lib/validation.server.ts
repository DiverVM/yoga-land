import { t } from "@/i18n";
import { getProductById } from "@/lib/repositories";
import { isNonEmptyString } from "@/lib/validation";
import type { Product } from "@/lib/types";

export async function validateProductId(productId: unknown) {
  if (!isNonEmptyString(productId)) {
    return {
      valid: false as const,
      message: t("validation.productIdRequired"),
    };
  }

  const product = await getProductById(productId);
  if (!product) {
    return {
      valid: false as const,
      message: t("validation.unknownProductId", { productId }),
    };
  }

  return {
    valid: true as const,
    product: product as Product,
  };
}
