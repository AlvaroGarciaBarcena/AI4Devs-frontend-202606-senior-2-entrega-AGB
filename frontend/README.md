# Frontend — LTI Talent Tracking System

Construido con [Vite](https://vite.dev) + React + TypeScript (migrado desde
Create React App, descontinuado por el equipo de React).

## Scripts disponibles

### `npm run dev`

Arranca el servidor de desarrollo en [http://localhost:3000](http://localhost:3000)
con hot module replacement. El puerto está fijado a `3000` en
`vite.config.ts` porque el backend tiene el CORS configurado para ese
origen concretamente.

### `npm run build`

Type-checkea el proyecto (`tsc -b`) y genera el build de producción en
`dist/` (antes `build/` con Create React App).

### `npm run preview`

Sirve localmente el contenido de `dist/`, para comprobar el build de
producción antes de desplegarlo.

### `npm test`

Ejecuta los tests con [Vitest](https://vitest.dev) una vez y termina
(`--passWithNoTests`: no falla si todavía no hay ningún test). Para modo
observador durante el desarrollo, usa `npm run test:watch`.

### `npm run lint`

Ejecuta ESLint (configuración plana en `eslint.config.js`).

## Idioma

Los textos de la interfaz están internacionalizados con `react-i18next`
(español/inglés) — ver `src/i18n/`.
