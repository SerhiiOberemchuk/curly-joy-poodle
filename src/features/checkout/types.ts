import type { SizeCode } from "@/features/catalog/types";

export type DeliveryMethod = "np-branch" | "np-locker" | "np-courier";
export type PaymentMethod = "card" | "cod" | "invoice";
export type PaymentStatus = "pending" | "not-required" | "paid" | "failed";

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

/** What the acquirer told us about the money, kept next to the order. */
export interface PaymentDetails {
  status: PaymentStatus;
  /** Acquirer transaction reference, once one has been reported. */
  reference: string | null;
  /** Why the payment failed, in the acquirer's words. */
  failureReason: string | null;
  /** When the status last changed, ISO 8601. */
  updatedAt: string;
}

export interface Order {
  /** Human-readable number shown to the customer and used in the CRM. */
  number: string;
  createdAt: string;
  customer: CustomerDetails;
  delivery: DeliveryDetails;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails: PaymentDetails;
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
