"use client";

import { useSearchParams } from "next/navigation";
import HomeView from "@/components/HomeView";
import { LOCATIONS } from "@/data/categories";

/** Đọc `?q=` và `?kv=` (khi tìm kiếm từ trang khác) làm từ khóa và khu vực ban đầu. */
export default function HomeWithSearchParams() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const kv = params.get("kv");
  const location = kv && LOCATIONS.includes(kv) ? kv : null;
  return <HomeView key={`${q}|${location}`} initialQuery={q} initialLocation={location} />;
}
