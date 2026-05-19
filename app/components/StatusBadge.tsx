import React from 'react';
import { OrderStatus } from '../types/order';

const STATUS_STYLES: Record<OrderStatus, string> = {
  'Pending':          'bg-amber-100 text-amber-700 border-amber-300',
  'Confirmed':        'bg-blue-100 text-blue-700 border-blue-300',
  'In progress':      'bg-[#FCEBEA] text-[#C55A4F] border-[#E78C85]/30',
  'Ready for pickup': 'bg-green-100 text-green-700 border-green-300',
  'Out for delivery': 'bg-teal-100 text-teal-700 border-teal-300',
  'Delivered':        'bg-green-700 text-white border-green-800',
  'Cancelled':        'bg-red-100 text-red-700 border-red-300',
};

export default function StatusBadge({ status, small = false }: { status: OrderStatus; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center border rounded-full font-semibold whitespace-nowrap
        ${small ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'}
        ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600 border-gray-300'}`}
    >
      {status}
    </span>
  );
}
