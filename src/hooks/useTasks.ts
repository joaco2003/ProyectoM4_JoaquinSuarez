import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
    createTask,
    deleteTask,
    reorderTasks,
    subscribeToTasks,
    toggleTask,
    updateTask,
} from '../services/tasks';
import { sendTaskCreatedEmail } from '../services/notify';
import type { Task, TaskFormValues } from '../types';


export function useTasks(user: User) {
    const uid = user.uid;
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
            (err) => {
                console.error(err);
                setError('No pudimos cargar tus tareas. Recargá la página.');
                setLoading(false);
            },
        );
    }, [uid]);

    const run = useCallback((action: () => Promise<void>, message: string) => {
        action().catch((err) => {
            console.error(err);
            setError(message);
        });
    }, []);

    const addTask = useCallback(
        (values: TaskFormValues) => {
            const title = values.title.trim();
            run(
                () => createTask(uid, values).then(() => sendTaskCreatedEmail(user, title)),
                'No se pudo guardar la tarea en el servidor. Revisá Firestore y tus reglas.',
            );
        },
        [uid, user, run],
    );

    const editTask = useCallback(
        (id: string, values: TaskFormValues) => run(() => updateTask(uid, id, values), 'No se pudo editar la tarea.'),
        [uid, run],
    );

    const toggle = useCallback(
        (id: string, completed: boolean) => run(() => toggleTask(uid, id, completed), 'No se pudo actualizar la tarea.'),
        [uid, run],
    );

    const remove = useCallback(
        (id: string) => run(() => deleteTask(uid, id), 'No se pudo eliminar la tarea.'),
        [uid, run],
    );

    const reorder = useCallback(
        (orderedIds: string[]) => run(() => reorderTasks(uid, orderedIds), 'No se pudo guardar el nuevo orden.'),
        [uid, run],
    );

    return { tasks, loading, error, addTask, editTask, toggle, remove, reorder };
}