'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { InvestmentEntry } from '../types/investment';
import { useGoogleSheet } from './useGoogleSheet';

const STORAGE_KEY = 'tch_investment_entries';
const MIGRATION_KEY = 'tch_inv_migrated_v1';

function loadLocal(): InvestmentEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InvestmentEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(entries: InvestmentEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// One-time migration: convert old material quantities → dated entries
function migrateOldMaterials(): InvestmentEntry[] {
  if (typeof window === 'undefined') return [];
  if (localStorage.getItem(MIGRATION_KEY)) return []; // already migrated
  try {
    const raw = localStorage.getItem('tch_raw_materials');
    if (!raw) return [];
    const materials = JSON.parse(raw) as { id: string; name: string; unit: string; pricePerUnit: number; quantity: number }[];
    const today = new Date().toISOString().slice(0, 10);
    const entries = materials
      .filter(m => m.quantity > 0)
      .map((m, i) => ({
        id: `migrated_${Date.now()}_${i}`,
        date: today,
        materialName: m.name,
        unit: m.unit,
        pricePerUnit: m.pricePerUnit,
        quantity: m.quantity,
      }));
    localStorage.setItem(MIGRATION_KEY, '1');
    return entries;
  } catch {
    return [];
  }
}

export function useInvestmentEntries() {
  const [entries, setEntries] = useState<InvestmentEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { getInvestmentEntries, addInvestmentEntry, deleteInvestmentEntry, getSheetUrl } = useGoogleSheet();
  const hasFetched = useRef(false);

  // On mount: show localStorage immediately, then pull Sheets to stay in sync
  useEffect(() => {
    // Migrate old material-quantity data to dated entries (runs once)
    const migrated = migrateOldMaterials();
    if (migrated.length > 0) {
      const existing = loadLocal();
      const merged = [...existing, ...migrated];
      saveLocal(merged);
    }

    const local = loadLocal();
    setEntries(local);

    if (hasFetched.current) return;
    hasFetched.current = true;

    if (!getSheetUrl()) return;

    setSyncing(true);
    getInvestmentEntries().then(sheetEntries => {
      if (sheetEntries.length === 0 && local.length > 0) {
        // Sheet is empty but we have local entries — push them up (first-time migration)
        Promise.all(local.map(e => addInvestmentEntry(e))).finally(() => setSyncing(false));
      } else if (sheetEntries.length > 0) {
        // Sheet has data — merge: sheet wins, add any local-only entries
        const sheetIds = new Set(sheetEntries.map(e => e.id));
        const localOnly = local.filter(e => !sheetIds.has(e.id));
        const merged = [...sheetEntries, ...localOnly];
        setEntries(merged);
        saveLocal(merged);
        // Push any local-only stragglers up to Sheets
        if (localOnly.length > 0) {
          Promise.all(localOnly.map(e => addInvestmentEntry(e))).finally(() => setSyncing(false));
        } else {
          setSyncing(false);
        }
      } else {
        setSyncing(false);
      }
    }).catch(() => setSyncing(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addEntry = useCallback((entry: Omit<InvestmentEntry, 'id'>): InvestmentEntry => {
    const newEntry: InvestmentEntry = { ...entry, id: `inv_${Date.now()}` };
    // Optimistic local update
    setEntries(prev => {
      const next = [...prev, newEntry];
      saveLocal(next);
      return next;
    });
    // Fire-and-forget to Sheets
    addInvestmentEntry(newEntry);
    return newEntry;
  }, [addInvestmentEntry]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      saveLocal(next);
      return next;
    });
    // Fire-and-forget to Sheets
    deleteInvestmentEntry(id);
  }, [deleteInvestmentEntry]);

  const refresh = useCallback(async () => {
    if (!getSheetUrl()) return;
    setSyncing(true);
    const sheetEntries = await getInvestmentEntries().catch(() => [] as InvestmentEntry[]);
    if (sheetEntries.length > 0) {
      setEntries(sheetEntries);
      saveLocal(sheetEntries);
    }
    setSyncing(false);
  }, [getInvestmentEntries, getSheetUrl]);

  return { entries, syncing, addEntry, deleteEntry, refresh };
}
