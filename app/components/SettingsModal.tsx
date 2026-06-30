'use client';

import React, { useState, useEffect } from 'react';
import { useGoogleSheet, DiagnosticResult, GOOGLE_SHEET_LINK, resetToDefaultSheetUrl } from '../hooks/useGoogleSheet';

interface SettingsModalProps {
  onClose: () => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export default function SettingsModal({ onClose, showToast }: SettingsModalProps) {
  const { getSheetUrl, saveSheetUrl, testConnection } = useGoogleSheet();
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);

  useEffect(() => {
    setUrl(getSheetUrl());
  }, [getSheetUrl]);

  function handleSave() {
    const trimmed = url.trim();
    if (trimmed && !trimmed.startsWith('https://script.google.com/')) {
      showToast('warning', 'URL should start with https://script.google.com/');
      return;
    }
    saveSheetUrl(trimmed);
    setDiagnostic(null);
    showToast('success', 'Google Sheet URL saved!');
    onClose();
  }

  async function handleTest() {
    const trimmed = url.trim();
    if (!trimmed) {
      showToast('warning', 'Please enter a URL first');
      return;
    }
    setTesting(true);
    setDiagnostic(null);
    const result = await testConnection(trimmed);
    setTesting(false);
    setDiagnostic(result);
    if (result.connected) {
      showToast('success', `Connected! ${result.orderCount} order${result.orderCount !== 1 ? 's' : ''} found in sheet.`);
    } else {
      showToast('error', result.error || 'Connection failed. Check the URL.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 pb-8 sm:pb-6 max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5 sm:hidden" />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 font-serif">Settings</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-xl leading-none">
            ×
          </button>
        </div>

        {/* URL field */}
        <div className="mb-5">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
            Google Apps Script Web App URL
          </label>
          <input
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); setDiagnostic(null); }}
            placeholder="https://script.google.com/macros/s/..."
            className="w-full h-12 px-4 rounded-xl border border-[#EFEAE2] bg-[#FCFAF7] text-sm focus:outline-none focus:border-[#D8A65C] focus:ring-4 focus:ring-[#D8A65C]/10 transition-all duration-200"
          />
          {!url.trim() && (
            <p className="mt-1.5 text-xs text-[#C55A4F] font-semibold">
              No URL configured — orders cannot be saved or loaded.
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex-1 h-12 rounded-xl border border-[#D8A65C] text-[#8C6239] font-bold text-xs hover:bg-[#FAF2E6] active:scale-95 transition-all duration-200 disabled:opacity-60"
          >
            {testing ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size={14} color="#8C6239" /> Checking...
              </span>
            ) : (
              'Test Connection'
            )}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#E78C85] to-[#D8A65C] hover:opacity-95 text-white font-bold text-xs shadow-sm active:scale-95 transition-all duration-200"
          >
            Save
          </button>
        </div>

        {/* Reset to default */}
        <button
          onClick={() => {
            resetToDefaultSheetUrl();
            setUrl(getSheetUrl());
            setDiagnostic(null);
            showToast('info', 'Reset to default script URL');
          }}
          className="w-full h-10 mb-4 rounded-xl border border-[#EFEAE2] text-xs font-semibold text-gray-400 hover:text-[#8C6239] hover:border-[#D8A65C] hover:bg-[#FDFAF6] active:scale-95 transition-all duration-200"
        >
          Reset to Default URL
        </button>

        {/* Open sheet link */}
        <a
          href={GOOGLE_SHEET_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-10 mb-4 rounded-xl border border-[#EFEAE2] bg-[#FCFAF7] text-xs font-semibold text-[#8C6239] hover:bg-[#FAF2E6] active:scale-95 transition-all duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Open Google Sheet
        </a>

        {/* Diagnostic result panel */}
        {diagnostic && (
          <div className={`mb-4 rounded-xl border p-4 space-y-2
            ${diagnostic.connected ? 'bg-[#F7FAF4] border-[#84A95B]/30' : 'bg-[#FDF6F5] border-[#E78C85]/40'}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{diagnostic.connected ? '✅' : '❌'}</span>
              <span className={`text-xs font-bold ${diagnostic.connected ? 'text-[#3B6D11]' : 'text-[#C55A4F]'}`}>
                {diagnostic.connected ? 'Connected successfully' : 'Connection failed'}
              </span>
            </div>

            {diagnostic.connected && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm">📋</span>
                  <span className="text-xs text-gray-700 font-semibold">
                    {diagnostic.orderCount} order{diagnostic.orderCount !== 1 ? 's' : ''} found in sheet
                  </span>
                </div>

                {diagnostic.orderCount > 0 && diagnostic.missingFields.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#FAF2E6]">
                    <p className="text-[10px] font-bold text-[#AF5C54] uppercase tracking-wide mb-1">
                      ⚠ Missing fields in your sheet data:
                    </p>
                    <p className="text-[11px] text-[#AF5C54] font-mono break-all">
                      {diagnostic.missingFields.join(', ')}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      This means your sheet headers may not match. Re-paste the Code.gs and redeploy your script.
                    </p>
                  </div>
                )}

                {diagnostic.orderCount > 0 && diagnostic.missingFields.length === 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">✓</span>
                    <span className="text-xs text-[#3B6D11] font-semibold">All key fields are present</span>
                  </div>
                )}
              </>
            )}

            {!diagnostic.connected && diagnostic.error && (
              <p className="text-xs text-[#C55A4F] font-mono break-all">{diagnostic.error}</p>
            )}
          </div>
        )}

        {/* Setup guide */}
        <div className="p-3 bg-[#FCFAF7] border border-[#FAF2E6] rounded-xl">
          <p className="text-xs text-[#8C6239] font-bold mb-1">How to set up:</p>
          <ol className="text-xs text-[#8C6239]/80 list-decimal list-inside space-y-1">
            <li>Open your Google Sheet → Extensions → Apps Script</li>
            <li>Replace all code with the <code className="bg-[#FAF2E6] px-1 rounded">Code.gs</code> from this project</li>
            <li>Click Deploy → New deployment → Web App</li>
            <li>Set "Execute as: Me" and "Who has access: Anyone"</li>
            <li>Copy the Web App URL and paste it above → Save</li>
            <li>Click "Test Connection" to verify</li>
          </ol>
          <div className="mt-2 pt-2 border-t border-[#FAF2E6]">
            <p className="text-[10px] text-[#8C6239]/70 font-semibold">
              After updating Code.gs, always create a NEW deployment version — existing deployments use old code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Spinner({ size = 18, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      style={{ display: 'inline-block' }}
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
