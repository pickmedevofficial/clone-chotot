import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-muted sm:grid-cols-3">
        <div>
          <p className="mb-2 text-lg font-bold text-foreground">ChợMới</p>
          <p>Trang rao vặt mô phỏng, xây dựng cho mục đích học tập.</p>
        </div>
        <nav aria-label="Liên kết chân trang">
          <p className="mb-2 font-semibold text-foreground">Liên kết</p>
          <ul className="space-y-1">
            <li>
              <Link href="/" className="hover:underline">Trang chủ</Link>
            </li>
            <li>
              <Link href="/admin" className="hover:underline">Đăng tin</Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="mb-2 font-semibold text-foreground">Lưu ý</p>
          <p>Tin đăng chỉ lưu trên trình duyệt của bạn và sẽ mất nếu xóa dữ liệu trang web.</p>
        </div>
      </div>
      <p className="border-t border-line py-3 text-center text-xs text-muted">© 2026 ChợMới</p>
    </footer>
  );
}
