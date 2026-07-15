'use client';

import { useState, useCallback } from 'react';
import { Order, OrderStatus } from '../types/order';
import { InvestmentEntry } from '../types/investment';
import { ProfitBankEntry } from '../types/profitBank';

const SHEET_URL_KEY = 'tch_sheet_url';
const HARDCODED_SHEET_URL = 'https://script.google.com/macros/s/AKfycbytMPnmaockIHadTk2tAb-_h77HxFRqWZXHcklQgBPWWGJauzejZeJpIER0fsP1V28G/exec';
const OLD_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxK8PQBG4zwjS45U6wGyw8DVGuBeE60XLUlxTFbyp3Sr_GjrI4gzcYObemX9BQmpgA/exec';

export function resetToDefaultSheetUrl() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SHEET_URL_KEY);
  }
}
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
  'Cake Photo': 'cakePhoto',
  'Photo': 'cakePhoto',
  'Cake Photo URL': 'cakePhoto',
  'Photo URL': 'cakePhoto',
};

const NUM_FIELDS = new Set(['totalPrice', 'advancePaid', 'balanceDue', 'cupcakeQty']);
const DATE_FIELDS = new Set(['orderDate', 'deliveryDate']);

function extractDate(val: unknown): string {
  const s = String(val || '').trim();
  if (!s) return '';

  // Case 1: ISO string or YYYY-MM-DD format
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    return isoMatch[1];
  }

  // Case 2: DD/MM/YYYY format
  const dmyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmyMatch) {
    const d = String(dmyMatch[1]).padStart(2, '0');
    const m = String(dmyMatch[2]).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Case 3: Other parseable date strings (e.g. GMT strings)
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return s;
}

function extractTime(val: unknown): string {
  const s = String(val || '').trim();
  if (!s) return '';
  // Match HH:MM in ISO or full datetime string
  const timeMatch = s.match(/(?:T|\b)(\d{2}:\d{2})(?::\d{2})?(?:\b|\.|\+|-)/);
  if (timeMatch) {
    return timeMatch[1];
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
    // Normalize date and time fields to standardized formats
    o.orderDate = extractDate(o.orderDate);
    o.deliveryDate = extractDate(o.deliveryDate);
    o.deliveryTime = extractTime(o.deliveryTime);
    o.phone = String(o.phone ?? '');
    o.totalPrice = Number(o.totalPrice) || 0;
    o.advancePaid = Number(o.advancePaid) || 0;
    o.balanceDue = Number(o.balanceDue) || 0;
    o.cupcakeQty = Number(o.cupcakeQty) || 0;
    o.cakePhoto = String(o.cakePhoto ?? '');
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
  order.cakePhoto = order.cakePhoto ?? '';
  if (!order.status) order.status = 'Pending';

  return order as unknown as Order;
}

export function useGoogleSheet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSheetUrl = useCallback((): string => {
    if (typeof window === 'undefined') return HARDCODED_SHEET_URL;
    const stored = localStorage.getItem(SHEET_URL_KEY);
    // Clear stale old deployment URL so hardcoded URL takes over
    if (stored === OLD_SHEET_URL) {
      localStorage.removeItem(SHEET_URL_KEY);
      return HARDCODED_SHEET_URL;
    }
    return stored || HARDCODED_SHEET_URL;
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

  // ─── Investment Entries ───────────────────────────────────────────────────

  const getInvestmentEntries = useCallback(async (): Promise<InvestmentEntry[]> => {
    const url = getSheetUrl();
    if (!url) return [];
    try {
      const res = await fetch(`${url}?action=getInvestmentEntries`);
      if (!res.ok) return [];
      const result = await res.json();
      return result.success ? (result.data as InvestmentEntry[]) : [];
    } catch {
      return [];
    }
  }, [getSheetUrl]);

  const addInvestmentEntry = useCallback(async (entry: InvestmentEntry): Promise<boolean> => {
    const url = getSheetUrl();
    if (!url) return false;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addInvestmentEntry', data: entry }),
      });
      if (!res.ok) return false;
      const result = await res.json();
      return result.success === true;
    } catch {
      return false;
    }
  }, [getSheetUrl]);

  const deleteInvestmentEntry = useCallback(async (id: string): Promise<boolean> => {
    const url = getSheetUrl();
    if (!url) return false;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'deleteInvestmentEntry', id }),
      });
      if (!res.ok) return false;
      const result = await res.json();
      return result.success === true;
    } catch {
      return false;
    }
  }, [getSheetUrl]);

  // ─── Profit Bank Entries ─────────────────────────────────────────────────

  const getProfitBankEntries = useCallback(async (): Promise<ProfitBankEntry[]> => {
    const url = getSheetUrl();
    if (!url) return [];
    try {
      const res = await fetch(`${url}?action=getProfitBankEntries`);
      if (!res.ok) return [];
      const result = await res.json();
      return result.success ? (result.data as ProfitBankEntry[]) : [];
    } catch {
      return [];
    }
  }, [getSheetUrl]);

  const addProfitBankEntry = useCallback(async (entry: ProfitBankEntry): Promise<boolean> => {
    const url = getSheetUrl();
    if (!url) return false;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addProfitBankEntry', data: entry }),
      });
      if (!res.ok) return false;
      const result = await res.json();
      return result.success === true;
    } catch {
      return false;
    }
  }, [getSheetUrl]);

  const deleteProfitBankEntry = useCallback(async (id: string): Promise<boolean> => {
    const url = getSheetUrl();
    if (!url) return false;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'deleteProfitBankEntry', id }),
      });
      if (!res.ok) return false;
      const result = await res.json();
      return result.success === true;
    } catch {
      return false;
    }
  }, [getSheetUrl]);

  return {
    loading, error, getSheetUrl, saveSheetUrl,
    addOrder, getOrders, updateStatus, updateOrder, testConnection,
    getInvestmentEntries, addInvestmentEntry, deleteInvestmentEntry,
    getProfitBankEntries, addProfitBankEntry, deleteProfitBankEntry,
  };
}
