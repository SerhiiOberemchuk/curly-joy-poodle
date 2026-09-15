import type { SizeCode } from "@/features/catalog/types";

export type DeliveryMethod = "np-branch" | "np-locker" | "np-courier";
export type PaymentMethod = "card" | "cod" | "invoice";

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  /** Normalised to `+380XXXXXXXXX`. */
  phone: string;
  email: string;
}

export interface DeliveryDetails {
  method: DeliveryMethod;
  city: string;
  /** Branch/locker number, or street address for courier delivery. */
  destination: string;
  comment: string;
}

export interface OrderItem {
  sku: string;
  productId: string;
  title: string;
  size: SizeCode;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  /** Human-readable number shown to the customer and used in the CRM. */
  number: string;
  createdAt: string;
  customer: CustomerDetails;
  delivery: DeliveryDetails;
  payment: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  freeShipping: boolean;
}

/** What the confirmation screen needs — kept small enough for a cookie. */
export interface OrderReceipt {
  number: string;
  total: number;
  payment: PaymentMethod;
  /** What happens next, as described by the payment provider. */
  note: string;
  email: string;
  phone: string;
  city: string;
  destination: string;
}
