import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TaskForm from './TaskForm';

describe('TaskForm', () => {
  it('muestra error si el título está vacío y no envía', async () => {
    const onSubmit = vi.fn();
    render(<TaskForm submitLabel="Agregar tarea" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Agregar tarea' }));

    expect(screen.getByRole('alert')).toHaveTextContent('El título es obligatorio.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía título y descripción y limpia el formulario', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<TaskForm submitLabel="Agregar tarea" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Título'), 'Comprar yerba');
    await userEvent.type(screen.getByLabelText('Descripción'), 'Dos paquetes');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar tarea' }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Comprar yerba',
      description: 'Dos paquetes',
      priority: 'media',
      dueDate: '',
    });
    expect(screen.getByLabelText('Título')).toHaveValue('');
  });

  it('muestra error si onSubmit falla', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('boom'));
    render(<TaskForm submitLabel="Agregar tarea" onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Título'), 'Algo');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar tarea' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos guardar la tarea');
  });
});
