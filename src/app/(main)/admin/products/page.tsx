import { ProductsAdminPage } from "@/components/products-admin-page";

type ProductsPageSearchParams = {
  updated?: string;
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductsPageSearchParams>;
}) {
  return <ProductsAdminPage searchParams={await searchParams} />;
}
