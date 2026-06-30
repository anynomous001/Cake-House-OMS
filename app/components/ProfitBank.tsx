'use client';

import React, { useState, useMemo } from 'react';
import { useProfitBank } from '../hooks/useProfitBank';
import { PaymentMode } from '../types/profitBank';
import { formatCurrency } from '../utils/orderHelpers';

const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'];

const MODE_ICON: Record<PaymentMode, string> = {
  Cash: '💵',
  UPI: '📱',
  'Bank Transfer': '🏦',
  Card: '💳',
  Other: '•',
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric',
  });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ProfitBank() {
  const { entries, syncing, addEntry, deleteEntry } = useProfitBank();

  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [showForm, setShowForm] = useState(false);
  const [entryType, setEntryType] = useState<'credit' | 'debit'>('credit');
  const [form, setForm] = useState({ date: todayStr(), amount: '', note: '', mode: 'Cash' as PaymentMode });

  // All unique months from entries + current month, newest first
  const months = useMemo(() => {
    const seen = new Set<string>([currentMonthKey()]);
    entries.forEach(e => seen.add(e.date.slice(0, 7)));
    return Array.from(seen).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  // Entries for selected month, sorted newest date first
  const monthEntries = useMemo(() => {
    return entries
      .filter(e => e.date.slice(0, 7) === selectedMonth)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [entries, selectedMonth]);

  // Month stats
  const monthIn  = monthEntries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
  const monthOut = monthEntries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
  const monthNet = monthIn - monthOut;

  // All-time balance
  const allTimeIn  = entries.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
  const allTimeOut = entries.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
  const allTimeBalance = allTimeIn - allTimeOut;

  // Month breakdown list (all months with data)
  const monthBreakdown = useMemo(() => {
    const seen = new Set<string>();
    entries.forEach(e => seen.add(e.date.slice(0, 7)));
    return Array.from(seen)
      .sort((a, b) => b.localeCompare(a))
      .map(key => {
        const bucket = entries.filter(e => e.date.slice(0, 7) === key);
        const inAmt  = bucket.filter(e => e.type === 'credit').reduce((s, e) => s + e.amount, 0);
        const outAmt = bucket.filter(e => e.type === 'debit').reduce((s, e) => s + e.amount, 0);
        return { key, label: monthLabel(key), in: inAmt, out: outAmt, net: inAmt - outAmt };
      });
  }, [entries]);

  function handleAdd() {
    const amt = Number(form.amount);
    if (!amt || !form.date) return;
    addEntry({ date: form.date, amount: amt, type: entryType, mode: form.mode, note: form.note.trim() });
    setSelectedMonth(form.date.slice(0, 7));
    setForm({ date: todayStr(), amount: '', note: '', mode: 'Cash' });
    setShowForm(false);
  }

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
        <SummaryCard label="Added" value={formatCurrency(monthIn)} icon="⬆️" color="green" />
        <SummaryCard label="Spent" value={formatCurrency(monthOut)} icon="⬇️" color="red" />
        <SummaryCard
          label={monthNet >= 0 ? 'Balance' : 'Deficit'}
          value={formatCurrency(Math.abs(monthNet))}
          icon={monthNet >= 0 ? '🏦' : '⚠️'}
          color={monthNet >= 0 ? 'amber' : 'red'}
        />
      </div>

      {/* Entries for selected month */}
      <div className="bg-white rounded-2xl border border-[#FAF2E6] shadow-premium overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#FAF2E6]">
          <div>
            <h3 className="text-xs font-bold text-[#2C1B12] uppercase tracking-wider">Transactions</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">{monthLabel(selectedMonth)}</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1 text-xs font-bold text-[#D8A65C] hover:text-[#E78C85] transition-colors"
          >
            <span className="text-base leading-none">{showForm ? '✕' : '+'}</span>
            {showForm ? 'Cancel' : 'Add Entry'}
          </button>
        </div>

        {/* Add Entry Form */}
        {showForm && (
          <div className="px-4 py-3 bg-[#FDFAF6] border-b border-[#FAF2E6] space-y-3">

            {/* Type Toggle */}
            <div className="flex rounded-xl overflow-hidden border border-[#E5DDD5]">
              <button
                onClick={() => setEntryType('credit')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all
                  ${entryType === 'credit'
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-400 hover:text-green-600'
                  }`}
              >
                ⬆ Add Money
              </button>
              <button
                onClick={() => setEntryType('debit')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-l border-[#E5DDD5]
                  ${entryType === 'debit'
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-400 hover:text-red-500'
                  }`}
              >
                ⬇ Deduct Money
              </button>
            </div>

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

            {/* Amount */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Amount (₹)</p>
              <input
                type="number"
                placeholder="0"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full text-sm border border-[#E5DDD5] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#D8A65C] font-medium text-[#2C1B12]"
              />
            </div>

            {/* Mode */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Mode</p>
              <div className="flex gap-1.5 flex-wrap">
                {PAYMENT_MODES.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, mode: m }))}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all
                      ${form.mode === m
                        ? 'bg-[#2C1B12] text-[#D8A65C]'
                        : 'bg-white border border-[#E5DDD5] text-gray-500 hover:border-[#D8A65C] hover:text-[#D8A65C]'
                      }`}
                  >
                    <span>{MODE_ICON[m]}</span> {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Note (optional)</p>
              <input
                type="text"
                placeholder="e.g. Weekly profit transfer, Market run..."
                value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                className="w-full text-sm border border-[#E5DDD5] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#D8A65C] font-medium text-[#2C1B12]"
              />
            </div>

            {/* Preview */}
            {form.amount && Number(form.amount) > 0 && (
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl
                ${entryType === 'credit' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}
              >
                <span className={`text-xs font-semibold ${entryType === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                  {entryType === 'credit' ? '⬆ Adding' : '⬇ Deducting'}
                </span>
                <span className={`text-sm font-extrabold ${entryType === 'credit' ? 'text-green-700' : 'text-red-600'}`}>
                  {formatCurrency(Number(form.amount))}
                </span>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={!form.amount || Number(form.amount) <= 0 || !form.date}
              className={`w-full py-2.5 text-white text-sm font-bold rounded-xl disabled:opacity-40 active:scale-[0.98] transition-all
                ${entryType === 'credit'
                  ? 'bg-gradient-to-r from-green-500 to-green-400'
                  : 'bg-gradient-to-r from-red-500 to-red-400'
                }`}
            >
              {entryType === 'credit' ? 'Save — Add Money' : 'Save — Deduct Money'}
            </button>
          </div>
        )}

        {/* Entry rows */}
        {monthEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <div className="text-3xl mb-2">🏦</div>
            <p className="text-xs font-semibold text-gray-400">No entries for {monthLabel(selectedMonth)}</p>
            <p className="text-[11px] text-gray-300 mt-0.5">Tap "Add Entry" to record a transaction</p>
          </div>
        ) : (
          <div className="divide-y divide-[#FAF2E6]">
            {monthEntries.map(e => (
              <div key={e.id} className="flex items-center px-4 py-3 gap-3">
                {/* Date badge */}
                <div className="shrink-0 text-center w-9">
                  <p className="text-[10px] font-bold text-[#D8A65C] uppercase leading-tight">
                    {formatDate(e.date).split(' ')[1]}
                  </p>
                  <p className="text-sm font-extrabold text-[#2C1B12] leading-tight">
                    {formatDate(e.date).split(' ')[0]}
                  </p>
                </div>

                {/* Type dot + note */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${e.type === 'credit' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#2C1B12] truncate">
                      {e.note || (e.type === 'credit' ? 'Money added' : 'Money deducted')}
                    </p>
                    <p className={`text-[10px] font-bold uppercase tracking-wide ${e.type === 'credit' ? 'text-green-500' : 'text-red-400'}`}>
                      {e.type === 'credit' ? 'Added' : 'Deducted'}
                      {e.mode && (
                        <span className="text-gray-400 normal-case font-semibold tracking-normal">
                          {' · '}{MODE_ICON[e.mode as PaymentMode] ?? ''} {e.mode}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Amount + delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-sm font-extrabold ${e.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                    {e.type === 'credit' ? '+' : '−'}{formatCurrency(e.amount)}
                  </span>
                  <button
                    onClick={() => deleteEntry(e.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-red-200 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Month total row */}
        {monthEntries.length > 0 && (
          <div className={`flex items-center justify-between px-4 py-3 rounded-b-2xl
            ${monthNet >= 0 ? 'bg-[#2C1B12]' : 'bg-red-900'}`}
          >
            <span className="text-xs font-bold text-[#D8A65C] uppercase tracking-wider">
              {monthLabel(selectedMonth)} Balance
            </span>
            <span className={`text-sm font-extrabold ${monthNet >= 0 ? 'text-white' : 'text-red-200'}`}>
              {monthNet >= 0 ? '' : '−'}{formatCurrency(Math.abs(monthNet))}
            </span>
          </div>
        )}
      </div>

      {/* Month-wise Breakdown */}
      {monthBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#FAF2E6] shadow-premium overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-[#FAF2E6]">
            <h3 className="text-xs font-bold text-[#2C1B12] uppercase tracking-wider">Month Breakdown</h3>
          </div>
          <div className="divide-y divide-[#FAF2E6]">
            {monthBreakdown.map(({ key, label, in: inAmt, out, net }) => (
              <button
                key={key}
                onClick={() => setSelectedMonth(key)}
                className={`w-full px-4 py-3 text-left transition-colors
                  ${selectedMonth === key ? 'bg-[#FAF2E6]' : 'hover:bg-[#FDFAF6]'}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {selectedMonth === key && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D8A65C] shrink-0" />
                    )}
                    <span className="text-sm font-bold text-[#2C1B12]">{label}</span>
                  </div>
                  <span className={`text-xs font-extrabold ${net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net))}
                  </span>
                </div>
                <div className="flex gap-4 pl-3.5">
                  <span className="text-[11px] text-gray-400">
                    In <span className="text-green-600 font-semibold">{formatCurrency(inAmt)}</span>
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Out <span className="text-red-500 font-semibold">{formatCurrency(out)}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* All-time balance footer */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#2C1B12] rounded-b-2xl">
            <div>
              <p className="text-[10px] font-bold text-[#D8A65C] uppercase tracking-wider">Total Balance</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                In <span className="text-green-400 font-semibold">{formatCurrency(allTimeIn)}</span>
                {'  '}Out <span className="text-red-400 font-semibold">{formatCurrency(allTimeOut)}</span>
              </p>
            </div>
            <span className={`text-lg font-extrabold ${allTimeBalance >= 0 ? 'text-white' : 'text-red-300'}`}>
              {allTimeBalance >= 0 ? '' : '−'}{formatCurrency(Math.abs(allTimeBalance))}
            </span>
          </div>
        </div>
      )}

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
    red:   'bg-[#FDF6F5] text-[#C55A4F] border-[#FCEBEA]',
  };
  return (
    <div className={`rounded-2xl border p-3 ${colorMap[color]}`}>
      <p className="text-[9px] font-bold tracking-wide uppercase opacity-70 mb-1">{label}</p>
      <p className="text-base font-extrabold leading-tight truncate">{value}</p>
      <span className="text-lg mt-1 block">{icon}</span>
    </div>
  );
}
