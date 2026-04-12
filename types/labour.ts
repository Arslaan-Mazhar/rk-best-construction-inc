export interface Labour {
  id?: string; // Firestore document ID
  code: number;
  labourName: string;
  rate: number;
  phone?: string;
  address?: string;
  taxNo?: string;
}