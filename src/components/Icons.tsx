import type { IconBaseProps, IconType } from "react-icons";
import {
  FaArrowRight,
  FaBagShopping,
  FaCartShopping,
  FaCheck,
  FaMagnifyingGlass,
  FaMinus,
  FaPlus,
  FaShieldHalved,
  FaTruckFast,
  FaXmark,
} from "react-icons/fa6";

type IconName =
  | "cart"
  | "search"
  | "arrow"
  | "check"
  | "truck"
  | "bag"
  | "shield"
  | "minus"
  | "plus"
  | "close";

const icons: Record<IconName, IconType> = {
  cart: FaCartShopping,
  search: FaMagnifyingGlass,
  arrow: FaArrowRight,
  check: FaCheck,
  truck: FaTruckFast,
  bag: FaBagShopping,
  shield: FaShieldHalved,
  minus: FaMinus,
  plus: FaPlus,
  close: FaXmark,
};

export function Icon({ name, ...props }: IconBaseProps & { name: IconName }) {
  const Glyph = icons[name];
  return <Glyph aria-hidden="true" size="20" {...props} />;
}
