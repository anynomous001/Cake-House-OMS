'use client';

import React, { useState, useMemo } from 'react';
import { Order } from '../types/order';
import { useInvestment } from '../hooks/useInvestment';
import { useInvestmentEntries } from '../hooks/useInvestmentEntries';
import { formatCurrency } from '../utils/orderHelpers';

interface InvestmentProps {
  orders: Order[];
}

const UNITS = ['kg', 'g', 'litre', 'ml', 'pcs', 'dozen', 'pack'];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function orderMonthKey(o: Order): string {
  const d = new Date(o.savedAt || o.orderDate || '');
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric',
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function Investment({ orders }: InvestmentProps) {
  const { materials } = useInvestment();
  const { entries, syncing, addEntry, deleteEntry } = useInvestmentEntries();

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [form, setForm] = useState({
    date: todayStr(),
    materialName: '',
    unit: 'kg',
    pricePerUnit: '',
    quantity: '',
  });

  // All months that have either orders or investment entries
  const months = useMemo(() => {
    const seen = new Set<string>();
    entries.forEach(e => seen.add(monthKey(e.date)));
    orders.filter(o => o.status !== 'Cancelled').forEach(o => {
      const k = orderMonthKey(o);
      if (k) seen.add(k);
    });
    const cur = currentMonthKey();
    seen.add(cur);
    return Array.from(seen).sort((a, b) => b.localeCompare(a));
  }, [entries, orders]);

  // Investment entries for selected month, sorted newest date first
  const monthEntries = useMemo(() => {
    return entries
      .filter(e => monthKey(e.date) === selectedMonth)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, selectedMonth]);

  // Month-wise investment totals
  const investmentByMonth = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach(e => {
      const k = monthKey(e.date);
      map.set(k, (map.get(k) || 0) + e.pricePerUnit * e.quantity);
    });
    return map;
  }, [entries]);

  const monthInvestment = investmentByMonth.get(selectedMonth) || 0;

  // Revenue for selected month
  const monthRevenue = useMemo(() => {
    return orders
      .filter(o => o.status !== 'Cancelled' && orderMonthKey(o) === selectedMonth)
      .reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);
  }, [orders, selectedMonth]);

  const profit = monthRevenue - monthInvestment;
  const profitPositive = profit >= 0;

  // All-time totals for the breakdown list
  const allTimeInvestment = useMemo(() =>
    entries.reduce((s, e) => s + e.pricePerUnit * e.quantity, 0),
    [entries]
  );
  const allTimeRevenue = useMemo(() =>
    orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + (Number(o.totalPrice) || 0), 0),
    [orders]
  );

  // Month breakdown list (all months with data)
  const monthBreakdown = useMemo(() => {
    const allMonths = new Set<string>([...Array.from(investmentByMonth.keys())]);
    orders.filter(o => o.status !== 'Cancelled').forEach(o => {
      const k = orderMonthKey(o);
      if (k) allMonths.add(k);
    });
    return Array.from(allMonths)
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({
        key,
        label: monthLabel(key),
        revenue: orders
          .filter(o => o.status !== 'Cancelled' && orderMonthKey(o) === key)
          .reduce((s, o) => s + (Number(o.totalPrice) || 0), 0),
        investment: investmentByMonth.get(key) || 0,
      }));
  }, [investmentByMonth, orders]);

  function handleAdd() {
    if (!form.materialName.trim() || !form.quantity || !form.date) return;
    addEntry({
      date: form.date,
      materialName: form.materialName.trim(),
      unit: form.unit,
      pricePerUnit: Number(form.pricePerUnit) || 0,
      quantity: Number(form.quantity),
    });
    // Switch to the month of the added entry
    setSelectedMonth(monthKey(form.date));
    setForm({ date: todayStr(), materialName: '', unit: 'kg', pricePerUnit: '', quantity: '' });
    setShowAddForm(false);
  }

  // Quick-fill material name from catalog
  const catalogNames = materials.map(m => m.name);

  return (
    <div className="pb-28 px-4 pt-4 space-y-4 bg-[#FAF8F5]">

      {/* Sync indicator */}
      {syncing && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#FAF2E6] rounded-xl">
          <span className="w-2 h-2 rounded-full bg-[#D8A65C] animate-pulse shrink-0" />
          <p className="text-xs text-gray-400 font-medium">Syncing with Google Sheets…</p>
        </div>
      )}

      {/* Month Picker */}
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Month</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {months.map(m => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200
                ${selectedMonth === m
                  ? 'bg-gradient-to-r from-[#E78C85] to-[#D8A65C] text-white shadow-sm'
                  : 'bg-white border border-[#EFEAE2] text-gray-500 hover:border-[#D8A65C] hover:text-[#D8A65C]'
                }`}
            >
              {monthLabel(m)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard label="Revenue" value={formatCurrency(monthRevenue)} icon="💰" color="green" />
        <SummaryCard label="Invested" value={formatCurrency(monthInvestment)} icon="🧾" color="amber" />
        <SummaryCard
          label={profitPositive ? 'Profit' : 'Loss'}
          value={formatCurrency(Math.abs(profit))}
          icon={profitPositive ? '📈' : '📉'}
          color={profitPositive ? 'green' : 'red'}
        />
      </div>

      {/* Investment Entries for selected month */}
      <div className="bg-white rounded-2xl border border-[#FAF2E6] shadow-premium overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#FAF2E6]">
          <div>
            <h3 className="text-xs font-bold text-[#2C1B12] uppercase tracking-wider">Purchases</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">{monthLabel(selectedMonth)}</p>
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1 text-xs font-bold text-[#D8A65C] hover:text-[#E78C85] transition-colors"
          >
            <span className="text-base leading-none">{showAddForm ? '✕' : '+'}</span>
            {showAddForm ? 'Cancel' : 'Log Purchase'}
          </button>
        </div>

        {/* Add Purchase Form */}
        {showAddForm && (
          <div className="px-4 py-3 bg-[#FDFAF6] border-b border-[#FAF2E6] space-y-2">
            {/* Date */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Date</p>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full text-sm border border-[#E5DDD5] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#D8A65C] font-medium text-[#2C1B12]"
              />
            </div>

            {/* Material name with catalog suggestions */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Material</p>
              <input
                type="text"
                list="material-suggestions"
                placeholder="e.g. Butter, Sugar..."
                value={form.materialName}
                onChange={e => {
                  const name = e.target.value;
                  setForm(p => {
                    const match = materials.find(m => m.name.toLowerCase() === name.toLowerCase());
                    return {
                      ...p,
                      materialName: name,
                      unit: match ? match.unit : p.unit,
                      pricePerUnit: match ? String(match.pricePerUnit) : p.pricePerUnit,
                    };
                  });
                }}
                className="w-full text-sm border border-[#E5DDD5] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#D8A65C] font-medium text-[#2C1B12]"
              />
              <datalist id="material-suggestions">
                {catalogNames.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>

            {/* Unit + Price/unit + Qty */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Unit</p>
                <select
                  value={form.unit}
                  onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                  className="w-full text-sm border border-[#E5DDD5] rounded-xl px-2 py-2 bg-white focus:outline-none focus:border-[#D8A65C] text-[#2C1B12] font-medium"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">₹ / unit</p>
                <input
                  type="number"
                  placeholder="0"
                  value={form.pricePerUnit}
                  onChange={e => setForm(p => ({ ...p, pricePerUnit: e.target.value }))}
                  className="w-full text-sm border border-[#E5DDD5] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#D8A65C] text-[#2C1B12] font-medium"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Qty</p>
                <input
                  type="number"
                  placeholder="0"
                  value={form.quantity}
                  onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                  className="w-full text-sm border border-[#E5DDD5] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#D8A65C] text-[#2C1B12] font-medium"
                />
              </div>
            </div>

            {/* Preview total */}
            {form.quantity && form.pricePerUnit && (
              <div className="flex items-center justify-between px-3 py-2 bg-[#FAF2E6] rounded-xl">
                <span className="text-xs text-[#8C6239] font-semibold">
                  {form.quantity} {form.unit} × {formatCurrency(Number(form.pricePerUnit))}
                </span>
                <span className="text-sm font-extrabold text-[#2C1B12]">
                  {formatCurrency(Number(form.quantity) * Number(form.pricePerUnit))}
                </span>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={!form.materialName.trim() || !form.quantity || !form.date}
              className="w-full py-2.5 bg-gradient-to-r from-[#E78C85] to-[#D8A65C] text-white text-sm font-bold rounded-xl disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              Save Purchase
            </button>
          </div>
        )}

        {/* Entry rows for selected month */}
        {monthEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <div className="text-3xl mb-2">🧾</div>
            <p className="text-xs font-semibold text-gray-400">No purchases logged for {monthLabel(selectedMonth)}</p>
            <p className="text-[11px] text-gray-300 mt-0.5">Tap "Log Purchase" to add one</p>
          </div>
        ) : (
          <div className="divide-y divide-[#FAF2E6]">
            {monthEntries.map(e => {
              const total = e.pricePerUnit * e.quantity;
              return (
                <div key={e.id} className="flex items-center px-4 py-3 gap-3">
                  <div className="shrink-0 text-center">
                    <p className="text-[10px] font-bold text-[#D8A65C] uppercase">{formatDate(e.date).split(' ')[1]}</p>
                    <p className="text-sm font-extrabold text-[#2C1B12] leading-tight">{formatDate(e.date).split(' ')[0]}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#2C1B12] truncate">{e.materialName}</p>
                    <p className="text-[11px] text-gray-400">
                      {e.quantity} {e.unit}
                      {e.pricePerUnit > 0 && <span> · {formatCurrency(e.pricePerUnit)}/{e.unit}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-[#2C1B12]">{formatCurrency(total)}</span>
                    <button
                      onClick={() => deleteEntry(e.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Month investment total */}
        {monthInvestment > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#2C1B12] rounded-b-2xl">
            <span className="text-xs font-bold text-[#D8A65C] uppercase tracking-wider">
              {monthLabel(selectedMonth)} Investment
            </span>
            <span className="text-sm font-extrabold text-white">{formatCurrency(monthInvestment)}</span>
          </div>
        )}
      </div>

      {/* Month-wise Breakdown */}
      {monthBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#FAF2E6] shadow-premium overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-[#FAF2E6]">
            <h3 className="text-xs font-bold text-[#2C1B12] uppercase tracking-wider">Month Summary</h3>
          </div>
          <div className="divide-y divide-[#FAF2E6]">
            {monthBreakdown.map(({ key, label, revenue, investment }) => {
              const p = revenue - investment;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedMonth(key)}
                  className={`w-full px-4 py-3 text-left transition-colors
                    ${selectedMonth === key ? 'bg-[#FAF2E6]' : 'hover:bg-[#FDFAF6]'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {selectedMonth === key && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D8A65C] shrink-0" />
                      )}
                      <span className="text-sm font-bold text-[#2C1B12]">{label}</span>
                    </div>
                    <span className={`text-xs font-bold ${p >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {p >= 0 ? '+' : '−'}{formatCurrency(Math.abs(p))}
                    </span>
                  </div>
                  <div className="flex gap-4 pl-3.5">
                    <span className="text-[11px] text-gray-400">Rev <span className="text-[#2C1B12] font-semibold">{formatCurrency(revenue)}</span></span>
                    <span className="text-[11px] text-gray-400">Inv <span className="text-[#8C6239] font-semibold">{formatCurrency(investment)}</span></span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-[#2C1B12] rounded-b-2xl">
            <div>
              <p className="text-[10px] font-bold text-[#D8A65C] uppercase tracking-wider">All-time</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Net {allTimeRevenue - allTimeInvestment >= 0 ? 'Profit' : 'Loss'}{' '}
                <span className={allTimeRevenue - allTimeInvestment >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatCurrency(Math.abs(allTimeRevenue - allTimeInvestment))}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Rev <span className="text-white font-bold">{formatCurrency(allTimeRevenue)}</span></p>
              <p className="text-[10px] text-gray-400">Inv <span className="text-[#D8A65C] font-bold">{formatCurrency(allTimeInvestment)}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Price Catalog (collapsible reference) */}
      <div className="bg-white rounded-2xl border border-[#FAF2E6] shadow-premium overflow-hidden">
        <button
          onClick={() => setShowCatalog(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <h3 className="text-xs font-bold text-[#2C1B12] uppercase tracking-wider">Price Catalog</h3>
          <span className="text-xs text-gray-400 font-semibold">{showCatalog ? 'Hide ▲' : 'Show ▼'}</span>
        </button>
        {showCatalog && (
          <div className="divide-y divide-[#FAF2E6] border-t border-[#FAF2E6]">
            {materials.map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 py-2.5">
                <p className="text-sm font-semibold text-[#2C1B12]">{m.name}</p>
                <p className="text-xs text-gray-400 font-medium">
                  {formatCurrency(m.pricePerUnit)}<span className="text-gray-300">/{m.unit}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function SummaryCard({ label, value, icon, color }: {
  label: string; value: string; icon: string;
  color: 'green' | 'amber' | 'red';
}) {
  const colorMap = {
    green: 'bg-[#F7FAF4] text-[#4D6E32] border-[#EDF5E6]',
    amber: 'bg-[#FDFAF6] text-[#8C6239] border-[#FAF2E6]',
    red: 'bg-[#FDF6F5] text-[#C55A4F] border-[#FCEBEA]',
  };
  return (
    <div className={`rounded-2xl border p-3 ${colorMap[color]}`}>
      <p className="text-[9px] font-bold tracking-wide uppercase opacity-70 mb-1">{label}</p>
      <p className="text-base font-extrabold leading-tight truncate">{value}</p>
      <span className="text-lg mt-1 block">{icon}</span>
    </div>
  );
}
