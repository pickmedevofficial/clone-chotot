export interface Category {
  id: string;
  name: string;
  icon: string;
  shortName: string;
  color: string;
}
export interface Product {
  id: string;
  title: string;
  familyId: string;
  brand: string;
  name: string;
  size: string;
  packSize: number;
  unitPrice: number;
  price: number;
  categoryId: string;
  description: string;
  stock: number;
  color: string;
  sourceUrl?: string;
}
export interface CartItem {
  productId: string;
  quantity: number;
}
export interface CartLine extends CartItem {
  product: Product;
  lineTotal: number;
}
export type ShippingMethod = "standard" | "express";
export type PaymentMethod = "cod" | "bank";
export interface Buyer {
  name: string;
  phone: string;
  email: string;
  province: string;
  ward: string;
  address: string;
  note: string;
}
export interface OrderTotals {
  subtotal: number;
  discount: number;
  shippingFee: number;
  shippingDiscount: number;
  shippingTotal: number;
  total: number;
  voucher: string;
  voucherError: string | null;
}
export interface Order {
  id: string;
  createdAt: string;
  buyer: Buyer;
  items: {
    productId: string;
    title: string;
    brand: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  shipping: ShippingMethod;
  payment: PaymentMethod;
  status: "awaiting-payment" | "pending-confirmation";
  totals: OrderTotals;
}
