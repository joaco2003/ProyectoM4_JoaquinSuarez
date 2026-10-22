import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import { useTasks } from './useTasks';
import type { Task } from '../types';

const mocks = vi.hoisted(() => ({
    subscribeToTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    toggleTask: vi.fn(),
    deleteTask: vi.fn(),
    reorderTasks: vi.fn(),
    sendTaskCreatedEmail: vi.fn(),
}));

vi.mock('../services/tasks', () => ({
    subscribeToTasks: mocks.subscribeToTasks,
    createTask: mocks.createTask,
    updateTask: mocks.updateTask,
    toggleTask: mocks.toggleTask,
    deleteTask: mocks.deleteTask,
    reorderTasks: mocks.reorderTasks,
}));
vi.mock('../services/notify', () => ({ sendTaskCreatedEmail: mocks.sendTaskCreatedEmail }));

const user = { uid: 'u1' } as User;
const task: Task = {
    id: 't1', title: 'Hola', description: '', completed: false, priority: 'media',
    dueDate: null, order: 0, createdAt: null, updatedAt: null,
};
const values = { title: ' Nueva ', description: '', priority: 'alta' as const, dueDate: '' };

describe('useTasks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.subscribeToTasks.mockImplementation((_uid: string, onData: (t: Task[]) => void) => {
            onData([task]);
            return () => { };
        });
    });

    it('carga las tareas del usuario y deja de estar cargando', async () => {
        const { result } = renderHook(() => useTasks(user));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.tasks).toEqual([task]);
        expect(mocks.subscribeToTasks).toHaveBeenCalledWith('u1', expect.any(Function), expect.any(Function));
    });

    it('crea la tarea y envía el email con el título limpio', async () => {
        mocks.createTask.mockResolvedValue(undefined);
        const { result } = renderHook(() => useTasks(user));

        act(() => result.current.addTask(values));

        await waitFor(() => expect(mocks.sendTaskCreatedEmail).toHaveBeenCalledWith(user, 'Nueva'));
        expect(mocks.createTask).toHaveBeenCalledWith('u1', values);
    });

    it('expone un error si el servidor rechaza la tarea y no envía email', async () => {
        mocks.createTask.mockRejectedValue(new Error('permission-denied'));
        vi.spyOn(console, 'error').mockImplementation(() => { });
        const { result } = renderHook(() => useTasks(user));

        act(() => result.current.addTask(values));

        await waitFor(() => expect(result.current.error).toContain('No se pudo guardar la tarea'));
        expect(mocks.sendTaskCreatedEmail).not.toHaveBeenCalled();
    });
});