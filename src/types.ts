import type { Timestamp } from 'firebase/firestore';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface TaskFormValues {
  title: string;
  description: string;
}

export type AuthMode = 'login' | 'register';
