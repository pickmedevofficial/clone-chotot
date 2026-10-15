export default function AboutSection() {
  return (
    <section aria-labelledby="gioi-thieu-heading" className="rounded-lg bg-surface p-4 text-sm leading-relaxed text-muted sm:p-6">
      <h2 id="gioi-thieu-heading" className="mb-2 text-lg font-semibold text-foreground">
        ChợMới — nơi mua bán, rao vặt gần bạn
      </h2>
      <p className="mb-2">
        ChợMới giúp bạn đăng tin bán đồ đã qua sử dụng, tìm xe, tìm nhà hay tìm việc chỉ trong vài phút. Mỗi tin
        đăng gồm hình ảnh, giá, khu vực và mô tả để người mua dễ dàng so sánh.
      </p>
      <p>
        Đây là bản trình diễn giao diện: dữ liệu mẫu được dựng sẵn, còn tin bạn đăng chỉ được lưu trong trình
        duyệt của bạn. Không có thanh toán hay tài khoản người dùng.
      </p>
    </section>
  );
}
