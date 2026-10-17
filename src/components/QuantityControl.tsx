import { MAX_QUANTITY } from "@/lib/commerce";
import { Icon } from "./Icons";
export default function QuantityControl({
  quantity,
  onChange,
  label = "Số lượng",
}: {
  quantity: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <div
      className="inline-flex shrink-0 items-center overflow-hidden rounded-lg border border-line bg-white"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={quantity <= 1}
        aria-label={`Giảm ${label.toLowerCase()}`}
        className="p-2.5 hover:bg-blue-50"
      >
        <Icon name="minus" width="14" height="14" />
      </button>
      <span
        className="min-w-8 text-center text-sm font-semibold"
        aria-live="polite"
      >
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= MAX_QUANTITY}
        aria-label={`Tăng ${label.toLowerCase()}`}
        className="p-2.5 hover:bg-blue-50"
      >
        <Icon name="plus" width="14" height="14" />
      </button>
    </div>
  );
}
