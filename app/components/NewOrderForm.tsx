'use client';

import React, { useState, useCallback } from 'react';
import { Order, OrderStatus, DeliveryType } from '../types/order';
import { generateOrderId, getTodayString } from '../utils/orderHelpers';
import { useGoogleSheet } from '../hooks/useGoogleSheet';
import { Spinner } from './SettingsModal';

const CAKE_CATEGORIES = [
  'Floral cake', 'Bento cake', 'Meme / funny cake', 'Roast cake',
  'Breakup cake', 'Proposal / crush cake', 'Romantic cake', 'K-drama / anime cake',
  'Baby shower cake', 'Birthday cake', 'Anniversary cake', 'Wedding cake',
  'Graduation cake', 'Farewell cake', 'Festival cake', 'Custom / other',
];
const OCCASIONS = [
  'Birthday', 'Anniversary', 'Wedding', 'Baby shower', 'Proposal',
  'Farewell', 'Graduation', 'Friendship day', "Valentine's day",
  "Mother's day", "Father's day", 'Puja / festival', 'Just because', 'Other',
];
const FLAVOURS = [
  'Chocolate', 'Vanilla', 'Strawberry', 'Black forest', 'Butterscotch',
  'Red velvet', 'Pineapple', 'Mango', 'Mixed fruit', 'Custom / other',
];
const SIZES = ['1/2 lb', '1 lb', '1.5 lb', '2 lb', '2.5 lb', '3 lb', '4 lb', '5 lb', 'Custom size'];
const TIERS = ['1 tier', '2 tiers', '3 tiers', 'Custom'];
const PAYMENT_MODES = ['UPI / GPay', 'PhonePe', 'Cash', 'Partial payment'];
const ORDER_STATUSES: OrderStatus[] = [
  'Pending', 'Confirmed', 'In progress', 'Ready for pickup',
  'Out for delivery', 'Delivered', 'Cancelled',
];
const REFERRAL_SOURCES = [
  'Facebook', 'Instagram', 'WhatsApp referral', 'Existing customer', 'Walk-in', 'Other',
];

interface FormState {
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
  orderDate: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryType: DeliveryType;
  deliveryAddress: string;
  totalPrice: string;
  advancePaid: string;
  paymentMode: string;
  status: OrderStatus;
  referralSource: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function defaultForm(): FormState {
  return {
    customerName: '',
    phone: '',
    area: '',
    cakeCategory: '',
    occasion: '',
    flavour: '',
    size: '',
    tiers: '',
    cakeMessage: '',
    designNotes: '',
    orderDate: getTodayString(),
    deliveryDate: '',
    deliveryTime: '',
    deliveryType: 'Home Delivery',
    deliveryAddress: '',
    totalPrice: '',
    advancePaid: '',
    paymentMode: '',
    status: 'Pending',
    referralSource: '',
    notes: '',
  };
}

interface NewOrderFormProps {
  existingOrders: Order[];
  onOrderSaved: (order: Order) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function NewOrderForm({ existingOrders, onOrderSaved, showToast }: NewOrderFormProps) {
  const [form, setForm] = useState<FormState>(defaultForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const { addOrder, getSheetUrl } = useGoogleSheet();

  const balanceDue = Math.max(0, (Number(form.totalPrice) || 0) - (Number(form.advancePaid) || 0));

  const set = useCallback((field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.customerName.trim()) e.customerName = 'Customer name is required';
    if (form.phone.trim() && !/^\d{10}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid 10-digit number';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      showToast('warning', 'Customer name is required');
      return;
    }

    if (!getSheetUrl()) {
      showToast('error', 'Google Sheet not connected. Go to Settings and add your Web App URL first.');
      return;
    }

    setSaving(true);

    const order: Order = {
      orderId: generateOrderId(existingOrders),
      orderDate: form.orderDate,
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      area: form.area.trim(),
      cakeCategory: form.cakeCategory,
      occasion: form.occasion,
      flavour: form.flavour,
      size: form.size,
      tiers: form.tiers,
      cakeMessage: form.cakeMessage.trim(),
      designNotes: form.designNotes.trim(),
      deliveryDate: form.deliveryDate,
      deliveryTime: form.deliveryTime,
      deliveryType: form.deliveryType,
      deliveryAddress: form.deliveryAddress.trim(),
      totalPrice: Number(form.totalPrice) || 0,
      advancePaid: Number(form.advancePaid) || 0,
      balanceDue,
      paymentMode: form.paymentMode,
      status: form.status,
      referralSource: form.referralSource,
      notes: form.notes.trim(),
      savedAt: new Date().toISOString(),
    };

    const ok = await addOrder(order);
    if (!ok) {
      setSaving(false);
      showToast('error', 'Could not save to Google Sheet. Please try again.');
      return;
    }

    setSaving(false);
    onOrderSaved(order);
    showToast('success', `Order ${order.orderId} saved successfully!`);

    // Reset form, keep today's date
    const fresh = defaultForm();
    fresh.orderDate = getTodayString();
    setForm(fresh);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="pb-28">
      {/* Section 1: Customer */}
      <Section title="Customer Details" icon="👤">
        <Field label="Customer Name" required error={errors.customerName}>
          <input
            type="text"
            value={form.customerName}
            onChange={e => set('customerName', e.target.value)}
            placeholder="e.g. Rahul Das"
            className={inputCls(!!errors.customerName)}
          />
        </Field>
        <Field label="WhatsApp Number" error={errors.phone}>
          <input
            type="tel"
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="10-digit mobile number"
            maxLength={10}
            inputMode="numeric"
            className={inputCls(!!errors.phone)}
          />
        </Field>
        <Field label="Area / Locality" error={errors.area}>
          <input
            type="text"
            value={form.area}
            onChange={e => set('area', e.target.value)}
            placeholder="Habra, Barasat, Ashoknagar..."
            className={inputCls(false)}
          />
        </Field>
      </Section>

      {/* Section 2: Cake Details */}
      <Section title="Cake Details" icon="🎂">
        <Field label="Cake Category" error={errors.cakeCategory}>
          <select
            value={form.cakeCategory}
            onChange={e => set('cakeCategory', e.target.value)}
            className={selectCls(false)}
          >
            <option value="">Select category...</option>
            {CAKE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Occasion" error={errors.occasion}>
          <select value={form.occasion} onChange={e => set('occasion', e.target.value)} className={selectCls(false)}>
            <option value="">Select occasion...</option>
            {OCCASIONS.map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Flavour" error={errors.flavour}>
            <select value={form.flavour} onChange={e => set('flavour', e.target.value)} className={selectCls(false)}>
              <option value="">Select...</option>
              {FLAVOURS.map(f => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Size" error={errors.size}>
            <select value={form.size} onChange={e => set('size', e.target.value)} className={selectCls(false)}>
              <option value="">Select...</option>
              {SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Number of Tiers" error={errors.tiers}>
          <select value={form.tiers} onChange={e => set('tiers', e.target.value)} className={selectCls(false)}>
            <option value="">Select tiers...</option>
            {TIERS.map(t => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Custom message on cake" error={errors.cakeMessage}>
          <input
            type="text"
            value={form.cakeMessage}
            onChange={e => set('cakeMessage', e.target.value)}
            placeholder="e.g. Happy Birthday Rohit!"
            className={inputCls(false)}
          />
        </Field>
        <Field label="Design reference / Special instructions" error={errors.designNotes}>
          <textarea
            value={form.designNotes}
            onChange={e => set('designNotes', e.target.value)}
            placeholder="Describe the design, colours, theme, reference photo link, etc."
            rows={3}
            className={inputCls(false) + ' resize-none py-3 leading-relaxed h-auto'}
          />
        </Field>
      </Section>

      {/* Section 3: Order & Delivery */}
      <Section title="Order & Delivery" icon="🚚">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Order Date" error={errors.orderDate}>
            <input
              type="date"
              value={form.orderDate}
              onChange={e => set('orderDate', e.target.value)}
              className={inputCls(false)}
            />
          </Field>
          <Field label="Delivery Date" error={errors.deliveryDate}>
            <input
              type="date"
              value={form.deliveryDate}
              onChange={e => set('deliveryDate', e.target.value)}
              className={inputCls(false)}
            />
          </Field>
        </div>
        <Field label="Delivery Time" error={errors.deliveryTime}>
          <input
            type="time"
            value={form.deliveryTime}
            onChange={e => set('deliveryTime', e.target.value)}
            className={inputCls(false)}
          />
        </Field>

        {/* Delivery Type Toggle */}
        <div className="mb-1">
          <p className="text-xs font-semibold text-gray-500 mb-2">Delivery Type</p>
          <div className="flex rounded-xl overflow-hidden border border-[#EFEAE2] bg-[#FCFAF7] p-1 gap-1">
            {(['Home Delivery', 'Self Pickup'] as DeliveryType[]).map(dt => (
              <button
                key={dt}
                type="button"
                onClick={() => set('deliveryType', dt)}
                className={`flex-1 h-11 text-xs font-bold rounded-lg transition-all duration-200
                  ${form.deliveryType === dt
                    ? 'bg-gradient-to-r from-[#E78C85] to-[#D8A65C] text-white shadow-sm'
                    : 'text-gray-500 hover:text-[#2C1B12] hover:bg-white/50'}`}
              >
                {dt === 'Home Delivery' ? '🚚 Home Delivery' : '🏪 Self Pickup'}
              </button>
            ))}
          </div>
        </div>

        {form.deliveryType === 'Home Delivery' && (
          <Field label="Delivery Address" error={errors.deliveryAddress}>
            <textarea
              value={form.deliveryAddress}
              onChange={e => set('deliveryAddress', e.target.value)}
              placeholder="Full delivery address..."
              rows={2}
              className={inputCls(false) + ' resize-none py-3 leading-relaxed h-auto'}
            />
          </Field>
        )}
      </Section>

      {/* Section 4: Payment */}
      <Section title="Payment Details" icon="💰">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Total Price (₹)" required error={errors.totalPrice}>
            <input
              type="number"
              value={form.totalPrice}
              onChange={e => set('totalPrice', e.target.value)}
              placeholder="0"
              min="0"
              inputMode="numeric"
              className={inputCls(!!errors.totalPrice)}
            />
          </Field>
          <Field label="Advance Paid (₹)" error={errors.advancePaid}>
            <input
              type="number"
              value={form.advancePaid}
              onChange={e => set('advancePaid', e.target.value)}
              placeholder="0"
              min="0"
              inputMode="numeric"
              className={inputCls(false)}
            />
          </Field>
        </div>

        {/* Balance Due - Receipt Style Card */}
        <div 
          className={
            balanceDue > 0
              ? 'flex items-center justify-between px-4 py-3.5 rounded-xl border border-dashed border-[#E78C85]/40 bg-[#FDF6F5] transition-all duration-200'
              : 'flex items-center justify-between px-4 py-3.5 rounded-xl border border-dashed border-[#84A95B]/40 bg-[#F7FAF4] transition-all duration-200'
          }
        >
          <span 
            className={balanceDue > 0 ? 'text-[#AF5C54] text-xs font-bold uppercase tracking-wider' : 'text-[#4D6E32] text-xs font-bold uppercase tracking-wider'}
          >
            Balance Due
          </span>
          <span 
            className={balanceDue > 0 ? 'text-[#C55A4F] text-lg font-extrabold font-mono' : 'text-[#4D6E32] text-lg font-extrabold font-mono'}
          >
            ₹{balanceDue.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Payment Mode Pills */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Payment Mode</p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_MODES.map(pm => (
              <button
                key={pm}
                type="button"
                onClick={() => set('paymentMode', form.paymentMode === pm ? '' : pm)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all duration-200 active:scale-95
                  ${form.paymentMode === pm
                    ? 'bg-[#E78C85] text-white border-transparent shadow-sm'
                    : 'bg-[#FCFAF7] text-gray-600 border-[#EFEAE2] hover:border-[#D8A65C] hover:text-[#D8A65C]'
                  }`}
              >
                {pm}
              </button>
            ))}
          </div>
        </div>

        <Field label="Order Status" error={errors.status}>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value as OrderStatus)}
            className={selectCls(false)}
          >
            {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </Section>

      {/* Section 5: Additional Info */}
      <Section title="Additional Info" icon="📝">
        <Field label="How did customer find us?" error={errors.referralSource}>
          <select
            value={form.referralSource}
            onChange={e => set('referralSource', e.target.value)}
            className={selectCls(false)}
          >
            <option value="">Select source...</option>
            {REFERRAL_SOURCES.map(r => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Internal notes / remarks" error={errors.notes}>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any internal notes for this order..."
            rows={3}
            className={inputCls(false) + ' resize-none py-3 leading-relaxed h-auto'}
          />
        </Field>
      </Section>

      {/* Sticky Submit Button */}
      <div className="fixed bottom-[68px] left-0 right-0 max-w-lg mx-auto px-4 pb-3 pt-4 bg-[#FDFBF7]/90 backdrop-blur-md border-t border-[#EFEAE2]/60 z-20 safe-bottom">
        <button
          type="submit"
          disabled={saving}
          className="w-full h-13 rounded-xl bg-gradient-to-r from-[#E78C85] to-[#D8A65C] hover:from-[#EE9B94] hover:to-[#E5B573] text-white font-bold text-sm shadow-md shadow-[#E78C85]/20 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Spinner size={18} />
              <span>Saving Order...</span>
            </>
          ) : (
            <>
              <span className="text-base">✓</span>
              <span>Save Order</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 mb-5 bg-white rounded-2xl border border-[#FAF2E6] shadow-premium hover:shadow-premium-hover transition-all duration-300 overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[#FAF2E6] bg-[#FAF2E6]/30">
        <span className="text-lg">{icon}</span>
        <h2 className="text-xs font-bold text-[#2C1B12] tracking-wider uppercase font-sans">{title}</h2>
      </div>
      <div className="px-4 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-gray-500">
        {label} {required && <span className="text-[#C55A4F]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-[#C55A4F] font-semibold">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full h-12 px-4 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#D8A65C]/10
    ${hasError
      ? 'border-[#C55A4F] bg-[#FCEBEA] focus:border-[#C55A4F] text-[#AF5C54]'
      : 'border-[#EFEAE2] bg-[#FCFAF7] focus:border-[#D8A65C] focus:bg-white text-[#2C1B12]'
    }`;
}

function selectCls(hasError: boolean) {
  return `w-full h-12 px-4 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#D8A65C]/10 appearance-none bg-no-repeat bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%238c6239%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[right_12px_center] bg-[length:20px_20px] pr-10
    ${hasError
      ? 'border-[#C55A4F] bg-[#FCEBEA] focus:border-[#C55A4F] text-[#AF5C54]'
      : 'border-[#EFEAE2] bg-[#FCFAF7] focus:border-[#D8A65C] focus:bg-white text-[#2C1B12]'
    }`;
}
