import { Suspense } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductDetail from "@/components/ProductDetail";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function ProductPage({ params }: PageProps<"/san-pham/[id]">) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <Suspense
          fallback={<p className="py-16 text-center text-muted">Đang tải...</p>}
        >
          {params.then(({ id }) => (
            <ProductDetail id={safeDecode(id)} />
          ))}
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
