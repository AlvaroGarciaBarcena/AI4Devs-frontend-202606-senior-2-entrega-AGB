# Registro de prompts y arreglos — Validación de candidatos: mensajes claros, i18n y a11y (rama `candidate-validation-i18n-a11y-AGB`)

Autor: garciabarcenaalvaro@gmail.com
Asistente: Claude Code (Sonnet 5)
Fecha: 2026-09-16

Rama base: fusión de `backend-AGB` (commit `24f86fd`) y `frontend-AGB`
(commit `d92752d`), ambas partiendo de `main` (`8025b6f`).

> Nota sobre la fusión: esta rama toca exactamente los mismos ficheros que
> `backend-AGB` (`validator.ts`, `candidateController.ts`,
> `candidateRoutes.ts`) y `frontend-AGB` (`AddCandidateForm.js`,
> `candidateService.js`) ya habían corregido, así que en vez de partir de
> `main` de nuevo (y reintroducir bugs ya arreglados en esas dos ramas), se
> parte de la fusión de ambas. El único conflicto de la fusión fue este
> mismo fichero (`prompts-AGB.md`), porque las dos ramas crearon uno
> independiente en la raíz; se resolvió conservando ambos como
> [`prompts-AGB-backend.md`](./prompts-AGB-backend.md) y
> [`prompts-AGB-frontend.md`](./prompts-AGB-frontend.md), y reescribiendo
> este fichero para el trabajo de la rama actual.

_(Esta sección se completa más abajo, tras implementar los cambios de esta
rama.)_
