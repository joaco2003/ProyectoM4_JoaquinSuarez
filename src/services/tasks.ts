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
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task)),
    onError,
  );
}

export async function createTask(uid: string, values: TaskFormValues): Promise<void> {
  await addDoc(tasksRef(uid), {
    title: values.title.trim(),
    description: values.description.trim(),
    completed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateTask(uid: string, id: string, values: TaskFormValues): Promise<void> {
  await updateDoc(taskRef(uid, id), {
    title: values.title.trim(),
    description: values.description.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function toggleTask(uid: string, id: string, completed: boolean): Promise<void> {
  await updateDoc(taskRef(uid, id), { completed, updatedAt: serverTimestamp() });
}

export async function deleteTask(uid: string, id: string): Promise<void> {
  await deleteDoc(taskRef(uid, id));
}
