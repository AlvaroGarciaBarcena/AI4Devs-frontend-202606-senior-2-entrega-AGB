## Why

Toda esta sesión se ha documentado en `prompts-AGB.md`, un diario narrativo de ~3300 líneas repartido en 14 ramas git. Es completo, pero no es consultable: para saber "¿qué hace el sistema hoy con la autenticación?" hay que leer el fichero entero y reconstruir el hilo tú mismo. El usuario pidió más trazabilidad — una forma de ver qué hace el sistema ahora mismo, capacidad por capacidad, y de qué rama viene cada pieza de comportamiento, sin tener que leer la narrativa completa.

Este change adopta OpenSpec retroactivamente: extrae de `prompts-AGB.md` y del código real (verificado, no de memoria) una foto estructurada de las capacidades del sistema tal y como quedan tras las 14 ramas, con cada requisito etiquetado con la rama (y el commit) que lo implementó.

## What Changes

- Se inicializa OpenSpec en el repo (`openspec init`, esquema `spec-driven`).
- Se documentan 10 capacidades nuevas, cada una con sus requisitos y escenarios, extraídos del trabajo ya implementado en las 14 ramas de esta sesión.
- Cada requisito incluye una línea de trazabilidad (`Rama: `<nombre>` (commit `<hash>`)`) señalando en qué rama se implementó — la pieza central de lo que pidió el usuario.
- Los cambios puramente de herramientas/infraestructura sin comportamiento observable (migración de Create React App a Vite, actualización de `react-router-dom` a v7, incorporación de tests automáticos) **no** generan una capacidad propia — no cambian qué hace el sistema, cambian cómo está construido. Quedan reflejados aquí, en el Impact, y en `prompts-AGB.md`, no como requisitos de spec.
- No se modifica ni una línea de código de la aplicación — este change es puramente documental.

## Capabilities

### New Capabilities
- `candidate-intake`: alta de un candidato (datos básicos, CV, educación, experiencia laboral, vínculo con una posición vía Application) y el comportamiento del formulario (errores que se limpian al corregir, reseteo tras un alta con éxito).
- `candidate-validation`: las reglas de validación de cada campo y la arquitectura de errores estructurados (`{field, code, params}`) que permite traducirlos sin que el backend decida el idioma.
- `file-upload`: subida del CV del candidato — tipos aceptados, límite de tamaño, saneamiento del nombre de fichero.
- `position-catalog`: listado de posiciones abiertas con los datos reales de cada una.
- `hiring-pipeline`: el tablero "Ver proceso" — candidatos agrupados por fase de entrevista, puntuación media.
- `authentication`: login/logout contra los `Employee` sembrados, JWT, protección de rutas.
- `internationalization`: detección automática de idioma, selector explícito, mensajes traducidos en toda la aplicación.
- `accessibility`: técnicas WCAG 2.1 aplicadas al formulario de alta y al selector de idioma.
- `security-hardening`: cabeceras de seguridad, límites de peticiones, validaciones anti-abuso que no son parte del flujo funcional pero sí requisitos reales del sistema.
- `frontend-performance`: carga diferida por ruta del bundle del frontend.

### Modified Capabilities
(ninguna — `openspec/specs/` está vacío, todo es capacidad nueva desde la perspectiva de OpenSpec)

## Impact

- Ficheros nuevos únicamente, bajo `openspec/`; ningún fichero de la aplicación (backend/frontend) se toca.
- Fuente de cada requisito: el código real del repo (verificado con `grep`/lectura directa al escribir cada spec, no solo con `prompts-AGB.md`) y los commits de las 14 ramas ya existentes.
- No cubierto por una capacidad propia (documentado como decisión, no como omisión — ver "What Changes"): migración de Create React App a Vite (`vite-migration-AGB`), migración de `react-router-dom` a v7 (`react-router-v7-AGB`), incorporación de tests automáticos (`tests-AGB`) — cambios de herramientas sin comportamiento observable propio.
