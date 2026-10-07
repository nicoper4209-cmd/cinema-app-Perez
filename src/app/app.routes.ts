import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guard/auth-guard';
import { Login } from './login/login';
import { TaskBoard } from './tasks/task-board/task-board';
import { TaskList } from './tasks/task-list/task-list';
import { TaskDetail } from './tasks/task-detail/task-detail';
import { TaskForm } from './tasks/task-form/task-form';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'board' },
    { path: 'login', component: Login, canActivate: [guestGuard] },
    { path: 'board', component: TaskBoard, canActivate: [authGuard] },
    { path: 'tasks', component: TaskList, canActivate: [authGuard] },
    { path: 'tasks/new', component: TaskForm, canActivate: [authGuard] },
    { path: 'tasks/:taskId', component: TaskDetail, canActivate: [authGuard] },
    { path: 'tasks/:taskId/edit', component: TaskForm, canActivate: [authGuard] },
    { path: '**', redirectTo: 'board' }
];
