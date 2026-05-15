import { revalidatePath, updateTag } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";
import { t } from "@/i18n";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getAllProducts, updateProduct } from "@/lib/repositories";
import { validateProductUpdatePayload } from "@/lib/validation";

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
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    currencyCode: product.currencyCode,
    isVisible: product.active,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

async function revalidateProductsCache() {
  "use server";
  updateTag("products");
  revalidatePath("/");
  revalidatePath("/admin/products");
}

async function updateProductAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = Number(formData.get("price"));
  const isVisible = formData.get("isVisible") === "on";

  if (!id) return;

  const validation = validateProductUpdatePayload({
    name,
    description,
    price: priceRaw,
    currencyCode: "933",
    isVisible,
  });

  if (!validation.valid) return;

  await updateProduct(id, {
    name: validation.product.name,
    description: validation.product.description,
    price: validation.product.price,
    currencyCode: validation.product.currencyCode,
    active: validation.product.isVisible,
  });

  await revalidateProductsCache();
  redirect("/admin/products?updated=1");
}

type ProductsAdminPageProps = {
  searchParams?: {
    updated?: string;
  };
};

export async function ProductsAdminPage({
  searchParams,
}: ProductsAdminPageProps) {
  const products = (await getAllProducts())
    .map(toAdminProduct)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const isUpdated = searchParams?.updated === "1";

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#fff7ed_0%,#ffedd5_35%,#fed7aa_70%,#fdba74_100%)] px-4 py-24 text-stone-900">
      <div className="pointer-events-none absolute -left-20 top-12 h-60 w-60 rounded-full bg-orange-300/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-8 h-72 w-72 rounded-full bg-amber-400/35 blur-3xl" />

      <main className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-3xl border border-stone-800/10 bg-white/80 p-6 shadow-2xl shadow-orange-950/20 backdrop-blur md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-stone-900">
                {t("admin.productsTitle")}
              </h1>
              <p className="mt-2 text-sm text-stone-600">
                {t("admin.productsSubtitle")}
              </p>
            </div>

            <Link
              href="/admin/dashboard"
              className="btn-secondary px-4 py-2 text-sm"
            >
              {t("admin.backToDashboard")}
            </Link>
          </div>
        </header>

        <section className="rounded-3xl border border-stone-800/10 bg-white/85 p-5 shadow-lg shadow-stone-900/5 md:p-6">
          {isUpdated ? (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {t("admin.productUpdated")}
            </div>
          ) : null}

          {products.length === 0 ? (
            <p className="text-sm text-stone-500">{t("admin.noProducts")}</p>
          ) : (
            <ul className="space-y-4">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  <form action={updateProductAction} className="space-y-3">
                    <input type="hidden" name="id" value={product.id} />
                    <div className="text-xs text-stone-500">{product.id}</div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1 text-sm">
                        <span className="text-stone-700">
                          {t("admin.productName")}
                        </span>
                        <input
                          name="name"
                          type="text"
                          defaultValue={product.name}
                          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring"
                          required
                        />
                      </label>
                      <label className="space-y-1 text-sm">
                        <span className="text-stone-700">
                          {t("admin.productPrice")}
                        </span>
                        <input
                          name="price"
                          type="number"
                          min={0.01}
                          step="0.01"
                          defaultValue={product.price}
                          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring"
                          required
                        />
                      </label>
                    </div>

                    <label className="space-y-1 text-sm">
                      <span className="text-stone-700">
                        {t("admin.productDescription")}
                      </span>
                      <input
                        name="description"
                        type="text"
                        defaultValue={product.description}
                        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none ring-orange-500 focus:ring"
                        required
                      />
                    </label>

                    <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                      <input
                        name="isVisible"
                        type="checkbox"
                        defaultChecked={product.isVisible}
                      />
                      {t("admin.productVisibility")}
                    </label>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                      <span>
                        {formatMoney(product.price, product.currencyCode)}
                      </span>
                      <span>•</span>
                      <span>{formatDateTime(product.updatedAt)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="btn-secondary px-3 py-1.5 text-sm"
                      >
                        {t("admin.updateProduct")}
                      </button>
                    </div>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
