//Los estados posibles de una tarea son: pendiente, en progreso y completada.
export type TaskStatus = 'pending' | 'in-progress' | 'done';

export const STATUS_LABELS: Record<TaskStatus, string> = {
    pending: 'Pendiente',
    'in-progress': 'En curso',
    done: 'Hecha',
};

export const COLUMN_LABELS: Record<TaskStatus, string> = {
    pending: 'Pendientes',
    'in-progress': 'En curso',
    done: 'Hechas',
};

export function statusLabel(status: TaskStatus): string {
    return STATUS_LABELS[status];
}

export function nextStatus(status: TaskStatus): TaskStatus {
    switch (status) {
        case 'pending': return 'in-progress';
        case 'in-progress': return 'done';
        case 'done': return 'pending';
        default: const check: never = status; return check;
    }
}
