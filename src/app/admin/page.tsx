import { Suspense } from "react";
import AdminView from "@/components/AdminView";
import { isAdminTab } from "@/lib/admin-tabs";

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense
      fallback={<p className="py-16 text-center text-muted">Đang tải...</p>}
    >
      {searchParams.then(({ tab }) => (
        <AdminView initialTab={isAdminTab(tab) ? tab : "overview"} />
      ))}
    </Suspense>
  );
}
