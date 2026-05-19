export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'In progress'
  | 'Ready for pickup'
  | 'Out for delivery'
  | 'Delivered'
  | 'Cancelled';

export type DeliveryType = 'Home Delivery' | 'Self Pickup';

export interface Order {
  orderId: string;
  orderDate: string;
  customerName: string;
  phone: string;
  area: string;
  cakeCategory: string;
  occasion: string;
  flavour: string;
  size: string;
  tiers: string;
  cakeMessage: string;
  designNotes: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryType: DeliveryType;
  deliveryAddress: string;
  totalPrice: number;
  advancePaid: number;
  balanceDue: number;
  paymentMode: string;
  status: OrderStatus;
  referralSource: string;
  notes: string;
  savedAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export type Tab = 'new-order' | 'history' | 'summary';
