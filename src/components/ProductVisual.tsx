import type { Product } from "@/types/shop";

// Bao bì SVG minh họa, không mô phỏng ảnh sản phẩm chính thức của hãng.
export default function ProductVisual({
  product,
  className = "",
  decorative = false,
}: {
  product: Product;
  className?: string;
  decorative?: boolean;
}) {
  const tube = ["sua-rua-mat", "kem-chong-nang"].includes(product.categoryId);
  const spray = ["xit-khu-mui", "cham-soc-rau"].includes(product.categoryId);
  const roll = product.categoryId === "lan-khu-mui";
  const brand =
    product.brand.length > 16 ? product.brand.slice(0, 16) : product.brand;
  return (
    <div
      className={`product-visual flex items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 220 250"
        className="h-full max-h-full w-full"
        role={decorative ? undefined : "img"}
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : `Bao bì minh họa ${product.title}`}
      >
        <ellipse
          cx="110"
          cy="229"
          rx="58"
          ry="8"
          fill="#0f172a"
          opacity=".08"
        />
        {product.packSize > 1 && (
          <g opacity=".22" transform="translate(36,-5) rotate(9 110 140)">
            <rect
              x="65"
              y="65"
              width="90"
              height="160"
              rx="16"
              fill={product.color}
            />
            <rect x="82" y="41" width="56" height="26" rx="5" fill="#0f172a" />
          </g>
        )}
        {tube ? (
          <>
            <path d="M58 38h104l-12 162H70L58 38Z" fill={product.color} />
            <rect
              x="58"
              y="35"
              width="104"
              height="7"
              rx="2"
              fill="#ffffff"
              opacity=".25"
            />
            <rect x="70" y="198" width="80" height="28" rx="5" fill="#172b4d" />
          </>
        ) : (
          <>
            <rect
              x={roll ? 76 : 80}
              y={roll ? 42 : spray ? 29 : 27}
              width={roll ? 68 : 60}
              height={roll ? 56 : 39}
              rx={roll ? 30 : 8}
              fill="#14253f"
            />
            <rect
              x="61"
              y={roll ? 86 : 61}
              width="98"
              height={roll ? 141 : 166}
              rx={roll ? 32 : spray ? 15 : 22}
              fill={product.color}
            />
            <path
              d="M73 80v124"
              stroke="white"
              strokeWidth="5"
              opacity=".12"
              strokeLinecap="round"
            />
          </>
        )}
        <path d="M65 112h90v63H65z" fill="white" opacity=".95" />
        <text
          x="110"
          y="133"
          textAnchor="middle"
          fill={product.color}
          fontSize={brand.length > 12 ? "10" : "13"}
          fontWeight="800"
          fontFamily="Arial, sans-serif"
        >
          {brand}
        </text>
        <text
          x="110"
          y="151"
          textAnchor="middle"
          fill="#64748b"
          fontSize="7"
          fontWeight="600"
          fontFamily="Arial, sans-serif"
        >
          DAILY CARE / FOR HIM
        </text>
        <path d="M92 161h36" stroke={product.color} strokeWidth="2" />
        <text
          x="110"
          y="194"
          textAnchor="middle"
          fill="white"
          opacity=".9"
          fontSize="10"
          fontFamily="Arial, sans-serif"
        >
          {product.size}
        </text>
      </svg>
    </div>
  );
}
