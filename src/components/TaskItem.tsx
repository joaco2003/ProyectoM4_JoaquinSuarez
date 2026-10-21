import { useState } from 'react';
import type { Task, TaskFormValues } from '../types';
import TaskForm from './TaskForm';

interface Props {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, values: TaskFormValues) => Promise<void>;
}

export default function TaskItem({ task, onToggle, onDelete, onEdit }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="task editing">
        <TaskForm
          initialValues={{ title: task.title, description: task.description }}
          submitLabel="Guardar cambios"
          onSubmit={async (values) => {
            await onEdit(task.id, values);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className={`task${task.completed ? ' done' : ''}`}>
      <input
        type="checkbox"
        checked={task.completed}
        aria-label={`Marcar "${task.title}" como completada`}
        onChange={(e) => onToggle(task.id, e.target.checked)}
      />
      <div className="task-body">
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
      </div>
      <div className="row">
        <button className="btn" onClick={() => setEditing(true)}>Editar</button>
        <button className="btn danger" onClick={() => onDelete(task.id)}>Eliminar</button>
      </div>
    </li>
  );
}
