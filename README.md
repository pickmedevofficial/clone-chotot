# MEN / DAILY

Cửa hàng demo sản phẩm chăm sóc nam, viết bằng Next.js 16.4.1, React 19, TypeScript và Tailwind 4.

## Chạy

```bash
pnpm install
pnpm dev
pnpm test
pnpm test:e2e    # cần build trước; Chrome có sẵn trên máy
pnpm lint
pnpm build
pnpm start
```

Kiểm thử E2E dùng Chrome tại `/usr/bin/google-chrome`; đặt `PLAYWRIGHT_CHROMIUM_EXECUTABLE` nếu Chrome nằm ở đường dẫn khác. Chạy các kịch bản desktop/mobile với `pnpm build` rồi `pnpm test:e2e`.

## Trải nghiệm

- `/`: tìm kiếm không dấu, danh mục, thương hiệu, mua lẻ/combo, sắp xếp và xem thêm.
- `/san-pham/[id]`: chi tiết, chọn quy cách, thêm vào giỏ hoặc đặt hàng.
- `/gio-hang`: sửa số lượng, xóa sản phẩm và xem tổng tạm tính.
- `/thanh-toan`: thông tin người mua, địa chỉ, giao hàng, voucher, COD/chuyển khoản.
- `/don-hang`: lịch sử đơn trên trình duyệt này.
- `/don-hang/[id]`: snapshot đơn, tổng thanh toán, QR và thông tin người nhận.
- `/admin`: URL cũ chuyển về giỏ hàng; không còn chức năng đăng tin.

## Catalog

`src/data/products.ts` tạo **400 SKU**: 8 danh mục × 10 dòng sản phẩm × 5 quy cách (mua lẻ, combo 2/3/4/6). Có 80 dòng cơ bản, không phải 400 công thức riêng biệt. Mỗi combo có giá bằng giá đơn nhân số sản phẩm. Một đơn vị giỏ hàng là một SKU; ví dụ 2 đơn vị combo 3 gồm 6 sản phẩm.

Các danh mục: dầu gội, xịt khử mùi, sữa rửa mặt, kem chống nắng, vệ sinh nam, lăn khử mùi, sữa tắm, chăm sóc râu. Bao bì là minh họa SVG nội bộ. Giá, quy cách và tồn kho là dữ liệu seed tham khảo, cần đối soát với nhà cung cấp trước khi bán thật. Một số giá có liên kết nhà bán lẻ trong dữ liệu; xem nguồn và ngày khảo sát trong `docs/superpowers/specs/2026-10-17-men-store-design.md`.

## Giao hàng và voucher demo

- Tiêu chuẩn: 30.000đ, miễn từ 499.000đ tiền hàng trước giảm giá; dự kiến 3–5 ngày.
- Giao nhanh: 50.000đ; dự kiến 1–2 ngày, tùy khu vực.
- `HELLO10`: giảm 10% tối đa 100.000đ, từ 200.000đ.
- `MEN50`: giảm 50.000đ, từ 500.000đ.
- `FREESHIP`: giảm tối đa 30.000đ phí ship, từ 299.000đ.
- Mỗi đơn một mã; tổng = tiền hàng − giảm tiền hàng + phí ship − giảm phí ship.

## QR

Sao chép `.env.example` thành `.env.local` và điền ngân hàng (BIN hoặc mã ngân hàng được VietQR hỗ trợ), số tài khoản và tên người nhận. Không đưa API secret vào biến `NEXT_PUBLIC_*`.

Khi có cấu hình hợp lệ, đơn chuyển khoản dùng `img.vietqr.io` để tạo QR với đúng tổng tiền và mã đơn làm nội dung. Dịch vụ ngoài nhận số tài khoản công khai, tên chủ tài khoản, số tiền và mã đơn; không gửi địa chỉ, tên người mua hay điện thoại. Nếu QR không tải được, thông tin chuyển khoản vẫn hiển thị để thao tác thủ công.

Khi chưa cấu hình, QR được tạo ngay trên trình duyệt bằng `qrcode`, chứa mã đơn, số tiền và nhãn `NOT FOR PAYMENT`. Đây là **QR thông tin demo**, không chuyển tiền. Đơn COD cũng chỉ dùng QR thông tin.

Không có đối soát ngân hàng, webhook, ví điện tử hoặc nút tự xác nhận đã thanh toán. Đơn chuyển khoản ở trạng thái chờ thanh toán; COD chờ xác nhận.

## Lưu trữ và giới hạn

Giỏ (`mendaily:cart:v1`) và đơn (`mendaily:orders:v1`) dùng localStorage. Mỗi SKU tối đa 20 đơn vị. Tạo đơn chụp lại tên hàng, giá, số lượng, phí, voucher và địa chỉ; lưu đơn thành công mới dọn giỏ. JSON hỏng được bỏ qua; lỗi ghi bộ nhớ được báo trên giao diện.

Đây là frontend demo: đơn chưa gửi cho shop, không có cơ sở dữ liệu chung, quản lý kho, tài khoản, email xác nhận hay dịch vụ vận chuyển thật. Xóa dữ liệu website sẽ xóa giỏ và lịch sử; đường dẫn đơn chỉ dùng được trên trình duyệt có lưu đơn đó.

Để bán thật cần backend kiểm tra giá/tồn kho/voucher, lưu đơn tập trung và tích hợp xác nhận thanh toán, vận chuyển.
