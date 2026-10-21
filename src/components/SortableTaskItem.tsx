import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TaskItem from './TaskItem';

type Props = Omit<ComponentProps<typeof TaskItem>, 'rootRef' | 'rootStyle' | 'handleProps' | 'dragging'>;

export default function SortableTaskItem(props: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: props.task.id,
    });

    return (
        <TaskItem
            {...props}
            rootRef={setNodeRef}
            rootStyle={{ transform: CSS.Transform.toString(transform), transition }}
            handleProps={{ ...attributes, ...listeners } as ButtonHTMLAttributes<HTMLButtonElement>}
            dragging={isDragging}
        />
    );
}