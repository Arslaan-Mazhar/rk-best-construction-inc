export interface Contract {
  id?: string; // Firestore document ID
  job: number; // Job ID
  totalContract: number;
  percent: number;
}