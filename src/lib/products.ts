import type { Product } from "@/lib/types";

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "starter-pass",
    name: "Starter Yoga Pass",
    price: 19,
    currency: "USD",
  },
  {
    id: "full-retreat",
    name: "Weekend Retreat",
    price: 79,
    currency: "USD",
  },
  {
    id: "premium-plan",
    name: "Premium Monthly Plan",
    price: 129,
    currency: "USD",
  },
];

export function getProductById(productId: string): Product | undefined {
  return MOCK_PRODUCTS.find((product) => product.id === productId);
}
