import { useState, type FormEvent } from 'react';
import type { Priority, TaskFormValues } from '../types';

interface Props {
  initialValues?: TaskFormValues;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const EMPTY: TaskFormValues = { title: '', description: '', priority: 'media', dueDate: '' };

export default function TaskForm({ initialValues = EMPTY, submitLabel, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initialValues.title);
  const [description, setDescription] = useState(initialValues.description);
  const [priority, setPriority] = useState<Priority>(initialValues.priority);
  const [dueDate, setDueDate] = useState(initialValues.dueDate);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit({ title, description, priority, dueDate });
      if (!initialValues.title) {
        setTitle('');
        setDescription('');
        setPriority('media');
        setDueDate('');
      }
    } catch {
      setError('No pudimos guardar la tarea. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <label>
        Título
        <input
          value={title}
          maxLength={100}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Preparar informe semanal"
        />
      </label>
      <label>
        Descripción
        <textarea
          value={description}
          maxLength={500}
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opcional"
        />
      </label>
      <div className="field-row">
        <label>
          Prioridad
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </label>
        <label>
          Vence
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Guardando…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
