export interface InvestmentEntry {
  id: string;
  date: string;        // "YYYY-MM-DD"
  materialName: string;
  unit: string;
  pricePerUnit: number;
  quantity: number;
}
