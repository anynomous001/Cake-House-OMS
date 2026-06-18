'use client';

import { useState, useCallback, useEffect } from 'react';
import { RawMaterial } from '../types/material';

const STORAGE_KEY = 'tch_raw_materials';

const DEFAULT_MATERIALS: RawMaterial[] = [
  { id: 'd1', name: 'All Purpose Flour', unit: 'kg', pricePerUnit: 45, quantity: 0 },
  { id: 'd2', name: 'Sugar', unit: 'kg', pricePerUnit: 45, quantity: 0 },
  { id: 'd3', name: 'Butter', unit: 'kg', pricePerUnit: 500, quantity: 0 },
  { id: 'd4', name: 'Eggs', unit: 'pcs', pricePerUnit: 8, quantity: 0 },
  { id: 'd5', name: 'Milk', unit: 'litre', pricePerUnit: 60, quantity: 0 },
  { id: 'd6', name: 'Whipping Cream', unit: 'litre', pricePerUnit: 180, quantity: 0 },
  { id: 'd7', name: 'Cocoa Powder', unit: 'kg', pricePerUnit: 400, quantity: 0 },
  { id: 'd8', name: 'Vanilla Essence', unit: 'ml', pricePerUnit: 2, quantity: 0 },
  { id: 'd9', name: 'Fondant', unit: 'kg', pricePerUnit: 600, quantity: 0 },
  { id: 'd10', name: 'Food Color', unit: 'pcs', pricePerUnit: 50, quantity: 0 },
  { id: 'd11', name: 'Cake Box', unit: 'pcs', pricePerUnit: 30, quantity: 0 },
  { id: 'd12', name: 'Cake Board', unit: 'pcs', pricePerUnit: 20, quantity: 0 },
  { id: 'd13', name: 'Dark Chocolate', unit: 'kg', pricePerUnit: 800, quantity: 0 },
  { id: 'd14', name: 'Cream Cheese', unit: 'kg', pricePerUnit: 800, quantity: 0 },
  { id: 'd15', name: 'Dry Fruits', unit: 'kg', pricePerUnit: 600, quantity: 0 },
];

function load(): RawMaterial[] {
  if (typeof window === 'undefined') return DEFAULT_MATERIALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MATERIALS;
    return JSON.parse(raw) as RawMaterial[];
  } catch {
    return DEFAULT_MATERIALS;
  }
}

function save(materials: RawMaterial[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
}

export function useInvestment() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);

  useEffect(() => {
    setMaterials(load());
  }, []);

  const updateMaterial = useCallback((updated: RawMaterial) => {
    setMaterials(prev => {
      const next = prev.map(m => (m.id === updated.id ? updated : m));
      save(next);
      return next;
    });
  }, []);

  const addMaterial = useCallback((material: Omit<RawMaterial, 'id'>) => {
    const newItem: RawMaterial = { ...material, id: `m_${Date.now()}` };
    setMaterials(prev => {
      const next = [...prev, newItem];
      save(next);
      return next;
    });
  }, []);

  const deleteMaterial = useCallback((id: string) => {
    setMaterials(prev => {
      const next = prev.filter(m => m.id !== id);
      save(next);
      return next;
    });
  }, []);

  const totalInvestment = materials.reduce(
    (sum, m) => sum + (m.pricePerUnit * m.quantity),
    0
  );

  return { materials, totalInvestment, updateMaterial, addMaterial, deleteMaterial };
}
