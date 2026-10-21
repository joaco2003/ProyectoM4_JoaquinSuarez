import type { Priority, Task, TaskFilter, TaskSort } from '../types';

const PRIORITY_RANK: Record<Priority, number> = { alta: 0, media: 1, baja: 2 };

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
    if (filter === 'pending') return tasks.filter((t) => !t.completed);
    if (filter === 'completed') return tasks.filter((t) => t.completed);
    return tasks;
}

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
    const byOrder = (a: Task, b: Task) => a.order - b.order;
    const copy = [...tasks];

    if (sort === 'priority') {
        return copy.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byOrder(a, b));
    }
    if (sort === 'due') {
        return copy.sort((a, b) => {
            if (a.dueDate && b.dueDate) {
                return a.dueDate.localeCompare(b.dueDate) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
            }
            if (a.dueDate) return -1; // las que tienen fecha van primero
            if (b.dueDate) return 1;
            return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byOrder(a, b);
        });
    }
    return copy.sort(byOrder);
}

export function todayString(now: Date = new Date()): string {
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${m}-${d}`;
}

export function isOverdue(task: Pick<Task, 'completed' | 'dueDate'>, today: string = todayString()): boolean {
    return !task.completed && !!task.dueDate && task.dueDate < today;
}

export function formatDueDate(dueDate: string): string {
    const [y, m, d] = dueDate.split('-');
    return `${d}/${m}/${y}`;
}