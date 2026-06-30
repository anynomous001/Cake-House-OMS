'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ProfitBankEntry } from '../types/profitBank';
import { useGoogleSheet } from './useGoogleSheet';

const STORAGE_KEY = 'tch_profit_bank';

function loadLocal(): ProfitBankEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProfitBankEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(entries: ProfitBankEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useProfitBank() {
  const [entries, setEntries] = useState<ProfitBankEntry[]>([]);
  const [syncing, setSyncing] = useState(false);
  const { getProfitBankEntries, addProfitBankEntry, deleteProfitBankEntry, getSheetUrl } = useGoogleSheet();
  const hasFetched = useRef(false);

  // On mount: show localStorage immediately, then pull Sheets to stay in sync
  useEffect(() => {
    const local = loadLocal();
    setEntries(local);

    if (hasFetched.current) return;
    hasFetched.current = true;

    if (!getSheetUrl()) return;

    setSyncing(true);
    getProfitBankEntries().then(sheetEntries => {
      if (sheetEntries.length === 0 && local.length > 0) {
        // Sheet is empty but we have local entries — push them up (first-time migration)
        Promise.all(local.map(e => addProfitBankEntry(e))).finally(() => setSyncing(false));
      } else if (sheetEntries.length > 0) {
        // Sheet has data — merge: sheet wins, add any local-only entries
        const sheetIds = new Set(sheetEntries.map(e => e.id));
        const localOnly = local.filter(e => !sheetIds.has(e.id));
        const merged = [...sheetEntries, ...localOnly];
        setEntries(merged);
        saveLocal(merged);
        if (localOnly.length > 0) {
          Promise.all(localOnly.map(e => addProfitBankEntry(e))).finally(() => setSyncing(false));
        } else {
          setSyncing(false);
        }
      } else {
        setSyncing(false);
      }
    }).catch(() => setSyncing(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addEntry = useCallback((entry: Omit<ProfitBankEntry, 'id'>): ProfitBankEntry => {
    const newEntry: ProfitBankEntry = { ...entry, id: `pb_${Date.now()}` };
    // Optimistic local update
    setEntries(prev => {
      const next = [...prev, newEntry];
      saveLocal(next);
      return next;
    });
    // Fire-and-forget to Sheets
    addProfitBankEntry(newEntry);
    return newEntry;
  }, [addProfitBankEntry]);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      saveLocal(next);
      return next;
    });
    // Fire-and-forget to Sheets
    deleteProfitBankEntry(id);
  }, [deleteProfitBankEntry]);

  const refresh = useCallback(async () => {
    if (!getSheetUrl()) return;
    setSyncing(true);
    const sheetEntries = await getProfitBankEntries().catch(() => [] as ProfitBankEntry[]);
    if (sheetEntries.length > 0) {
      setEntries(sheetEntries);
      saveLocal(sheetEntries);
    }
    setSyncing(false);
  }, [getProfitBankEntries, getSheetUrl]);

  return { entries, syncing, addEntry, deleteEntry, refresh };
}
