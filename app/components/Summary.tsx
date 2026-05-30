'use client';

import React, { useMemo } from 'react';
import { Order } from '../types/order';
import { formatCurrency, getMonthKey } from '../utils/orderHelpers';

interface SummaryProps {
  orders: Order[];
}

export default function Summary({ orders }: SummaryProps) {
  const stats = useMemo(() => {
    const active = orders.filter(o =>
      ['Pending', 'Confirmed', 'In progress'].includes(o.status)
    );
    const nonCancelled = orders.filter(o => o.status !== 'Cancelled');
    const delivered = orders.filter(o => o.status === 'Delivered');
    const cancelled = orders.filter(o => o.status === 'Cancelled');

    const totalRevenue = nonCancelled.reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);
    const amountCollected = nonCancelled.reduce((s, o) => s + (Number(o.advancePaid) || 0), 0);
    const amountDue = nonCancelled.reduce((s, o) => s + (Number(o.balanceDue) || 0), 0);
    const avgOrder = nonCancelled.length > 0 ? Math.round(totalRevenue / nonCancelled.length) : 0;
    const cupcakeOrders = orders.filter(o => o.cakeCategory === 'Cup cake');
    const cupcakes = cupcakeOrders.length;
    const cupcakePieces = cupcakeOrders.reduce((s, o) => s + (Number(o.cupcakeQty) || 0), 0);

    return { active, delivered, cancelled, totalRevenue, amountCollected, amountDue, avgOrder, cupcakes, cupcakePieces };
  }, [orders]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.cakeCategory) counts[o.cakeCategory] = (counts[o.cakeCategory] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [orders]);

  const monthlyData = useMemo(() => {
    const months: { key: string; label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = getMonthKey(d);
      const label = d.toLocaleDateString('en-IN', { month: 'short' });
      const count = orders.filter(o => {
        const oDate = o.orderDate || o.savedAt?.split('T')[0] || '';
        return oDate.startsWith(key);
      }).length;
      months.push({ key, label, count });
    }
    return months;
  }, [orders]);

  const deliveryData = useMemo(() => {
    const home = orders.filter(o => o.deliveryType === 'Home Delivery').length;
    const pickup = orders.filter(o => o.deliveryType === 'Self Pickup').length;
    const total = home + pickup;
    return { home, pickup, total };
  }, [orders]);

  const areaData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (o.area?.trim()) counts[o.area.trim()] = (counts[o.area.trim()] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [orders]);

  const maxCategoryCount = categoryData[0]?.[1] || 1;
  const maxMonthlyCount = Math.max(...monthlyData.map(m => m.count), 1);

  return (
    <div className="pb-24 px-4 pt-4 space-y-5 bg-[#FAF8F5]">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Total Orders" value={orders.length} icon="📋" />
        <MetricCard label="Active Orders" value={stats.active.length} icon="🔥" color="purple" />
        <MetricCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon="💰" color="green" />
        <MetricCard label="Amount Collected" value={formatCurrency(stats.amountCollected)} icon="✅" color="green" />
        <MetricCard label="Amount Due" value={formatCurrency(stats.amountDue)} icon="⏳" color={stats.amountDue > 0 ? 'red' : 'green'} />
        <MetricCard label="Delivered" value={stats.delivered.length} icon="🎉" color="green" />
        <MetricCard label="Cancelled" value={stats.cancelled.length} icon="❌" color={stats.cancelled.length > 0 ? 'red' : undefined} />
        <MetricCard label="Avg Order Value" value={formatCurrency(stats.avgOrder)} icon="📊" color="blue" />
        <MetricCard label="Cup Cake Orders" value={stats.cupcakes} icon="🧁" color="purple" />
        <MetricCard label="Cup Cake Pieces" value={stats.cupcakePieces} icon="🧁" color="blue" />
      </div>

      {/* Top Cake Categories */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#FAF2E6] shadow-premium p-4">
          <h3 className="text-xs font-bold text-[#2C1B12] uppercase tracking-wider mb-4 font-sans">Top Cake Categories</h3>
          <div className="space-y-3">
            {categoryData.map(([cat, count]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 font-semibold truncate pr-2 flex-1">{cat}</span>
                  <span className="text-xs font-bold text-[#8C6239] shrink-0">{count}</span>
                </div>
                <div className="h-2 bg-[#FCFAF7] border border-[#EFEAE2]/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#E78C85] to-[#D8A65C] rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxCategoryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Order Trend */}
      <div className="bg-white rounded-2xl border border-[#FAF2E6] shadow-premium p-4">
        <h3 className="text-xs font-bold text-[#2C1B12] uppercase tracking-wider mb-4 font-sans">Monthly Order Trend</h3>
        <div className="flex items-end gap-2 h-28 pt-2">
          {monthlyData.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-[#8C6239]">{m.count > 0 ? m.count : ''}</span>
              <div className="w-full bg-[#FCFAF7] border border-[#EFEAE2]/30 rounded-t-lg overflow-hidden" style={{ height: '80px' }}>
                <div
                  className="w-full bg-gradient-to-t from-[#E78C85] to-[#D8A65C] rounded-t-lg transition-all duration-500"
                  style={{ height: `${(m.count / maxMonthlyCount) * 80}px`, marginTop: `${80 - (m.count / maxMonthlyCount) * 80}px` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-bold tracking-wide uppercase mt-0.5">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery vs Pickup */}
      {deliveryData.total > 0 && (
        <div className="bg-white rounded-2xl border border-[#FAF2E6] shadow-premium p-4">
          <h3 className="text-xs font-bold text-[#2C1B12] uppercase tracking-wider mb-4 font-sans">Delivery vs Pickup</h3>
          <div className="flex items-center gap-6">
            <DonutChart
              home={deliveryData.home}
              pickup={deliveryData.pickup}
              total={deliveryData.total}
            />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#E78C85]" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Home Delivery</p>
                  <p className="text-sm font-bold text-[#2C1B12]">
                    {deliveryData.home} ({Math.round((deliveryData.home / deliveryData.total) * 100)}%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#D8A65C]" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Self Pickup</p>
                  <p className="text-sm font-bold text-[#2C1B12]">
                    {deliveryData.pickup} ({Math.round((deliveryData.pickup / deliveryData.total) * 100)}%)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Areas */}
      {areaData.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#FAF2E6] shadow-premium p-4">
          <h3 className="text-xs font-bold text-[#2C1B12] uppercase tracking-wider mb-3 font-sans">Top Customer Areas</h3>
          <div className="space-y-2">
            {areaData.map(([area, count], i) => (
              <div key={area} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#FAF2E6] text-[#8C6239] text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700 font-semibold">{area}</span>
                <span className="text-xs font-bold text-[#8C6239] bg-[#FAF2E6] px-2.5 py-1 rounded-full">{count} orders</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-sm font-bold text-[#2C1B12]">No data yet</p>
          <p className="text-xs text-gray-400 mt-1">Create your first order to see insights</p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon, color }: {
  label: string; value: string | number; icon: string; color?: 'purple' | 'green' | 'red' | 'blue';
}) {
  const colorMap = {
    purple: 'bg-[#FCEBEA] text-[#C55A4F] border-[#FCEBEA]',
    green: 'bg-[#F7FAF4] text-[#4D6E32] border-[#F7FAF4]',
    red: 'bg-[#FDF6F5] text-[#C55A4F] border-[#FDF6F5]',
    blue: 'bg-[#FCFAF7] text-[#8C6239] border-[#FAF2E6]',
  };
  const cls = color ? colorMap[color] : 'bg-white text-gray-800 border-[#FAF2E6] shadow-premium';

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 hover:shadow-premium-hover ${cls}`}>
      <p className="text-[10px] font-bold tracking-wide uppercase opacity-75 mb-1.5">{label}</p>
      <div className="flex items-center justify-between">
        <p className="text-lg font-extrabold leading-tight">{value}</p>
        <span className="text-xl">{icon}</span>
      </div>
    </div>
  );
}

function DonutChart({ home, pickup, total }: { home: number; pickup: number; total: number }) {
  const r = 40;
  const circumference = 2 * Math.PI * r;
  const homePct = home / total;
  const homeArc = homePct * circumference;
  const pickupArc = circumference - homeArc;
  const gap = 2;

  return (
    <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
      {/* Pickup arc */}
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke="#D8A65C"
        strokeWidth="14"
        strokeDasharray={`${pickupArc - gap} ${homeArc + gap}`}
        strokeDashoffset={-(homeArc + gap / 2)}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      {/* Home delivery arc */}
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke="#E78C85"
        strokeWidth="14"
        strokeDasharray={`${homeArc - gap} ${pickupArc + gap}`}
        strokeDashoffset={gap / 2}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="55" textAnchor="middle" fontSize="14" fontWeight="bold" className="font-sans font-extrabold" fill="#160E0A">{total}</text>
    </svg>
  );
}
