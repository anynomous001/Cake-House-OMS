'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderStatus } from '../types/order';
import OrderCard from './OrderCard';
import { Spinner } from './SettingsModal';

type SortOption = 'newest' | 'oldest' | 'delivery';
type FilterOption = OrderStatus | 'All';

const FILTERS: FilterOption[] = [
  'All', 'Pending', 'Confirmed', 'In progress',
  'Ready for pickup', 'Out for delivery', 'Delivered', 'Cancelled',
];

interface OrderHistoryProps {
  orders: Order[];
  refreshing: boolean;
  onRefresh: () => void;
  onStatusUpdated: (orderId: string, status: OrderStatus) => void;
  onOrderUpdated: (order: Order) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  filterDate?: string | null;
  onClearFilterDate?: () => void;
}

export default function OrderHistory({
  orders, refreshing, onRefresh, onStatusUpdated, onOrderUpdated, showToast,
  filterDate, onClearFilterDate,
}: OrderHistoryProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterOption>('All');
  const [sort, setSort] = useState<SortOption>('newest');
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!fetched) {
      onRefresh();
      setFetched(true);
    }
  }, [fetched, onRefresh]);

  const filtered = useMemo(() => {
    let list = [...orders];

    // Calendar date filter takes priority — only show orders for that delivery date
    if (filterDate) {
      list = list.filter(o => o.deliveryDate?.split('T')[0] === filterDate);
      list.sort((a, b) => (a.deliveryDate || '').localeCompare(b.deliveryDate || ''));
      return list;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.customerName?.toLowerCase().includes(q) ||
        o.phone?.includes(q) ||
        o.orderId?.toLowerCase().includes(q) ||
        o.area?.toLowerCase().includes(q)
      );
    }

    if (filter !== 'All') {
      list = list.filter(o => o.status === filter);
    }

    list.sort((a, b) => {
      if (sort === 'newest') return (b.savedAt || b.orderDate || '').localeCompare(a.savedAt || a.orderDate || '');
      if (sort === 'oldest') return (a.savedAt || a.orderDate || '').localeCompare(b.savedAt || b.orderDate || '');
      if (sort === 'delivery') return (a.deliveryDate || '').localeCompare(b.deliveryDate || '');
      return 0;
    });

    return list;
  }, [orders, search, filter, sort, filterDate]);

  // Group orders by month (only when not in delivery-date sort or calendar filter mode)
  const groupedByMonth = useMemo(() => {
    if (filterDate || sort === 'delivery') return null;

    const map = new Map<string, Order[]>();
    filtered.forEach(o => {
      const d = new Date(o.savedAt || o.orderDate || '');
      const key = isNaN(d.getTime())
        ? 'unknown'
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    });

    const sortedKeys = Array.from(map.keys()).sort((a, b) =>
      sort === 'oldest' ? a.localeCompare(b) : b.localeCompare(a)
    );

    return sortedKeys.map(key => {
      let label = 'Unknown';
      if (key !== 'unknown') {
        const [y, m] = key.split('-');
        label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
          month: 'long', year: 'numeric',
        });
      }
      return { key, label, orders: map.get(key)! };
    });
  }, [filtered, filterDate, sort]);

  const filterDateLabel = filterDate
    ? new Date(filterDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    : null;

  return (
    <div className="bg-[#FAF8F5] pb-24">
      {/* Calendar filter banner */}
      {filterDate && (
        <div className="sticky top-0 z-20 bg-[#2C1B12] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">📅</span>
            <p className="text-xs font-bold text-white">Deliveries on {filterDateLabel}</p>
          </div>
          <button
            onClick={onClearFilterDate}
            className="text-xs font-bold text-[#D8A65C] hover:text-[#E78C85] transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
          >
            Clear ✕
          </button>
        </div>
      )}

      {/* Search + Refresh */}
      <div className={`sticky z-10 bg-[#FAF8F5] px-4 pt-3 pb-3 border-b border-[#EFEAE2]/60 shadow-sm ${filterDate ? 'top-[44px]' : 'top-0'}`}>
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, phone, order ID..."
              className="w-full h-11 pl-9 pr-4 rounded-xl border border-[#EFEAE2] bg-white text-sm focus:outline-none focus:border-[#D8A65C] focus:ring-4 focus:ring-[#D8A65C]/10 transition-all duration-200"
            />
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="w-11 h-11 rounded-xl border border-[#EFEAE2] bg-white flex items-center justify-center text-[#8C6239] hover:bg-[#FAF2E6] active:scale-95 transition-all duration-200 disabled:opacity-50 shadow-sm"
            title="Refresh"
          >
            {refreshing ? <Spinner size={16} color="#8C6239" /> : <RefreshIcon />}
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200
                ${filter === f
                  ? 'bg-gradient-to-r from-[#E78C85] to-[#D8A65C] text-white border-transparent shadow-sm'
                  : 'bg-white border border-[#EFEAE2] text-gray-500 hover:border-[#D8A65C] hover:text-[#D8A65C] hover:bg-[#FCFAF7]'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-400 font-semibold shrink-0">Sort:</span>
          {([
            ['newest', 'Newest first'],
            ['oldest', 'Oldest first'],
            ['delivery', 'Delivery date'],
          ] as [SortOption, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSort(val)}
              className={`text-xs px-3 py-1 rounded-full transition-all duration-200
                ${sort === val
                  ? 'bg-[#FAF2E6] text-[#8C6239] font-bold shadow-sm'
                  : 'text-gray-400 hover:text-[#8C6239]'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="px-4 py-2">
        <p className="text-xs text-gray-400 font-semibold">
          {refreshing ? 'Loading orders...' : `${filtered.length} order${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Order list */}
      {refreshing && orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-[#FAF8F5]">
          <Spinner size={32} color="#D8A65C" />
          <p className="mt-4 text-sm font-semibold">Loading orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState search={search} filter={filter} />
      ) : groupedByMonth ? (
        <div className="pt-2">
          {groupedByMonth.map(group => (
            <div key={group.key}>
              {/* Month header */}
              <div className="px-4 pt-4 pb-2 flex items-center gap-3">
                <span className="text-xs font-bold text-[#8C6239] uppercase tracking-wider">{group.label}</span>
                <span className="text-[10px] font-semibold text-gray-400 bg-[#FAF2E6] px-2 py-0.5 rounded-full">
                  {group.orders.length} order{group.orders.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="px-4 space-y-3">
                {group.orders.map(order => (
                  <OrderCard
                    key={order.orderId}
                    order={order}
                    onStatusUpdated={onStatusUpdated}
                    onOrderUpdated={onOrderUpdated}
                    showToast={showToast}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-3 pt-4">
          {filtered.map(order => (
            <OrderCard
              key={order.orderId}
              order={order}
              onStatusUpdated={onStatusUpdated}
              onOrderUpdated={onOrderUpdated}
              showToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ search, filter }: { search: string; filter: FilterOption }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4">🎂</div>
      <h3 className="text-base font-bold text-gray-700 mb-1">No orders found</h3>
      <p className="text-sm text-gray-400">
        {search
          ? `No results for "${search}"`
          : filter !== 'All'
          ? `No orders with status "${filter}"`
          : 'No orders yet. Create your first order!'}
      </p>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
