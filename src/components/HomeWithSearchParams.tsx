"use client";

import { useSearchParams } from "next/navigation";
import HomeView from "@/components/HomeView";

/** Đọc `?q=` (khi tìm kiếm từ trang khác) làm từ khóa ban đầu. */
export default function HomeWithSearchParams() {
  const q = useSearchParams().get("q") ?? "";
  return <HomeView key={q} initialQuery={q} />;
}
