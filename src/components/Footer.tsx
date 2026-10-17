import Link from "next/link";
export default function Footer() {
  return (
    <footer className="mt-8 bg-[#101f36] text-white sm:mt-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-4 py-6 sm:grid-cols-3 sm:gap-8 sm:px-6 sm:py-12">
        <div className="col-span-2 sm:col-span-1">
          <p className="text-2xl font-extrabold tracking-tight">
            MEN <span className="text-blue-400">/</span> DAILY.
          </p>
          <p className="mt-2 max-w-xs text-xs leading-5 text-slate-400 sm:mt-3 sm:text-sm sm:leading-6">
            Những điều nhỏ mỗi ngày.
            <br />
            Một phiên bản tốt hơn của bạn.
          </p>
        </div>
        <nav aria-label="Liên kết chân trang">
          <h2 className="mb-3 text-xs font-semibold sm:mb-4 sm:text-sm">
            Khám phá cửa hàng
          </h2>
          <div className="flex flex-col gap-3 text-xs text-slate-300 sm:text-sm">
            <Link href="/#san-pham">Tất cả sản phẩm</Link>
            <Link href="/gio-hang">Giỏ hàng của bạn</Link>
            <Link href="/don-hang">Xem lại đơn hàng</Link>
          </div>
        </nav>
        <div>
          <h2 className="mb-3 text-xs font-semibold sm:mb-4 sm:text-sm">
            Thông tin bản trải nghiệm
          </h2>
          <p className="text-[11px] leading-5 text-slate-400 sm:text-xs sm:leading-6">
            Giá và tồn kho là dữ liệu demo. Bao bì là ảnh minh họa. Đơn hàng chỉ
            lưu trên trình duyệt này, chưa được gửi đến cửa hàng.
          </p>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t border-white/10 px-6 py-5 text-[11px] text-slate-400">
        <span>© 2026 MEN / DAILY. Made for your everyday.</span>
        <span>CHĂM SÓC TÓC · DA · CƠ THỂ</span>
      </div>
    </footer>
  );
}
