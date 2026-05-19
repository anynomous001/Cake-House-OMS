import { Order } from '../types/order';

export function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function generateOrderId(existingOrders: Order[] = []): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;
  const todayPrefix = `TCH-${dateStr}-`;
  const todayOrders = existingOrders.filter(o => o.orderId?.startsWith(todayPrefix));
  const seq = String(todayOrders.length + 1).padStart(4, '0');
  return `${todayPrefix}${seq}`;
}

export function formatCurrency(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '-';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export function buildWhatsAppMessage(order: Order): string {
  const deliveryLine =
    order.deliveryType === 'Home Delivery'
      ? `Delivery on ${formatDate(order.deliveryDate)}${order.deliveryTime ? ' at ' + formatTime(order.deliveryTime) : ''}`
      : `Pickup on ${formatDate(order.deliveryDate)}${order.deliveryTime ? ' at ' + formatTime(order.deliveryTime) : ''}`;

  return (
    `Hi ${order.customerName || 'Customer'}, your cake order at Tota Cake House is confirmed!\n` +
    `Order ID: ${order.orderId || '-'}\n` +
    `Cake: ${order.cakeCategory || '-'} - ${order.flavour || '-'} - ${order.size || '-'}\n` +
    `${deliveryLine}\n` +
    `Total: ₹${order.totalPrice ?? 0} | Advance paid: ₹${order.advancePaid ?? 0} | Balance: ₹${order.balanceDue ?? 0}\n` +
    `Thank you for ordering from Tota Cake House!`
  );
}

export function getWhatsAppLink(phone: string, order: Order): string {
  const cleaned = (phone || '').replace(/\D/g, '');
  const indiaPhone = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
  const message = encodeURIComponent(buildWhatsAppMessage(order));
  return `https://wa.me/${indiaPhone}?text=${message}`;
}

export function buildReceiptText(order: Order): string {
  const lines = [
    'TOTA CAKE HOUSE — ORDER RECEIPT',
    '─'.repeat(34),
    `Order ID   : ${order.orderId}`,
    `Order Date : ${formatDate(order.orderDate)}`,
    '',
    'CUSTOMER',
    `Name  : ${order.customerName}`,
    `Phone : ${order.phone}`,
    order.area ? `Area  : ${order.area}` : '',
    '',
    'CAKE DETAILS',
    `Category : ${order.cakeCategory}`,
    order.occasion ? `Occasion : ${order.occasion}` : '',
    `Flavour  : ${order.flavour}`,
    `Size     : ${order.size}`,
    order.tiers ? `Tiers    : ${order.tiers}` : '',
    order.cakeMessage ? `Message  : ${order.cakeMessage}` : '',
    order.designNotes ? `Design   : ${order.designNotes}` : '',
    '',
    'DELIVERY',
    `Type : ${order.deliveryType}`,
    `Date : ${formatDate(order.deliveryDate)}`,
    order.deliveryTime ? `Time : ${formatTime(order.deliveryTime)}` : '',
    order.deliveryType === 'Home Delivery' && order.deliveryAddress
      ? `Address : ${order.deliveryAddress}`
      : '',
    '',
    'PAYMENT',
    `Total     : ₹${order.totalPrice}`,
    `Advance   : ₹${order.advancePaid}`,
    `Balance   : ₹${order.balanceDue}`,
    order.paymentMode ? `Mode      : ${order.paymentMode}` : '',
    '',
    `Status : ${order.status}`,
    '─'.repeat(34),
    'Thank you for ordering from Tota Cake House! 🎂',
  ];
  return lines.filter(l => l !== undefined).join('\n');
}

export function getMonthLabel(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
