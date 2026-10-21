import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import TaskForm from '../components/TaskForm';
import TaskItem from '../components/TaskItem';
import { createTask, deleteTask, subscribeToTasks, toggleTask, updateTask } from '../services/tasks';
import { sendTaskCreatedEmail } from '../services/notify';
import type { Task, TaskFormValues } from '../types';

export default function TasksPage() {
  const { user, logout } = useAuth();
  const uid = user!.uid; // ProtectedRoute garantiza que hay usuario
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    return subscribeToTasks(
      uid,
      (data) => {
        setTasks(data);
        setLoading(false);
      },
      () => {
        setError('No pudimos cargar tus tareas. Recargá la página.');
        setLoading(false);
      },
    );
  }, [uid]);

  // No bloqueamos la UI esperando al servidor: la lista se actualiza al instante
  // (Firestore escribe en local primero) y si el servidor rechaza, mostramos el error.
  function handleCreate(values: TaskFormValues) {
    const title = values.title.trim();
    createTask(uid, values)
      .then(() => sendTaskCreatedEmail(user!, title))
      .catch(() => setError('No se pudo guardar la tarea en el servidor. Revisá Firestore y tus reglas.'));
  }

  const run = (action: () => Promise<void>) =>
    action().catch(() => setError('La acción falló. Intentá de nuevo.'));

  const pending = tasks.filter((t) => !t.completed).length;

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1>Mis tareas</h1>
          <p className="muted">{user?.displayName || user?.email}</p>
        </div>
        <button className="btn" onClick={() => void logout()}>Cerrar sesión</button>
      </header>

      <section className="card" aria-labelledby="new-task">
        <h2 id="new-task" className="card-title">Nueva tarea</h2>
        <TaskForm submitLabel="Agregar tarea" onSubmit={handleCreate} />
      </section>

      <section aria-labelledby="list">
        <h2 id="list">Lista {tasks.length > 0 && <span className="muted">({pending} pendientes)</span>}</h2>
        {error && <p className="error" role="alert">{error}</p>}
        {loading ? (
          <p className="status" role="status">Cargando tareas…</p>
        ) : tasks.length === 0 ? (
          <p className="muted">Todavía no tenés tareas. Agregá la primera arriba.</p>
        ) : (
          <ul className="tasks">
            {tasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={(id, completed) => void run(() => toggleTask(uid, id, completed))}
                onDelete={(id) => void run(() => deleteTask(uid, id))}
                onEdit={(id, values) => {
                  void run(() => updateTask(uid, id, values));
                  return Promise.resolve();
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}