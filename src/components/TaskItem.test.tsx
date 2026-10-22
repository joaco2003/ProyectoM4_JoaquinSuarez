import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TaskItem from './TaskItem';
import type { Task } from '../types';

const task: Task = {
  id: 't1',
  title: 'Estudiar React',
  description: 'Hooks y context',
  completed: false,
  priority: 'media',
  dueDate: null,
  order: 0,
  createdAt: null,
  updatedAt: null,
};

function setup(overrides: Partial<Task> = {}) {
  const handlers = {
    onToggle: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn().mockResolvedValue(undefined),
  };
  render(<TaskItem task={{ ...task, ...overrides }} {...handlers} />);
  return handlers;
}

describe('TaskItem', () => {
  it('muestra título y descripción', () => {
    setup();
    expect(screen.getByText('Estudiar React')).toBeInTheDocument();
    expect(screen.getByText('Hooks y context')).toBeInTheDocument();
  });

  it('marca como completada', async () => {
    const { onToggle } = setup();
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('t1', true);
  });

  it('elimina la tarea', async () => {
    const { onDelete } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(onDelete).toHaveBeenCalledWith('t1');
  });

  it('edita la tarea', async () => {
    const { onEdit } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const input = screen.getByLabelText('Título');
    await userEvent.clear(input);
    await userEvent.type(input, 'Estudiar TypeScript');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(onEdit).toHaveBeenCalledWith(
      't1',
      expect.objectContaining({ title: 'Estudiar TypeScript', description: 'Hooks y context' }),
    );
  });
});