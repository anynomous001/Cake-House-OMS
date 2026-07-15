'use client';

import React, { useState } from 'react';
import { Order, OrderStatus } from '../types/order';
import StatusBadge from './StatusBadge';
import { formatDate, formatTime, formatCurrency, getWhatsAppLink, buildReceiptText } from '../utils/orderHelpers';
import { useGoogleSheet } from '../hooks/useGoogleSheet';
import { Spinner } from './SettingsModal';
import EditOrderModal from './EditOrderModal';

function compressImage(file: File, maxWidth = 400, maxHeight = 400, quality = 0.6): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

const ALL_STATUSES: OrderStatus[] = [
  'Pending', 'Confirmed', 'In progress', 'Ready for pickup',
  'Out for delivery', 'Delivered', 'Cancelled',
];

interface OrderCardProps {
  order: Order;
  onStatusUpdated: (orderId: string, status: OrderStatus) => void;
  onOrderUpdated: (order: Order) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function OrderCard({ order, onStatusUpdated, onOrderUpdated, showToast }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { updateStatus, updateOrder } = useGoogleSheet();

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const compressedBase64 = await compressImage(file, 400, 400, 0.6);
      const updated: Order = {
        ...order,
        cakePhoto: compressedBase64,
      };
      const ok = await updateOrder(updated);
      if (ok) {
        onOrderUpdated(updated);
        showToast('success', 'Cake photo uploaded successfully!');
      } else {
        showToast('error', 'Failed to upload photo to sheet.');
      }
    } catch (err) {
      showToast('error', 'Error resizing image.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleRemovePhoto() {
    if (!confirm('Are you sure you want to remove the cake photo?')) return;
    setUploadingPhoto(true);
    try {
      const updated: Order = {
        ...order,
        cakePhoto: '',
      };
      const ok = await updateOrder(updated);
      if (ok) {
        onOrderUpdated(updated);
        showToast('success', 'Cake photo removed.');
      } else {
        showToast('error', 'Failed to remove photo from sheet.');
      }
    } catch {
      showToast('error', 'Error removing photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleStatusSelect(status: OrderStatus) {
    setShowStatusSheet(false);
    if (status === order.status) return;
    setUpdatingStatus(true);
    const ok = await updateStatus(order.orderId, status);
    setUpdatingStatus(false);
    if (ok) {
      onStatusUpdated(order.orderId, status);
      showToast('success', `Status updated to "${status}"`);
    } else {
      showToast('error', 'Failed to update status. Try again.');
    }
  }

  async function handleMarkFullyPaid() {
    setMarkingPaid(true);
    const updated: Order = {
      ...order,
      advancePaid: order.totalPrice,
      balanceDue: 0,
    };
    const ok = await updateOrder(updated);
    setMarkingPaid(false);
    if (ok) {
      onOrderUpdated(updated);
      showToast('success', 'Order marked as fully paid!');
    } else {
      showToast('error', 'Failed to update payment. Try again.');
    }
  }

  function handleShare() {
    const text = buildReceiptText(order);
    if (navigator.share) {
      navigator.share({ title: `Order ${order.orderId}`, text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      showToast('info', 'Receipt text copied to clipboard!');
    }
  }

  function handleDownloadPDF() {
    const html = buildReceiptHtml(order);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-[11px] text-gray-400 font-mono">{order.orderId}</span>
              <span className="mx-2 text-gray-200">·</span>
              <span className="text-[11px] text-gray-400">{formatDate(order.orderDate)}</span>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[17px] font-bold text-gray-900 leading-tight">{order.customerName}</h3>
            <div className="flex items-center gap-1.5">
              {/* WhatsApp */}
              <a
                href={getWhatsAppLink(order.phone, order)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-100 active:scale-90 transition-all"
                title="Open WhatsApp"
              >
                <WhatsAppIcon />
              </a>
              {/* Edit order */}
              <button
                onClick={() => setShowEditModal(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#EEF2FB] text-[#4A6FA5] hover:bg-[#4A6FA5] hover:text-white active:scale-90 transition-all duration-200"
                title="Update order"
              >
                <EditOrderIcon />
              </button>
              {/* Status update */}
              <button
                onClick={() => setShowStatusSheet(true)}
                disabled={updatingStatus}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#FAF2E6] text-[#8C6239] hover:bg-[#E78C85] hover:text-white active:scale-90 transition-all duration-200 disabled:opacity-50"
                title="Update status"
              >
                {updatingStatus ? <Spinner size={14} color="#8C6239" /> : <StatusIcon />}
              </button>
            </div>
          </div>

          {/* Phone + eye toggle */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <a
              href={showSensitive ? `tel:${order.phone}` : undefined}
              onClick={!showSensitive ? (e) => e.preventDefault() : undefined}
              className="text-sm text-[#8C6239] hover:text-[#E78C85] font-semibold transition-colors duration-200 tracking-wide"
            >
              {showSensitive ? order.phone : maskPhone(order.phone)}
            </a>
            <button
              onClick={() => setShowSensitive(v => !v)}
              className="text-gray-300 hover:text-[#8C6239] transition-colors duration-200 flex items-center"
              title={showSensitive ? 'Hide details' : 'Show phone & address'}
            >
              {showSensitive ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Key Info Row */}
        <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1">
          {order.cakeCategory && <InfoChip label="Cake" value={order.cakeCategory} />}
          {order.cakeCategory === 'Cup cake' && order.cupcakeQty > 0 && (
            <InfoChip label="Pieces" value={String(order.cupcakeQty)} />
          )}
          {order.flavour && <InfoChip label="Flavour" value={order.flavour} />}
          {order.cakeCategory !== 'Cup cake' && order.size && <InfoChip label="Size" value={order.size} />}
          {!order.cakeCategory && !order.flavour && !order.size && (
            <span className="text-[11px] text-gray-400 italic">No cake details</span>
          )}
        </div>

        {/* Delivery Row */}
        <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1">
          <InfoChip
            label={order.deliveryType === 'Home Delivery' ? '🚚 Delivery' : '🏪 Pickup'}
            value={formatDate(order.deliveryDate) + (order.deliveryTime ? ' · ' + formatTime(order.deliveryTime) : '')}
          />
          {order.area && <InfoChip label="Area" value={showSensitive ? order.area : '••••••'} />}
        </div>

        {/* Payment Row */}
        <div className="px-4 pb-3 flex gap-3">
          <PriceChip label="Total" value={formatCurrency(order.totalPrice)} />
          <PriceChip label="Paid" value={formatCurrency(order.advancePaid)} color="green" />
          <PriceChip
            label="Balance"
            value={formatCurrency(order.balanceDue)}
            color={order.balanceDue > 0 ? 'red' : 'green'}
          />
        </div>

        {/* Mark Fully Paid — shown when balance > 0 */}
        {order.balanceDue > 0 && (
          <div className="px-4 pb-3">
            <button
              onClick={handleMarkFullyPaid}
              disabled={markingPaid}
              className="w-full h-10 rounded-xl bg-[#EAF3DE] text-[#3B6D11] border border-[#84A95B]/30 font-bold text-xs hover:bg-[#3B6D11] hover:text-white active:scale-95 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {markingPaid ? <Spinner size={13} color="#3B6D11" /> : <CheckIcon />}
              {markingPaid ? 'Updating...' : `Mark as Fully Paid · ${formatCurrency(order.totalPrice)}`}
            </button>
          </div>
        )}

        {/* Expanded Details */}
        {expanded && (
          <div className="px-4 pb-3 border-t border-gray-50 pt-3 space-y-2">
            {order.occasion && <DetailRow label="Occasion" value={order.occasion} />}
            {order.tiers && <DetailRow label="Tiers" value={order.tiers} />}
            {order.cakeMessage && <DetailRow label="Cake message" value={order.cakeMessage} />}
            {order.designNotes && <DetailRow label="Design notes" value={order.designNotes} />}
            {order.deliveryType === 'Home Delivery' && order.deliveryAddress && (
              <DetailRow label="Delivery address" value={showSensitive ? order.deliveryAddress : '••••••••••••••••'} />
            )}
            {order.paymentMode && <DetailRow label="Payment mode" value={order.paymentMode} />}
            {order.referralSource && <DetailRow label="Found us via" value={order.referralSource} />}
            {order.notes && <DetailRow label="Notes" value={order.notes} />}

            {/* Cake Photo Section */}
            <div className="border-t border-gray-50 pt-3 mt-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Cake Photo</p>
              {order.cakePhoto ? (
                <div className="space-y-2">
                  <div className="relative w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center py-1">
                    <img src={order.cakePhoto} alt="Cake" className="w-full h-auto max-h-72 object-contain" />
                    <button
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-sm"
                      title="Remove Photo"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#FAF2E6] hover:border-[#D8A65C] rounded-xl py-6 cursor-pointer hover:bg-[#FDFAF6] transition-colors">
                    <span className="text-2xl mb-1">📷</span>
                    <span className="text-xs font-bold text-gray-500">Upload Cake Photo</span>
                    <span className="text-[9px] text-gray-400 mt-0.5">JPEG / PNG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>
                  {uploadingPhoto && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Spinner size={14} color="#D8A65C" />
                      <span className="text-xs text-gray-400 font-medium">Uploading photo...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card Footer */}
        <div className="flex border-t border-gray-50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 py-3 text-xs font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
          >
            {expanded ? '▲ Less' : '▼ More details'}
          </button>
          <div className="w-px bg-gray-50" />
          <button
            onClick={() => setShowReceipt(true)}
            className="flex-1 py-3 text-xs font-bold text-[#E78C85] hover:bg-[#FCEBEA] transition-colors duration-200"
          >
            View Receipt
          </button>
        </div>
      </div>

      {/* Status Bottom Sheet */}
      {showStatusSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowStatusSheet(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl shadow-2xl pb-8">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
            <h3 className="text-center font-bold text-gray-900 mb-4 px-6 font-sans text-sm tracking-wide">Update Order Status</h3>
            <div className="px-4 space-y-2">
              {ALL_STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusSelect(s)}
                  className={`w-full h-12 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95
                    ${s === order.status
                      ? 'bg-gradient-to-r from-[#E78C85] to-[#D8A65C] text-white shadow-sm'
                      : 'bg-[#FCFAF7] text-gray-700 hover:bg-[#FAF2E6] hover:text-[#8C6239]'
                    }`}
                >
                  {s === order.status ? `✓ ${s}` : s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReceipt(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1 sm:hidden" />
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 font-sans text-sm">Order Receipt</h3>
              <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <div className="text-center mb-4">
                <img src="/logo.jpg" alt="Tota Cake House" className="w-14 h-14 object-contain rounded-full mx-auto mb-1" />
                <p className="text-base font-bold text-[#160E0A] font-serif">Tota Cake House</p>
                <p className="text-xs text-[#8C6239] font-medium tracking-wide uppercase font-sans mt-0.5">Maslandapur, West Bengal</p>
              </div>
              <div className="bg-[#FCFAF7] border border-[#FAF2E6] rounded-xl p-4 space-y-2 text-sm">
                <ReceiptRow label="Order ID" value={order.orderId || '-'} mono />
                <ReceiptRow label="Date" value={formatDate(order.orderDate)} />
                <ReceiptRow label="Customer" value={order.customerName || '-'} />
                <div className="border-t border-[#FAF2E6] pt-2 mt-2">
                  <ReceiptRow label="Cake" value={[
                    order.cakeCategory,
                    order.cakeCategory === 'Cup cake' && order.cupcakeQty > 0 ? `${order.cupcakeQty} pcs` : order.size,
                    order.flavour,
                  ].filter(Boolean).join(' · ') || '-'} />
                  <ReceiptRow label="Delivery" value={`${order.deliveryType} · ${formatDate(order.deliveryDate)}${order.deliveryTime ? ' · ' + formatTime(order.deliveryTime) : ''}`} />
                </div>
                <div className="border-t border-[#FAF2E6] pt-2 mt-2">
                  <ReceiptRow label="Total" value={formatCurrency(order.totalPrice)} bold />
                  {order.paymentMode && <ReceiptRow label="Payment" value={order.paymentMode} />}
                  <ReceiptRow label="Status" value={order.status} />
                </div>
                {order.cakePhoto && (
                  <div className="border-t border-[#FAF2E6] pt-2 mt-2 flex flex-col items-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase self-start mb-1">Cake Photo</p>
                    <img src={order.cakePhoto} alt="Cake" className="w-full max-h-36 object-contain rounded-lg border border-gray-100" />
                  </div>
                )}
              </div>
              <p className="text-center text-[10px] text-gray-400 font-sans mt-4">Thank you for your order!</p>
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-100">
              <button
                onClick={handleShare}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#E78C85] to-[#D8A65C] text-white font-bold text-xs hover:scale-[1.01] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1"
              >
                Share
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 h-12 rounded-xl bg-[#EEF2FB] text-[#4A6FA5] border border-[#4A6FA5]/20 font-bold text-xs hover:bg-[#4A6FA5] hover:text-white active:scale-95 transition-all duration-200 flex items-center justify-center gap-1"
              >
                <DownloadIcon /> PDF
              </button>
              <a
                href={getWhatsAppLink(order.phone, order)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-12 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-700 hover:scale-[1.01] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1"
              >
                <WhatsAppIcon /> WA
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && (
        <EditOrderModal
          order={order}
          onClose={() => setShowEditModal(false)}
          onOrderUpdated={onOrderUpdated}
          showToast={showToast}
        />
      )}
    </>
  );
}


function buildReceiptHtml(order: Order): string {
  const fmtDate = (d: string) => {
    if (!d) return '-';
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
  };
  const fmtTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };
  const fmtCur = (n: number) => `&#8377;${Number(n || 0).toLocaleString('en-IN')}`;
  const row = (label: string, value: string, extraStyle = '') =>
    `<div class="row"><span class="label">${label}</span><span class="value" style="${extraStyle}">${value}</span></div>`;
  const opt = (cond: boolean | string | undefined, content: string) => (cond ? content : '');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Receipt - ${order.orderId}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff;color:#1a1a1a;padding:28px 24px;max-width:420px;margin:0 auto}
  .header{text-align:center;margin-bottom:20px}
  .logo{width:60px;height:60px;object-fit:contain;border-radius:50%;margin-bottom:6px}
  .brand{font-size:20px;font-weight:700;color:#160E0A}
  .subtitle{font-size:11px;color:#8C6239;text-transform:uppercase;letter-spacing:2px;margin-top:3px}
  hr{border:none;border-top:1px dashed #d8c9b5;margin:14px 0}
  .section{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#8C6239;margin:14px 0 6px}
  .row{display:flex;justify-content:space-between;align-items:baseline;padding:3px 0}
  .label{font-size:12px;color:#666;flex-shrink:0;margin-right:12px}
  .value{font-size:12px;font-weight:600;color:#1a1a1a;text-align:right}
  .mono{font-family:monospace}
  .bold{font-weight:700;font-size:14px}
  .footer{text-align:center;margin-top:20px;font-size:11px;color:#8C6239;font-weight:600;letter-spacing:.5px}
  @media print{body{padding:16px}}
</style>
</head>
<body>
<div class="header">
  <img class="logo" src="${window.location.origin}/logo.jpg" alt="Tota Cake House" />
  <div class="brand">Tota Cake House</div>
  <div class="subtitle">Maslandapur, West Bengal</div>
</div>
<hr>
${row('Order ID', order.orderId, 'font-family:monospace')}
${row('Date', fmtDate(order.orderDate))}
${row('Customer', order.customerName)}
<hr>
${row('Cake', [
    order.cakeCategory,
    order.cakeCategory === 'Cup cake' && order.cupcakeQty > 0 ? `${order.cupcakeQty} pcs` : order.size,
    order.flavour,
  ].filter(Boolean).join(' · ') || '-')}
${row('Delivery', `${order.deliveryType} · ${fmtDate(order.deliveryDate)}${order.deliveryTime ? ' · ' + fmtTime(order.deliveryTime) : ''}`)}
<hr>
${row('Total', fmtCur(order.totalPrice), 'font-weight:700;font-size:15px')}
${opt(order.paymentMode, row('Payment', order.paymentMode))}
${row('Status', order.status)}
${order.cakePhoto ? `
<hr>
<div class="section">Cake Photo</div>
<div style="text-align: center; margin: 10px 0;">
  <img src="${order.cakePhoto}" style="max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 8px;" />
</div>
` : ''}
<hr>
<div class="footer">Thank you for ordering from Tota Cake House!</div>
<script>window.onload=function(){window.print();}</script>
</body>
</html>`;
}

function maskPhone(phone: string) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '••••';
  return digits.slice(0, 2) + '••••••' + digits.slice(-2);
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[11px] text-gray-400">{label}:</span>
      <span className="text-[11px] text-gray-700 font-semibold">{value}</span>
    </div>
  );
}

function PriceChip({ label, value, color }: { label: string; value: string; color?: 'green' | 'red' }) {
  return (
    <div className={`flex-1 rounded-xl px-2.5 py-1.5 text-center
      ${color === 'green' ? 'bg-[#EAF3DE]' : color === 'red' ? 'bg-[#FCEBEB]' : 'bg-gray-50'}`}
    >
      <p className="text-[10px] text-gray-400 font-medium">{label}</p>
      <p className={`text-sm font-bold
        ${color === 'green' ? 'text-[#3B6D11]' : color === 'red' ? 'text-[#A32D2D]' : 'text-gray-800'}`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-xs text-gray-700 font-medium">{value}</span>
    </div>
  );
}

function ReceiptRow({ label, value, mono, bold, color }: { label: string; value: string; mono?: boolean; bold?: boolean; color?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span
        className={`text-xs text-right ${bold ? 'font-bold' : 'font-medium'} ${mono ? 'font-mono' : ''}`}
        style={color ? { color } : {}}
      >
        {value}
      </span>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function EditOrderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="15" height="15">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function StatusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
