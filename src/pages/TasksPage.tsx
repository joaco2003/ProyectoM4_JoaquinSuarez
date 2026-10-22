import { useMemo, useState } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import TaskForm from '../components/TaskForm';
import TaskItem from '../components/TaskItem';
import SortableTaskItem from '../components/SortableTaskItem';
import { filterTasks, sortTasks } from '../utils/taskView';
import type { Task, TaskFilter, TaskFormValues, TaskSort } from '../types';

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'completed', label: 'Completadas' },
];

export default function TasksPage() {
  const { user, logout } = useAuth();
  const { tasks, loading, error, addTask, editTask, toggle, remove, reorder } = useTasks(user!); // ProtectedRoute garantiza que hay usuario
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [sort, setSort] = useState<TaskSort>('manual');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const visible = useMemo(() => sortTasks(filterTasks(tasks, filter), sort), [tasks, filter, sort]);
  const canDrag = sort === 'manual' && filter === 'all';
  const pending = tasks.filter((t) => !t.completed).length;

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const ids = visible.map((t) => t.id);
    reorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }

  const itemProps = (t: Task) => ({
    task: t,
    onToggle: toggle,
    onDelete: remove,
    onEdit: (id: string, values: TaskFormValues) => {
      editTask(id, values);
      return Promise.resolve();
    },
  });

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
        <TaskForm submitLabel="Agregar tarea" onSubmit={addTask} />
      </section>

      <section aria-labelledby="list">
        <h2 id="list">
          Lista {tasks.length > 0 && <span className="muted">({pending} pendientes)</span>}
        </h2>

        {tasks.length > 0 && (
          <div className="toolbar">
            <div className="segmented" role="group" aria-label="Filtrar tareas">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={filter === f.value ? 'active' : ''}
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <label className="sort">
              Ordenar por
              <select value={sort} onChange={(e) => setSort(e.target.value as TaskSort)}>
                <option value="manual">Manual (arrastrar)</option>
                <option value="priority">Prioridad</option>
                <option value="due">Fecha de vencimiento</option>
              </select>
            </label>
          </div>
        )}

        {error && <p className="error" role="alert">{error}</p>}

        {loading ? (
          <p className="status" role="status">Cargando tareas…</p>
        ) : tasks.length === 0 ? (
          <p className="muted">Todavía no tenés tareas. Agregá la primera arriba.</p>
        ) : visible.length === 0 ? (
          <p className="muted">No hay tareas en este filtro.</p>
        ) : canDrag ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visible.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <ul className="tasks">
                {visible.map((t) => (
                  <SortableTaskItem key={t.id} {...itemProps(t)} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        ) : (
          <>
            <p className="muted hint">Para reordenar arrastrando, usá "Todas" y orden "Manual".</p>
            <ul className="tasks">
              {visible.map((t) => (
                <TaskItem key={t.id} {...itemProps(t)} />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}