import type { Timestamp } from 'firebase/firestore';

export type Priority = 'alta' | 'media' | 'baja';
export type TaskFilter = 'all' | 'pending' | 'completed';
export type TaskSort = 'manual' | 'priority' | 'due';

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  /** Fecha en formato YYYY-MM-DD, o null si no tiene vencimiento */
  dueDate: string | null;
  /** Posición para el orden manual (menor = más arriba) */
  order: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface TaskFormValues {
  title: string;
  description: string;
  priority: Priority;
  /** '' si no hay fecha */
  dueDate: string;
}

export type AuthMode = 'login' | 'register';
