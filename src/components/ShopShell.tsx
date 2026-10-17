import Header from "./Header";
import Footer from "./Footer";
export default function ShopShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6">
        {children}
      </main>
      <Footer />
    </>
  );
}
