export interface WorkEntry {
  id?: string; // Firestore document ID
  code: number; // Labour Code
  job: number;  // Job ID
  hours: number;
  date: Date;
  amount: number;
  paid: number;
  balance: number;
  material: number;
  price: number;
  comment?: string;
}