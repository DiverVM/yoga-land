import { t } from "@/i18n";
import type { DecisionStatus, PaymentStatus } from "@/lib/types";

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === "string" &&
    ["pending", "success", "failed"].includes(value)
  );
}

export function isDecisionStatus(value: unknown): value is DecisionStatus {
  return (
    typeof value === "string" &&
    ["pending", "accepted", "declined"].includes(value)
  );
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeOptionalName(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

type ProductCreateInput = {
  id?: string;
  name: string;
  description: string;
  price: number;
  currencyCode: "933";
  isVisible: boolean;
};

type ProductUpdateInput = Partial<ProductCreateInput>;

export function validateProductCreatePayload(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return {
      valid: false as const,
      message: t("common.validationFailed"),
    };
  }

  const body = payload as Record<string, unknown>;
  const idRaw = typeof body.id === "string" ? body.id.trim() : "";
  const nameRaw = typeof body.name === "string" ? body.name.trim() : "";
  const descriptionRaw =
    typeof body.description === "string" ? body.description.trim() : "";
  const priceRaw = body.price;
  const currencyCodeRaw = body.currencyCode;
  const isVisibleRaw = body.isVisible;

  if (!nameRaw) {
    return {
      valid: false as const,
      message: t("validation.productNameRequired"),
    };
  }

  if (!descriptionRaw) {
    return {
      valid: false as const,
      message: t("validation.productDescriptionRequired"),
    };
  }

  if (
    typeof priceRaw !== "number" ||
    !Number.isFinite(priceRaw) ||
    priceRaw <= 0
  ) {
    return {
      valid: false as const,
      message: t("validation.productPriceInvalid"),
    };
  }

  if (currencyCodeRaw !== "933") {
    return {
      valid: false as const,
      message: t("validation.currencyCodeInvalid"),
    };
  }

  if (typeof isVisibleRaw !== "boolean") {
    return {
      valid: false as const,
      message: t("validation.productVisibilityInvalid"),
    };
  }

  return {
    valid: true as const,
    product: {
      id: idRaw || undefined,
      name: nameRaw,
      description: descriptionRaw,
      price: priceRaw,
      currencyCode: currencyCodeRaw,
      isVisible: isVisibleRaw,
    } satisfies ProductCreateInput,
  };
}

export function validateProductUpdatePayload(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return {
      valid: false as const,
      message: t("common.validationFailed"),
    };
  }

  const body = payload as Record<string, unknown>;
  const update: ProductUpdateInput = {};

  if ("id" in body) {
    if (typeof body.id !== "string" || !body.id.trim()) {
      return {
        valid: false as const,
        message: t("validation.productIdRequired"),
      };
    }
    update.id = body.id.trim();
  }

  if ("name" in body) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return {
        valid: false as const,
        message: t("validation.productNameRequired"),
      };
    }
    update.name = body.name.trim();
  }

  if ("description" in body) {
    if (typeof body.description !== "string" || !body.description.trim()) {
      return {
        valid: false as const,
        message: t("validation.productDescriptionRequired"),
      };
    }
    update.description = body.description.trim();
  }

  if ("price" in body) {
    if (
      typeof body.price !== "number" ||
      !Number.isFinite(body.price) ||
      body.price <= 0
    ) {
      return {
        valid: false as const,
        message: t("validation.productPriceInvalid"),
      };
    }
    update.price = body.price;
  }

  if ("currencyCode" in body) {
    if (body.currencyCode !== "933") {
      return {
        valid: false as const,
        message: t("validation.currencyCodeInvalid"),
      };
    }
    update.currencyCode = "933";
  }

  if ("isVisible" in body) {
    if (typeof body.isVisible !== "boolean") {
      return {
        valid: false as const,
        message: t("validation.productVisibilityInvalid"),
      };
    }
    update.isVisible = body.isVisible;
  }

  if (Object.keys(update).length === 0) {
    return {
      valid: false as const,
      message: t("validation.productUpdateEmpty"),
    };
  }

  return {
    valid: true as const,
    product: update,
  };
}

type BulkSendItemInput = {
  email: string;
  productId: string;
  firstName?: string;
  lastName?: string;
};

export function validateBulkSendItems(items: unknown) {
  if (!Array.isArray(items)) {
    return {
      valid: false as const,
      message: t("validation.recipientsListRequired"),
    };
  }

  const normalized = items.filter((value): value is BulkSendItemInput => {
    return (
      typeof value === "object" &&
      value !== null &&
      "email" in value &&
      "productId" in value &&
      typeof value.email === "string" &&
      typeof value.productId === "string"
    );
  });

  if (normalized.length < 1) {
    return {
      valid: false as const,
      message: t("validation.minOneEmail"),
    };
  }

  if (normalized.length > 10) {
    return {
      valid: false as const,
      message: t("validation.maxTenRecipients"),
    };
  }

  const prepared = normalized.map((item) => ({
    email: normalizeEmail(item.email),
    productId: item.productId.trim(),
    firstName: normalizeOptionalName(item.firstName),
    lastName: normalizeOptionalName(item.lastName),
  }));

  for (const item of prepared) {
    if (!item.productId) {
      return {
        valid: false as const,
        message: t("validation.productRequiredForEachEmail"),
      };
    }

    if (!item.email) {
      return {
        valid: false as const,
        message: t("validation.emailRequired"),
      };
    }

    if (!isEmail(item.email)) {
      return {
        valid: false as const,
        message: t("validation.invalidEmail", { email: item.email }),
      };
    }
  }

  const duplicates = prepared.filter(
    (item, index) =>
      prepared.findIndex(
        (other) =>
          other.email === item.email && other.productId === item.productId,
      ) !== index,
  );

  if (duplicates.length > 0) {
    return {
      valid: false as const,
      message: t("validation.duplicateEmailProduct", {
        email: duplicates[0].email,
      }),
    };
  }

  return {
    valid: true as const,
    items: prepared,
  };
}

export function validateEmailList(emails: unknown) {
  if (!Array.isArray(emails)) {
    return {
      valid: false as const,
      message: t("validation.emailListRequired"),
    };
  }

  const normalized = emails
    .filter((value): value is string => typeof value === "string")
    .map(normalizeEmail)
    .filter(Boolean);

  if (normalized.length < 1) {
    return {
      valid: false as const,
      message: t("validation.minOneEmail"),
    };
  }

  if (normalized.length > 10) {
    return {
      valid: false as const,
      message: t("validation.maxTenEmails"),
    };
  }

  for (const email of normalized) {
    if (!isEmail(email)) {
      return {
        valid: false as const,
        message: t("validation.invalidEmail", { email }),
      };
    }
  }

  const duplicates = normalized.filter(
    (email, index) => normalized.indexOf(email) !== index,
  );

  if (duplicates.length > 0) {
    return {
      valid: false as const,
      message: t("validation.duplicateEmail", { email: duplicates[0] }),
    };
  }

  return {
    valid: true as const,
    emails: normalized,
  };
}
