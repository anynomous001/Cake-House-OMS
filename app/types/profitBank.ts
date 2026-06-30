export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Card' | 'Other';

export interface ProfitBankEntry {
  id: string;
  date: string;        // "YYYY-MM-DD"
  amount: number;
  type: 'credit' | 'debit';
  mode: PaymentMode;
  note: string;
}
