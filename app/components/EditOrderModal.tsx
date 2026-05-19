'use client';

import React, { useState, useCallback } from 'react';
import { Order, OrderStatus, DeliveryType } from '../types/order';
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

interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
  onOrderUpdated: (order: Order) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function EditOrderModal({ order, onClose, onOrderUpdated, showToast }: EditOrderModalProps) {
  const [form, setForm] = useState<FormState>({
    customerName: order.customerName,
    phone: order.phone,
    area: order.area,
    cakeCategory: order.cakeCategory,
    occasion: order.occasion,
    flavour: order.flavour,
    size: order.size,
    tiers: order.tiers,
    cakeMessage: order.cakeMessage,
    designNotes: order.designNotes,
    orderDate: order.orderDate,
    deliveryDate: order.deliveryDate,
    deliveryTime: order.deliveryTime,
    deliveryType: order.deliveryType,
    deliveryAddress: order.deliveryAddress,
    totalPrice: String(order.totalPrice || ''),
    advancePaid: String(order.advancePaid || ''),
    paymentMode: order.paymentMode,
    status: order.status,
    referralSource: order.referralSource,
    notes: order.notes,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const { updateOrder } = useGoogleSheet();

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
      showToast('warning', 'Please fix the errors before saving');
      return;
    }

    setSaving(true);

    const updated: Order = {
      ...order,
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
      orderDate: form.orderDate,
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
    };

    const ok = await updateOrder(updated);
    setSaving(false);

    if (ok) {
      onOrderUpdated(updated);
      showToast('success', `Order ${order.orderId} updated!`);
      onClose();
    } else {
      showToast('error', 'Failed to update order. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Update Order</h3>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{order.orderId}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Scrollable form */}
        <form id="edit-order-form" onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1">
          <div className="px-5 py-4 space-y-4">

            {/* Customer */}
            <SectionTitle title="Customer Details" />
            <Field label="Customer Name" required error={errors.customerName}>
              <input type="text" value={form.customerName} onChange={e => set('customerName', e.target.value)}
                placeholder="e.g. Rahul Das" className={inputCls(!!errors.customerName)} />
            </Field>
            <Field label="WhatsApp Number" error={errors.phone}>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="10-digit mobile number" maxLength={10} inputMode="numeric" className={inputCls(!!errors.phone)} />
            </Field>
            <Field label="Area / Locality">
              <input type="text" value={form.area} onChange={e => set('area', e.target.value)}
                placeholder="Habra, Barasat, Ashoknagar..." className={inputCls(false)} />
            </Field>

            {/* Cake */}
            <SectionTitle title="Cake Details" />
            <Field label="Cake Category">
              <select value={form.cakeCategory} onChange={e => set('cakeCategory', e.target.value)} className={selectCls(false)}>
                <option value="">Select category...</option>
                {CAKE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Occasion">
              <select value={form.occasion} onChange={e => set('occasion', e.target.value)} className={selectCls(false)}>
                <option value="">Select occasion...</option>
                {OCCASIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Flavour">
                <select value={form.flavour} onChange={e => set('flavour', e.target.value)} className={selectCls(false)}>
                  <option value="">Select...</option>
                  {FLAVOURS.map(f => <option key={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="Size">
                <select value={form.size} onChange={e => set('size', e.target.value)} className={selectCls(false)}>
                  <option value="">Select...</option>
                  {SIZES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Number of Tiers">
              <select value={form.tiers} onChange={e => set('tiers', e.target.value)} className={selectCls(false)}>
                <option value="">Select tiers...</option>
                {TIERS.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Custom message on cake">
              <input type="text" value={form.cakeMessage} onChange={e => set('cakeMessage', e.target.value)}
                placeholder="e.g. Happy Birthday Rohit!" className={inputCls(false)} />
            </Field>
            <Field label="Design reference / Special instructions">
              <textarea value={form.designNotes} onChange={e => set('designNotes', e.target.value)}
                placeholder="Describe design, colours, theme..." rows={3}
                className={inputCls(false) + ' resize-none py-3 leading-relaxed h-auto'} />
            </Field>

            {/* Delivery */}
            <SectionTitle title="Order & Delivery" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Order Date">
                <input type="date" value={form.orderDate} onChange={e => set('orderDate', e.target.value)} className={inputCls(false)} />
              </Field>
              <Field label="Delivery Date">
                <input type="date" value={form.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} className={inputCls(false)} />
              </Field>
            </div>
            <Field label="Delivery Time">
              <input type="time" value={form.deliveryTime} onChange={e => set('deliveryTime', e.target.value)} className={inputCls(false)} />
            </Field>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Delivery Type</p>
              <div className="flex rounded-xl overflow-hidden border border-[#EFEAE2] bg-[#FCFAF7] p-1 gap-1">
                {(['Home Delivery', 'Self Pickup'] as DeliveryType[]).map(dt => (
                  <button key={dt} type="button" onClick={() => set('deliveryType', dt)}
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
              <Field label="Delivery Address">
                <textarea value={form.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)}
                  placeholder="Full delivery address..." rows={2}
                  className={inputCls(false) + ' resize-none py-3 leading-relaxed h-auto'} />
              </Field>
            )}

            {/* Payment */}
            <SectionTitle title="Payment Details" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Total Price (₹)">
                <input type="number" value={form.totalPrice} onChange={e => set('totalPrice', e.target.value)}
                  placeholder="0" min="0" inputMode="numeric" className={inputCls(false)} />
              </Field>
              <Field label="Advance Paid (₹)">
                <input type="number" value={form.advancePaid} onChange={e => set('advancePaid', e.target.value)}
                  placeholder="0" min="0" inputMode="numeric" className={inputCls(false)} />
              </Field>
            </div>
            <div className={balanceDue > 0
              ? 'flex items-center justify-between px-4 py-3.5 rounded-xl border border-dashed border-[#E78C85]/40 bg-[#FDF6F5]'
              : 'flex items-center justify-between px-4 py-3.5 rounded-xl border border-dashed border-[#84A95B]/40 bg-[#F7FAF4]'
            }>
              <span className={balanceDue > 0 ? 'text-[#AF5C54] text-xs font-bold uppercase tracking-wider' : 'text-[#4D6E32] text-xs font-bold uppercase tracking-wider'}>
                Balance Due
              </span>
              <span className={balanceDue > 0 ? 'text-[#C55A4F] text-lg font-extrabold font-mono' : 'text-[#4D6E32] text-lg font-extrabold font-mono'}>
                ₹{balanceDue.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Payment Mode</p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_MODES.map(pm => (
                  <button key={pm} type="button" onClick={() => set('paymentMode', form.paymentMode === pm ? '' : pm)}
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
            <Field label="Order Status">
              <select value={form.status} onChange={e => set('status', e.target.value as OrderStatus)} className={selectCls(false)}>
                {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>

            {/* Additional */}
            <SectionTitle title="Additional Info" />
            <Field label="How did customer find us?">
              <select value={form.referralSource} onChange={e => set('referralSource', e.target.value)} className={selectCls(false)}>
                <option value="">Select source...</option>
                {REFERRAL_SOURCES.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Internal notes / remarks">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Any internal notes for this order..." rows={3}
                className={inputCls(false) + ' resize-none py-3 leading-relaxed h-auto'} />
            </Field>
          </div>
        </form>

        {/* Footer buttons */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-[#EFEAE2] bg-[#FCFAF7] text-gray-600 font-bold text-sm hover:bg-gray-100 active:scale-95 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="edit-order-form"
            disabled={saving}
            className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-[#E78C85] to-[#D8A65C] text-white font-bold text-sm hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {saving ? <><Spinner size={16} /> Saving...</> : '✓ Update Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="text-xs font-bold text-[#8C6239] uppercase tracking-wider pt-1 pb-0.5 border-b border-[#FAF2E6]">
      {title}
    </p>
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
