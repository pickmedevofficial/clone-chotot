import Image from "next/image";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";

export default function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0];
  return (
    <Link
      href={`/san-pham/${encodeURIComponent(product.id)}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full bg-background">
        {cover ? (
          <Image
            src={cover}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 220px, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">Chưa có ảnh</div>
        )}
        {product.images.length > 1 && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
            {product.images.length} ảnh
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <h3 className="line-clamp-2 text-sm leading-snug group-hover:underline">{product.title}</h3>
        <p className="font-semibold text-price">{formatPrice(product.price)}</p>
        <p className="mt-auto truncate text-xs text-muted">
          {product.location} · {formatDate(product.createdAt)}
        </p>
      </div>
    </Link>
  );
}
