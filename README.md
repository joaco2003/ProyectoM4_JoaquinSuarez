# MateCode Tareas

SPA de gestión de tareas con **React + TypeScript**, **Firebase (Auth + Firestore)**, notificaciones por email con **AWS SES**, tests con **Vitest + React Testing Library** y deploy en **Vercel**.

## Funcionalidades
- Registro / login con email y contraseña o Google, logout y manejo de errores de autenticación.
- Rutas privadas: sin sesión no se ven las tareas (`ProtectedRoute`).
- CRUD de tareas (título + descripción), marcar como completada, en tiempo real.
- Cada usuario solo ve sus tareas (`users/{uid}/tasks` + reglas de Firestore).
- Email al crear una tarea (función serverless `api/send-email.ts` → SES).
- Diseño responsive, mobile first.

## Arquitectura
```
src/
  components/   TaskForm, TaskItem, ProtectedRoute (+ tests)
  context/      AuthContext (estado de sesión)
  pages/        AuthPage (login/registro), TasksPage
  services/     tasks.ts (Firestore), notify.ts (llamada a /api/send-email)
  utils/        authErrors.ts
  types.ts      Task, TaskFormValues, AuthMode
api/send-email.ts   Función serverless: verifica el ID token de Firebase y envía con SES
firestore.rules     Reglas de seguridad
```

## Puesta en marcha
1. `npm install`
2. Creá un proyecto en [Firebase Console](https://console.firebase.google.com): habilitá **Authentication** (Email/Password y Google) y **Firestore**.
3. Copiá `.env.example` a `.env.local` y completá las variables `VITE_FIREBASE_*`.
4. Pegá `firestore.rules` en Firestore > Rules y publicalas.
5. `npm run dev`

> Para probar `/api/send-email` en local usá `npx vercel dev` (con todas las variables del `.env.example`).

## AWS SES
1. En SES, verificá el email o dominio remitente (`SES_FROM_EMAIL`).
2. Mientras la cuenta esté en **sandbox**, también tenés que verificar los emails destinatarios (o pedir salida del sandbox).
3. Creá un usuario IAM con permiso solo `ses:SendEmail` y cargá sus claves como variables de entorno en Vercel.

## Tests
```
npm test
```

## Deploy en Vercel
1. Subí el repo a GitHub e importalo en Vercel (framework: Vite).
2. Cargá **todas** las variables de `.env.example` en Project Settings > Environment Variables.
3. En Firebase > Authentication > Settings > Authorized domains, agregá tu dominio `*.vercel.app`.

## Uso de IA (documentación)
Completá esta sección con tu experiencia real: qué herramienta usaste, qué prompts, qué te sirvió y qué corregiste. Ejemplo de formato:

| Tarea | Prompt resumido | Resultado | Qué entendí / ajusté |
|---|---|---|---|
| Reglas de Firestore | "Reglas para que cada usuario solo lea y escriba sus tareas" | Reglas con `request.auth.uid == userId` | Agregué validación de tipos y longitud |
