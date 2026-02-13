
export type AppState = 'IDLE' | 'PRINTING' | 'FINISHED';

export interface ReceiptLine {
  id: string;
  type: 'SYSTEM' | 'INGREDIENT' | 'ANALYSIS' | 'DIVIDER' | 'TOTAL' | 'ITEM' | 'PRICE';
  text: string;
  delay: number;
}

export interface ReceiptData {
  userName: string;
  imageUrl: string | null;
  ingredients: string[];
}
