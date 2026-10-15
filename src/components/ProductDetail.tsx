"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { getCategoryName } from "@/data/categories";
import { getSeller, maskPhone } from "@/data/sellers";
import { formatDate, formatPrice, formatRelativeTime, parsePrice } from "@/lib/format";
import { findProduct, useIsClient, useProducts } from "@/lib/product-store";
import { toggleSaved, useSavedIds } from "@/lib/saved";
import type { Product } from "@/types/product";

const CONDITION_LABEL: Record<Product["condition"], string> = {
  moi: "Mới",
  "da-su-dung": "Đã sử dụng",
};

function Icon({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

const HEART = (
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
);

async function shareProduct(title: string): Promise<string> {
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return "";
    }
    await navigator.clipboard.writeText(url);
    return "Đã sao chép liên kết";
  } catch (err) {
    // Người dùng tự đóng hộp chia sẻ thì không coi là lỗi.
    if (err instanceof DOMException && err.name === "AbortError") return "";
    return "Không thể chia sẻ, hãy sao chép địa chỉ trên trình duyệt";
  }
}

function Gallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const [shareNotice, setShareNotice] = useState("");
  const images = product.images;
  const count = images.length;
  const current = images[Math.min(index, count - 1)];
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  if (!current)
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-background text-muted">
        Chưa có ảnh
      </div>
    );

  const overlayButton =
    "flex h-9 w-9 items-center justify-center rounded-full bg-white text-foreground shadow transition hover:bg-white/85";

  return (
    <div className="min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#1f1f1f]">
        <Image
          src={current}
          alt={`${product.title} — ảnh ${index + 1}/${count}`}
          fill
          sizes="(min-width: 768px) 440px, 100vw"
          className="object-contain"
          priority
        />
        <button
          type="button"
          onClick={async () => setShareNotice(await shareProduct(product.title))}
          className={`${overlayButton} absolute right-3 top-3`}
          aria-label="Chia sẻ tin"
        >
          <Icon className="h-4 w-4">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="m16 6-4-4-4 4" />
            <path d="M12 2v13" />
          </Icon>
        </button>
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-0 top-1/2 flex h-16 w-10 -translate-y-1/2 items-center justify-center text-white hover:bg-black/20"
              aria-label="Ảnh trước"
            >
              <Icon className="h-6 w-6">
                <path d="m15 18-6-6 6-6" />
              </Icon>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-0 top-1/2 flex h-16 w-10 -translate-y-1/2 items-center justify-center text-white hover:bg-black/20"
              aria-label="Ảnh sau"
            >
              <Icon className="h-6 w-6">
                <path d="m9 18 6-6-6-6" />
              </Icon>
            </button>
          </>
        )}
        <span className="absolute bottom-3 right-3 rounded bg-black/50 px-2 py-0.5 text-sm font-medium text-white">
          {index + 1}/{count}
        </span>
      </div>
      <p role="status" className="mt-1 min-h-5 text-xs text-muted">
        {shareNotice}
      </p>
      {count > 1 && (
        <ul className="flex gap-2 overflow-x-auto p-1" aria-label="Ảnh sản phẩm">
          {images.map((src, i) => (
            <li key={`${i}-${src.slice(0, 40)}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={i === index}
                className={`relative block h-[72px] w-[72px] overflow-hidden rounded-lg ring-2 ring-offset-2 ${
                  i === index ? "ring-foreground" : "ring-transparent"
                }`}
              >
                <Image src={src} alt="" fill sizes="72px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SaveButton({ productId }: { productId: string }) {
  const saved = useSavedIds().includes(productId);
  const [error, setError] = useState("");
  return (
    <div className="flex shrink-0 flex-col items-end">
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => setError(toggleSaved(productId) ? "" : "Trình duyệt không cho phép lưu")}
        className={`flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition ${
          saved ? "border-price bg-price/5 text-price" : "border-line hover:bg-background"
        }`}
      >
        <svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          {HEART}
        </svg>
        {saved ? "Đã lưu" : "Lưu"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-price">
          {error}
        </p>
      )}
    </div>
  );
}

function ContactPanel({ product }: { product: Product }) {
  const seller = getSeller(product);
  const [showPhone, setShowPhone] = useState(false);
  const [message, setMessage] = useState("");
  const [chatNotice, setChatNotice] = useState("");
  const [offer, setOffer] = useState("");
  const [offerResult, setOfferResult] = useState<{ ok: boolean; text: string } | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!message.trim()) return;
    setChatNotice("Bản demo: tin nhắn chưa được gửi tới người bán.");
    setMessage("");
  }

  function sendOffer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = parsePrice(offer);
    if (value === null || value <= 0) {
      setOfferResult({ ok: false, text: "Giá không hợp lệ, ví dụ: 2.300.000" });
      return;
    }
    setOfferResult({ ok: true, text: `Bản demo: đề nghị ${formatPrice(value)} chưa được gửi tới người bán.` });
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {showPhone ? (
          <a
            href={`tel:${seller.phone}`}
            className="flex h-11 items-center justify-center rounded-full bg-background text-sm font-semibold hover:bg-line sm:text-base"
          >
            Gọi {seller.phone}
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setShowPhone(true)}
            className="h-11 rounded-full bg-background text-sm font-semibold hover:bg-line sm:text-base"
          >
            Hiện số {maskPhone(seller.phone)}
          </button>
        )}
        <button
          type="button"
          onClick={() => messageRef.current?.focus()}
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold hover:brightness-95 sm:text-base"
        >
          <Icon>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </Icon>
          Chat
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-semibold uppercase">
          {seller.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{seller.name}</p>
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-600" aria-hidden="true" />
              Đang hoạt động
            </span>
            <span>Phản hồi: {seller.responseRate}%</span>
          </p>
        </div>
        <div className="hidden text-center sm:block">
          <p className="text-lg font-semibold">{seller.soldCount}</p>
          <p className="text-xs text-muted">Đã bán</p>
        </div>
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex items-end gap-3 rounded-xl bg-background p-3">
        <label htmlFor="chat-message" className="sr-only">
          Tin nhắn cho người bán
        </label>
        <textarea
          id="chat-message"
          ref={messageRef}
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="💬 Hỏi người bán: Sản phẩm này còn không ạ?"
          className="min-w-0 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className="h-10 shrink-0 rounded-full bg-brand px-5 text-sm font-semibold transition hover:brightness-95 disabled:opacity-50"
        >
          Gửi
        </button>
      </form>
      {chatNotice && (
        <p role="status" className="mt-1 text-xs text-muted">
          {chatNotice}
        </p>
      )}

      <form onSubmit={sendOffer} className="mt-5 border-t border-line pt-4" noValidate>
        <label htmlFor="offer-price" className="text-sm font-semibold">
          Deal giá
        </label>
        <div className="mt-2 flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <input
              id="offer-price"
              inputMode="numeric"
              value={offer}
              onChange={(e) => {
                setOffer(e.target.value);
                setOfferResult(null);
              }}
              placeholder="Nhập giá bạn mong muốn"
              aria-invalid={offerResult?.ok === false}
              aria-describedby="offer-hint"
              className="h-11 w-full rounded-lg border border-line pl-3 pr-8 text-sm outline-none ring-brand-strong focus:ring-2"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">đ</span>
          </div>
          <button type="submit" className="h-10 shrink-0 rounded-full bg-background px-4 text-sm font-semibold hover:bg-line">
            Trả giá
          </button>
        </div>
        <p
          id="offer-hint"
          role={offerResult ? "status" : undefined}
          className={`mt-1 text-xs ${offerResult?.ok === false ? "text-price" : "text-muted"}`}
        >
          {offerResult?.text ?? `Giá gốc: ${formatPrice(product.price)}`}
        </p>
      </form>
    </>
  );
}

export default function ProductDetail({ id }: { id: string }) {
  const products = useProducts();
  const isClient = useIsClient();
  const product = findProduct(products, id);

  if (!product) {
    // Trước khi hydrate chỉ có mock data; tin của người dùng chưa đọc được từ localStorage.
    if (!isClient) return <p className="py-16 text-center text-muted">Đang tải...</p>;
    return (
      <div className="rounded-lg bg-surface px-4 py-16 text-center">
        <h1 className="mb-3 text-xl font-semibold">Không tìm thấy tin đăng</h1>
        <p className="mb-6 text-muted">Tin có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        <Link href="/" className="rounded-md bg-brand px-5 py-2.5 font-semibold hover:brightness-95">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const category = getCategoryName(product.categoryId);

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb" className="truncate text-xs text-muted">
        <Link href="/" className="hover:underline">ChợMới</Link>
        {" / "}
        <Link href={`/?q=${encodeURIComponent(category)}`} className="hover:underline">{category}</Link>
        {" / "}
        <Link
          href={`/?q=${encodeURIComponent(category)}&kv=${encodeURIComponent(product.location)}`}
          className="hover:underline"
        >
          {category} {product.location}
        </Link>
        {" / "}
        <span className="font-semibold text-foreground">{product.title}</span>
      </nav>

      <article className="grid gap-6 rounded-xl bg-surface p-4 md:grid-cols-[5fr_7fr] md:p-5">
        <Gallery key={product.id} product={product} />
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <h1 className="min-w-0 flex-1 break-words text-xl font-bold leading-snug sm:text-2xl">{product.title}</h1>
            <SaveButton productId={product.id} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {category} · {CONDITION_LABEL[product.condition]}
          </p>
          <p className="mt-2 text-2xl font-bold text-price">{formatPrice(product.price)}</p>

          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li className="flex items-center gap-2">
              <Icon className="h-5 w-5 shrink-0">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </Icon>
              {product.location}
            </li>
            <li className="flex items-center gap-2">
              <Icon className="h-5 w-5 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </Icon>
              {/* Thời gian tương đối phụ thuộc giờ hiện tại → chỉ tính sau khi hydrate. */}
              Đăng {isClient ? formatRelativeTime(product.createdAt) : formatDate(product.createdAt)}
            </li>
          </ul>

          <ContactPanel key={product.id} product={product} />
        </div>
      </article>

      <section aria-labelledby="mo-ta" className="rounded-xl bg-surface p-4 md:p-5">
        <h2 id="mo-ta" className="mb-2 text-lg font-semibold">Mô tả chi tiết</h2>
        <p className="whitespace-pre-line break-words text-sm leading-relaxed">
          {product.description || "Người bán chưa thêm mô tả."}
        </p>
        <h2 className="mt-6 mb-2 text-lg font-semibold">Thông số chi tiết</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm sm:max-w-md">
          <dt className="text-muted">Tình trạng</dt>
          <dd>{CONDITION_LABEL[product.condition]}</dd>
          <dt className="text-muted">Danh mục</dt>
          <dd>{category}</dd>
          <dt className="text-muted">Khu vực</dt>
          <dd>{product.location}</dd>
          <dt className="text-muted">Ngày đăng</dt>
          <dd>{formatDate(product.createdAt)}</dd>
        </dl>
      </section>
    </div>
  );
}
