export type DeliveryMethod = "np-branch" | "np-courier";
export type PaymentMethod = "card" | "cod";
export type PaymentStatus =
  | "pending"
  | "not-required"
  | "paid"
  | "failed"
  | "refunded"
  | "partially-refunded"
  | "cancelled";

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}
export interface DeliveryDetails {
  method: DeliveryMethod;
  city: string;
  cityRef: string;
  citySearch: string;
  destination: string;
  branchRef: string;
  streetRef: string;
  streetSearch: string;
  building: string;
  flat: string;
  comment: string;
}
export interface OrderItem {
  sku: string;
  productId: string;
  title: string;
  option: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}
export interface Order {
  /** Stable idempotency key. The human-readable number is allocated by CRM. */
  number: string;
  customer: CustomerDetails;
  delivery: DeliveryDetails;
  payment: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  freeShipping: boolean;
}
export interface OrderReceipt {
  /** CRM externalId, protected by a server signature. */
  number: string;
  total: number;
  payment: PaymentMethod;
  status: PaymentStatus;
  note: string;
  email: string;
  phone: string;
  city: string;
  destination: string;
  crmReference: string | null;
  cartFingerprint: string;
}
