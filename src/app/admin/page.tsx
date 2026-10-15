import type { Metadata } from "next";
import AdminView from "@/components/AdminView";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Đăng tin",
};

export default function AdminPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4">
        <AdminView />
      </main>
      <Footer />
    </>
  );
}
