import { t } from "@/i18n";
import { ALFA_REQUEST_LANGUAGE } from "@/lib/payment-constants";

export type RegisterOrderResponse = {
  orderId: string;
  formUrl: string;
};

export type OrderStatusResponse = {
  // 0 = registered/not paid, 1 = pre-auth hold (two-stage), 2 = authorized+completed,
  // 3 = cancelled, 4 = refunded, 5 = 3DS initiated, 6 = declined
  orderStatus: number;
  actionCode?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function buildFormData(
  params: Record<string, string | number | undefined>,
): URLSearchParams {
  const data = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      data.append(key, String(value));
    }
  });
  return data;
}

export async function registerOrder(input: {
  amountRubles: number;
  currencyCode: string;
  orderNumber: string;
  returnUrl: string;
  failUrl: string;
  description?: string;
}): Promise<RegisterOrderResponse> {
  const baseUrl = getRequiredEnv("ALFA_API_BASE_URL");
  const username = getRequiredEnv("ALFA_USERNAME");
  const password = getRequiredEnv("ALFA_PASSWORD");
  const amountInKopeks = Math.round(input.amountRubles * 100);

  const params = buildFormData({
    amount: amountInKopeks,
    currency: input.currencyCode,
    returnUrl: input.returnUrl,
    failUrl: input.failUrl,
    description: input.description,
    language: ALFA_REQUEST_LANGUAGE,
    userName: username,
    password: password,
    orderNumber: input.orderNumber,
  });

  try {
    const response = await fetch(`${baseUrl}/register.do`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = (await response.json()) as Record<string, unknown>;
    console.log("registerOrder response:", data);

    if (
      !response.ok ||
      (data.errorCode !== undefined && String(data.errorCode) !== "0")
    ) {
      throw new Error(
        data.errorMessage
          ? String(data.errorMessage)
          : t("paymentGateway.registerFailed"),
      );
    }

    const orderId = data.orderId;
    const formUrl = data.formUrl;

    if (!orderId || !formUrl) {
      throw new Error(t("paymentGateway.invalidRegisterResponse"));
    }

    return {
      orderId: String(orderId),
      formUrl: String(formUrl),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(t("paymentGateway.requestFailed"));
  }
}

export async function getOrderStatus(
  orderId: string,
): Promise<OrderStatusResponse> {
  const baseUrl = getRequiredEnv("ALFA_API_BASE_URL");
  const username = getRequiredEnv("ALFA_USERNAME");
  const password = getRequiredEnv("ALFA_PASSWORD");

  const params = buildFormData({
    orderId,
    language: ALFA_REQUEST_LANGUAGE,
    userName: username,
    password: password,
  });

  try {
    const response = await fetch(`${baseUrl}/getOrderStatusExtended.do`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = (await response.json()) as Record<string, unknown>;
    console.log("getOrderStatus response:", data);

    if (
      !response.ok ||
      (data.errorCode !== undefined && String(data.errorCode) !== "0")
    ) {
      throw new Error(
        data.errorMessage
          ? String(data.errorMessage)
          : t("paymentGateway.getStatusFailed"),
      );
    }

    const orderStatus = data.orderStatus;
    if (typeof orderStatus !== "number") {
      throw new Error(t("paymentGateway.invalidStatusResponse"));
    }

    return {
      orderStatus,
      actionCode: data.actionCode ? String(data.actionCode) : undefined,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(t("paymentGateway.requestFailed"));
  }
}
