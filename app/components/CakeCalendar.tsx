'use client';

import React, { useState, useMemo } from 'react';
import { Order } from '../types/order';
import { formatDate, formatTime } from '../utils/orderHelpers';

interface CakeCalendarProps {
  orders: Order[];
  onDateSelect: (date: string) => void;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLOR: Record<string, string> = {
  'Pending':          'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Confirmed':        'bg-blue-100 text-blue-700 border-blue-200',
  'In progress':      'bg-orange-100 text-orange-700 border-orange-200',
  'Ready for pickup': 'bg-purple-100 text-purple-700 border-purple-200',
  'Out for delivery': 'bg-pink-100 text-pink-700 border-pink-200',
  'Delivered':        'bg-green-100 text-green-700 border-green-200',
  'Cancelled':        'bg-gray-100 text-gray-400 border-gray-200',
};

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CakeCalendar({ orders, onDateSelect }: CakeCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Map deliveryDate → orders for quick lookup
  const byDate = useMemo(() => {
    const map: Record<string, Order[]> = {};
    orders.forEach(o => {
      if (!o.deliveryDate) return;
      const key = o.deliveryDate.split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(o);
    });
    return map;
  }, [orders]);

  const todayStr = toYMD(today);

  // Build calendar grid
  const { cells, monthLabel } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const label = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad end to complete last row
    while (cells.length % 7 !== 0) cells.push(null);
    return { cells, monthLabel: label };
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }
  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  function handleDayTap(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    if (byDate[dateStr]?.length > 0) {
      onDateSelect(dateStr);
    }
  }

  // Days with any orders this month (for dot indicator)
  const daysWithOrders = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-`;
    return new Set(
      Object.keys(byDate)
        .filter(k => k.startsWith(prefix))
        .map(k => parseInt(k.split('-')[2], 10))
    );
  }, [byDate, viewYear, viewMonth]);

  return (
    <div className="pb-28 bg-[#FAF8F5] min-h-full">
      {/* Month Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#EFEAE2]/60 shadow-sm px-4 py-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#FAF2E6] text-[#8C6239] active:scale-95 transition-all"
        >
          <ChevronLeft />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-[#2C1B12]">{monthLabel}</p>
          {(viewMonth !== today.getMonth() || viewYear !== today.getFullYear()) && (
            <button onClick={goToday} className="text-[10px] text-[#D8A65C] font-bold">Back to today</button>
          )}
        </div>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#FAF2E6] text-[#8C6239] active:scale-95 transition-all"
        >
          <ChevronRight />
        </button>
      </div>

      <div className="px-3 pt-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;

            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOrders = byDate[dateStr] || [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasOrders = dayOrders.length > 0;
            const first = dayOrders[0];
            const extra = dayOrders.length - 1;

            return (
              <button
                key={dateStr}
                onClick={() => handleDayTap(day)}
                className={`
                  relative flex flex-col items-center rounded-xl transition-all duration-150 active:scale-95 overflow-hidden
                  min-h-[72px] pt-1 pb-1.5 px-0.5
                  ${isSelected ? 'bg-[#2C1B12] shadow-lg' : hasOrders ? 'bg-white border border-[#FAF2E6] shadow-sm' : 'bg-transparent'}
                  ${!isSelected && !hasOrders ? 'hover:bg-[#FAF2E6]/50' : ''}
                `}
              >
                {/* Date number */}
                <span className={`
                  w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1
                  ${isToday && !isSelected ? 'bg-gradient-to-br from-[#E78C85] to-[#D8A65C] text-white' : ''}
                  ${isSelected ? 'text-white' : hasOrders ? 'text-[#2C1B12]' : 'text-gray-400'}
                `}>
                  {day}
                </span>

                {/* Order preview */}
                {hasOrders && (
                  <div className="w-full space-y-0.5 px-0.5">
                    <OrderChip order={first} selected={isSelected} />
                    {extra > 0 && (
                      <p className={`text-[9px] font-bold text-center ${isSelected ? 'text-[#D8A65C]' : 'text-[#8C6239]'}`}>
                        +{extra} more
                      </p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 mt-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#E78C85] to-[#D8A65C]" />
          <span className="text-[10px] text-gray-400 font-semibold">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-xl bg-white border border-[#FAF2E6] shadow-sm" />
          <span className="text-[10px] text-gray-400 font-semibold">Has deliveries</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-xl bg-[#2C1B12]" />
          <span className="text-[10px] text-gray-400 font-semibold">Selected</span>
        </div>
      </div>

      {/* Month summary */}
      <MonthSummary orders={orders} viewYear={viewYear} viewMonth={viewMonth} onDateSelect={onDateSelect} />
    </div>
  );
}

function OrderChip({ order, selected }: { order: Order; selected: boolean }) {
  const colorCls = selected
    ? 'bg-white/10 text-white border-white/20'
    : STATUS_COLOR[order.status] ?? 'bg-[#FAF2E6] text-[#8C6239] border-[#FAF2E6]';

  return (
    <div className={`rounded-md border px-1 py-0.5 ${colorCls}`}>
      <p className="text-[8px] font-bold leading-tight truncate">{order.customerName || 'Order'}</p>
      <p className="text-[7px] leading-tight truncate opacity-80">{order.cakeCategory || ''}</p>
    </div>
  );
}

function MonthSummary({ orders, viewYear, viewMonth, onDateSelect }: {
  orders: Order[];
  viewYear: number;
  viewMonth: number;
  onDateSelect: (date: string) => void;
}) {
  const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-`;
  const monthOrders = orders.filter(o => o.deliveryDate?.startsWith(prefix));

  if (monthOrders.length === 0) return null;

  // Group by date, sort ascending
  const grouped: Record<string, Order[]> = {};
  monthOrders.forEach(o => {
    const key = o.deliveryDate!.split('T')[0];
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(o);
  });
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="mx-3 mt-4 bg-white rounded-2xl border border-[#FAF2E6] shadow-premium overflow-hidden">
      <div className="px-4 py-3 border-b border-[#FAF2E6]">
        <h3 className="text-xs font-bold text-[#2C1B12] uppercase tracking-wider">
          Delivery Schedule — {monthOrders.length} order{monthOrders.length !== 1 ? 's' : ''}
        </h3>
      </div>
      <div className="divide-y divide-[#FAF2E6]">
        {sortedDates.map(date => {
          const dayOrders = grouped[date];
          return (
            <button
              key={date}
              onClick={() => onDateSelect(date)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#FDFAF6] active:bg-[#FAF2E6] transition-colors text-left"
            >
              <DateBadge date={date} />
              <div className="flex-1 min-w-0 space-y-1">
                {dayOrders.slice(0, 2).map(o => (
                  <div key={o.orderId} className="flex items-center gap-2">
                    <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${STATUS_COLOR[o.status] ?? ''}`}>
                      {o.status}
                    </span>
                    <span className="text-xs font-semibold text-[#2C1B12] truncate">{o.customerName}</span>
                    <span className="text-[10px] text-gray-400 truncate shrink-0">{o.cakeCategory}</span>
                  </div>
                ))}
                {dayOrders.length > 2 && (
                  <p className="text-[10px] text-[#8C6239] font-bold">+{dayOrders.length - 2} more orders</p>
                )}
              </div>
              <span className="text-[#D8A65C] text-sm shrink-0 mt-0.5">›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateBadge({ date }: { date: string }) {
  const d = new Date(date + 'T00:00:00');
  const day = d.getDate();
  const mon = d.toLocaleDateString('en-IN', { month: 'short' });
  const dow = d.toLocaleDateString('en-IN', { weekday: 'short' });
  return (
    <div className="shrink-0 w-10 flex flex-col items-center bg-[#FAF2E6] rounded-xl py-1.5">
      <span className="text-[9px] font-bold text-[#8C6239] uppercase">{mon}</span>
      <span className="text-base font-extrabold text-[#2C1B12] leading-tight">{day}</span>
      <span className="text-[8px] font-semibold text-gray-400 uppercase">{dow}</span>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
