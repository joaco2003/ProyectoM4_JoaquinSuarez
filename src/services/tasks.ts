import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Task, TaskFormValues } from '../types';

// Las tareas viven en users/{uid}/tasks: así las reglas de Firestore aíslan a cada usuario.
const tasksRef = (uid: string) => collection(db, 'users', uid, 'tasks');
const taskRef = (uid: string, id: string) => doc(db, 'users', uid, 'tasks', id);

export function subscribeToTasks(
  uid: string,
  onData: (tasks: Task[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(tasksRef(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) =>
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          // Normalizamos tareas viejas que no tenían estos campos
          return {
            id: d.id,
            ...data,
            priority: data.priority ?? 'media',
            dueDate: data.dueDate ?? null,
            order:
              typeof data.order === 'number'
                ? data.order
                : -(data.createdAt?.toMillis?.() ?? Date.now()),
          } as Task;
        }),
      ),
    onError,
  );
}

export async function createTask(uid: string, values: TaskFormValues): Promise<void> {
  await addDoc(tasksRef(uid), {
    title: values.title.trim(),
    description: values.description.trim(),
    completed: false,
    priority: values.priority,
    dueDate: values.dueDate || null,
    order: -Date.now(), // las nuevas quedan arriba en el orden manual
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTask(uid: string, id: string, values: TaskFormValues): Promise<void> {
  await updateDoc(taskRef(uid, id), {
    title: values.title.trim(),
    description: values.description.trim(),
    priority: values.priority,
    dueDate: values.dueDate || null,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleTask(uid: string, id: string, completed: boolean): Promise<void> {
  await updateDoc(taskRef(uid, id), { completed, updatedAt: serverTimestamp() });
}

export async function deleteTask(uid: string, id: string): Promise<void> {
  await deleteDoc(taskRef(uid, id));
}

/** Guarda el orden manual: la posición en el array pasa a ser el campo `order`. */
export async function reorderTasks(uid: string, orderedIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => batch.update(taskRef(uid, id), { order: index }));
  await batch.commit();
}