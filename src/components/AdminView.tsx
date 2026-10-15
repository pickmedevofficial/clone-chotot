"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { CATEGORIES, LOCATIONS, getCategoryName } from "@/data/categories";
import { formatDate, formatPrice, parsePrice } from "@/lib/format";
import { compressImage } from "@/lib/image";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGES,
  MAX_TITLE_LENGTH,
  deleteUserProduct,
  saveUserProduct,
  useIsClient,
  useProducts,
  validateImageFile,
  validateProduct,
  type ProductErrors,
} from "@/lib/product-store";
import type { ProductCondition, ProductDraft } from "@/types/product";

interface FormState {
  title: string;
  price: string;
  categoryId: string;
  location: string;
  condition: ProductCondition;
  description: string;
  images: string[];
}

const EMPTY_FORM: FormState = {
  title: "",
  price: "",
  categoryId: "",
  location: "",
  condition: "da-su-dung",
  description: "",
  images: [],
};

const PRICE_FORMAT_ERROR = "Giá chỉ gồm chữ số, có thể ngăn hàng nghìn bằng dấu chấm (vd: 1.500.000)";

function toDraft(form: FormState): ProductDraft {
  return {
    title: form.title,
    price: form.price.trim() ? (parsePrice(form.price) ?? Number.NaN) : 0,
    categoryId: form.categoryId,
    location: form.location,
    condition: form.condition,
    description: form.description,
    images: form.images,
  };
}

function validateForm(form: FormState): ProductErrors {
  const errors = validateProduct(toDraft(form));
  if (form.price.trim() && parsePrice(form.price) === null) errors.price = PRICE_FORMAT_ERROR;
  return errors;
}

const inputClass =
  "w-full min-w-0 rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-strong focus:ring-2 focus:ring-brand/40 aria-[invalid=true]:border-price";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs text-price">
      {message}
    </p>
  );
}

export default function AdminView() {
  const products = useProducts();
  const isClient = useIsClient();
  const userProducts = products.filter((p) => p.source === "user");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageErrors, setImageErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);
  // Lỗi từng trường chỉ hiện sau lần bấm "Đăng tin" đầu tiên, rồi cập nhật theo dữ liệu nhập.
  const errors: ProductErrors = submitted ? validateForm(form) : {};
  // Số ảnh đã có + đang xử lý, cập nhật đồng bộ để nhiều lần chọn ảnh liên tiếp không vượt quá giới hạn.
  const imageSlotsRef = useRef(0);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const problems: string[] = [];
    const accepted: File[] = [];
    let dropped = 0;
    for (const file of files) {
      const error = validateImageFile(file, imageSlotsRef.current);
      if (error) {
        if (imageSlotsRef.current >= MAX_IMAGES) dropped += 1;
        else problems.push(error);
        continue;
      }
      accepted.push(file);
      imageSlotsRef.current += 1; // giữ chỗ ngay, trước khi await
    }
    if (dropped > 0) problems.push(`Tối đa ${MAX_IMAGES} ảnh cho mỗi tin — đã bỏ qua ${dropped} ảnh`);
    setImageErrors([...new Set(problems)]);

    const urls: string[] = [];
    for (const file of accepted) {
      try {
        urls.push(await compressImage(file));
      } catch {
        imageSlotsRef.current -= 1;
        problems.push(`Không đọc được "${file.name}"`);
      }
    }
    setImageErrors([...new Set(problems)]);
    if (urls.length > 0) setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
  }

  function removeImage(index: number) {
    imageSlotsRef.current = Math.max(0, imageSlotsRef.current - 1);
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    setImageErrors([]);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setStatus(null);
    const draft = toDraft(form);
    const validation = validateForm(form);
    if (Object.keys(validation).length > 0) {
      setStatus({ kind: "error", message: "Vui lòng sửa các lỗi được đánh dấu bên dưới." });
      return;
    }
    const result = saveUserProduct(draft);
    if (!result.ok) {
      setStatus({ kind: "error", message: result.error });
      return;
    }
    setForm(EMPTY_FORM);
    imageSlotsRef.current = 0;
    setImageErrors([]);
    setSubmitted(false);
    setStatus({ kind: "success", message: `Đã đăng tin "${result.product.title}".` });
  }

  function handleDelete(id: string, title: string) {
    if (!window.confirm(`Xóa tin "${title}"?`)) return;
    const result = deleteUserProduct(id);
    setStatus(
      result.ok
        ? { kind: "success", message: `Đã xóa tin "${title}".` }
        : { kind: "error", message: result.error },
    );
  }

  const priceDraft = parsePrice(form.price) ?? 0;

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <section aria-labelledby="dang-tin-heading" className="min-w-0 rounded-lg bg-surface p-4 sm:p-6">
        <h1 id="dang-tin-heading" className="mb-1 text-xl font-semibold">
          Đăng tin mới
        </h1>
        <p className="mb-4 text-sm text-muted">
          Tin được lưu trong trình duyệt này. Các trường có dấu <span className="text-price">*</span> là bắt buộc.
        </p>

        {status && (
          <div
            role={status.kind === "error" ? "alert" : "status"}
            className={`mb-4 rounded-md px-3 py-2 text-sm ${
              status.kind === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-price"
            }`}
          >
            {status.message}
            {status.kind === "success" && (
              <>
                {" "}
                <Link href="/" className="underline">
                  Xem trang chủ
                </Link>
              </>
            )}
          </div>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="images" className="mb-1 block text-sm font-medium">
              Hình ảnh <span className="text-price">*</span>{" "}
              <span className="font-normal text-muted">
                ({form.images.length}/{MAX_IMAGES}, mỗi ảnh tối đa 1MB)
              </span>
            </label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              disabled={form.images.length >= MAX_IMAGES}
              aria-invalid={Boolean(errors.images || imageErrors.length)}
              aria-describedby="images-error"
              className="block w-full min-w-0 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:font-medium disabled:opacity-50"
            />
            <div id="images-error" aria-live="polite">
              {imageErrors.map((msg) => (
                <p key={msg} className="mt-1 text-xs text-price">
                  {msg}
                </p>
              ))}
              {errors.images && <p className="mt-1 text-xs text-price">{errors.images}</p>}
            </div>
            {form.images.length > 0 && (
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {form.images.map((src, i) => (
                  <li key={`${i}-${src.length}`} className="relative aspect-square overflow-hidden rounded-md bg-background">
                    <Image src={src} alt={`Ảnh đã chọn ${i + 1}`} fill sizes="120px" className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label={`Bỏ ảnh ${i + 1}`}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm leading-none text-white hover:bg-black/80"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Tiêu đề <span className="text-price">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              maxLength={MAX_TITLE_LENGTH}
              onChange={(e) => update("title", e.target.value)}
              aria-invalid={Boolean(errors.title)}
              aria-describedby="title-error"
              className={inputClass}
              placeholder="Ví dụ: Xe đạp thể thao còn mới"
            />
            <FieldError id="title-error" message={errors.title} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label htmlFor="price" className="mb-1 block text-sm font-medium">
                Giá (đồng) <span className="text-price">*</span>
              </label>
              <input
                id="price"
                type="text"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                aria-invalid={Boolean(errors.price)}
                aria-describedby="price-error price-preview"
                className={inputClass}
                placeholder="Ví dụ: 1500000"
              />
              {priceDraft > 0 && (
                <p id="price-preview" className="mt-1 text-xs text-muted">
                  {formatPrice(priceDraft)}
                </p>
              )}
              <FieldError id="price-error" message={errors.price} />
            </div>

            <div className="min-w-0">
              <label htmlFor="categoryId" className="mb-1 block text-sm font-medium">
                Danh mục <span className="text-price">*</span>
              </label>
              <select
                id="categoryId"
                value={form.categoryId}
                onChange={(e) => update("categoryId", e.target.value)}
                aria-invalid={Boolean(errors.categoryId)}
                aria-describedby="categoryId-error"
                className={inputClass}
              >
                <option value="">-- Chọn danh mục --</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FieldError id="categoryId-error" message={errors.categoryId} />
            </div>

            <div className="min-w-0">
              <label htmlFor="location" className="mb-1 block text-sm font-medium">
                Khu vực <span className="text-price">*</span>
              </label>
              <select
                id="location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                aria-invalid={Boolean(errors.location)}
                aria-describedby="location-error"
                className={inputClass}
              >
                <option value="">-- Chọn khu vực --</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <FieldError id="location-error" message={errors.location} />
            </div>

            <fieldset
              className="min-w-0"
              aria-invalid={Boolean(errors.condition)}
              aria-describedby="condition-error"
            >
              <legend className="mb-1 block text-sm font-medium">
                Tình trạng <span className="text-price">*</span>
              </legend>
              <div className="flex gap-4 py-2 text-sm">
                {(
                  [
                    ["moi", "Mới"],
                    ["da-su-dung", "Đã sử dụng"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="condition"
                      value={value}
                      checked={form.condition === value}
                      onChange={() => update("condition", value)}
                      className="accent-brand-strong"
                    />
                    {label}
                  </label>
                ))}
              </div>
              <FieldError id="condition-error" message={errors.condition} />
            </fieldset>
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              Mô tả
            </label>
            <textarea
              id="description"
              rows={5}
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              aria-invalid={Boolean(errors.description)}
              aria-describedby="description-error"
              className={inputClass}
              placeholder="Tình trạng, xuất xứ, lý do bán..."
            />
            <FieldError id="description-error" message={errors.description} />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-brand-strong px-5 py-2.5 font-semibold text-white hover:brightness-95 sm:w-auto"
          >
            Đăng tin
          </button>
        </form>
      </section>

      <section aria-labelledby="tin-da-dang-heading" className="min-w-0 rounded-lg bg-surface p-4 sm:p-6">
        <h2 id="tin-da-dang-heading" className="mb-3 text-lg font-semibold">
          Tin đã đăng {isClient && <span className="text-muted">({userProducts.length})</span>}
        </h2>
        {!isClient ? (
          <p className="text-sm text-muted">Đang tải...</p>
        ) : userProducts.length === 0 ? (
          <p className="text-sm text-muted">Bạn chưa đăng tin nào.</p>
        ) : (
          <ul className="divide-y divide-line">
            {userProducts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-background">
                  {p.images[0] && <Image src={p.images[0]} alt={p.title} fill sizes="56px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/san-pham/${encodeURIComponent(p.id)}`} className="block truncate text-sm font-medium hover:underline">
                    {p.title}
                  </Link>
                  <p className="text-sm font-semibold text-price">{formatPrice(p.price)}</p>
                  <p className="truncate text-xs text-muted">
                    {getCategoryName(p.categoryId)} · {formatDate(p.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id, p.title)}
                  className="shrink-0 rounded-md border border-line px-3 py-1.5 text-sm text-price hover:bg-red-50"
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
