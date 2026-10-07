# Taskflow

Aplicacion web de gestion de tareas desarrollada para la asignatura **Programacion IV** de la **Universidad Tecnologica Nacional, Facultad Regional Avellaneda (UTN FRA)**.

Taskflow permite iniciar sesion con GitHub, administrar tareas persistidas en Supabase, organizarlas por estado y adjuntar archivos. El frontend esta construido con Angular 22 y utiliza componentes standalone, Signals, control de flujo integrado y Signal Forms.

## Indice

- [Objetivos](#objetivos)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Configuracion de Supabase](#configuracion-de-supabase)
- [Instalacion y ejecucion](#instalacion-y-ejecucion)
- [Rutas de la aplicacion](#rutas-de-la-aplicacion)
- [Modelo de datos](#modelo-de-datos)
- [Pruebas](#pruebas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Alcance actual](#alcance-actual)

## Objetivos

- Modelar una entidad de dominio (`TaskModel`) con tipos estrictos en TypeScript.
- Implementar operaciones de alta, consulta, modificacion y eliminacion de tareas.
- Aplicar Signals para mantener un estado reactivo y centralizado.
- Practicar composicion de componentes standalone y comunicacion mediante signal inputs y outputs.
- Incorporar rutas parametrizadas, validaciones de formularios y una interfaz de usuario en espanol.

## Funcionalidades

- **Tablero:** visualiza las tareas en las columnas Pendientes, En curso y Hechas.
- **Listado:** muestra todas las tareas y permite filtrarlas por titulo.
- **Autenticacion:** inicio y cierre de sesion mediante GitHub OAuth con Supabase Auth.
- **Rutas protegidas:** las vistas de tareas requieren una sesion valida.
- **Nueva tarea y edicion:** permiten guardar titulo, estado, prioridad y un archivo adjunto.
- **Detalle:** consulta la tarea y muestra enlaces a sus adjuntos.
- **Prioridades:** permite seleccionar P1, P2 o P3.
- **Acciones rapidas:** marcar una tarea como hecha y eliminarla desde las tarjetas.
- **Actualizaciones en tiempo real:** Supabase Realtime sincroniza cambios de la tabla `tasks`.
- **Validaciones:** el titulo es obligatorio, debe tener entre 3 y 80 caracteres y la prioridad debe estar entre 1 y 3.

## Tecnologias

- [Angular](https://angular.dev/) 22.1 (standalone, Signals, signal inputs/outputs y Signal Forms)
- Angular Router con guards funcionales
- TypeScript 6.0 con `strict` y `strictTemplates`
- [Supabase JavaScript](https://supabase.com/docs/reference/javascript) 2.117 para Auth, Postgres, Realtime y Storage
- RxJS 7.8
- Vitest 4 para pruebas unitarias
- npm 11.17.0

## Arquitectura

La aplicacion arranca con `bootstrapApplication` y utiliza una arquitectura basada en componentes standalone y providers:

- `App`: componente raiz, navegacion y accion de cierre de sesion.
- `AuthService`: mantiene la sesion como Signal e integra Supabase Auth.
- `TaskStore`: servicio singleton con el estado de tareas, operaciones y suscripcion Realtime.
- `TaskApi`: acceso a la tabla `public.tasks` de Supabase.
- `AttachmentsService`: carga y consulta archivos en Supabase Storage.
- `authGuard` y `guestGuard`: protegen las rutas de usuario autenticado y de invitados.
- `TaskBoard`: organiza las tareas por estado.
- `TaskList`: presenta el listado y aplica el filtro de busqueda.
- `TaskCard`: componente reutilizable para representar una tarea.
- `TaskDetail`: muestra la informacion de la tarea y los adjuntos existentes.
- `TaskForm`: gestiona el alta, edicion y carga de adjuntos con validaciones.
- `PriorityPicker`: control reutilizable para seleccionar la prioridad.

La UI usa el control de flujo integrado (`@if`, `@for`), Signals (`signal`, `computed`, `effect`) y Signal Forms. Las tareas se leen y guardan en Supabase; el bucket `attachments` almacena los archivos bajo una ruta por usuario y tarea.

## Requisitos

- Node.js en una de las ramas compatibles con Angular 22: `^22.22.3`, `^24.15.0` o `>=26.0.0`.
- npm 11.17.0 o una version compatible.
- Un navegador web actualizado.
- Un proyecto de Supabase con Auth, una base de datos Postgres y Storage.

Se recomienda comprobar las versiones instaladas con:

```bash
node --version
npm --version
```

## Configuracion de Supabase

1. Configura GitHub como proveedor en **Authentication > Providers** de Supabase. Registra en GitHub la URL de callback de Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`). En **Authentication > URL Configuration**, establece **Site URL** en `https://programaccion-iv-utn.vercel.app` y agrega `http://localhost:4200/**` y `https://programaccion-iv-utn.vercel.app/**` a **Redirect URLs**. El codigo vuelve a `/board` en el mismo origen desde el que se inicio el login.
2. Crea `public.tasks` con estas columnas: `id` (bigint autogenerado), `title` (text), `status` (text), `priority` (integer) y `user_id` (uuid relacionado con `auth.users`). Los estados aceptados por la app son `pending`, `in-progress` y `done`; la prioridad va de 1 a 3.
3. Activa RLS en `public.tasks` y agrega politicas para que cada usuario autenticado solo pueda leer, insertar, actualizar y borrar filas donde `auth.uid() = user_id`.
4. Habilita la tabla `tasks` en la publicacion de Realtime de Supabase.
5. Crea el bucket de Storage `attachments`. La app guarda cada objeto como `{userId}/{taskId}/{nombreNormalizado}` y necesita politicas para listar y cargar archivos solo dentro de la carpeta del usuario autenticado. La implementacion usa `getPublicUrl`; si el bucket es publico, cualquier persona que obtenga un enlace puede leer esos archivos.
6. Configura la URL del proyecto y la clave anon/publicable en `src/environments/environments.ts`, en las propiedades `supebaseUrl` y `supabaseAnonkey`. Esta clave se entrega al navegador: nunca coloques una clave `service_role` en el frontend. La seguridad debe depender de RLS y de las politicas de Storage.

`src/environments/environments.prod.ts` existe, pero `angular.json` no configura un reemplazo de archivo para produccion. Antes de desplegar, configura un mecanismo de configuracion de produccion y evita publicar credenciales privilegiadas.

## Instalacion y ejecucion

Desde la carpeta `taskflow`, instalar las dependencias:

```bash
npm ci
```

Iniciar el servidor de desarrollo:

```bash
npm start
```

Luego abrir [http://localhost:4200/](http://localhost:4200/). Angular recarga automaticamente la aplicacion cuando se modifican los archivos fuente.

Para compilar una version optimizada:

```bash
npm run build
```

Los artefactos se generan en la carpeta `dist/`.

Ejecutar las pruebas en modo no interactivo:

```bash
npm test -- --watch=false
```

## Rutas de la aplicacion

| Ruta | Vista | Descripcion |
| --- | --- | --- |
| `/login` | Inicio de sesion | Acceso mediante GitHub para usuarios sin sesion. |
| `/board` | Tablero | Organiza las tareas por estado. |
| `/tasks` | Tareas | Lista y filtra tareas por titulo. |
| `/tasks/new` | Nueva tarea | Crea una tarea. |
| `/tasks/:taskId` | Detalle | Consulta una tarea especifica. |
| `/tasks/:taskId/edit` | Editar tarea | Modifica una tarea existente. |

La ruta raiz redirige a `/board`. Las rutas de tareas requieren autenticacion; `/login` redirige al tablero si ya existe una sesion. Las rutas desconocidas vuelven al tablero.

## Modelo de datos

Cada tarea se representa mediante la siguiente estructura:

```ts
interface TaskModel {
	id: number;
	title: string;
	status: 'pending' | 'in-progress' | 'done';
	priority: 1 | 2 | 3;
	assignee?: UserModel;
}
```

Los estados se muestran como **Pendiente**, **En curso** y **Hecha**. La prioridad se expresa como P1, P2 o P3. El propietario se persiste en `user_id`; RLS debe impedir el acceso a tareas de otros usuarios.

## Pruebas

Ejecutar las pruebas unitarias con:

```bash
npm test
```

El proyecto utiliza Vitest a traves del builder de pruebas de Angular. La suite cubre la creacion de componentes y casos basicos, incluido el formulario con adjuntos. Ejecuta `npm test -- --watch=false` para correrla completa.

No existe un script de pruebas end-to-end configurado en este proyecto.

## Estructura del proyecto

```text
taskflow/
├── public/                         # Recursos publicos
├── src/
│   ├── main.ts                     # Punto de entrada
│   ├── styles.css                  # Estilos globales
│   └── app/
│       ├── app.ts                  # Componente raiz
│       ├── app.html                # Navegacion y outlet
│       ├── app.routes.ts           # Rutas y guards
│       ├── app.config.ts           # Providers de Angular
│       ├── guard/                  # Guards funcionales
│       ├── login/                  # Inicio de sesion
│       ├── services/               # Auth, Supabase, tareas y adjuntos
│       └── tasks/
│           ├── task.model.ts       # Modelos y tipos
│           ├── task-status.ts      # Estados y funciones auxiliares
│           ├── task-board/         # Vista de tablero
│           ├── task-list/          # Vista de listado
│           ├── task-detail/        # Vista de detalle
│           ├── task-form/          # Alta y edicion
│           ├── task-card/          # Tarjeta reutilizable
│           └── priority-picker/    # Selector de prioridad
├── angular.json
├── package.json
└── tsconfig.json
```

## Alcance actual

Taskflow persiste las tareas en Supabase y actualiza la interfaz con Realtime. La autenticacion, RLS de Postgres y las politicas de Storage deben estar configuradas en el proyecto Supabase para que las operaciones funcionen de forma segura. No hay pruebas end-to-end configuradas.

## Autor y contexto academico

Proyecto desarrollado como trabajo practico para **Programacion IV - UTN Facultad Regional Avellaneda**.

## Licencia

Este proyecto fue desarrollado con fines academicos.
