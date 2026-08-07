export type OrderItem = {
  product_id: string;
  slug: string;
  name: string;
  unit_price: number;
  quantity: number;
  image_url: string;
};

export type PaymentMethod = "stripe" | "paypal";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "cancelled"
  | "refunded";

export type ShippingStatus =
  | "preparing"
  | "shipped"
  | "in_transit"
  | "delivered";

export type ShippingCarrier = "laposte" | "mondial_relay";

export type OrderRow = {
  id: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: string;
  shipping_status: ShippingStatus;
  shipping_carrier: ShippingCarrier | null;
  tracking_number: string | null;
  label_url: string | null;
  relay_point_id: string | null;
  total: number;
  currency: string;
  items: OrderItem[];
  shipping_address: {
    fullName: string;
    line1: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
    email?: string;
  } | null;
  created_at: string;
};
