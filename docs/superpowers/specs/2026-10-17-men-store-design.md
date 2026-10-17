# MEN / DAILY — cửa hàng chăm sóc nam

## Phạm vi đã thống nhất
Chuyển frontend rao vặt thành bản demo bán hàng chăm sóc nam. Giữ Next.js hiện tại; giỏ và đơn hàng chỉ lưu trên trình duyệt. Không giả lập việc ngân hàng xác nhận thanh toán.

## Danh mục và dữ liệu
8 danh mục: dầu gội, xịt khử mùi, sữa rửa mặt, kem chống nắng, vệ sinh nam, lăn khử mùi, sữa tắm, chăm sóc râu. Mỗi danh mục có 10 dòng × 5 quy cách (1, 2, 3, 4, 6 sản phẩm): 50 SKU/danh mục, 400 tổng cộng. Thương hiệu có thật, giá seed tham khảo; combo tính theo số lượng, không trình bày là 400 công thức riêng biệt. Ảnh là minh họa bao bì, không phải ảnh hãng.

## Trải nghiệm
Tông xanh dương, thương hiệu demo MEN / DAILY. Danh mục, tìm kiếm không dấu, lọc thương hiệu, sắp xếp và tải thêm. Trang chi tiết có mua ngay/thêm giỏ. Thay trang đăng tin bằng giỏ và chuyển hướng URL /admin cũ.

## Đặt hàng
Giỏ chỉnh số lượng 1–20 mỗi SKU, xóa và tính tổng. Checkout yêu cầu họ tên, điện thoại Việt Nam, tỉnh/thành, quận/huyện, phường/xã, địa chỉ; email/ghi chú tùy chọn. Giao tiêu chuẩn 30.000đ (miễn từ 499.000đ trước giảm giá); giao nhanh 50.000đ. Voucher HELLO10 giảm 10% tối đa 100.000đ từ 200.000đ; MEN50 giảm 50.000đ từ 500.000đ; FREESHIP miễn tối đa 30.000đ từ 299.000đ. Chỉ dùng một voucher. Tổng = tiền hàng − giảm tiền hàng + phí ship − giảm phí ship.

## Thanh toán và đơn hàng
COD hoặc chuyển khoản. Tạo mã đơn, chụp lại dòng hàng/giá/tổng tại thời điểm đặt, lưu trước khi xóa giỏ. Khi chưa cấu hình ngân hàng, hiển thị QR thông tin đơn minh họa và cảnh báo không dùng thanh toán. Khi có biến môi trường ngân hàng, tạo VietQR chứa đúng tài khoản, tổng tiền và mã đơn. Trạng thái chuyển khoản luôn chờ thanh toán, COD chờ xác nhận; không có nút tự nhận đã thanh toán. Thất bại lưu trữ phải báo lỗi và giữ giỏ.

## Kiểm chứng
Unit test số lượng danh mục/SKU, dữ liệu giỏ hỏng, giới hạn số lượng, voucher tại biên, giao hàng, xác thực người mua, snapshot đơn và lưu trữ lỗi. Chạy test suite, lint, TypeScript, build và kiểm tra trình duyệt nếu có công cụ.

## Nguồn tham khảo
- https://www.guardian.com.vn/sua-rua-mat-nivea-men-mud-giup-sang-da-kiem-soat-nhon-100g.html — Nivea Men Mud 100g: 89.000đ tại thời điểm tra cứu.
- https://hasaki.vn/san-pham/dau-tam-goi-clear-men-3-trong-1-active-cool-mat-lanh-630g-87935.html — Clear Men Active Cool 630g: 177.000đ.
- https://www.guardian.com.vn/shopby/anessa.html?brand_id=604%2C14610 — Anessa Perfect UV Milk 60ml: 468.000đ.
- https://www.vietqr.io/ — cấu trúc URL img.vietqr.io.

Các giá khác là giá demo biên tập, không cam kết là báo giá thị trường hay tồn kho thật.
