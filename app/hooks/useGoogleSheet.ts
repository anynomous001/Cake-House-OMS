'use client';

import { useState, useCallback } from 'react';
import { Order, OrderStatus } from '../types/order';

const SHEET_URL_KEY = 'tch_sheet_url';
const HARDCODED_SHEET_URL = 'https://script.google.com/macros/s/AKfycbwct5Tm_FTdh5Epcl47RbACRTGWNSqFJYsX-QpgKGJhKXyZHb7Bubw9w44jX3w6awOu/exec';
export const GOOGLE_SHEET_LINK = 'https://docs.google.com/spreadsheets/d/1KLU9ekrlTGxMsrH-TflvSVrLcK00rynPmMb8wPI87qw/edit?gid=0#gid=0';

export interface DiagnosticResult {
  connected: boolean;
  orderCount: number;
  fieldsSample: string[];
  missingFields: string[];
  error?: string;
}

const EXPECTED_FIELDS = [
  'orderId', 'customerName', 'phone', 'cakeCategory',
  'flavour', 'size', 'deliveryDate', 'deliveryType', 'totalPrice', 'status',
];

// Maps both our FIELD_MAP names AND the user's actual sheet column headers (with ₹, aliases etc.)
const RAW_HEADER_TO_FIELD: Record<string, string> = {
  'Order ID': 'orderId',
  'Order Date': 'orderDate',
  'Customer Name': 'customerName',
  'Phone': 'phone',
  'Area': 'area',
  'Area / Locality': 'area',
  'Cake Category': 'cakeCategory',
  'Category': 'cakeCategory',
  'Cake Type': 'cakeCategory',
  'Occasion': 'occasion',
  'Flavour': 'flavour',
  'Flavor': 'flavour',
  'Size': 'size',
  'Tiers': 'tiers',
  'Cupcake Qty': 'cupcakeQty',
  'Cupcake Pieces': 'cupcakeQty',
  'Cake Message': 'cakeMessage',
  'Design Notes': 'designNotes',
  'Delivery Date': 'deliveryDate',
  'Delivery Time': 'deliveryTime',
  'Delivery Type': 'deliveryType',
  'Delivery Address': 'deliveryAddress',
  'Total Price': 'totalPrice',
  'Total Price (₹)': 'totalPrice',
  'Advance Paid': 'advancePaid',
  'Advance Paid (₹)': 'advancePaid',
  'Balance Due': 'balanceDue',
  'Balance Due (₹)': 'balanceDue',
  'Payment Mode': 'paymentMode',
  'Status': 'status',
  'Order Status': 'status',
  'Referral Source': 'referralSource',
  'Notes': 'notes',
  'Saved At': 'savedAt',
};

const NUM_FIELDS = new Set(['totalPrice', 'advancePaid', 'balanceDue', 'cupcakeQty']);
const DATE_FIELDS = new Set(['orderDate', 'deliveryDate']);

function extractDate(val: unknown): string {
  const s = String(val || '');
  if (!s) return '';
  // Google Sheets returns dates as ISO: "2026-05-19T18:30:00.000Z" → take date part
  return s.includes('T') ? s.split('T')[0] : s;
}

function extractTime(val: unknown): string {
  const s = String(val || '');
  if (!s) return '';
  // Google Sheets returns times as "1899-12-30T14:54:50.000Z" → take HH:MM
  if (s.includes('T')) {
    return s.split('T')[1]?.substring(0, 5) || '';
  }
  return s;
}

// Handles two formats:
//   1. camelCase fields (our updated Code.gs) → pass through
//   2. Raw spreadsheet headers (user's older script) → remap
function normalizeOrder(raw: Record<string, unknown>): Order {
  // If it already has camelCase fields, it's from our updated Code.gs
  if ('orderId' in raw) {
    const o = { ...raw } as Record<string, unknown>;
    // Still fix dates in case they're ISO strings
    if (typeof o.orderDate === 'string' && o.orderDate.includes('T')) o.orderDate = extractDate(o.orderDate);
    if (typeof o.deliveryDate === 'string' && o.deliveryDate.includes('T')) o.deliveryDate = extractDate(o.deliveryDate);
    if (typeof o.deliveryTime === 'string' && o.deliveryTime.includes('T')) o.deliveryTime = extractTime(o.deliveryTime);
    o.phone = String(o.phone ?? '');
    o.totalPrice = Number(o.totalPrice) || 0;
    o.advancePaid = Number(o.advancePaid) || 0;
    o.balanceDue = Number(o.balanceDue) || 0;
    o.cupcakeQty = Number(o.cupcakeQty) || 0;
    return o as unknown as Order;
  }

  // Raw header format — remap using RAW_HEADER_TO_FIELD
  const order: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(raw)) {
    const field = RAW_HEADER_TO_FIELD[key];
    if (!field) continue;

    if (NUM_FIELDS.has(field)) {
      order[field] = Number(val) || 0;
    } else if (DATE_FIELDS.has(field)) {
      order[field] = extractDate(val);
    } else if (field === 'deliveryTime') {
      order[field] = extractTime(val);
    } else {
      order[field] = String(val ?? '');
    }
  }

  // Safe defaults
  order.totalPrice = order.totalPrice ?? 0;
  order.advancePaid = order.advancePaid ?? 0;
  order.balanceDue = order.balanceDue ?? 0;
  order.cupcakeQty = order.cupcakeQty ?? 0;
  if (!order.status) order.status = 'Pending';

  return order as unknown as Order;
}

export function useGoogleSheet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSheetUrl = useCallback((): string => {
    if (typeof window === 'undefined') return HARDCODED_SHEET_URL;
    return localStorage.getItem(SHEET_URL_KEY) || HARDCODED_SHEET_URL;
  }, []);

  const saveSheetUrl = useCallback((url: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SHEET_URL_KEY, url);
    }
  }, []);

  const addOrder = useCallback(
    async (orderData: Order): Promise<boolean> => {
      const url = getSheetUrl();
      if (!url) { setError('Google Sheet not configured'); return false; }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'addOrder', data: orderData }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.error || 'Unknown error');
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save order');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getSheetUrl]
  );

  const getOrders = useCallback(async (): Promise<Order[]> => {
    const url = getSheetUrl();
    if (!url) { setError('Google Sheet not configured'); return []; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${url}?action=getOrders`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Unknown error');
      const raw: Record<string, unknown>[] = result.data || [];
      return raw.map(normalizeOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      return [];
    } finally {
      setLoading(false);
    }
  }, [getSheetUrl]);

  const updateStatus = useCallback(
    async (orderId: string, status: OrderStatus): Promise<boolean> => {
      const url = getSheetUrl();
      if (!url) { setError('Google Sheet not configured'); return false; }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'updateStatus', orderId, status }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.error || 'Unknown error');
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update status');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getSheetUrl]
  );

  const updateOrder = useCallback(
    async (orderData: Order): Promise<boolean> => {
      const url = getSheetUrl();
      if (!url) { setError('Google Sheet not configured'); return false; }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({ action: 'updateOrder', data: orderData }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = await res.json();
        if (!result.success) throw new Error(result.error || 'Unknown error');
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update order');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getSheetUrl]
  );

  const testConnection = useCallback(async (url: string): Promise<DiagnosticResult> => {
    try {
      const res = await fetch(`${url}?action=getOrders`);
      if (!res.ok) return { connected: false, orderCount: 0, fieldsSample: [], missingFields: EXPECTED_FIELDS, error: `HTTP ${res.status}` };
      const result = await res.json();
      if (!result.success) return { connected: false, orderCount: 0, fieldsSample: [], missingFields: EXPECTED_FIELDS, error: result.error || 'Script returned failure' };

      const raw: Record<string, unknown>[] = result.data || [];
      const orderCount = raw.length;
      if (orderCount === 0) return { connected: true, orderCount: 0, fieldsSample: [], missingFields: [] };

      const first = normalizeOrder(raw[0]);
      const firstObj = first as unknown as Record<string, unknown>;
      const fieldsSample = Object.keys(firstObj).filter(k => firstObj[k] !== '' && firstObj[k] !== null && firstObj[k] !== 0);
      const missingFields = EXPECTED_FIELDS.filter(f => !firstObj[f] && firstObj[f] !== 0);

      return { connected: true, orderCount, fieldsSample, missingFields };
    } catch (err) {
      return {
        connected: false, orderCount: 0, fieldsSample: [], missingFields: EXPECTED_FIELDS,
        error: err instanceof Error ? err.message : 'Network error — check the URL',
      };
    }
  }, []);

  return { loading, error, getSheetUrl, saveSheetUrl, addOrder, getOrders, updateStatus, updateOrder, testConnection };
}
