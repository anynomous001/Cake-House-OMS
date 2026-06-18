'use client';

import React, { useState } from 'react';
import { Order } from '../types/order';
import { RawMaterial } from '../types/material';
import { useInvestment } from '../hooks/useInvestment';
import { formatCurrency } from '../utils/orderHelpers';

interface InvestmentProps {
  orders: Order[];
}

const UNITS = ['kg', 'g', 'litre', 'ml', 'pcs', 'dozen', 'pack'];

export default function Investment({ orders }: InvestmentProps) {
  const { materials, totalInvestment, updateMaterial, addMaterial, deleteMaterial } = useInvestment();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<RawMaterial>>({});
  const [newItem, setNewItem] = useState({ name: '', unit: 'kg', pricePerUnit: '', quantity: '' });

  const totalRevenue = orders
    .filter(o => o.status !== 'Cancelled')
    .reduce((s, o) => s + (Number(o.totalPrice) || 0), 0);

  const profit = totalRevenue - totalInvestment;
  const profitPositive = profit >= 0;

  function startEdit(m: RawMaterial) {
    setEditingId(m.id);
    setEditDraft({ ...m });
  }

  function saveEdit() {
    if (!editDraft.id) return;
    updateMaterial({
      id: editDraft.id,
      name: editDraft.name || '',
      unit: editDraft.unit || 'kg',
      pricePerUnit: Number(editDraft.pricePerUnit) || 0,
      quantity: Number(editDraft.quantity) || 0,
    });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft({});
  }

  function handleAdd() {
    if (!newItem.name.trim()) return;
    addMaterial({
      name: newItem.name.trim(),
      unit: newItem.unit,
      pricePerUnit: Number(newItem.pricePerUnit) || 0,
      quantity: Number(newItem.quantity) || 0,
    });
    setNewItem({ name: '', unit: 'kg', pricePerUnit: '', quantity: '' });
    setShowAddForm(false);
  }

  return (
    <div className="pb-28 px-4 pt-4 space-y-4 bg-[#FAF8F5]">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryCard
          label="Revenue"
          value={formatCurrency(totalRevenue)}
          icon="💰"
          color="green"
        />
        <SummaryCard
          label="Raw Cost"
          value={formatCurrency(totalInvestment)}
          icon="🧾"
          color="amber"
        />
        <SummaryCard
          label={profitPositive ? 'Profit' : 'Loss'}
          value={formatCurrency(Math.abs(profit))}
          icon={profitPositive ? '📈' : '📉'}
          color={profitPositive ? 'green' : 'red'}
        />
      </div>

      {/* Raw Materials List */}
      <div className="bg-white rounded-2xl border border-[#FAF2E6] shadow-premium overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#FAF2E6]">
          <h3 className="text-xs font-bold text-[#2C1B12] uppercase tracking-wider">Raw Materials</h3>
          <button
            onClick={() => { setShowAddForm(v => !v); setEditingId(null); }}
            className="flex items-center gap-1 text-xs font-bold text-[#D8A65C] hover:text-[#E78C85] transition-colors"
          >
            <span className="text-base leading-none">{showAddForm ? '✕' : '+'}</span>
            {showAddForm ? 'Cancel' : 'Add Item'}
          </button>
        </div>

        {/* Add New Item Form */}
        {showAddForm && (
          <div className="px-4 py-3 bg-[#FDFAF6] border-b border-[#FAF2E6] space-y-2">
            <input
              type="text"
              placeholder="Material name"
              value={newItem.name}
              onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))}
              className="w-full text-sm border border-[#E5DDD5] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#D8A65C] font-medium text-[#2C1B12]"
            />
            <div className="grid grid-cols-3 gap-2">
              <select
                value={newItem.unit}
                onChange={e => setNewItem(p => ({ ...p, unit: e.target.value }))}
                className="text-sm border border-[#E5DDD5] rounded-xl px-2 py-2 bg-white focus:outline-none focus:border-[#D8A65C] text-[#2C1B12] font-medium"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <input
                type="number"
                placeholder="Price/unit"
                value={newItem.pricePerUnit}
                onChange={e => setNewItem(p => ({ ...p, pricePerUnit: e.target.value }))}
                className="text-sm border border-[#E5DDD5] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#D8A65C] text-[#2C1B12] font-medium"
              />
              <input
                type="number"
                placeholder="Qty"
                value={newItem.quantity}
                onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))}
                className="text-sm border border-[#E5DDD5] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#D8A65C] text-[#2C1B12] font-medium"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newItem.name.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-[#E78C85] to-[#D8A65C] text-white text-sm font-bold rounded-xl disabled:opacity-40 active:scale-[0.98] transition-all"
            >
              Add Material
            </button>
          </div>
        )}

        {/* Material Rows */}
        <div className="divide-y divide-[#FAF2E6]">
          {materials.map(m => {
            const rowTotal = m.pricePerUnit * m.quantity;
            const isEditing = editingId === m.id;

            if (isEditing) {
              return (
                <div key={m.id} className="px-4 py-3 bg-[#FDFAF6] space-y-2">
                  <input
                    type="text"
                    value={editDraft.name ?? ''}
                    onChange={e => setEditDraft(p => ({ ...p, name: e.target.value }))}
                    className="w-full text-sm border border-[#E5DDD5] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#D8A65C] font-semibold text-[#2C1B12]"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={editDraft.unit ?? 'kg'}
                      onChange={e => setEditDraft(p => ({ ...p, unit: e.target.value }))}
                      className="text-sm border border-[#E5DDD5] rounded-xl px-2 py-2 bg-white focus:outline-none focus:border-[#D8A65C] text-[#2C1B12] font-medium"
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input
                      type="number"
                      value={editDraft.pricePerUnit ?? ''}
                      onChange={e => setEditDraft(p => ({ ...p, pricePerUnit: Number(e.target.value) }))}
                      placeholder="Price/unit"
                      className="text-sm border border-[#E5DDD5] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#D8A65C] text-[#2C1B12] font-medium"
                    />
                    <input
                      type="number"
                      value={editDraft.quantity ?? ''}
                      onChange={e => setEditDraft(p => ({ ...p, quantity: Number(e.target.value) }))}
                      placeholder="Qty"
                      className="text-sm border border-[#E5DDD5] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#D8A65C] text-[#2C1B12] font-medium"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      className="flex-1 py-2 bg-gradient-to-r from-[#E78C85] to-[#D8A65C] text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => deleteMaterial(m.id)}
                      className="px-4 py-2 bg-[#FEF2F2] text-red-500 text-xs font-bold rounded-xl border border-red-100 active:scale-[0.98] transition-all"
                    >
                      Delete
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 bg-[#FAF2E6] text-[#8C6239] text-xs font-bold rounded-xl active:scale-[0.98] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={m.id}
                onClick={() => startEdit(m)}
                className="w-full flex items-center px-4 py-3 hover:bg-[#FDFAF6] active:bg-[#FAF2E6] transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2C1B12] truncate">{m.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {formatCurrency(m.pricePerUnit)}/{m.unit}
                    {m.quantity > 0 && (
                      <span className="text-[#8C6239] font-semibold">
                        {' · '}{m.quantity} {m.unit}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  {rowTotal > 0 ? (
                    <span className="text-sm font-bold text-[#2C1B12]">{formatCurrency(rowTotal)}</span>
                  ) : (
                    <span className="text-xs text-gray-300 font-medium">Tap to edit</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Total Row */}
        {totalInvestment > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#2C1B12] rounded-b-2xl">
            <span className="text-xs font-bold text-[#D8A65C] uppercase tracking-wider">Total Raw Cost</span>
            <span className="text-sm font-extrabold text-white">{formatCurrency(totalInvestment)}</span>
          </div>
        )}
      </div>

      {materials.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🥣</div>
          <p className="text-sm font-bold text-[#2C1B12]">No materials yet</p>
          <p className="text-xs text-gray-400 mt-1">Tap "+ Add Item" to start tracking</p>
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
