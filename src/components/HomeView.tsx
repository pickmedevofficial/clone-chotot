"use client";

import { useState } from "react";
import AboutSection from "@/components/AboutSection";
import CategoryGrid from "@/components/CategoryGrid";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductFeed from "@/components/ProductFeed";
import { useProducts } from "@/lib/product-store";

interface HomeViewProps {
  initialQuery?: string;
  initialLocation?: string | null;
}

export default function HomeView({ initialQuery = "", initialLocation = null }: HomeViewProps) {
  const products = useProducts();
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState<string | null>(initialLocation);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  function selectCategory(id: string | null) {
    setCategoryId(id);
    if (id) document.getElementById("tin-dang")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <Header query={query} onQueryChange={setQuery} location={location} onLocationChange={setLocation} hero />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 pb-4">
        <CategoryGrid selectedId={categoryId} onSelect={selectCategory} />
        <ProductFeed
          products={products}
          query={query}
          categoryId={categoryId}
          location={location}
          onClearFilters={() => {
            setQuery("");
            setCategoryId(null);
            setLocation(null);
          }}
        />
        <AboutSection />
      </main>
      <Footer />
    </>
  );
}
