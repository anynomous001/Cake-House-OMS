'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Tab, ToastMessage, Order, OrderStatus } from './types/order';
import { useOrders } from './hooks/useOrders';
import { useGoogleSheet } from './hooks/useGoogleSheet';
import NewOrderForm from './components/NewOrderForm';
import OrderHistory from './components/OrderHistory';
import Summary from './components/Summary';
import Investment from './components/Investment';
import CakeCalendar from './components/CakeCalendar';
import ProfitBank from './components/ProfitBank';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';
let toastIdCounter = 0;

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('new-order');
  const [showSettings, setShowSettings] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [calendarFilterDate, setCalendarFilterDate] = useState<string | null>(null);
  const { orders, refreshing, fetchOrders, addOrderToState, updateOrderStatusInState, updateOrderInState } = useOrders();
  const { getSheetUrl, getInvestmentEntries, getProfitBankEntries } = useGoogleSheet();

  const showToast = useCallback((type: ToastMessage['type'], message: string) => {
    const id = String(++toastIdCounter);
    setToasts(prev => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  function handleOrderSaved(order: Order) {
    addOrderToState(order);
  }

  function handleStatusUpdated(orderId: string, status: OrderStatus) {
    updateOrderStatusInState(orderId, status);
  }

  function handleOrderUpdated(order: Order) {
    updateOrderInState(order);
  }

  function handleCalendarDateSelect(date: string) {
    setCalendarFilterDate(date);
    setActiveTab('history');
  }

  const [sheetConfigured, setSheetConfigured] = useState(false);

  useEffect(() => {
    const configured = getSheetUrl().length > 0;
    setSheetConfigured(configured);
    if (configured) {
      fetchOrders();
      // Trigger sheet creation for Investment and ProfitBank on first load
      getInvestmentEntries();
      getProfitBankEntries();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col max-w-lg mx-auto relative shadow-xl border-x border-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#160E0A] border-b border-[#2C1B12]/20 flex items-center justify-between px-4 h-[64px] shadow-md">
        <div className="flex items-center gap-2.5">
          <img src="/1000059078.png" alt="Tota Cake House" className="w-9 h-9 object-contain rounded-lg" />
          <div>
            <h1 className="text-base font-bold text-white tracking-wide font-serif leading-tight">Tota Cake House</h1>
            <p className="text-[9px] text-[#D8A65C] uppercase tracking-widest font-semibold leading-none">Order Management</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#2C1B12] text-[#D8A65C] hover:text-[#E78C85] transition-all duration-200 active:scale-95"
          aria-label="Settings"
        >
          <GearIcon />
        </button>
      </header>

      {/* Not connected banner */}
      {!sheetConfigured && (
        <button
          onClick={() => setShowSettings(true)}
          className="mx-4 mt-3 flex items-center gap-2 px-4 py-3 bg-[#FAEEDA] border border-[#854F0B]/20 rounded-xl text-left"
        >
          <span className="text-base shrink-0">⚠️</span>
          <p className="text-xs text-[#854F0B] font-medium flex-1">
            Google Sheet not connected. Tap to configure.
          </p>
          <span className="text-[#854F0B] text-lg leading-none shrink-0">›</span>
        </button>
      )}

      {/* Tab content */}
      <main className="flex-1 overflow-auto">
        <div className={activeTab === 'new-order' ? 'pt-4' : ''}>
          {activeTab === 'new-order' && (
            <NewOrderForm
              existingOrders={orders}
              onOrderSaved={handleOrderSaved}
              showToast={showToast}
            />
          )}
          {activeTab === 'history' && (
            <OrderHistory
              orders={orders}
              refreshing={refreshing}
              onRefresh={fetchOrders}
              onStatusUpdated={handleStatusUpdated}
              onOrderUpdated={handleOrderUpdated}
              showToast={showToast}
              filterDate={calendarFilterDate}
              onClearFilterDate={() => setCalendarFilterDate(null)}
            />
          )}
          {activeTab === 'summary' && (
            <Summary orders={orders} />
          )}
          {activeTab === 'investment' && (
            <Investment orders={orders} />
          )}
          {activeTab === 'calendar' && (
            <CakeCalendar orders={orders} onDateSelect={handleCalendarDateSelect} />
          )}
          {activeTab === 'profit-bank' && (
            <ProfitBank />
          )}
        </div>
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-20 bg-white border-t border-gray-100 flex safe-bottom shadow-[0_-1px_0_rgba(0,0,0,0.06)]">
        <TabButton
          icon={<PlusIcon />}
          label="New Order"
          active={activeTab === 'new-order'}
          onClick={() => setActiveTab('new-order')}
        />
        <TabButton
          icon={<HistoryIcon />}
          label="History"
          active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
        />
        <TabButton
          icon={<ChartIcon />}
          label="Summary"
          active={activeTab === 'summary'}
          onClick={() => setActiveTab('summary')}
        />
        <TabButton
          icon={<BagIcon />}
          label="Investment"
          active={activeTab === 'investment'}
          onClick={() => setActiveTab('investment')}
        />
        <TabButton
          icon={<CalendarIcon />}
          label="Calendar"
          active={activeTab === 'calendar'}
          onClick={() => setActiveTab('calendar')}
        />
        <TabButton
          icon={<BankIcon />}
          label="Bank"
          active={activeTab === 'profit-bank'}
          onClick={() => setActiveTab('profit-bank')}
        />
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} showToast={showToast} />
      )}

      {/* Toasts */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-200 min-h-[56px] relative overflow-hidden active:scale-95
        ${active ? 'text-[#D8A65C]' : 'text-gray-400 hover:text-[#D8A65C]'}`}
    >
      <span className={`transition-all duration-200 ${active ? 'scale-110 text-[#D8A65C]' : 'text-gray-400'}`}>{icon}</span>
      <span className={`text-[10px] font-bold tracking-wide transition-colors duration-200 ${active ? 'text-[#160E0A]' : 'text-gray-400'}`}>
        {label}
      </span>
      {active && (
        <span className="absolute bottom-0 w-12 h-1 bg-gradient-to-r from-[#E78C85] to-[#D8A65C] rounded-t-full shadow-sm" />
      )}
    </button>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
      <polyline points="12 8 12 12 14 14" />
      <path d="M3.05 11a9 9 0 1 0 .5-4.5" />
      <polyline points="3 3 3 9 9 9" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
      <rect x="2" y="10" width="20" height="11" rx="1" />
      <path d="M12 2L2 7h20L12 2z" />
      <line x1="6" y1="10" x2="6" y2="21" />
      <line x1="12" y1="10" x2="12" y2="21" />
      <line x1="18" y1="10" x2="18" y2="21" />
    </svg>
  );
}
