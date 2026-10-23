import { Suspense } from "react";
import AdminProductDetail from "@/components/AdminProductDetail";

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function AdminProductContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminProductDetail id={safeDecode(id)} />;
}

export default function AdminProductPage({
  params,
}: PageProps<"/admin/san-pham/[id]">) {
  return (
    <Suspense
      fallback={<p className="py-16 text-center text-muted">Đang tải...</p>}
    >
      <AdminProductContent params={params} />
    </Suspense>
  );
}
