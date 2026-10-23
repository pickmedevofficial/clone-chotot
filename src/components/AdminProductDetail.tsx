"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaArrowUpRightFromSquare,
  FaCheck,
  FaPen,
  FaPlus,
  FaTrash,
} from "react-icons/fa6";
import { PRODUCTS, PRODUCT_MAP } from "@/data/products";
import { CATEGORIES, getCategoryName } from "@/data/categories";
import { useOrders } from "@/lib/commerce-store";
import { formatPrice as money } from "@/lib/format";
import {
  getSpecLabel,
  mergeOrders,
  type CustomSibling,
  type ProductOverride,
} from "@/lib/admin";
import {
  syncCustomSiblingsToProductMap,
  useAdminData,
  writeAdmin,
} from "@/lib/admin-store";
import AdminShell from "./AdminShell";
import ProductVisual from "./ProductVisual";

/** Trang quản trị chi tiết một sản phẩm: /admin/san-pham/[id]. */
export default function AdminProductDetail({ id }: { id: string }) {
  const data = useAdminData();
  syncCustomSiblingsToProductMap(data.customSiblings);
  const storefront = useOrders();
  const product = PRODUCT_MAP.get(id);
  const pendingCount = mergeOrders(data, storefront).filter(
    (o) => o.status === "pending",
  ).length;
  return (
    <AdminShell
      active="products"
      pendingCount={pendingCount}
      crumbs={[
        { label: "Quản trị", href: "/admin" },
        { label: "Sản phẩm", href: "/admin?tab=products" },
        { label: id },
      ]}
    >
      <main className="mx-auto max-w-[1500px] p-4 sm:p-8">
        <Link
          href="/admin?tab=products"
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted hover:text-brand"
        >
          <FaArrowLeft aria-hidden="true" /> Quay lại danh sách sản phẩm
        </Link>
        {product ? (
          <Detail key={id} id={id} />
        ) : (
          <div className="admin-panel py-16 text-center">
            <h1 className="text-xl font-bold">Không tìm thấy sản phẩm</h1>
            <p className="my-4 text-sm text-muted">
              Mã “{id}” không có trong catalog.
            </p>
            <Link className="btn-primary" href="/admin?tab=products">
              Về danh sách sản phẩm
            </Link>
          </div>
        )}
      </main>
    </AdminShell>
  );
}

interface ProductFieldRow {
  key: string;
  label: string;
  original: string;
  type?: "text" | "number" | "textarea" | "select-category" | "select-pack";
  format?: (value: string) => React.ReactNode;
}

function Detail({ id }: { id: string }) {
  const router = useRouter();
  const product = PRODUCT_MAP.get(id)!;
  const data = useAdminData();
  const override = data.overrides[id];
  const current = override ?? {
    price: product.price,
    stock: product.stock,
    active: true,
  };

  const [notice, setNotice] = useState(() => {
    if (typeof window !== "undefined") {
      const flash = sessionStorage.getItem("admin_flash_notice");
      if (flash) {
        sessionStorage.removeItem("admin_flash_notice");
        return flash;
      }
    }
    return "";
  });
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<ReadonlySet<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const flash = sessionStorage.getItem("admin_flash_notice");
      if (flash) {
        sessionStorage.removeItem("admin_flash_notice");
        setNotice(flash);
      }
    }
  }, [id]);

  // Thêm quy cách mới
  const [addingSibling, setAddingSibling] = useState(false);
  const [addingError, setAddingError] = useState("");

  // Sửa nội dung quy cách trực tiếp
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);
  const [editingSpecDefault, setEditingSpecDefault] = useState("");
  const [editingSpecError, setEditingSpecError] = useState("");

  const baseSiblings = PRODUCTS.filter((p) => p.familyId === product.familyId);
  const customList = data.customSiblings?.[product.familyId] ?? [];
  const siblings = [...baseSiblings, ...customList];

  function handleSaveSpecLabel(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingSpecId) return;
    const f = new FormData(e.currentTarget);
    const newLabel = String(f.get("newSpecLabel") ?? "").trim();
    if (!newLabel) {
      setEditingSpecError("Vui lòng nhập nội dung quy cách.");
      return;
    }

    const prevOverride = data.overrides[editingSpecId];
    const existingCustom = data.customSiblings?.[product.familyId] ?? [];
    const updatedCustom = existingCustom.map((s) =>
      s.id === editingSpecId
        ? { ...s, specLabel: newLabel, size: newLabel }
        : s,
    );

    const updatedTarget = PRODUCT_MAP.get(editingSpecId);
    if (updatedTarget) {
      updatedTarget.specLabel = newLabel;
    }

    try {
      writeAdmin({
        ...data,
        customSiblings: {
          ...data.customSiblings,
          [product.familyId]: updatedCustom,
        },
        overrides: {
          ...data.overrides,
          [editingSpecId]: {
            ...prevOverride,
            specLabel: newLabel,
            size: newLabel,
          },
        },
      });
      setNotice(`Đã cập nhật nội dung quy cách thành "${newLabel}".`);
      setEditingSpecId(null);
      setEditingSpecError("");
    } catch {
      setEditingSpecError("Không thể lưu nội dung quy cách. Vui lòng thử lại.");
    }
  }

  function handleAddSibling(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const specLabel = String(f.get("specLabel") ?? "").trim();
    if (!specLabel) {
      setAddingError("Vui lòng nhập nội dung quy cách.");
      return;
    }

    const slug =
      specLabel
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || Date.now().toString().slice(-4);

    const newId = `${product.familyId}-${slug}`;

    if (
      siblings.some(
        (s) =>
          s.id === newId ||
          getSpecLabel(s, data.overrides[s.id]).toLowerCase() ===
            specLabel.toLowerCase(),
      )
    ) {
      setAddingError(`Quy cách "${specLabel}" đã tồn tại trong dòng này.`);
      return;
    }

    const categoryName = getCategoryName(product.categoryId);
    const newTitle = `${categoryName} ${product.brand} ${product.name} ${specLabel}`;
    const newDescription = `${categoryName} ${product.brand} ${product.name}, quy cách ${specLabel}. Xem thành phần và hướng dẫn trên bao bì trước khi sử dụng. Ngưng sử dụng nếu có dấu hiệu kích ứng.`;

    const newSibling: CustomSibling = {
      id: newId,
      familyId: product.familyId,
      brand: product.brand,
      name: product.name,
      size: specLabel,
      packSize: parseInt(specLabel.replace(/\D/g, "")) || 1,
      specLabel,
      unitPrice: product.unitPrice,
      price: product.price,
      stock: 50,
      categoryId: product.categoryId,
      color: product.color,
      title: newTitle,
      description: newDescription,
      active: true,
    };

    const existingCustom = data.customSiblings?.[product.familyId] ?? [];
    const nextCustom = [...existingCustom, newSibling];

    try {
      PRODUCT_MAP.set(newId, newSibling);
      writeAdmin({
        ...data,
        customSiblings: {
          ...data.customSiblings,
          [product.familyId]: nextCustom,
        },
        overrides: {
          ...data.overrides,
          [newId]: {
            price: product.price,
            stock: 50,
            active: true,
            specLabel,
            size: specLabel,
          },
        },
      });
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "admin_flash_notice",
          `Đã thêm quy cách "${specLabel}". Bạn có thể chỉnh sửa giá bán, tồn kho và thông tin ở cột bên phải.`,
        );
      }
      setNotice(
        `Đã thêm quy cách "${specLabel}". Bạn có thể chỉnh sửa giá bán, tồn kho và thông tin ở cột bên phải.`,
      );
      setAddingSibling(false);
      setAddingError("");
      router.push(`/admin/san-pham/${encodeURIComponent(newId)}`);
    } catch {
      setAddingError("Không thể lưu quy cách. Vui lòng thử lại.");
    }
  }

  function deleteSibling(siblingId: string) {
    const existingCustom = data.customSiblings?.[product.familyId] ?? [];
    const target = existingCustom.find((s) => s.id === siblingId);
    if (!target) return;
    const label = getSpecLabel(target, data.overrides[siblingId]);
    if (!confirm(`Bạn có chắc chắn muốn xóa quy cách "${label}" này không?`)) {
      return;
    }
    const nextCustom = existingCustom.filter((s) => s.id !== siblingId);
    const nextOverrides = { ...data.overrides };
    delete nextOverrides[siblingId];
    PRODUCT_MAP.delete(siblingId);
    writeAdmin({
      ...data,
      customSiblings: {
        ...data.customSiblings,
        [product.familyId]: nextCustom,
      },
      overrides: nextOverrides,
    });
    if (siblingId === id) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "admin_flash_notice",
          `Đã xóa quy cách "${label}".`,
        );
      }
      const fallback = siblings.find((s) => s.id !== siblingId) ?? product;
      router.push(`/admin/san-pham/${encodeURIComponent(fallback.id)}`);
    } else {
      setNotice(`Đã xóa quy cách "${label}".`);
    }
  }

  // Hiển thị theo override nếu đã lưu, hoặc theo draft nếu đang sửa dở
  const effectiveBrand = drafts.brand ?? override?.brand ?? product.brand;
  const effectiveName = drafts.name ?? override?.name ?? product.name;
  const effectiveSku = drafts.sku ?? override?.sku ?? id;
  const effectiveActive = current.active;

  function startEdit(key: string, value: string) {
    setDrafts((prev) => ({ ...prev, [key]: prev[key] ?? value }));
    setEditing((prev) => new Set(prev).add(key));
  }

  function finishEdit(key: string) {
    setEditing((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    // Trả focus về nút bút sau khi bấm tích xong
    document.getElementById(`product-edit-btn-${key}`)?.focus();
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const adminPrice = Number(f.get("adminPrice"));
    const adminStock = Number(f.get("adminStock"));
    if (!Number.isInteger(adminPrice) || adminPrice < 1) {
      setError("Giá admin phải là số nguyên dương.");
      return;
    }
    if (!Number.isInteger(adminStock) || adminStock < 0) {
      setError("Tồn kho phải là số nguyên không âm.");
      return;
    }

    const pick = (key: string, fallback: string) =>
      key in drafts ? drafts[key].trim() : fallback;

    const price = Number(pick("price", String(current.price)));
    const stock = Number(pick("stock", String(current.stock)));
    const unitPrice = Number(pick("unitPrice", String(product.unitPrice)));
    const packSize = Number(pick("packSize", String(product.packSize)));

    const specLabel = pick("specLabel", getSpecLabel(product, override));

    const nextOverride: ProductOverride = {
      ...override,
      price: adminPrice,
      stock: adminStock,
      active: f.get("active") === "true",
      sku: pick("sku", effectiveSku),
      brand: pick("brand", product.brand),
      name: pick("name", product.name),
      title: `${pick("name", product.name)} ${pick("brand", product.brand)}`,
      categoryId: pick("categoryId", product.categoryId),
      size: pick("size", product.size),
      specLabel,
      packSize: packSize > 0 ? packSize : product.packSize,
      unitPrice: unitPrice > 0 ? unitPrice : product.unitPrice,
      familyId: pick("familyId", product.familyId),
      description: pick("description", product.description),
    };

    const existingCustom = data.customSiblings?.[product.familyId] ?? [];
    const updatedCustom = existingCustom.map((s) =>
      s.id === id
        ? {
            ...s,
            specLabel,
            size: specLabel,
            price: adminPrice,
            stock: adminStock,
          }
        : s,
    );

    const targetProduct = PRODUCT_MAP.get(id);
    if (targetProduct) {
      targetProduct.specLabel = specLabel;
    }

    try {
      writeAdmin({
        ...data,
        customSiblings: {
          ...data.customSiblings,
          [product.familyId]: updatedCustom,
        },
        overrides: {
          ...data.overrides,
          [id]: nextOverride,
        },
      });
      setNotice("Đã lưu thay đổi sản phẩm trên trình duyệt này.");
      setError("");
      setEditing(new Set());
    } catch {
      setError(
        "Không thể lưu. Kiểm tra quyền hoặc dung lượng bộ nhớ trình duyệt.",
      );
    }
  }

  function reset() {
    const next = { ...data.overrides };
    delete next[id];
    try {
      writeAdmin({ ...data, overrides: next });
      setNotice("Đã khôi phục thông tin sản phẩm theo catalog.");
      setError("");
      setEditing(new Set());
      setDrafts({});
    } catch {
      setError(
        "Không thể lưu. Kiểm tra quyền hoặc dung lượng bộ nhớ trình duyệt.",
      );
    }
  }

  const rows: ProductFieldRow[] = [
    {
      key: "sku",
      label: "Mã SKU",
      original: override?.sku ?? id,
      type: "text",
    },
    {
      key: "brand",
      label: "Thương hiệu",
      original: override?.brand ?? product.brand,
      type: "text",
    },
    {
      key: "name",
      label: "Tên sản phẩm",
      original: override?.name ?? product.name,
      type: "text",
    },
    {
      key: "categoryId",
      label: "Danh mục",
      original: override?.categoryId ?? product.categoryId,
      type: "select-category",
      format: (catId) => getCategoryName(catId) || catId,
    },
    {
      key: "size",
      label: "Dung tích / khối lượng",
      original: override?.size ?? product.size,
      type: "text",
    },
    {
      key: "specLabel",
      label: "Nội dung quy cách",
      original: getSpecLabel(product, override),
      type: "text",
    },
    {
      key: "price",
      label: "Giá catalog",
      original: String(override?.price ?? product.price),
      type: "number",
      format: (p) => money(Number(p)),
    },
    {
      key: "unitPrice",
      label: "Đơn giá / sản phẩm",
      original: String(override?.unitPrice ?? product.unitPrice),
      type: "number",
      format: (p) => money(Number(p)),
    },
    {
      key: "stock",
      label: "Tồn kho catalog",
      original: String(override?.stock ?? product.stock),
      type: "number",
    },
    {
      key: "familyId",
      label: "Mã dòng sản phẩm",
      original: override?.familyId ?? product.familyId,
      type: "text",
    },
  ];

  const fullRows: ProductFieldRow[] = [
    {
      key: "description",
      label: "Mô tả",
      original: override?.description ?? product.description,
      type: "textarea",
    },
  ];

  function renderField(row: ProductFieldRow, hasBorder = true) {
    const isEditing = editing.has(row.key);
    const original = String(row.original ?? "");
    const currentVal = row.key in drafts ? drafts[row.key] : original;
    const changed = row.key in drafts && drafts[row.key].trim() !== original;
    const inputId = `product-input-${row.key}`;

    const fieldProps = {
      id: inputId,
      className: "field !py-2 text-sm",
      defaultValue: currentVal,
      autoFocus: true,
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) =>
        setDrafts((prev) => ({
          ...prev,
          [row.key]: e.target.value,
        })),
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          finishEdit(row.key);
        }
      },
    };

    return (
      <div
        key={row.key}
        className={hasBorder ? "border-b border-line py-3" : "py-3"}
      >
        <dt className="mb-1 text-[11px] font-semibold text-muted">
          {isEditing ? <label htmlFor={inputId}>{row.label}</label> : row.label}
        </dt>
        <dd className="admin-detail-value">
          {isEditing ? (
            <>
              {row.type === "textarea" ? (
                <textarea
                  {...fieldProps}
                  rows={3}
                  className="field !py-2 text-sm"
                />
              ) : row.type === "select-category" ? (
                <select
                  {...fieldProps}
                  className="field !py-2 text-sm"
                  defaultValue={currentVal}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              ) : row.type === "select-pack" ? (
                <select
                  {...fieldProps}
                  className="field !py-2 text-sm"
                  defaultValue={currentVal}
                >
                  <option value="1">Mua lẻ (1 sản phẩm)</option>
                  <option value="2">Combo 2 sản phẩm</option>
                  <option value="3">Combo 3 sản phẩm</option>
                  <option value="4">Combo 4 sản phẩm</option>
                  <option value="5">Combo 5 sản phẩm</option>
                  <option value="6">Combo 6 sản phẩm</option>
                </select>
              ) : (
                <input
                  {...fieldProps}
                  type={row.type === "number" ? "number" : "text"}
                  step={row.type === "number" ? "1" : undefined}
                />
              )}
              <button
                type="button"
                className="admin-edit-button admin-confirm-button"
                aria-label={`Xong sửa ${row.label.toLowerCase()}`}
                title="Xong"
                onClick={() => finishEdit(row.key)}
              >
                <FaCheck aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <span className={currentVal ? "" : "text-muted"}>
                {row.format
                  ? row.format(currentVal)
                  : currentVal || "Chưa có thông tin"}
                {changed && (
                  <small className="admin-edited-tag">Đã sửa · chưa lưu</small>
                )}
              </span>
              <button
                id={`product-edit-btn-${row.key}`}
                type="button"
                className="admin-edit-button"
                aria-label={`Sửa ${row.label.toLowerCase()}`}
                title="Sửa"
                onClick={() => startEdit(row.key, original)}
              >
                <FaPen aria-hidden="true" />
              </button>
            </>
          )}
        </dd>
      </div>
    );
  }

  const hasDrafts = Object.keys(drafts).length > 0;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2 text-brand">{effectiveBrand}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {effectiveName}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{effectiveSku}</span>
            <span
              className={`admin-badge ${effectiveActive ? "status-completed" : "status-cancelled"}`}
            >
              {effectiveActive ? "Đang kinh doanh" : "Tạm ngưng"}
            </span>
          </p>
        </div>
        <Link
          href={`/san-pham/${encodeURIComponent(id)}`}
          target="_blank"
          className="btn-secondary inline-flex items-center gap-2"
        >
          Xem trên cửa hàng
          <FaArrowUpRightFromSquare aria-hidden="true" />
        </Link>
      </div>

      {notice && (
        <div
          role="status"
          className="mb-4 flex justify-between rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
          <button onClick={() => setNotice("")} aria-label="Đóng thông báo">
            ×
          </button>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Cột trái: Ảnh và quy cách cùng dòng */}
        <section aria-label="Hình ảnh sản phẩm" className="grid gap-4">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-line bg-[#eaf0f8]">
            <div className="absolute h-2/3 w-2/3 rounded-full bg-white/60" />
            <ProductVisual product={product} className="relative h-4/5 w-4/5" />
            <span className="absolute bottom-4 px-4 text-center text-[11px] text-muted">
              Bao bì minh họa · Không phải ảnh chính thức của hãng
            </span>
          </div>
          <div className="admin-panel p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="admin-modal-heading !mb-0">
                  QUY CÁCH CÙNG DÒNG
                </h2>
                <p className="text-[11px] text-muted">
                  Dòng {product.familyId} · {siblings.length} quy cách
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="btn-secondary !py-1 !px-2.5 text-xs inline-flex items-center gap-1 font-medium hover:border-brand hover:text-brand transition-colors"
                  onClick={() => {
                    setEditingSpecId(id);
                    setEditingSpecDefault(getSpecLabel(product, override));
                    setEditingSpecError("");
                    setAddingSibling(false);
                  }}
                  aria-label="Sửa nội dung quy cách đang chọn"
                  title="Sửa nội dung quy cách đang chọn"
                >
                  <FaPen aria-hidden="true" className="text-[10px]" />
                  <span>Sửa quy cách</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary !py-1 !px-2.5 text-xs inline-flex items-center gap-1.5 font-medium hover:border-brand hover:text-brand transition-colors"
                  onClick={() => {
                    setAddingSibling((prev) => !prev);
                    setAddingError("");
                    setEditingSpecId(null);
                  }}
                  aria-expanded={addingSibling}
                  aria-label="Thêm quy cách mới"
                >
                  <FaPlus aria-hidden="true" className="text-[10px]" />
                  <span>Thêm quy cách</span>
                </button>
              </div>
            </div>

            {/* Form sửa nội dung quy cách */}
            {editingSpecId && (
              <form
                onSubmit={handleSaveSpecLabel}
                className="mb-3 rounded-xl border border-brand/30 bg-blue-50/50 p-3 shadow-xs"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-brand">
                    Sửa nội dung quy cách
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingSpecId(null)}
                    className="text-muted hover:text-foreground text-sm leading-none"
                    aria-label="Đóng form sửa quy cách"
                  >
                    ×
                  </button>
                </div>
                {editingSpecError && (
                  <p className="mb-2 text-[11px] text-red-600 font-medium">
                    {editingSpecError}
                  </p>
                )}
                <label className="block text-[10px] font-semibold text-muted">
                  Nội dung quy cách
                  <input
                    name="newSpecLabel"
                    type="text"
                    required
                    autoFocus
                    defaultValue={editingSpecDefault}
                    className="field !py-1.5 text-xs mt-1"
                    aria-label="Nhập nội dung quy cách mới"
                  />
                </label>
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-blue-200/60 pt-2">
                  <button
                    type="button"
                    className="btn-secondary !py-1 !px-2.5 text-xs"
                    onClick={() => setEditingSpecId(null)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-primary !py-1 !px-3 text-xs inline-flex items-center gap-1 font-medium"
                  >
                    <FaCheck aria-hidden="true" className="text-[10px]" /> Lưu
                    nội dung quy cách
                  </button>
                </div>
              </form>
            )}

            {addingSibling && (
              <form
                onSubmit={handleAddSibling}
                className="mb-3 rounded-xl border border-brand/30 bg-blue-50/50 p-3 shadow-xs"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-brand">
                    Thêm quy cách mới cho dòng này
                  </h3>
                  <button
                    type="button"
                    onClick={() => setAddingSibling(false)}
                    className="text-muted hover:text-foreground text-sm leading-none"
                    aria-label="Đóng form thêm quy cách"
                  >
                    ×
                  </button>
                </div>
                {addingError && (
                  <p className="mb-2 text-[11px] text-red-600 font-medium">
                    {addingError}
                  </p>
                )}
                <label className="block text-[10px] font-semibold text-muted">
                  Nội dung quy cách
                  <input
                    name="specLabel"
                    type="text"
                    required
                    autoFocus
                    placeholder="Ví dụ: 100ml, 250ml, 900g, Combo 5..."
                    className="field !py-1.5 text-xs mt-1"
                    aria-label="Nội dung quy cách mới"
                  />
                </label>
                <p className="mt-1 text-[10px] text-muted">
                  Sau khi thêm, bạn có thể chọn quy cách này ở tab để chỉnh sửa
                  giá bán, tồn kho và thông tin chi tiết ở cột bên phải.
                </p>
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-blue-200/60 pt-2">
                  <button
                    type="button"
                    className="btn-secondary !py-1 !px-2.5 text-xs"
                    onClick={() => setAddingSibling(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn-primary !py-1 !px-3 text-xs inline-flex items-center gap-1 font-medium"
                  >
                    <FaPlus aria-hidden="true" className="text-[10px]" /> Thêm
                    quy cách
                  </button>
                </div>
              </form>
            )}

            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
              {siblings.map((p) => {
                const isCurrent = p.id === id;
                const isCustom = data.customSiblings?.[product.familyId]?.some(
                  (s) => s.id === p.id,
                );
                const label = getSpecLabel(p, data.overrides[p.id]);

                return (
                  <li key={p.id} className="relative group">
                    <Link
                      href={`/admin/san-pham/${encodeURIComponent(p.id)}`}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`block rounded-xl border p-2 text-center text-[11px] font-medium transition-all ${
                        isCurrent
                          ? "border-brand bg-blue-50 text-brand font-semibold shadow-xs ring-1 ring-brand"
                          : "border-line bg-white hover:border-brand text-foreground"
                      }`}
                    >
                      <ProductVisual
                        product={p}
                        decorative
                        className="mx-auto mb-1 h-14 w-14"
                      />
                      <span className="block truncate font-medium">
                        {label}
                      </span>
                      {isCurrent && (
                        <span className="mt-1 inline-block rounded bg-brand px-1.5 py-0.5 text-[9px] font-bold text-white">
                          Đang xem
                        </span>
                      )}
                      {isCustom && (
                        <span className="mt-1 inline-block rounded bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-700">
                          Tùy chỉnh
                        </span>
                      )}
                    </Link>
                    {/* Nút thao tác trên tab: sửa nội dung quy cách & xóa nếu là custom */}
                    <div className="absolute -top-1.5 -right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingSpecId(p.id);
                          setEditingSpecDefault(label);
                          setEditingSpecError("");
                          setAddingSibling(false);
                        }}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[9px] shadow-xs hover:bg-blue-700 transition-colors"
                        title={`Sửa nội dung quy cách "${label}"`}
                        aria-label={`Sửa nội dung quy cách ${label}`}
                      >
                        <FaPen aria-hidden="true" />
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteSibling(p.id);
                          }}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] shadow-xs hover:bg-rose-600 transition-colors"
                          title={`Xóa quy cách "${label}"`}
                          aria-label={`Xóa quy cách ${label}`}
                        >
                          <FaTrash aria-hidden="true" className="text-[9px]" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Cột phải: Form thông tin & chỉnh sửa */}
        <form onSubmit={submit} className="grid gap-6">
          {/* Card 1: Cài đặt bán hàng admin */}
          <section
            className="admin-panel p-5"
            aria-labelledby="admin-sales-heading"
          >
            <h2 id="admin-sales-heading" className="admin-modal-heading">
              CÀI ĐẶT BÁN HÀNG
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="admin-label">
                Giá admin (đ)
                <input
                  name="adminPrice"
                  className="field"
                  required
                  type="number"
                  min="1"
                  max="1000000000"
                  step="1"
                  defaultValue={current.price}
                />
              </label>
              <label className="admin-label">
                Tồn kho admin
                <input
                  name="adminStock"
                  className="field"
                  required
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  defaultValue={current.stock}
                />
              </label>
              <label className="admin-label">
                Trạng thái
                <select
                  name="active"
                  className="field"
                  defaultValue={String(current.active)}
                >
                  <option value="true">Đang kinh doanh</option>
                  <option value="false">Tạm ngưng</option>
                </select>
              </label>
            </div>
            <p className="mt-3 text-xs text-muted">
              {override
                ? "Đang dùng giá/tồn kho do admin chỉnh."
                : "Đang dùng giá/tồn kho theo catalog."}
            </p>
          </section>

          {/* Card 2: Thông tin sản phẩm - có icon bút để sửa từng dòng */}
          <section
            className="admin-panel p-5"
            aria-labelledby="admin-info-heading"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div>
                <h2
                  id="admin-info-heading"
                  className="admin-modal-heading !mb-1"
                >
                  THÔNG TIN SẢN PHẨM
                </h2>
                <p className="text-xs text-muted">
                  Bấm vào biểu tượng bút để chỉnh sửa từng mục thông tin sản
                  phẩm.
                </p>
              </div>
            </div>

            <dl className="grid gap-x-6 sm:grid-cols-2">
              {rows.map((row) => renderField(row, true))}
            </dl>

            <dl className="mt-2 grid gap-y-1">
              {fullRows.map((row) => renderField(row, false))}
            </dl>

            {error && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* Chân thẻ: Nút lưu thay đổi đặt ở dưới */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <p className="text-xs text-muted">
                {hasDrafts
                  ? `Đang có ${Object.keys(drafts).length} mục đã chỉnh sửa (chưa lưu).`
                  : override
                    ? "Đang dùng thông tin do admin tùy chỉnh."
                    : "Đang dùng thông tin gốc theo catalog."}
              </p>
              <div className="flex gap-2">
                {(override || hasDrafts) && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={reset}
                  >
                    Khôi phục mặc định
                  </button>
                )}
                <button type="submit" className="btn-primary">
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    </>
  );
}
