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

type BulkSendItemInput = {
  email: string;
  productId: string;
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
