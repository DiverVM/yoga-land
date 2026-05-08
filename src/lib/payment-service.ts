export type PaymentSimulationMode = "auto" | "success" | "failed";

export type PaymentSimulationResult = {
  status: "success" | "failed";
};

type SimulatePaymentInput = {
  mode?: PaymentSimulationMode;
  delayMs?: number;
};

export async function simulatePayment(
  input: SimulatePaymentInput = {},
): Promise<PaymentSimulationResult> {
  const delayMs = input.delayMs ?? 1100;
  const mode = input.mode ?? "auto";

  await new Promise((resolve) => setTimeout(resolve, delayMs));

  if (mode === "success") {
    return { status: "success" };
  }

  if (mode === "failed") {
    return { status: "failed" };
  }

  return Math.random() > 0.35 ? { status: "success" } : { status: "failed" };
}
