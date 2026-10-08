import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guard/auth-guard';
import { Login } from './login/login';
import { Cartelera } from './cine/cartelera/cartelera';
import { DetallePelicula } from './cine/detalle-pelicula/detalle-pelicula';
import { SeleccionButacas } from './cine/seleccion-butacas/seleccion-butacas';
import { TaskBoard } from './tasks/task-board/task-board';
import { TaskList } from './tasks/task-list/task-list';
import { TaskDetail } from './tasks/task-detail/task-detail';
import { TaskForm } from './tasks/task-form/task-form';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'cartelera' },
    { path: 'login', component: Login, canActivate: [guestGuard] },
    { path: 'cartelera', component: Cartelera },
    { path: 'pelicula/:peliculaId', component: DetallePelicula },
    { path: 'compra/:peliculaId/:funcionId', component: SeleccionButacas },
    { path: 'compra/:peliculaId', component: SeleccionButacas },
    { path: 'board', component: TaskBoard, canActivate: [authGuard] },
    { path: 'tasks', component: TaskList, canActivate: [authGuard] },
    { path: 'tasks/new', component: TaskForm, canActivate: [authGuard] },
    { path: 'tasks/:taskId', component: TaskDetail, canActivate: [authGuard] },
    { path: 'tasks/:taskId/edit', component: TaskForm, canActivate: [authGuard] },
    { path: '**', redirectTo: 'cartelera' }
];
