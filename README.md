# ChợMới

ChợMới là trang rao vặt mô phỏng (chỉ có frontend), dựng bằng Next.js (App Router), TypeScript và Tailwind CSS.

- **Trang chủ** (`/`): ô tìm kiếm (không cần gõ dấu), danh mục, danh sách tin với hai tab "Dành cho bạn" / "Mới nhất".
- **Chi tiết tin** (`/san-pham/[id]`): ảnh, giá, tình trạng, khu vực, mô tả.
- **Đăng tin** (`/admin`): form đăng tin và danh sách tin đã đăng (có nút xóa).

Không có thanh toán, giỏ hàng, đăng nhập hay máy chủ/cơ sở dữ liệu.

## Chạy dự án

```bash
npm install
npm run dev     # chạy môi trường phát triển tại http://localhost:3000
npm test        # chạy unit test (Vitest)
npm run lint    # kiểm tra ESLint
npm run build   # build bản production
```

## Dữ liệu

- Tin mẫu nằm trong `src/data/mock-products.ts` (ảnh minh họa từ picsum.photos).
- Tin bạn đăng **chỉ được lưu trong `localStorage` của trình duyệt đang dùng**: không đồng bộ sang máy/trình duyệt khác và sẽ mất nếu xóa dữ liệu trang web.
- Mỗi tin có 1–6 ảnh, mỗi file tối đa 1MB. Trước khi lưu, ảnh được thu nhỏ (cạnh dài tối đa 1280px) và nén JPEG để tiết kiệm dung lượng `localStorage` (~5MB). Nếu bộ nhớ vẫn đầy, trang sẽ báo và không làm mất tin cũ.
