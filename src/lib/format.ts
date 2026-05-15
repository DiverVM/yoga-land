const DISPLAY_CURRENCY_BY_CODE: Record<string, string> = {
  "933": "BYN",
};

export function formatMoney(amount: number, currencyCode: string) {
  const displayCurrency = DISPLAY_CURRENCY_BY_CODE[currencyCode] ?? "BYN";
  return new Intl.NumberFormat("ru-BY", {
    style: "currency",
    currency: displayCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-BY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
