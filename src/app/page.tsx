import { Suspense } from "react";
import HomeView from "@/components/HomeView";
import HomeWithSearchParams from "@/components/HomeWithSearchParams";

export default function HomePage() {
  return (
    <Suspense fallback={<HomeView />}>
      <HomeWithSearchParams />
    </Suspense>
  );
}
