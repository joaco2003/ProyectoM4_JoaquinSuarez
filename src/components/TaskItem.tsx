import { useState, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import type { Task, TaskFormValues } from '../types';
import { formatDueDate, isOverdue } from '../utils/taskView';
import TaskForm from './TaskForm';

interface Props {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, values: TaskFormValues) => Promise<void>;
  // Opcionales: los provee SortableTaskItem cuando el drag & drop está activo
  rootRef?: (node: HTMLLIElement | null) => void;
  rootStyle?: CSSProperties;
  handleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragging?: boolean;
}

export default function TaskItem({
  task,
  onToggle,
  onDelete,
  onEdit,
  rootRef,
  rootStyle,
  handleProps,
  dragging,
}: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="task editing" ref={rootRef} style={rootStyle}>
        <TaskForm
          initialValues={{
            title: task.title,
            description: task.description,
            priority: task.priority,
            dueDate: task.dueDate ?? '',
          }}
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

  const overdue = isOverdue(task);
  const classes = ['task', task.completed && 'done', handleProps && 'sortable', dragging && 'dragging']
    .filter(Boolean)
    .join(' ');

  return (
    <li className={classes} ref={rootRef} style={rootStyle}>
      {handleProps && (
        <button
          type="button"
          className="handle"
          aria-label={`Arrastrar para reordenar "${task.title}"`}
          {...handleProps}
        >
          ⠿
        </button>
      )}
      <input
        type="checkbox"
        checked={task.completed}
        aria-label={`Marcar "${task.title}" como completada`}
        onChange={(e) => onToggle(task.id, e.target.checked)}
      />
      <div className="task-body">
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
        <div className="meta">
          <span className={`badge ${task.priority}`}>Prioridad {task.priority}</span>
          {task.dueDate && (
            <span className={`badge due${overdue ? ' overdue' : ''}`}>
              {overdue ? 'Vencida · ' : 'Vence '}
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
      <div className="row">
        <button className="btn" onClick={() => setEditing(true)}>Editar</button>
        <button className="btn danger" onClick={() => onDelete(task.id)}>Eliminar</button>
      </div>
    </li>
  );
}