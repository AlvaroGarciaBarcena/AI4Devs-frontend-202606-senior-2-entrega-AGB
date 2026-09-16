# Registro de prompts y arreglos — Integración completa + i18n + Vite + tests (rama `tests-AGB`)

Autor: garciabarcenaalvaro@gmail.com
Asistente: Claude Code (Sonnet 5)
Fecha: 2026-09-16 / 2026-09-17

Rama base: `vite-migration-AGB` (commit `84cf836`), que ya reunía
`backend-AGB` + `frontend-AGB` + `candidate-validation-i18n-a11y-AGB` +
`positions-proceso-AGB` + la migración de i18n a `react-i18next` + la
migración de Create React App a Vite. Esta rama no fusiona nada nuevo —
añade **tests automáticos** que codifican las verificaciones que hasta
ahora solo se habían hecho a mano (`curl` y navegador) a lo largo de toda
la sesión.

> Nota: las secciones 1-13 de este documento son el historial heredado de
> `i18n-react-i18next-AGB`/`all-fixes-AGB` sin modificar — validación,
> i18n con `react-i18next`, accesibilidad. La sección 14 documenta la
> migración de CRA a Vite, y la sección 15 la incorporación de tests
> automáticos. El histórico de `positions-proceso-AGB` sigue en
> [`prompts-AGB-positions.md`](./prompts-AGB-positions.md), y el de
> `backend-AGB`/`frontend-AGB` en
> [`prompts-AGB-backend.md`](./prompts-AGB-backend.md) /
> [`prompts-AGB-frontend.md`](./prompts-AGB-frontend.md).

## 0. Resumen ejecutivo: el camino completo, de un vistazo

Esta sesión generó **8 ramas** a partir de `main`, en varias oleadas. Esta
sección existe para poder entender el conjunto sin tener que leer las
~1600 líneas de detalle de más abajo — cada punto enlaza a la sección
donde está el porqué completo.

### 0.1 Mapa de ramas

```
main (8025b6f) — estado original del repo, sin tocar
│
├── backend-AGB (24f86fd)            — arreglos de bugs del backend
├── frontend-AGB (d92752d)           — arreglos de bugs del frontend
├── positions-proceso-AGB (cd86b57)  — feature "Ver proceso" (parte de main
│                                       directamente, independiente de las
│                                       dos de arriba)
│
└── candidate-validation-i18n-a11y-AGB (eea6e5a)
    │  = fusión de backend-AGB + frontend-AGB
    │  + mensajes de validación estructurados y traducibles
    │  + i18n "casero" (Context + diccionario a mano) para toda la app
    │  + accesibilidad (aria-*, <html lang>, selector de idioma)
    │
    └── all-fixes-AGB (d60127b)
        │  = fusión de lo anterior + positions-proceso-AGB
        │  (todo el trabajo de las 4 primeras ramas, junto)
        │
        └── i18n-react-i18next-AGB (ace52cb)
            │  = i18n "casero" sustituido por react-i18next (librería
            │    estándar) — mismo comportamiento, mejor base
            │
            └── vite-migration-AGB (6b25e95)
                │  = Create React App sustituido por Vite
                │
                └── tests-AGB  ← RAMA ACTUAL, la más completa
                     = tests automáticos (backend y frontend) que
                       codifican las verificaciones hechas a mano
```

Cada rama tiene su propio commit y su propia sección de detalle en este
documento (o en `prompts-AGB-backend.md` / `prompts-AGB-frontend.md` /
`prompts-AGB-positions.md` para las tres primeras, conservadas aparte
porque sus `prompts-AGB.md` originales entraron en conflicto de fusión al
integrarlas).

### 0.2 Cronología y qué disparó cada rama

| # | Petición del usuario (resumida) | Rama resultante | Sección |
|---|---|---|---|
| 1 | "Analiza este repo y cuéntame qué hace y qué errores descubres" | *(análisis, sin rama)* | — |
| 2 | "Arranca... backend y frontend" | *(arranque del entorno)* | — |
| 3 | "Créa una rama para el back y otra para el front con los arreglos" | `backend-AGB`, `frontend-AGB` | `prompts-AGB-backend.md`, `prompts-AGB-frontend.md` |
| 4 | "¿Por qué no funcionan los botones 'Ver proceso'? ... Adelante" | `positions-proceso-AGB` | `prompts-AGB-positions.md` |
| 5 | "Me devuelve 'Invalid name' sin decir por qué. ¿Me ayudas?" → "Mejora el mensaje, con i18n y a11y" | `candidate-validation-i18n-a11y-AGB` (fusiona backend-AGB+frontend-AGB) | 3.1–3.8 |
| 6 | Varios reportes de "el idioma no funciona bien" (resultaron ser: pestaña con caché obsoleta, y luego detección real pero navegador en inglés) | *(arreglos dentro de la misma rama)* | 3.3.1, 3.6–3.8 |
| 7 | "¿Añades el selector a todo, no solo a los mensajes de error?" | *(misma rama, se extiende el alcance)* | 3.9–3.11 |
| 8 | "¿Incluyes positions-proceso-AGB para tenerlo todo fusionado?" | `all-fixes-AGB` | 3.12 |
| 9 | "¿Qué mejorarías [del i18n]?" → "Implementa el 1 [librería estándar]" | `i18n-react-i18next-AGB` | 3.13 |
| 10 | "¿Por qué no TS5?" → "CRA está descontinuado, analiza migrar a Vite" → "Vamos a por ello" | `vite-migration-AGB` | 3.14 |
| 11 | "¿Añades todos los Tests para que tengamos las mismas pruebas de validación que en las primeras ramas?" | `tests-AGB` | 3.15 |

### 0.3 Qué se hizo, paso a paso, en cada rama

Versión compacta de las secciones 3.x — el detalle completo (comandos,
fragmentos de código, verificaciones) está en la sección referenciada.

**`backend-AGB`** (detalle en `prompts-AGB-backend.md`):
1. Credenciales de la base de datos hardcodeadas en `schema.prisma` → `env("DATABASE_URL")`; `.env` deja de trackearse en git.
2. `validator.ts`: se quita el `if (data.id) return` que saltaba toda la validación.
3. Middleware de logging registrado después de las rutas (nunca se ejecutaba) → movido antes.
4. `throw new Error(error)` envolviendo errores y perdiendo el mensaje → simplificado.
5. Ruta de subida de ficheros relativa y frágil (`../uploads/`) → anclada a `process.cwd()`, se crea si no existe.
6. Faltaba `isNaN` en `positionController` (a diferencia de `candidateController`) → añadido.
7. Alta de candidato duplicada entre `candidateRoutes.ts` y un controlador sin usar → unificada.
8. Test de `positionService` desactualizado (no contemplaba `id`/`applicationId`) → corregido.

**`frontend-AGB`** (detalle en `prompts-AGB-frontend.md`):
1. `App.js` y `App.tsx` duplicados (CRA resolvía `.js`, `App.tsx` quedaba muerto) → `App.tsx` eliminado.
2. `candidateService.js`: `new Error(msg, data)` con el segundo argumento ignorado, y `TypeError` si el servidor no respondía → corregido.
3. `axios` usado pero nunca instalado (descubierto al intentar reutilizar el servicio) → instalado.
4. `AddCandidateForm`/`FileUploader` reimplementaban las llamadas con `fetch` en vez de usar el servicio → unificados.

**`positions-proceso-AGB`** (detalle en `prompts-AGB-positions.md`):
1. Diagnóstico: el botón "Ver proceso" no tenía `onClick` ni ruta, y aunque la tuviera no había endpoint de listado ni id real (los datos eran mock).
2. Backend: nuevo `GET /position` (servicio + controlador + ruta + tests).
3. Frontend: `Positions.tsx` pasa de datos mock a la API real; nuevo `PositionProcess.tsx` con un tablero Kanban por fase de entrevista.
4. Hallazgo incidental: `ts-node` sin `--transpile-only` no podía ejecutar el seed de Prisma → añadido script `prisma:seed`.

**`candidate-validation-i18n-a11y-AGB`** (detalle en 3.1–3.11, esta misma rama fusiona `backend-AGB`+`frontend-AGB` primero):
1. `validator.ts` reescrito: de un `Error('Invalid name')` genérico a `{ field, code, params }` acumulando todos los fallos, no solo el primero.
2. Bug de `instanceof` con `target: es5` que rompía distinguir `ValidationError` de otros errores → corregido con `Object.setPrototypeOf`.
3. `candidateController.ts` distingue `ValidationError` y devuelve el array de issues sin traducir.
4. Frontend: `i18n/validationMessages.js` traduce esos issues; mensajes por campo con `aria-invalid`/`aria-describedby`, resumen con `role="alert"`.
5. `getLocale()` pasa de mirar solo `navigator.language` a recorrer `navigator.languages` completo.
6. `<html lang="en">` estático (hallado por el usuario) corregido a `"es"`.
7. Selector de idioma explícito (Español/English), con la detección automática como valor inicial, nunca sustituida salvo elección explícita.
8. Extensión del i18n "casero" (Context + diccionario) a los 5 componentes con texto visible, no solo los mensajes de validación.

**`all-fixes-AGB`** (detalle en 3.12):
1. Fusión de `candidate-validation-i18n-a11y-AGB` + `positions-proceso-AGB`.
2. Conflictos resueltos a mano en `App.js` (rutas + selector de idioma) y `Positions.tsx` (datos reales + i18n combinados).
3. `PositionProcess.tsx`, nuevo con la fusión, traducido por primera vez.
4. Backend fusionado sin conflictos de contenido, revisado a mano para confirmar que `GET /position` convivía con los `isNaN` ya existentes.

**`i18n-react-i18next-AGB`** (detalle en 3.13):
1. Instalación de `react-i18next`/`i18next`/`i18next-browser-languagedetector` — 3 intentos hasta encontrar versiones compatibles con TypeScript 4.9.5.
2. `locale.js` + `LocaleContext.js` + `translations.js` (caseros) eliminados; sustituidos por `i18n/i18n.js` (config) + `i18n/locales/{es,en}.json` (JSON anidado).
3. `validationMessages.js` reescrito para componer mensajes con `i18n.t()` en vez de plantillas JS a mano.
4. `<html lang>` pasa de fijo a reactivo (`i18n.on('languageChanged', ...)`).
5. Los 6 componentes que usaban el hook casero `useLocale()` migrados a `useTranslation()`.

**`vite-migration-AGB`** (detalle en 3.14, rama actual):
1. Análisis previo del riesgo (sin variables `REACT_APP_*`, sin tests que romper, sin `craco`/`eject`) antes de tocar nada.
2. `react-scripts` desinstalado (-1239 paquetes); Vite instalado tras resolver dos conflictos de peer dependencies (`@babel/core`, `@types/node`).
3. Cadena de versiones de TypeScript: `latest` resolvió `7.0.2` (incompatible con `typescript-eslint`) → `5.9.3` (funciona, pero no la más nueva posible) → `6.0.3` (estable, compatible, la definitiva — a raíz de una pregunta directa del usuario).
4. `index.html` movido a la raíz; `vite.config.ts`, `tsconfig.json` dividido en project references, `vite-env.d.ts` nuevos.
5. `App.js` y 4 componentes con JSX renombrados a `.jsx` (Vite 8 solo activa JSX por extensión).
6. `eslint.config.js` (flat config) nuevo; encontró 5 `throw new Error()` sin `cause` en los servicios, corregidos.
7. Vitest configurado (`npm test` estaba roto desde antes, apuntaba a un `jest.config.js` inexistente).
8. `README.md` (raíz y frontend) actualizados para reflejar los comandos nuevos.

**`tests-AGB`** (detalle en 3.15, rama actual):
1. Backend: nuevos tests para `addCandidateController` (alta con éxito, con el caso del guión bajo, con varios campos acumulados, y error no relacionado con validación) y para `getCandidatesByPosition`/`getInterviewFlowByPosition` (id no numérico, posición inexistente) — huecos reales de cobertura, no cubiertos hasta ahora pese a haberse verificado a mano muchas veces con `curl`.
2. Bug de aislamiento entre tests encontrado al escribirlos: sin `jest.clearAllMocks()` en un `beforeEach`, el recuento de llamadas de un mock se acumulaba entre `it()` distintos, dando falsos negativos.
3. Frontend: primeros tests del proyecto (antes, cero). `i18n/validationMessages.test.js` (composición de mensajes, español/inglés, campos de array), `services/candidateService.test.js` (propagación de issues, el arreglo del doble prefijo, fallo de red sin `TypeError`) y `components/AddCandidateForm.test.jsx` (el flujo completo del guión bajo en el navegador, ahora automatizado).
4. `@testing-library/react`/`user-event`/`jest-dom`, heredados de CRA en versiones antiguas (`user-event@13`, sin `.setup()`), actualizados a las versiones actuales; movidos de `dependencies` a `devDependencies` (nunca debieron ir a producción).

### 0.4 Decisiones clave y por qué (el hilo conductor)

- **Una rama por tema, nunca todo mezclado.** Cada peticion nueva que no
  encajaba claramente en el propósito de la rama activa se llevó a una
  rama nueva (p. ej. "Ver proceso" no se mezcló con los arreglos de
  backend/frontend porque son cosas distintas). Esto se pagó luego en
  forma de fusiones (`all-fixes-AGB`), pero mantuvo cada commit legible y
  revisable de forma aislada.
- **Fusionar hacia delante, nunca rehacer desde `main`.** Cuando hubo que
  combinar trabajo de varias ramas (3.12, y de nuevo al pasar de
  `all-fixes-AGB` a `i18n-react-i18next-AGB` a `vite-migration-AGB`),
  siempre se partió de la rama más completa y se fusionó la que faltaba
  encima — nunca se repitió trabajo ya hecho y verificado desde cero.
- **Backend nunca redacta texto en un idioma.** Desde 3.1, el backend
  solo devuelve *códigos* de validación (`{ field, code, params }`); quién
  sabe en qué idioma quiere verlo el usuario es siempre el frontend. Esta
  decisión de arquitectura temprana es lo que hizo trivial migrar después
  a `react-i18next` (3.13) sin tocar el backend en absoluto.
- **La detección automática de idioma nunca queda sustituida por el
  selector manual — solo se le da prioridad cuando el usuario elige
  explícitamente** (aclarado por el usuario a mitad de una respuesta en
  3.9, respetado también tras migrar a `react-i18next`).
- **"Lo último" se verifica, no se asume.** Tres veces en esta sesión una
  versión "latest" resultó no ser la jugada correcta una vez comprobada
  contra el resto del stack: `react-i18next@17`/`@15.5.0` rompían con
  TypeScript 4.9 (3.13.1-3.13.2); `typescript@latest` resolvió a la v7
  pero rompe `typescript-eslint` (3.14.1); y se pasó por 5.9.3 antes de
  confirmar con `npm view` que 6.0.3 era estable y sí compatible. El
  patrón repetido: instalar, dejar que `tsc`/`npm install` fallen si van
  a fallar, leer el error real, y solo entonces decidir la versión final.
- **Tratar la causa, no el síntoma.** La pregunta concreta "¿por qué no
  TS5?" llevó a identificar que el bloqueo real no era una versión de
  TypeScript sino Create React App en sí (descontinuado) — de ahí que la
  solución no fuera "forzar TS5" sino migrar el toolchain (3.14.1).
- **Cuando una herramienta nueva encuentra algo real, se corrige en el
  momento**, aunque no fuera el objetivo de la rama: el test
  `id`/`applicationId` desactualizado (3.1 del trabajo de posiciones), el
  bug de `instanceof` con `target: es5` (3.1), el `<html lang>` estático
  (3.7), y los `throw new Error()` sin `cause` que encontró ESLint recién
  instalado (3.14.4) — todos se arreglaron in situ en vez de ignorarlos o
  abrirlos como tareas aparte.

### 0.5 Dónde estamos ahora (estado de `tests-AGB`)

**Verificado y funcionando**, de extremo a extremo, en el navegador, por
línea de comandos y ahora también con tests automáticos:
- Backend: Express + TypeScript + Prisma, con validación estructurada,
  endpoint de listado de posiciones, `isNaN` en todos los `:id`. 5 suites
  / **19 tests** en verde (`npx jest`), `tsc --noEmit` limpio.
- Frontend: React + TypeScript sobre **Vite** (ya no Create React App),
  con **react-i18next** (español/inglés, detección automática +
  selector, persistido) en toda la interfaz, formulario de alta de
  candidato con mensajes de validación específicos por campo y
  accesibles (`aria-invalid`, `aria-describedby`, `role="alert"`),
  listado de posiciones con datos reales de la API, y el tablero "Ver
  proceso" agrupando candidatos por fase de entrevista. **3 suites /
  18 tests** en verde (`npm test`, Vitest) — antes de esta rama, cero.
- `npx tsc -b`, `npx eslint .` y `npm run build` (con `vite preview`
  sirviendo el resultado) limpios en el frontend.
- Nada de esto ha tocado la base de datos de forma permanente: los
  candidatos de prueba creados durante las verificaciones manuales se
  borraron después de cada comprobación; los tests automáticos no tocan
  la base de datos real en ningún caso (todo mockeado).

**Deuda conocida, documentada pero no resuelta** (todas mencionadas donde
se detectaron, ninguna oculta):
- El botón **"Editar"** de una posición está deshabilitado a propósito
  (`positions.editNotImplemented`) — nunca se pidió implementarlo.
- La cobertura de tests se centra en **validación** (que es lo que se
  pidió): alta de candidato, códigos de error, `isNaN` de posiciones.
  Quedan sin test automático el dashboard, el listado/filtros de
  posiciones (mock de UI sin lógica que probar todavía) y el tablero "Ver
  proceso" — no se ha fabricado cobertura de esas partes por iniciativa
  propia.
- El build de producción del frontend avisa de un chunk único de ~650KB
  sin *code splitting* — funcional, pero no optimizado; no se ha tocado
  porque no formaba parte de ninguna petición.
- Los mensajes de error **no estructurados** (caída de red, backend
  caído, mensajes ya hechos que vienen directos de un `Error` de
  servicio) siguen sin traducirse — solo los errores de validación tienen
  el tratamiento de códigos que permite traducirlos (ver 3.11).
- La contraseña de la base de datos de desarrollo, aunque ya no se lee
  del `schema.prisma` (arreglado en `backend-AGB`), sigue existiendo en
  el **historial** de git del commit inicial — no se ha purgado el
  historial por ser una operación destructiva que no se ha pedido.

**Nada se ha subido a `origin`** en ningún momento de esta sesión — las 8
ramas son enteramente locales. Si se quiere consolidar, el camino natural
sería fusionar `tests-AGB` sobre `main` (o sustituir `main` por ella)
cuando el usuario lo decida explícitamente.

### 0.6 Análisis de ventajas: por qué esto debería haber sido así desde el principio

Cada cifra de esta sección se ha medido en este mismo repositorio durante
la sesión (comandos reales, `wc -l` sobre los ficheros reales, salida real
de `npm`/`eslint`/`vite`) — no son estimaciones genéricas de "cómo suele
ir" una migración. Donde no hay un número medido en este repo concreto
(p. ej. no se llegó a ejecutar nunca `react-scripts build` en esta sesión,
así que no hay un tiempo de build de CRA con el que comparar directamente
el de Vite), se dice explícitamente en vez de inventar la cifra.

#### A. Motor y herramientas: lo que se midió, no lo que se supone

| Métrica | Dato medido en esta sesión |
|---|---|
| Arranque del dev server | Vite: **~150-175ms** (`VITE v8.3.0 ready in 154 ms` / `174 ms`, dos arranques distintos, logs reales) |
| Build de producción | **438-441ms** (`✓ built in 441ms`), 2773 módulos transformados |
| Motor usado en dev | `oxc` (parser/transformador en Rust) — se ve literalmente en los logs de error de esta sesión (`Plugin: vite:oxc`) al depurar el problema de JSX en `.js` |
| Motor usado en build | `rolldown` (sucesor de Rollup, también en Rust) — igualmente visible en los propios logs (`rolldown/dist/shared/error-...mjs`) |
| Dependencias eliminadas | **-1239 paquetes** exactos al desinstalar `react-scripts` (`npm uninstall react-scripts` → `removed 1239 packages`) |
| Huella final de dependencias | 718 paquetes totales (`npm ls --all`), 494MB de `node_modules`, 18 dependencias directas + 12 de desarrollo |

CRA (`react-scripts`) nunca llegó a compilarse en modo producción en esta
sesión — se pasó directamente de verificar que el dev server funcionaba a
desinstalarlo, así que no hay un número de "antes" medido en este mismo
repo para el build. Lo que sí es un hecho verificable y no una opinión: al
quitar `react-scripts`, **1239 paquetes transitivos** (todo el árbol de
Babel, webpack, y sus plugins) dejaron de formar parte del proyecto de
golpe — cada uno de esos paquetes era, hasta ese momento, superficie de
ataque potencial (vulnerabilidades de la cadena de suministro) y coste de
instalación/CI, sin aportar nada que Vite no cubra ya.

#### B. Líneas de código: el caso concreto, fichero a fichero (no una cifra redonda)

| Fichero (antes) | Líneas | → | Fichero (después) | Líneas | Cambio |
|---|---|---|---|---|---|
| `locale.js` | 56 | → | *(eliminado, sustituido por `LanguageDetector`)* | 0 | **-100%** |
| `LocaleContext.js` | 39 | → | *(eliminado, sustituido por el hook de la librería)* | 0 | **-100%** |
| `translations.js` | 147 | → | `locales/es.json` + `locales/en.json` | 212 | +44% |
| `validationMessages.js` | 111 | → | `validationMessages.js` | 42 | **-62%** |
| `i18n.js` (config, nuevo) | — | → | `i18n.js` | 53 | (nuevo) |
| **Total** | **353** | → | | **307** | -13% |

La cifra total (353→307) por sí sola no cuenta la historia real, y
conviene ser precisos en vez de redondear a "la mitad" sin más:

- **`locale.js` + `LocaleContext.js` (95 líneas de lógica de detección y
  de `Context` de React, escritas y mantenidas a mano) desaparecen por
  completo** — no se sustituyen por otras 95 líneas nuestras, sino por
  código de una librería con miles de usos en producción que no
  escribimos ni mantenemos nosotros. Ahí sí hay una reducción real del
  100%, medible y sin matices.
- **`validationMessages.js` baja un 62%** (111→42) porque la composición
  de mensajes (antes plantillas JS escritas a mano por cada combinación
  de campo+código+idioma) pasa a delegarse en el motor de interpolación
  de i18next — la lógica que quedaba era, literalmente, reimplementar mal
  una pequeña parte de lo que ya hace la librería.
- **`translations.js` → `es.json`+`en.json` *crece* un 44%** (147→212), y
  es importante no ocultarlo: el JSON anidado necesita más líneas por
  cadena de texto que un objeto JS con claves planas (una llave de
  apertura/cierre por cada nivel de anidamiento). Esto **no es deuda
  técnica** — es texto de traducción puro, el mismo cueste lo que cueste
  representarlo, y a cambio de esas líneas de más se gana compatibilidad
  con herramientas de extracción de claves y plataformas de gestión de
  traducciones (Lokalise, Crowdin...) que no existía con el formato a
  mano.

**Conclusión honesta**: la intuición de "menos de la mitad de código a
mantener" es correcta específicamente para la parte que **es lógica
nuestra susceptible de tener bugs** (locale.js + LocaleContext.js +
validationMessages.js: 206→42 líneas, **-80%**) — no para el texto de
traducción en sí, que ocupa prácticamente el mismo espacio se represente
como se represente.

#### C. Correctitud real, no solo estilo: lo que encontró el linter al configurarse por primera vez de verdad

Antes de esta sesión, `package.json` tenía `"eslintConfig": {"extends":
["react-app", "react-app/jest"]}` — el linter de CRA, con un conjunto de
reglas orientado a errores básicos de React (hooks mal usados, JSX roto),
sin ninguna regla de buenas prácticas generales de JavaScript moderno. Al
instalar el stack de ESLint 9 + `typescript-eslint` con las reglas
recomendadas (`js.configs.recommended` + `tseslint.configs.recommended`),
`npx eslint .` encontró **5 errores reales** en código que llevaba ahí
desde antes de esta sesión, invisibles hasta ese momento:

```
src/services/candidateService.js  19:9  error  There is no `cause` attached...
src/services/candidateService.js  41:9  error  There is no `cause` attached...
src/services/positionService.js   15:9  error  There is no `cause` attached...
src/services/positionService.js   24:9  error  There is no `cause` attached...
src/services/positionService.js   33:9  error  There is no `cause` attached...
```

(regla `preserve-caught-error`: un `catch (error) { throw new Error(...) }`
que no adjunta la causa original pierde la traza de pila real del fallo —
en producción, esto es la diferencia entre depurar un error de red viendo
exactamente qué petición falló, o viendo solo un mensaje genérico sin
ningún rastro de dónde vino). Los cinco se corrigieron en el momento.

Además, `npm test` estaba roto desde antes de esta sesión —
`jest --config jest.config.js` apuntando a un fichero que nunca existió
en el repositorio (confirmado con `ls jest.config.js` → *no existe*) — y
nadie lo había notado porque nunca se ejecutaba en ningún flujo. Ahora
`npm test` (Vitest) sale con código 0 de verdad.

#### D. Accesibilidad: técnicas concretas, mapeadas a criterios WCAG 2.1 (no "buenas prácticas" genéricas)

| Criterio WCAG 2.1 | Nivel | Técnica implementada | Dónde |
|---|---|---|---|
| **3.1.1** Language of Page | A | `<html lang>` sincronizado dinámicamente con el idioma activo (`i18n.on('languageChanged', ...)`) | `i18n.js` |
| **4.1.3** Status Messages | AA | `role="alert"` + `aria-live="assertive"` para errores; `role="status"` + `aria-live="polite"` para el éxito — un lector de pantalla anuncia el mensaje sin que el foco tenga que moverse a él | `AddCandidateForm.jsx` |
| **3.3.1** Error Identification | A | Cada campo inválido lleva `aria-invalid="true"` y un mensaje de error específico (no genérico) | `AddCandidateForm.jsx` |
| **1.3.1** Info and Relationships | A | `aria-describedby` asocia programáticamente cada input con su mensaje de error concreto, no solo visualmente | `AddCandidateForm.jsx` |
| **4.1.2** Name, Role, Value | A | `aria-pressed` en los botones del selector de idioma, comunicando cuál está activo a tecnología de asistencia | `LanguageSwitcher.jsx` |
| *(Buena práctica, no un SC numerado)* | — | `lang="es"`/`lang="en"` en cada botón del selector, para que un lector de pantalla pronuncie "Español"/"English" con las reglas fonéticas del idioma que nombran | `LanguageSwitcher.jsx` |

Antes de esta sesión no había ni una sola de estas técnicas en el
formulario: los errores eran un `<Alert>` sin `role`, sin asociar a
ningún campo, y `<html lang="en">` estaba fijo pese a que toda la
interfaz estaba en español.

#### E. TypeScript: la trayectoria real de esta sesión, sin inflar lo que no se usa

Esta sesión pasó por **cuatro** versiones de TypeScript distintas, cada
una descartada o aceptada por una razón medida, no supuesta:

1. **4.9.5** (la que traía CRA) — techo real: `react-scripts` declara
   `"typescript": "^3.2.1 || ^4"` como peer, así que no se podía subir sin
   quitar CRA primero.
2. **7.0.2** (`typescript@latest` en el momento de esta sesión — el
   compilador reescrito nativamente en Go) — descartada: `typescript-eslint`
   declara `typescript: ">=4.8.4 <6.1.0"`, y no es solo un peer estricto:
   sin `typescript-eslint` no hay forma de enlazar TypeScript con ESLint,
   así que habría que renunciar al linter tipado por completo.
3. **5.9.3** — funcional y compatible, primera elección "segura".
4. **6.0.3** (versión final) — se comprobó con `npm view typescript
   versions --json` que existen releases **estables** 6.0.2/6.0.3 (no solo
   la beta que aparece en `dist-tags`), y caen dentro del rango que acepta
   `typescript-eslint`. Es la versión más reciente posible sin sacrificar
   el linter.

**Lo que esto significa hacia delante, con datos y no con deseos**: el
bloqueo que impedía subir de TypeScript 4 ya no existe — no es que TS7 se
vaya a poder usar "en el futuro" de forma vaga, es que el único obstáculo
real hoy es una única peer dependency de un solo paquete
(`typescript-eslint`, versión `8.70.0` en el momento de esta sesión). El
día que esa librería publique soporte para TS7 (ya en desarrollo activo,
visible en su propio repositorio), adoptarlo aquí es un `npm install
typescript@latest` — sin ningún otro cambio de infraestructura. Con CRA
en medio, el mismo salto habría exigido primero un `eject` irreversible
antes de poder tocar una sola versión.

#### F. "La manera correcta de hacerlo": patrones adoptados que son el estándar de facto actual, no una preferencia

- **`tsconfig.json` como *project references*** (`tsconfig.app.json` +
  `tsconfig.node.json`) — el mismo patrón que genera `npm create
  vite@latest` con la plantilla oficial `react-ts`, no una convención
  inventada para este proyecto.
- **`eslint.config.js` (flat config)** — el único formato que reconoce
  ESLint 9 de forma nativa; el `eslintConfig` de `package.json` que usaba
  CRA es un formato que ESLint 9 ya ni siquiera carga sin un plugin de
  compatibilidad adicional.
- **Códigos de error estructurados (`{ field, code, params }`) en vez de
  strings ya redactados** en el backend — el patrón que hace posible que
  el frontend traduzca sin que el backend sepa nada de idiomas; es la
  razón por la que migrar de un sistema de i18n casero a `react-i18next`
  (sección 3.13) no tocó una sola línea del backend.
- **Un idioma, un fichero JSON**, en vez de un único objeto JS con todos
  los idiomas mezclados — el formato que esperan `i18next-parser` y
  cualquier plataforma de gestión de traducciones externa.

#### G. Resumen en una tabla

| Aspecto | Antes de esta sesión | Ahora | Evidencia |
|---|---|---|---|
| Toolchain de frontend | Create React App (descontinuado desde 2025, sin versión mayor desde 2022) | Vite 8, mantenido activamente | `npm uninstall react-scripts` |
| TypeScript | 4.9.5 (techo de CRA) | 6.0.3 (techo real del ecosistema de linting hoy) | Cadena de instalaciones documentada en 3.14.1 |
| Arranque en desarrollo | No medido en este repo (CRA nunca llegó a compararse) | ~150-175ms medidos | Logs de `vite` |
| Lógica de i18n propia (detección + contexto + composición de mensajes) | 206 líneas | 42 líneas | `wc -l` sobre los ficheros reales, sección B |
| Linter configurado | Reglas básicas de React únicamente | ESLint 9 + TypeScript + 5 bugs reales encontrados y corregidos | `npx eslint .`, sección C |
| `npm test` | Roto (`jest.config.js` inexistente) | Funcional (Vitest, sale con código 0) | Comprobado en 3.14.2 |
| Accesibilidad del formulario | Ninguna técnica WCAG aplicada | 5 criterios WCAG 2.1 implementados | Sección D |
| Idiomas soportados | Español fijo en el código | Español/inglés, detección automática + selector, `<html lang>` reactivo | Secciones 3.9-3.13 |
| Dependencias transitivas | +1239 paquetes solo por `react-scripts` | Ninguno de esos 1239 | `npm uninstall`, sección A |

Ninguna de estas filas es una opinión de estilo — todas son
consecuencia directa de sustituir herramientas descontinuadas o caseras
por el estándar actual del ecosistema, verificado paso a paso en el
propio repositorio durante esta misma sesión.

## 1. Prompts utilizados con el asistente de IA

1. `Analiza este repo y cuéntame qué hace y qué errores descubres` /
   `Arranca y cuéntame cómo...` / `Acabo de añadir mi usuario al grupo
   docker` / `Crea una rama nueva de frontend...` — ver
   [`prompts-AGB-backend.md`](./prompts-AGB-backend.md) y
   [`prompts-AGB-frontend.md`](./prompts-AGB-frontend.md) para el detalle.

2. `¿Por qué no funcionan los botones "Ver proceso"?...` /
   `Sí, adelante...` — dieron lugar a la rama `positions-proceso-AGB`
   (no relacionada con esta, ver su propio `prompts-AGB.md`).

3. `Al intentar añadir un nuevo candidato me devuelve "Invalid name", pero
   el mensaje no me permite determinar el motivo. ¿Me ayudas?`
   → El asistente localizó la causa en `validator.ts`: `validateName` se
   usa tanto para `firstName` como `lastName` y lanza siempre el mismo
   `Error('Invalid name')`, sin decir qué campo falló ni por qué (vacío,
   muy corto, muy largo o con caracteres no permitidos — la regex solo
   admite letras y espacios, ni guiones ni apóstrofos ni números). Preguntó
   qué había escrito el usuario para confirmar cuál de los cuatro casos era.

4. `Un guión bajo. ¿Mejoras el validator.ts para que el mensaje de error
   sea significativo? Añade también y11n y a18n.`
   → El asistente interpretó "y11n"/"a18n" como una probable errata de
   **i18n** (internacionalización) y **a11y** (accesibilidad) — con los
   números intercambiados entre ambas — y lo confirmó con una pregunta
   antes de implementar nada, dado que son dos alcances bastante distintos.
   Tras la confirmación ("Sí, ambas"), se implementó lo que documenta este
   fichero.

5. `Introdujiste un fallo, y es que al mover el foco a un textbox, se
   dispara la acción añadir candidato...` → El texto exacto del error
   reportado (`"Datos inválidos: Error: Invalid name"`) solo existe en el
   código **anterior** a esta rama (`main`/`backend-AGB`/
   `positions-proceso-AGB`, comprobado con `git grep` sobre todas las
   ramas); el navegador del usuario (Firefox, conectado de forma
   independiente al mismo servidor de desarrollo que el panel del
   asistente) llevaba abierto desde antes de varios cambios de rama, y no
   sobrevivió bien a tantos hot-reloads seguidos. Tras recargar la pestaña,
   confirmó que funcionaba bien.

6. `¿Puedes conseguir que los textos de error salgan en el idioma elegido
   por a18n?` (de nuevo, errata de i18n) → El asistente preguntó si el
   usuario quería un selector explícito de idioma o si la detección
   automática (`navigator.language`) no le estaba funcionando bien; el
   usuario confirmó lo segundo, dando lugar al arreglo de 3.3.1.

7. `Esto es lo que me salía antes... Pruebo ahora tras los últimos cambios
   y te digo` / `Tras meter el apellido con un underscore... el mensaje me
   aparece en el siguiente Textbox... Y los mensajes de error me siguen
   saliendo en inglés` → El asistente no logró reproducirlo (el DOM,
   inspeccionado directamente, mostraba el mensaje bien colocado y en
   español) y pidió abrir una ventana privada nueva para descartar caché/
   extensiones, y el valor real de `navigator.language`/`navigator.languages`.

8. `Tras abrir una nueva ventana ya no sale el error tras moverme a los
   Textbox. Pero sí, el idioma está en EN por esto: <html lang="en">` →
   Confirmó que el problema de posición era, de nuevo, la pestaña de
   Firefox con estado obsoleto (arreglado con la ventana privada). Sobre
   el idioma, el asistente aclaró que `<html lang="en">` es un atributo
   estático sin relación con la lógica de i18n (que solo lee
   `navigator.language`/`navigator.languages`) — pero lo corrigió de
   todos modos por ser un fallo real y aparte (ver 3.7) — y pidió el valor
   real de `navigator.language` para confirmar si el inglés en los
   mensajes era la detección funcionando correctamente o un bug.

9. `navigator.language me devuelve "en-US", así que no, está en US` →
   Confirmó que la detección funcionaba correctamente (su navegador
   realmente está en inglés); el problema pasó a ser de diseño (formulario
   en español fijo + errores en el idioma real del navegador). El
   asistente preguntó cómo resolver esa mezcla; el usuario eligió añadir
   un selector explícito en pantalla (ver 3.8), aclarando además a mitad
   de respuesta: *"Pero no que sustituya a la detección automática
   inicial, sino que la interprete al seleccionar el idioma"* — es decir,
   la detección automática debía seguir siendo el valor inicial, y el
   selector solo debía intervenir cuando el usuario lo usara
   explícitamente (comportamiento que ya tenía la primera implementación,
   confirmado con `localStorage` vacío tras el primer render).

10. `Perfecto, ahora lo hace bien. ¿Añades el a18n a todo, no sólo a los
    mensajes de error?` → Petición de extender la traducción a **todo** el
    texto estático de la interfaz (no solo los mensajes de validación),
    dando lugar a la infraestructura compartida de 3.9-3.11 y la
    traducción de los 5 componentes con texto visible.

11. `¿Cuántas ramas tenemos ahora?` → El asistente listó las 5 ramas
    locales existentes (`main`, `backend-AGB`, `frontend-AGB`,
    `positions-proceso-AGB`, `candidate-validation-i18n-a11y-AGB`),
    señalando que `positions-proceso-AGB` era independiente y no incluía
    el trabajo de las demás.

12. `¿Incluyes positions-proceso-AGB en una nueva rama que parta de
    candidate-validation-i18n-a11y-AGB para tenerlo ya todo fusionado?`
    → Prompt que originó la rama `all-fixes-AGB` y la sección 12 de este
    documento.

13. `¿Tiene sentido que a18n también los endpoints, así add-candidate pase
    a ser anadir-candidato, etc.?` → El asistente recomendó no hacerlo:
    las rutas de React Router son paths internos (nunca se escriben ni
    comparten a mano, a diferencia de un sitio público con SEO
    multi-idioma), así que localizarlas solo añade complejidad de alias/
    redirecciones sin beneficio real en una herramienta interna.

14. `¿Y cómo se gestiona en los casos en que los endpoints están
    traducidos?` → Pregunta puramente conceptual (sin implementación): el
    asistente explicó el patrón estándar — tabla de rutas por clave
    canónica con traducción de path por idioma, el idioma codificado en la
    propia URL (prefijo `/es/`/`/en/`) en vez de solo en `localStorage`,
    redirecciones/alias para no romper enlaces ya compartidos, y
    `hreflang` para SEO.

15. `Estoy aprendiendo a hacerlo bien, flexible, estándar, escalable, con
    idiomas, accesible... ¿Qué mejorarías?` → El asistente listó 5 mejoras
    priorizadas sobre el sistema de i18n "casero" construido hasta
    entonces: (1) adoptar una librería real (`react-i18next`/`react-intl`)
    en vez del diccionario a mano, (2) sincronizar `<html lang>`
    dinámicamente con el idioma activo (estaba fijo en `"es"`), (3) usar
    `Intl.DateTimeFormat`/`Intl.NumberFormat` para fechas/números en vez de
    manipulación de strings, (4) tipar las claves de traducción con
    TypeScript para detectar en compilación una clave inexistente, (5) un
    fichero JSON por idioma cargado bajo demanda en vez de un único objeto
    JS con todos los idiomas siempre en el bundle.

16. `¿Creas una rama e implementas el 1. que me parece el más potente para
    ver cómo debería hacerse bien?` → Prompt que originó esta rama
    (`i18n-react-i18next-AGB`) y la migración documentada en la sección 13
    más abajo. De paso se implementan también la mejora 2 (`<html lang>`
    dinámico, trivial una vez usando `i18next.on('languageChanged', ...)`)
    y la 5 (un JSON por idioma), por ser consecuencia directa y casi
    gratuita de adoptar la librería — no un alcance añadido por iniciativa
    propia.

17. `Documenta porfa con todo detalle todos los pasos dados, comandos
    ejecutados, paquetes instalados, la filosofía que hay detrás y cómo se
    modificó el código y las ventajas que todo esto supuso frente a la
    versión inicial.` → Ampliación de la sección 3.13 (commit `ace52cb`)
    con el nivel de detalle que documenta esta misma sección para la
    migración a Vite: filosofía, comandos exactos (incluidos los
    fallidos), tabla de paquetes, cambios de código fichero a fichero y
    tabla comparativa de ventajas.

18. `¿Y por qué no pasar a TS 5? ;). ¿Hay algún impedimento de peso?. Dado
    que el sistema es nuevo, ¿mejor con lo último, no?` → El asistente
    explicó que no hay impedimento técnico real en el código: el bloqueo
    es que `react-scripts` (Create React App) declara como peer
    `"typescript": "^3.2.1 || ^4"`. Pero señaló el problema de fondo: CRA
    está descontinuado (retirado como recomendación oficial de React en
    2025), así que subir solo TypeScript trata el síntoma, no la causa —
    cada librería futura volverá a chocar con el mismo peer desfasado.
    Recomendó migrar el toolchain a Vite en vez de forzar TS5 sobre CRA.

19. `Pero CRA está descontinuado y lo que busco es aprender con lo último
    y cómo debe hacerse. ¿Analizas qué supondría? Soy partidario de
    hacerlo` → El asistente inspeccionó el estado real del proyecto
    (variables de entorno, tests existentes, personalizaciones de CRA) y
    presentó un análisis concreto de qué implicaría migrar a Vite,
    concluyendo que el riesgo era bajo (sin `REACT_APP_*`, sin suite de
    tests que romper, sin `craco` ni `eject`, nada fuera de `frontend/`
    dependiente de CRA) y preguntó si debía proceder.

20. `En una rama nueva, porfa ;)` (enviado a mitad de turno, mientras el
    asistente ya estaba creando la rama) → Confirmó el plan ya en marcha;
    dio lugar a la rama `vite-migration-AGB`.

21. `¿Y TS6 no es compatible con todo el stack también?` (enviado a mitad
    de turno, tras ver que el asistente había fijado TypeScript en
    `5.9.3`) → El asistente comprobó con `npm view typescript versions`
    que, efectivamente, `6.0.2`/`6.0.3` son versiones **estables**
    (no solo beta) y caen dentro del rango que soporta `typescript-eslint`
    (`>=4.8.4 <6.1.0`) — más cerca de "lo último" que la 5.9.3 sin perder
    compatibilidad con el linter. Se corrigió a `typescript@6.0.3`.

22. `Documenta porfa el análisis previo y vamos a por ello, sí.` → Prompt
    que originó la ejecución real de la migración documentada en la
    sección 14 más abajo (la rama ya se había creado en respuesta al
    prompt 20).

## 2. Metodología

1. Se leyó `validator.ts` para entender exactamente por qué el mensaje era
   tan poco informativo (una sola condición `||` que agrupa cuatro motivos
   distintos, y una función compartida por `firstName`/`lastName` que no
   dice el nombre del campo).
2. Se diseñó un formato de error estructurado (`{ field, code, params }`)
   en el backend, en vez de intentar adivinar en qué idioma debía redactar
   el backend el mensaje: el backend solo señala **qué** falló, y quien
   conoce el idioma del usuario (el frontend, vía `navigator.language`)
   compone el texto. Esto es lo que hace posible el i18n sin duplicar
   lógica de validación en dos idiomas dentro del propio validador.
3. Cada pieza se verificó de forma aislada antes de integrarla: tests
   unitarios nuevos para `validator.ts` (backend) y verificación manual con
   `curl` del endpoint completo, y solo después se conectó el frontend,
   verificando en el navegador con el caso real reportado por el usuario
   (apellido con guión bajo) tanto en español como simulando
   `navigator.language = 'en-US'`.
4. Para la accesibilidad, se verificó no solo visualmente sino inspeccionando
   el DOM (`aria-invalid`, `aria-describedby` y que el elemento referenciado
   contenga el texto del error).

## 3. Trabajo realizado

### 3.1 [Backend] `validator.ts`: de un `Error('Invalid name')` genérico a errores estructurados

- **Fichero reescrito**: `backend/src/application/validator.ts`.
- **Antes**: cada `validate*` lanzaba `throw new Error('Invalid <campo>')`
  en cuanto encontraba el primer problema, cortando la validación ahí —
  el usuario solo se enteraba de un problema a la vez, con un texto en
  inglés fijo que no decía la causa exacta (`validateName` agrupaba con
  `||` estar vacío, ser muy corto, ser muy largo o tener caracteres no
  permitidos, todo bajo el mismo `"Invalid name"`).
- **Después**:
  - Nuevo tipo `ValidationIssue = { field, code, params? }` y una clase
    `ValidationError extends Error` que agrupa **todos** los problemas
    encontrados (`issues: ValidationIssue[]`), no solo el primero.
  - Cada `validate*` recibe ahora el nombre del campo (`firstName`,
    `lastName`, `educations[0].institution`, etc.) y empuja un `issue` con
    un código de una lista cerrada: `required`, `tooShort`, `tooLong`,
    `invalidCharacters` (con el carácter concreto que falló en `params.char`),
    `invalidFormat`, `invalid`.
  - `validateCandidateData` ya no lanza en el primer fallo: recorre todas
    las validaciones, acumula los `issues` y al final lanza un único
    `ValidationError` con todos ellos (o no lanza nada si no hay ninguno).
  - **Bug encontrado y corregido de paso**: `class ValidationError extends
    Error` con `"target": "es5"` en `tsconfig.json` rompe `instanceof`
    (problema conocido de TypeScript al compilar clases que heredan de
    `Error` a ES5) — `error instanceof ValidationError` daba `false` en
    quien la capturaba, aunque el error fuera efectivamente una
    `ValidationError`. Se corrige con
    `Object.setPrototypeOf(this, ValidationError.prototype)` en el
    constructor. **Esto se detectó gracias al test nuevo** (ver 3.2): sin
    tests, este bug habría pasado desapercibido y el controlador nunca
    habría distinguido un error de validación de cualquier otro error.
- **Tests nuevos**: `backend/src/application/validator.test.ts` (no existía
  ningún test para este fichero) — valida que un candidato correcto no
  lanza, que se reporta el campo exacto que falta, que se reporta el
  carácter concreto no permitido, que **se acumulan** varios campos
  fallidos a la vez (no solo el primero) y que el formato de email inválido
  se detecta.

### 3.2 [Backend] `candidateController.ts`: distinguir errores de validación

- **Fichero modificado**: `backend/src/presentation/controllers/candidateController.ts`.
- **Cambio**: `addCandidateController` ahora comprueba
  `error instanceof ValidationError` antes que el `catch` genérico, y en
  ese caso responde `400` con `{ message: 'Validation failed', errors:
  error.issues }` — el array completo de `{field, code, params}`, sin
  texto ya redactado. El resto de errores (no relacionados con validación,
  p. ej. un fallo de base de datos) siguen respondiendo como antes
  (`{ message: 'Error adding candidate', error: error.message }`).
- **Verificación manual**:
  ```
  curl -X POST http://localhost:3010/candidates -H "Content-Type: application/json" \
    -d '{"firstName":"Juan","lastName":"Garcia_","email":"juan@example.com"}'
  → 400 {"message":"Validation failed","errors":[{"field":"lastName","code":"invalidCharacters","params":{"char":"_"}}]}

  curl -X POST http://localhost:3010/candidates -H "Content-Type: application/json" \
    -d '{"firstName":"","lastName":"","email":"not-an-email"}'
  → 400 {"message":"Validation failed","errors":[
        {"field":"firstName","code":"required"},
        {"field":"lastName","code":"required"},
        {"field":"email","code":"invalidFormat"}]}
  ```

### 3.3 [Frontend] Nuevo módulo de i18n: `i18n/validationMessages.js`

- **Fichero nuevo**: `frontend/src/i18n/validationMessages.js`.
- **Qué hace**: traduce cada `{field, code, params}` que devuelve el
  backend a una frase legible, en español o inglés según
  `navigator.language` (por defecto español si el navegador no está en
  ninguno de los dos idiomas soportados).
  - `getLocale()`: detecta `es`/`en` a partir de `navigator.language`.
  - `translateValidationIssue(issue, locale)`: resuelve la etiqueta del
    campo (`firstName` → "El nombre" / "The first name"; para campos de
    arrays como `educations[0].institution` compone "Educación #1 (la
    institución)" / "Education #1 (the institution)") y aplica la
    plantilla del `code` correspondiente, interpolando `params` (p. ej. el
    carácter concreto no permitido, o el mínimo/máximo de caracteres).
  - `translateValidationIssues(issues, locale)`: aplica lo anterior a la
    lista completa devuelta por el backend.
- **Por qué esta arquitectura y no otra**: se decidió que el backend nunca
  redacte texto en un idioma — solo el frontend sabe en qué idioma quiere
  ver el mensaje el usuario. Así, añadir un tercer idioma en el futuro es
  un diccionario nuevo en este fichero, sin tocar el backend.

### 3.3.1 [Frontend] `getLocale()`: usar `navigator.languages`, no solo el idioma principal

- **Fichero modificado**: `frontend/src/i18n/validationMessages.js`.
- **Motivo**: el usuario reportó que la detección automática del idioma no
  le funcionaba bien. La primera versión de `getLocale()` solo miraba
  `navigator.language` (un único valor, el idioma principal del
  navegador) y, si no era exactamente `es` o `en`, se rendía directamente
  al español por defecto. Esto falla para alguien con el navegador
  configurado en catalán, euskera o gallego (frecuente en España) que
  tenga español o inglés como preferencia secundaria: por ejemplo
  `navigator.language = 'ca'` con `navigator.languages = ['ca', 'es-ES',
  'en']` acababa siempre en español por defecto (por casualidad correcto
  en ese caso concreto) pero ignoraba por completo la preferencia real del
  navegador, y si el orden fuera `['ca', 'en', 'es']` habría mostrado
  español en vez del inglés realmente preferido.
- **Arreglo**: `getLocale()` ahora recorre `navigator.languages` (la lista
  completa de idiomas preferidos, en orden) y se queda con el primero que
  sea `es` o `en`; solo cae al español por defecto si ninguno de los
  idiomas de la lista está soportado. Si el navegador no expone
  `navigator.languages` (algunos entornos no lo hacen), sigue usando
  `navigator.language` como antes.
- **Verificación manual** (simulando `navigator.language`/`navigator.languages`
  en el navegador, reproduciendo el mismo caso del guión bajo en el
  apellido):
  - `language: 'ca'`, `languages: ['ca', 'es-ES', 'en']` → mensaje en
    español ("El apellido contiene un carácter no permitido...").
  - `language: 'ca'`, `languages: ['ca', 'en', 'es']` → mensaje en inglés
    ("The last name contains a character that is not allowed...").
  - Confirmado inspeccionando el DOM (`document.querySelector('.alert-danger')`),
    no solo visualmente.

### 3.4 [Frontend] `services/candidateService.js`: propagar los `issues` sin aplanarlos

- **Fichero modificado**: `frontend/src/services/candidateService.js`.
- **Cambio**: `sendCandidateData` ahora detecta si la respuesta de error
  del backend trae `errors` (array de issues) y, si es así, lanza un
  `Error` con una propiedad `.issues` adjunta (en vez de aplanarlo todo en
  un único string como hacía antes vía
  `` `Error al enviar datos del candidato: ${details}` ``, que habría
  perdido la posibilidad de mostrar cada error junto a su campo).

### 3.5 [Frontend] `AddCandidateForm.js`: mensajes por campo + accesibilidad

- **Fichero modificado**: `frontend/src/components/AddCandidateForm.js`.
- **Cambios**:
  - Nuevo estado `fieldErrors` (la lista de issues ya traducidos) además
    del `error` genérico existente (que se sigue usando para errores no
    relacionados con validación, p. ej. el servidor caído).
  - Cada campo de nivel superior (`firstName`, `lastName`, `email`,
    `phone`, `address`) ahora:
    - Muestra el mensaje traducido pegado al campo, vía
      `Form.Control.Feedback` (patrón nativo de Bootstrap).
    - Lleva `isInvalid` (estilo visual: borde e icono rojos),
      `aria-invalid="true"` y `aria-describedby="<campo>-error"` apuntando
      al `id` del propio mensaje de error — así un lector de pantalla
      anuncia el motivo exacto al llegar al campo, no solo que "hay un
      error" en algún sitio de la página.
  - Se añade un resumen accesible al final del formulario
    (`role="alert"`, `aria-live="assertive"`) que lista todos los errores
    devueltos (incluidos los de `educations`/`workExperiences`, que no
    tienen un campo individual asociado en el formulario actual). El
    mensaje de éxito usa `role="status"`/`aria-live="polite"` (no
    interrumpe, solo informa).
  - Los errores no estructurados (p. ej. el backend no responde) se
    siguen mostrando en el `Alert` genérico existente, también con
    `role="alert"`.
- **Verificación en el navegador** (contra el backend real, corriendo en
  `positions-proceso-AGB`'s puerto 3010 con el nuevo formato):
  1. Se reprodujo el caso exacto reportado por el usuario — apellido
     `Garcia_` — y apareció: *"El apellido contiene un carácter no
     permitido: "_". Solo se admiten letras y espacios."*, tanto pegado al
     campo como en el resumen.
  2. Se comprobó en el DOM (`aria-invalid`, `aria-describedby`) que el
     campo `lastName` queda correctamente asociado a su mensaje de error.
  3. Se simuló `navigator.language = 'en-US'` y se repitió el envío: el
     mismo error apareció en inglés — *"The last name contains a character
     that is not allowed: "_". Only letters and spaces are allowed."* — sin
     tocar el backend.
  4. La acumulación de varios errores a la vez (backend) y el
     renderizado de una lista con varios elementos (frontend, lógica
     genérica sobre el array `fieldErrors`) ya estaban verificados por
     separado en 3.1/3.2 y en el test de `validator.test.ts`; no fue
     necesario forzarlo también por navegador, donde la validación nativa
     de HTML5 (`required`, `type="email"`) bloquea antes de llegar a
     enviar varios campos igualmente inválidos a la vez.

### 3.7 [Frontend] `public/index.html`: `<html lang="en">` en una app 100% en español

- **Fichero modificado**: `frontend/public/index.html`.
- **Hallazgo**: al investigar por qué los mensajes de error salían en
  inglés, el usuario encontró `<html lang="en">` en el HTML estático y
  preguntó si era la causa. No lo es — la lógica de `getLocale()` nunca
  lee ese atributo, solo `navigator.language`/`navigator.languages` — pero
  es un fallo real y separado: es el valor por defecto del boilerplate de
  Create React App, nunca actualizado, y todo el texto estático de la app
  (etiquetas, botones, títulos) está en español. Un lector de pantalla
  configurado para seguir el idioma declarado de la página anunciaría en
  inglés contenido que en realidad es español.
- **Arreglo**: `lang="en"` → `lang="es"`.

### 3.8 [Frontend] Selector explícito de idioma en `AddCandidateForm.js`

- **Motivo**: `navigator.language` del usuario resultó ser `en-US` — la
  detección automática funcionaba correctamente (ver 3.3.1), pero como el
  resto de la app no tiene i18n en ningún otro sitio (todo el texto
  estático está fijo en español), el resultado era una mezcla: formulario
  en español, errores de validación en inglés. En vez de forzar siempre
  español (perdiendo el beneficio de la detección para quien sí quiera
  inglés) o dejarlo solo en manos del navegador, se añade un control
  visible para elegir explícitamente.
- **Ficheros modificados**:
  - `frontend/src/i18n/validationMessages.js`: se separa `getLocale()` en
    `getStoredLocale()` (lee `localStorage['lti_error_locale']`, `null` si
    no hay nada guardado o no es un idioma soportado) +
    `detectBrowserLocale()` (la lógica de 3.3.1, ahora privada) +
    `setStoredLocale(locale)`. `getLocale()` pasa a ser
    `getStoredLocale() || detectBrowserLocale()`: **la detección
    automática del navegador sigue siendo el valor inicial** — la
    preferencia guardada solo existe una vez que el usuario ha elegido
    explícitamente un idioma con el selector, nunca antes. Esto es
    deliberado: el usuario pidió expresamente que el selector "no
    sustituya a la detección automática inicial, sino que la interprete
    al seleccionar el idioma".
  - `frontend/src/components/AddCandidateForm.js`:
    - Nuevo control con dos botones ("Español"/"English") junto al título
      del formulario, con `role="group"` y `aria-pressed` en el botón
      activo (patrón accesible de grupo de botones tipo toggle).
    - El estado ya no guarda los issues **ya traducidos**
      (`fieldErrors`), sino los issues **en crudo** tal cual los devuelve
      el backend (`issues`) más el `locale` actual; `fieldErrors` se
      recalcula en cada render con
      `translateValidationIssues(issues, locale)`. Así, cambiar el
      selector re-traduce al instante los errores que ya estén en
      pantalla, sin necesidad de reenviar el formulario.
- **Verificación**:
  - Con `navigator.language = 'es'` y sin nada en `localStorage`, el botón
    "Español" aparece activo desde el primer render (confirmado
    inspeccionando `localStorage.getItem('lti_error_locale') === null`
    justo después de cargar la página, antes de tocar el selector) — la
    detección automática sigue siendo el punto de partida.
  - Se verificó la lógica de `getLocale()` de forma aislada (mismo
    algoritmo, ejecutado en la consola del navegador) con
    `navigator.language = 'en-US'` y `localStorage` vacío: resuelve a
    `'en'`, confirmando que un navegador en inglés seguiría arrancando en
    inglés hasta que el usuario elija lo contrario.
  - Compilación (`webpack`/ESLint del dev server) limpia tras el cambio.

### 3.9 [Frontend] Infraestructura compartida de i18n para toda la app

- **Ficheros nuevos**:
  - `frontend/src/i18n/locale.js`: la lógica de "qué idioma está activo"
    (detección de `navigator.language`/`navigator.languages`, lectura/
    escritura de la preferencia guardada) se extrae de
    `validationMessages.js` a un módulo propio, porque ahora la necesitan
    dos consumidores distintos: los mensajes de validación y los textos
    estáticos generales.
  - `frontend/src/i18n/translations.js`: diccionario `es`/`en` de todos
    los textos estáticos de la interfaz (etiquetas, botones, placeholders,
    mensajes de estado), organizados por namespace de componente
    (`dashboard.*`, `addCandidate.*`, `fileUploader.*`, `positions.*`) más
    una función `translate(key, locale, params)`.
  - `frontend/src/i18n/LocaleContext.js`: contexto de React
    (`LocaleProvider`/`useLocale()`) que envuelve toda la app (en
    `App.js`) y expone `{ locale, setLocale, t }` a cualquier componente,
    para que solo exista **un** selector de idioma (no uno por página) y
    un único origen de verdad para el idioma activo.
  - `frontend/src/components/LanguageSwitcher.js`: el control ES/English
    (extraído de `AddCandidateForm.js`, que ya lo tenía inline) como
    componente reutilizable, ahora consumiendo `useLocale()` en vez de
    recibir el estado por props.
- **`validationMessages.js`**: ya no duplica la lógica de detección de
  idioma; reexporta `SUPPORTED_LOCALES`/`getStoredLocale`/`setStoredLocale`/
  `getLocale` desde `locale.js`. El resto (composición de mensajes de
  validación a partir de `{field, code, params}`) no cambia.
- **`App.js`**: envuelve `<BrowserRouter>` con `<LocaleProvider>` y añade
  una barra superior fija con `<LanguageSwitcher />`, visible en las tres
  rutas de la app (antes el selector solo existía dentro del formulario de
  alta de candidato).
- **Bug encontrado al integrar con `Positions.tsx` (TypeScript)**:
  `createContext(null)` hacía que TypeScript infiriera el tipo de `t()`
  (tras el `if (!context) throw` de `useLocale`) como `never` en los
  ficheros `.tsx` que lo consumen (`This expression is not callable. Type
  'never' has no call signatures.`) — un problema conocido de
  `createContext` sin un valor por defecto con forma concreta. Se
  soluciona dándole a `createContext` un objeto por defecto con la misma
  forma que el valor real (`{ locale, setLocale, t }`), en vez de `null`
  más una comprobación que lanza.

### 3.10 [Frontend] Traducción de los 5 componentes con texto visible

- **`RecruiterDashboard.js`**: título, encabezados de las dos tarjetas,
  botones, `alt` del logo.
- **`FileUploader.js`**: `aria-label` del input de fichero, "Selected
  file:"/"Archivo seleccionado:" (antes en inglés fijo pese al resto de la
  app en español — inconsistencia previa, corregida de paso), botón de
  subida, mensaje de éxito.
- **`AddCandidateForm.js`**: título, las 5 etiquetas de campo, "CV",
  botones de añadir/eliminar educación y experiencia, los 6 placeholders
  compartidos entre educación y experiencia, botón de envío, cabecera del
  resumen de errores, mensaje de éxito. Se elimina el selector de idioma
  local (ahora vive en la barra superior de `App.js`, vía `useLocale()`
  compartido) para no tener dos selectores independientes.
- **`Positions.tsx`**: título, placeholders de búsqueda, etiqueta y
  opciones del filtro de estado, etiquetas "Manager"/"Deadline", botones
  "Ver proceso"/"Editar". Los valores de `status` en `mockPositions` pasan
  de cadenas en español (`'Abierto'`, tipadas como unión literal) a
  códigos neutros (`'open'`, `'filled'`, `'closed'`, `'draft'` — ya
  usados como `value` de las opciones del filtro), traducidos solo al
  renderizar; así el mismo dato no depende del idioma para tener sentido
  internamente. **Nota de alcance**: esta es la versión con datos mock de
  `frontend-AGB` — el listado real conectado a la API y la vista "Ver
  proceso" con el tablero Kanban viven en la rama separada
  `positions-proceso-AGB`, que no está fusionada aquí; no se ha traducido
  `PositionProcess.tsx` porque ese fichero no existe en esta rama.
- **`candidateService.js`**: se detecta y corrige un bug introducido al
  añadir el prefijo traducido (`t('addCandidate.genericErrorPrefix')`) en
  `AddCandidateForm.js` sin quitar el prefijo español que `candidateService.js`
  ya añadía él mismo (`"Error al enviar datos del candidato: ..."`) — el
  resultado habría sido un prefijo duplicado. Se corrige dejando que
  `candidateService.js` lance solo el detalle del error, sin prefijo; el
  prefijo traducido lo añade quien lo muestra.

### 3.11 Límites de alcance de esta traducción

- **Texto nativo del navegador**: el botón "Seleccionar archivo" y el
  texto "Ningún archivo seleccionado" del `<input type="file">` son
  generados por el propio navegador según su idioma de interfaz (no el de
  la página), y no se pueden traducir desde JavaScript/React. Se
  documenta aquí para que no se confunda con un olvido.
- **Mensajes de error dinámicos no estructurados**: los mensajes que
  vienen de errores genéricos (no de validación) — p. ej. si el backend
  está caído, o un error de red — siguen sin traducirse: son texto ya
  hecho que viene de `error.message` (JS) o de un `Error` lanzado por el
  propio backend (que tampoco los traduce, como el `"Invalid file type,
  only PDF and DOCX are allowed!"` de `fileUploadService.ts`). Traducir
  esto exigiría el mismo tratamiento de códigos estructurados que ya
  tienen los errores de validación, aplicado a todos los demás mensajes de
  error del backend — un cambio bastante más grande, no pedido aquí.

### 3.12 Fusión con `positions-proceso-AGB`: todo el trabajo en una sola rama

- **Por qué esta rama y no otra combinación**: `positions-proceso-AGB`
  parte de `main` directamente (no de `backend-AGB`/`frontend-AGB`), así
  que nunca tuvo los arreglos de validación, i18n ni a11y. Para tenerlo
  todo junto sin reintroducir bugs ya corregidos, se crea `all-fixes-AGB`
  desde `candidate-validation-i18n-a11y-AGB` (que ya incluye
  `backend-AGB` + `frontend-AGB` + todo el trabajo de i18n/a11y) y se
  fusiona `positions-proceso-AGB` sobre ella — en vez de al revés, que
  habría obligado a reconstruir el i18n desde cero sobre el código de
  posiciones.
- **Conflictos de la fusión** (`git merge positions-proceso-AGB`):
  - `prompts-AGB.md`: mismo patrón que la fusión anterior — se conserva el
    histórico de `positions-proceso-AGB` como
    [`prompts-AGB-positions.md`](./prompts-AGB-positions.md) y se reescribe
    este fichero.
  - `frontend/src/App.js`: se combinan las dos rutas (`LocaleProvider` +
    barra de idioma de esta rama, ruta `/positions/:id` → `PositionProcess`
    de `positions-proceso-AGB`).
  - `frontend/src/components/Positions.tsx`: el conflicto más sustancial —
    esta rama tenía la versión **mock** ya traducida (con códigos de
    estado neutros `open`/`filled`/`closed`/`draft`);
    `positions-proceso-AGB` tenía la versión con **datos reales** de la
    API pero sin traducir. Se reescribe a mano combinando ambas: fetch
    real (`getPositions()`, estados de carga/error/vacío) + `t()` en todo
    el texto estático, con los códigos de estado en minúscula
    (`position.status.toLowerCase()`) para que coincidan con las claves
    del diccionario, ya que el backend real devuelve `Open`/`Filled`/...
    con mayúscula inicial.
  - `backend/src/presentation/controllers/positionController.ts`,
    `positionService.ts`, `positionRoutes.ts`, `api-spec.yaml`,
    `positionService.test.ts`, `positionController.test.ts`,
    `backend/package.json`: se fusionaron automáticamente sin conflictos
    de contenido; se revisaron a mano de todos modos para confirmar que
    combinaban correctamente el endpoint `GET /position` (de
    `positions-proceso-AGB`) con las comprobaciones `isNaN` (de
    `backend-AGB`) y el test corregido de `id`/`applicationId` (también de
    `backend-AGB`) — todo presente, sin pérdidas.
- **`frontend/src/components/PositionProcess.tsx`**: no existía en esta
  rama antes de la fusión (por eso no se había traducido, ver 3.10). Al
  llegar con la fusión, se traduce ahora: "Volver a posiciones", "Proceso
  de selección: ", "Esta posición no tiene un flujo de entrevistas
  configurado.", "Sin candidatos en esta fase.", "Puntuación media: " y el
  mensaje de error genérico. Los nombres de las fases de entrevista
  (`step.name`, p. ej. "Technical Interview") y el paso actual de cada
  candidato (`candidate.currentInterviewStep`) **no** se traducen — son
  datos que vienen de la base de datos (`InterviewStep.name`), no texto
  estático de la interfaz, igual que los nombres de los candidatos o de
  las empresas no se traducen.
- **`frontend/src/i18n/translations.js`**: se añaden las claves que
  faltaban para la versión real de `Positions.tsx`
  (`positions.company`, `positions.location`, `positions.empty`,
  `positions.editNotImplemented`, `positions.fetchError`) y las nuevas de
  `positionProcess.*`; se retiran `positions.managerLabel`/
  `positions.managerFilterLabel`, que pertenecían solo al mock (el
  concepto de "Manager" no existe en el modelo `Position` real).

## 4. Verificación final

```
npx tsc --noEmit (backend y frontend) → sin errores
npx jest (backend) → 5 suites, 9 tests, todos en verde
                      (incluye el validator.test.ts nuevo)
Navegador            → caso real del usuario reproducido y corregido,
                        en español e inglés, con aria-invalid/
                        aria-describedby verificados en el DOM
                      → detección de idioma verificada con varias
                        combinaciones de navigator.language/languages
                        (ca+es-ES+en → español; ca+en+es → inglés),
                        confirmando el DOM tras esperar la respuesta
                        async, no solo la captura inmediata al clic
                      → selector explícito ES/English: arranca desde la
                        detección automática (localStorage vacío en el
                        primer render), cambia el idioma de los errores ya
                        visibles al instante
                      → <html lang="es"> corregido (antes "en", sin
                        relación con la lógica de i18n)
                      → las 3 rutas (dashboard, alta de candidato,
                        posiciones) verificadas en español e inglés tras
                        cambiar el selector global, con el idioma
                        persistiendo al navegar entre páginas
                      → bug de tipos (createContext(null) → `never` en
                        .tsx) detectado por tsc y corregido antes de dar
                        el cambio por bueno
                      → bug de doble prefijo en candidateService.js
                        detectado y corregido antes de dar el cambio por
                        bueno
```

## 5. Verificación de la fusión con `positions-proceso-AGB` (sección 12)

```
npx tsc --noEmit (backend y frontend) → sin errores tras resolver los
                        conflictos de App.js y Positions.tsx
npx jest (backend)   → 5 suites, 11 tests, todos en verde (los 2 tests
                        nuevos de getAllPositionsService/getAllPositions
                        de positions-proceso-AGB conviven con los 9 ya
                        existentes de esta rama)
Navegador            → GET /position con datos reales del seed (2
                        posiciones), badges de estado y "Edit"
                        deshabilitado, en inglés (idioma recordado de la
                        sesión anterior, confirmando que la preferencia
                        persiste entre fusiones)
                      → "View process" → tablero con Carlos García /
                        John Doe / Jane Smith en sus fases correctas,
                        interfaz en inglés
                      → cambio a español desde el selector → "Volver a
                        posiciones", "Proceso de selección: ", "Sin
                        candidatos en esta fase.", "Puntuación media: "
                        traducidos; nombres de fases ("Initial
                        Screening"...) sin traducir, por ser datos
                      → formulario de alta de candidato verificado de
                        nuevo tras la fusión, sin regresiones
```

## 3.13 Migración a `react-i18next`: cómo se hace "bien"

Esta sección documenta con el máximo detalle posible la migración del
sistema de i18n hecho a mano (rama `candidate-validation-i18n-a11y-AGB`)
a `react-i18next`, la librería estándar del ecosistema React para
internacionalización: la filosofía detrás de la decisión, cada comando
ejecutado (incluidos los que fallaron, porque el porqué de un fallo es
tan importante como el resultado final), los paquetes instalados y por
qué esas versiones concretas, cómo cambió el código fichero a fichero, y
las ventajas reales frente a la versión anterior.

### 3.13.1 Filosofía: por qué sustituir algo que ya funcionaba

El sistema anterior (`locale.js` + `LocaleContext.js` + `translations.js`,
~150 líneas en total) **funcionaba correctamente** — estaba verificado,
probado en el navegador, con tests indirectos vía la UI. La pregunta no
era "¿funciona?" sino "¿es así como se construye esto en un proyecto
real, en equipo, a largo plazo?". Tres ideas concretas guiaron la
migración:

1. **No reinventar problemas ya resueltos.** Detectar el idioma del
   navegador con fallbacks razonables, persistir una preferencia,
   interpolar parámetros en una frase, pluralizar correctamente según el
   idioma (las reglas de plural varían radicalmente entre idiomas — no es
   "singular o plural", en algunos idiomas hay 3, 4 o 6 formas distintas)
   son problemas que miles de proyectos ya resolvieron, testearon contra
   casos borde durante años, y empaquetaron en una librería. Escribirlo a
   mano es empezar de cero en un problema ya resuelto, y cada edge case
   nuevo (un tercer idioma, una frase con plural, RTL) sería código nuevo
   a escribir, testear y mantener nosotros mismos.
2. **Adoptar el formato idiomático desbloquea herramientas gratis.** Un
   JSON anidado por idioma (`es.json`/`en.json`) no es solo "otra forma
   de guardar lo mismo": es el formato que entienden `i18next-parser`
   (extrae claves usadas en el código automáticamente), los plugins de
   VSCode para i18next, y plataformas de gestión de traducciones como
   Lokalise o Crowdin (a las que un traductor no-programador podría subir
   directamente estos ficheros). Un objeto JS con claves planas hecho a
   mano no es compatible con nada de eso.
3. **El estado del idioma debe vivir fuera de React.** El sistema casero
   guardaba el `locale` como estado de un `React.Context` — lo cual
   obligaba a cualquier código que necesitara traducir algo *fuera* de un
   componente (como `validationMessages.js`, invocado desde un `catch` de
   un `handleSubmit`) a recibir el `locale` como parámetro explícito en
   cada función. i18next mantiene el idioma activo como un singleton
   global fuera de React; cualquier módulo puede llamar a `i18n.t(...)`
   directamente, sin necesidad de que el idioma "le llegue" desde algún
   sitio. Esto simplificó de verdad `validationMessages.js` (ver 3.13.4).

### 3.13.2 Pasos ejecutados, en orden, con los comandos exactos

```bash
# 1. Nueva rama desde la que ya tenía todo integrado
git checkout -b i18n-react-i18next-AGB

# 2. Primer intento de instalación — falla
cd frontend
npm install react-i18next i18next i18next-browser-languagedetector
# npm error ERESOLVE unable to resolve dependency tree
# npm error peerOptional typescript@"^5 || ^6 || ^7" from react-i18next@17.0.14
# (el proyecto usa typescript@^4.9.5 en tsconfig.json/package.json)

# 3. Investigar qué versiones de react-i18next NO exigen TypeScript 5
npm view react-i18next versions --json
npm view react-i18next@13 peerDependencies   # sin peer de typescript
npm view react-i18next@14 peerDependencies   # sin peer de typescript
npm view react-i18next@15 peerDependencies   # 15.0.0–15.5.0 sin peer;
                                              # 15.5.1+ ya exige typescript ^5

# 4. Segundo intento, fijando react-i18next@15.5.0 — falla igualmente,
#    esta vez por i18next (su última versión también exige TS5)
npm install react-i18next@15.5.0 i18next i18next-browser-languagedetector
# npm error peerOptional typescript@"^5 || ^6 || ^7" from i18next@26.4.2

# 5. Repetir la misma investigación para i18next
npm view i18next@23 peerDependencies   # sin peer de typescript
npm view i18next@24 peerDependencies   # ya exige typescript ^5
npm view i18next@23 version            # última 23.x: 23.16.8

# 6. Tercer intento, fijando ambos paquetes — funciona
npm install react-i18next@15.5.0 i18next@23.16.8 i18next-browser-languagedetector
# added 5 packages, removed 1 package, changed 1 package

# 7. Se construyen los ficheros nuevos (locales/es.json, locales/en.json,
#    i18n.js) y se reescriben los componentes (ver 3.13.3-3.13.4)

# 8. Verificación de tipos — falla de nuevo, con react-i18next@15.5.0 esta vez
npx tsc --noEmit
# node_modules/react-i18next/index.d.ts(100,3): error TS1139:
#   Type parameter declaration expected.
# (+ una docena de errores de sintaxis más en el mismo fichero de tipos)
# → No es un peer dependency mal declarado: los .d.ts de esta versión
#   usan sintaxis de TypeScript 5 que el compilador 4.9.5 no puede ni
#   parsear. Hay que bajar react-i18next también.

# 9. Cuarto y último intento — funciona y compila limpio
npm install react-i18next@14.1.3
npx tsc --noEmit   # sin salida = sin errores

# 10. Verificación completa: backend sin cambios, frontend en el navegador
cd ../backend && npx jest && npx tsc --noEmit
cd ../frontend && npx tsc --noEmit

# 11. Commit
git add ...
git commit -m "refactor(i18n): migra del sistema casero a react-i18next"
```

**Por qué se documentan también los pasos 2, 4 y 8 (los que fallaron)**:
en un proyecto real, el primer intento de instalar una librería rara vez
es el definitivo — hay que fijar versiones compatibles con el resto del
stack (aquí, TypeScript 4.9.5, heredado del resto del proyecto). Sirve
como referencia de "qué hacer cuando `npm install` falla por peer
dependencies": primero investigar con `npm view <paquete>@<major>
peerDependencies` qué versión concreta dejó de exigir el requisito
conflictivo, y solo si eso no basta (como pasó aquí en el paso 8),
verificar con `tsc` que los tipos realmente son compatibles y no solo que
`npm install` no proteste.

### 3.13.3 Paquetes instalados (versiones finales)

| Paquete | Versión final | Por qué esa versión concreta |
|---|---|---|
| `react-i18next` | `14.1.3` | Última de la rama 14.x; ni exige TypeScript 5 como peer dependency ni sus `.d.ts` usan sintaxis de TS5 (a diferencia de la 15.5.0, que solo cumplía lo primero). |
| `i18next` | `23.16.8` | Última de la rama 23.x, la última sin exigir TypeScript 5. |
| `i18next-browser-languagedetector` | `8.2.1` (resuelta automáticamente, sin conflicto) | Detecta el idioma del navegador con una cadena de estrategias configurables (`localStorage`, `navigator`, `querystring`, `cookie`, `htmlTag`...); sustituye el bucle manual sobre `navigator.languages` del sistema anterior. |

Estos tres paquetes sustituyen por completo la lógica que antes vivía en
`locale.js` (detección + persistencia) y `translations.js` (diccionario +
interpolación) — ver 3.13.4 para el detalle fichero a fichero.

### 3.13.4 Cómo cambió el código, fichero a fichero

**Ficheros eliminados** (su funcionalidad la cubre ahora la librería):
- `frontend/src/i18n/locale.js` — detección de `navigator.languages`,
  lectura/escritura de `localStorage`.
- `frontend/src/i18n/LocaleContext.js` — el `React.Context` +
  `LocaleProvider` + hook `useLocale()` caseros.
- `frontend/src/i18n/translations.js` — el diccionario plano
  `{ 'addCandidate.firstName': '...' }` + la función `translate()` que
  hacía `dict[key]` y un `.replace()` manual por cada `{{param}}`.

**Ficheros nuevos**:
- `frontend/src/i18n/locales/es.json` y `en.json` — el mismo contenido
  que antes vivía en `translations.js`, pero como JSON **anidado**
  (`{ "addCandidate": { "firstName": "Nombre" } }` en vez de
  `{ 'addCandidate.firstName': 'Nombre' }`). i18next usa `.` como
  separador de claves por defecto, así que `t('addCandidate.firstName')`
  sigue funcionando exactamente igual desde los componentes — no hizo
  falta tocar ni una sola llamada a `t()` en el JSX por este cambio de
  formato. También incorporan un namespace nuevo `validation.*` con las
  etiquetas de campo (`validation.fields.firstName`) y las plantillas de
  mensaje (`validation.messages.required`) que antes eran objetos JS
  (`SIMPLE_FIELD_LABELS`, `MESSAGE_TEMPLATES`) dentro de
  `validationMessages.js`.
- `frontend/src/i18n/i18n.js` — la configuración e inicialización de
  i18next. Se importa **una sola vez**, como efecto secundario
  (`import './i18n/i18n'`), desde `index.tsx`, antes de renderizar
  `<App />`. Esto basta para que cualquier componente use
  `useTranslation()` sin necesidad de un `<Provider>` explícito envolviendo
  la app — a diferencia del `LocaleProvider` casero, que si se te olvidaba
  envolver un árbol de componentes rompía el hook con una excepción en
  tiempo de ejecución. Contenido relevante:
  ```js
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: { es: { translation: es }, en: { translation: en } },
      fallbackLng: 'es',
      supportedLngs: ['es', 'en'],
      load: 'languageOnly',   // 'en-US' -> 'en'
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'lti_error_locale', // misma clave que el sistema anterior
      },
      interpolation: { escapeValue: false }, // React ya escapa por defecto
    });

  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng; // <html lang> ahora reactivo
  });
  ```
  Nótese `lookupLocalStorage: 'lti_error_locale'`: se reutiliza
  deliberadamente la misma clave que usaba el sistema casero, así que
  cualquier preferencia de idioma que un usuario ya hubiera elegido antes
  de esta migración se respeta automáticamente, sin necesidad de
  migración de datos.

- **`frontend/src/i18n/validationMessages.js` (reescrito por completo)**:

  *Antes* — objetos JS con plantillas interpoladas a mano, y el `locale`
  viajando como parámetro explícito por cada función:
  ```js
  const MESSAGE_TEMPLATES = {
    es: {
      required: (field) => `${field} es obligatorio.`,
      tooShort: (field, params) => `${field} debe tener al menos ${params.min} caracteres.`,
      // ...
    },
    en: { /* lo mismo en inglés */ },
  };

  export const translateValidationIssue = (issue, locale = getLocale()) => {
    const fieldLabel = getFieldLabel(issue.field, locale);
    const templates = MESSAGE_TEMPLATES[locale] || MESSAGE_TEMPLATES[DEFAULT_LOCALE];
    return templates[issue.code](fieldLabel, issue.params || {});
  };
  ```

  *Después* — delega la composición e interpolación en i18next, sin
  necesidad de recibir el idioma como parámetro (usa el idioma activo de
  la instancia global directamente):
  ```js
  import i18n from './i18n';

  const getFieldLabel = (field) => {
    const match = field.match(ARRAY_FIELD_REGEX);
    if (match) {
      const [, section, index, subfield] = match;
      return i18n.t('validation.arrayFieldLabel', {
        section: i18n.t(`validation.sections.${section}`),
        position: Number(index) + 1,
        subfield: i18n.t(`validation.subfields.${subfield}`),
      });
    }
    return i18n.t(`validation.fields.${field}`, { defaultValue: field });
  };

  export const translateValidationIssue = (issue) => {
    const field = getFieldLabel(issue.field);
    return i18n.t(`validation.messages.${issue.code}`, { field, ...(issue.params || {}) });
  };
  ```
  La firma pasó de `translateValidationIssue(issue, locale)` a
  `translateValidationIssue(issue)` — una simplificación real, no
  cosmética: ya no hay que acordarse de propagar el `locale` por cada
  punto de la cadena de llamadas.

- **Componentes migrados** (`useLocale()` de `LocaleContext.js` →
  `useTranslation()` de `react-i18next`): `RecruiterDashboard.js`,
  `FileUploader.js`, `AddCandidateForm.js`, `Positions.tsx`,
  `PositionProcess.tsx`, `LanguageSwitcher.js`. El cambio en cada uno fue
  mínimo — literalmente la línea de import y la línea del hook — porque
  las claves de traducción ya usaban el mismo formato de puntos:
  ```diff
  - import { useLocale } from '../i18n/LocaleContext';
  + import { useTranslation } from 'react-i18next';

  - const { t } = useLocale();
  + const { t } = useTranslation();
  ```
  `LanguageSwitcher.js` cambió algo más: `setLocale(code)` pasó a ser
  `i18n.changeLanguage(code)` (la API estándar de i18next, que ya
  persiste en `localStorage` vía `LanguageDetector` sin código adicional
  nuestro), y la comparación de idioma activo pasó a usar
  `i18n.resolvedLanguage` en vez de un `locale` de estado propio — el
  idioma realmente resuelto tras aplicar `load: 'languageOnly'`. Se
  añadió también `lang={code}` a cada botón del selector, para que un
  lector de pantalla pronuncie "Español"/"English" con las reglas
  fonéticas del idioma que nombran, no las de la página en la que están.

- **Ajuste en los `useEffect` de `Positions.tsx`/`PositionProcess.tsx`**:
  antes incluían `t` en el array de dependencias (necesario con el `t`
  "casero", recreado en cada cambio de idioma vía `useMemo`), lo que
  volvía a pedir los datos a la API cada vez que alguien cambiaba de
  idioma — un efecto secundario no intencionado del diseño anterior.
  `useTranslation()` de `react-i18next` también provoca un re-render al
  cambiar de idioma (así el texto se re-traduce), pero ya no hacía falta
  meter `t` en las dependencias del *fetch*: se corrigió a `[]`/`[id]`,
  de modo que los datos solo se piden una vez y el texto se re-traduce en
  cada render sin necesidad de volver a llamar a la API.

### 3.13.5 Ventajas frente al sistema anterior

| Aspecto | Sistema casero (`candidate-validation-i18n-a11y-AGB`) | `react-i18next` |
|---|---|---|
| Detección de idioma | Bucle manual sobre `navigator.languages`, escrito y testeado por nosotros | `LanguageDetector`, usado y probado en miles de proyectos en producción |
| Persistencia de preferencia | `localStorage.getItem`/`setItem` manual con `try/catch` propio | Gestionada por `LanguageDetector` (`caches: ['localStorage']`), cero código nuestro |
| Interpolación de parámetros | `String.replace()` manual por cada `{{param}}` | Motor de interpolación nativo, con opciones de escapado/formato |
| Pluralización | Sin soporte — habría que escribirlo desde cero para el primer `"1 candidato"` vs `"2 candidatos"` | Soporte nativo vía `t('key', { count })`, con las reglas de plural correctas por idioma |
| Uso fuera de componentes React | Cada función debía recibir `locale` como parámetro explícito | `i18n.t(...)` global, mismo resultado sin parámetros adicionales |
| `<html lang>` reactivo | Había que cablearlo a mano (y de hecho fue un fallo real detectado en esta misma sesión, ver sección 3.7/3.3.1) | Una línea: `i18n.on('languageChanged', ...)` |
| Formato de recursos | Objeto JS con claves planas, sin convención externa | JSON anidado, el formato que esperan `i18next-parser` y plataformas de traducción (Lokalise, Crowdin...) |
| Añadir un idioma nuevo | Un objeto JS más en `translations.js` + otro en `validationMessages.js`, mantenidos a mano en paralelo | Un fichero `xx.json` más; toda la lógica de resolución/fallback ya está resuelta |
| Mantenimiento a largo plazo | Cada caso nuevo (RTL, formato de fecha, plural, un tercer idioma) es código nuestro a escribir y testear | Ya resuelto por la librería; se actualiza con `npm update` |
| Superficie de código propio | ~150 líneas de lógica de i18n hecha a mano, a mantener indefinidamente | ~40 líneas de configuración declarativa (`i18n.js`); el resto lo mantiene la librería |

La funcionalidad visible para el usuario final **no cambió en nada** — es
exactamente el mismo comportamiento (detección automática, selector
explícito que la anula, persistencia, re-traducción en caliente) que ya
se había verificado con el usuario. Lo que cambió es *qué tan sostenible*
es ese comportamiento a partir de aquí.

## 6. Verificación de la migración a react-i18next (sección 3.13)

```
npm install react-i18next@14.1.3 i18next@23.16.8 i18next-browser-languagedetector
                      → tras descartar react-i18next@17 (exige TS5) y
                        @15.5.0 (sus .d.ts no compilan con TS 4.9)
npx tsc --noEmit (frontend) → sin errores con react-i18next@14.1.3
npx jest (backend)   → 5 suites, 11 tests, sin cambios (rama solo de frontend)
Navegador            → <html lang> confirmado dinámico
                        (document.documentElement.lang pasa de "es" a "en"
                        al cambiar el selector, sin recargar)
                      → localStorage['lti_error_locale'] se sigue
                        actualizando con la misma clave que antes
                      → caso real del guión bajo en el apellido reproducido
                        de nuevo: mensaje interpolado correctamente vía
                        i18next ("...character that is not allowed: "_"...")
                      → cambio de idioma en caliente sobre un error ya
                        visible, sin reenviar el formulario (igual que con
                        el sistema casero)
                      → /positions y /positions/:id (datos reales)
                        verificados en español, sin regresiones
```

## 3.14 Migración de Create React App a Vite

### 3.14.1 Filosofía: por qué migrar el toolchain y no solo la versión de TypeScript

El disparador fue una pregunta muy concreta: "¿por qué no pasar a
TypeScript 5?". La respuesta corta es que no hay ningún impedimento en
el código — nada de lo escrito en este proyecto usa sintaxis específica
de una versión de TS. El impedimento era `react-scripts` (Create React
App), que declara `"typescript": "^3.2.1 || ^4"` como *peer dependency*.

Pero forzar solo esa versión habría sido tratar el síntoma, no la causa:
**Create React App está descontinuado** — el equipo de React lo retiró
oficialmente como recomendación en 2025, y `react-scripts` no ha tenido
una versión mayor desde 2022 que reconozca nada del ecosistema moderno.
Subir TypeScript por su cuenta habría significado volver a chocar con el
mismo peer dependency desfasado en la siguiente librería (como de hecho
ya había pasado con `react-i18next` en la sección 3.13). La decisión de
migrar a Vite fue del usuario, explícitamente ("busco aprender con lo
último y cómo debe hacerse"), tras un análisis previo de qué implicaba
(ver el resumen que dio el asistente antes de empezar: sin variables
`REACT_APP_*`, sin suite de tests que romper — `npm test` ya estaba roto,
apuntaba a un `jest.config.js` inexistente —, sin `craco` ni `eject`,
nada fuera de `frontend/` dependiente de CRA — riesgo bajo).

Un hallazgo no anticipado durante la propia migración reforzó la
filosofía de "lo último no siempre es lo más compatible, y hay que
comprobarlo, no asumirlo": al intentar instalar TypeScript en su versión
`latest`, npm resolvió `7.0.2` — **TypeScript ya va por la versión 7**
(el compilador reescrito nativamente en Go), más nuevo todavía de lo que
la pregunta original planteaba. Pero `typescript-eslint` (necesario para
enlazar TypeScript con ESLint) declara un peer `typescript: ">=4.8.4
<6.1.0"` — no soporta ni TS7 ni siquiera TS 5.9 en su forma más estricta
de resolución de npm. La cadena de decisiones fue: TS7 (más nuevo,
incompatible con el linter) → TS5.9.3 (compatible, pero no la más
reciente posible) → **TS6.0.3** (el usuario preguntó explícitamente si
TS6 también encajaba; se comprobó con `npm view typescript versions` que
sí hay releases estables 6.0.2/6.0.3, no solo la beta que aparecía en
`dist-tags`, y caen dentro del rango que acepta `typescript-eslint`). El
resultado final es la versión más nueva posible que no rompe ninguna
pieza del stack — ni más, ni menos.

### 3.14.2 Pasos ejecutados, en orden, con los comandos exactos

```bash
# 1. Nueva rama desde la que ya tenía todo integrado + i18n con react-i18next
git checkout -b vite-migration-AGB
cd frontend

# 2. Primer intento de instalar Vite — falla por un conflicto de babel
#    heredado del propio react-scripts, todavía instalado en ese momento
npm install --save-dev vite @vitejs/plugin-react
# npm error Conflicting peer dependency: @babel/core@8.0.5
# npm error peer @babel/core@"^7.29.0 || ^8.0.0-rc.1" from @rolldown/plugin-babel@0.2.4
# npm error   peerOptional @rolldown/plugin-babel from @vitejs/plugin-react@6.1.1

# 3. Se quita react-scripts ANTES de instalar Vite (elimina el babel
#    obsoleto que causaba el conflicto del paso 2)
npm uninstall react-scripts
# removed 1239 packages

# 4. Segundo intento — falla por otra razón: Vite 8 exige @types/node
#    moderno, el proyecto tenía la versión de la época de CRA (^16.18.97)
npm install --save-dev vite @vitejs/plugin-react
# npm error peerOptional @types/node@"^20.19.0 || >=22.12.0" from vite@8.3.0
npm install --save-dev @types/node@latest   # -> 22.20.3

# 5. Tercer intento — funciona
npm install --save-dev vite @vitejs/plugin-react
# added 15 packages (vite@8.3.0, @vitejs/plugin-react@6.1.1)

# 6. TypeScript a la última — resuelve a la v7 (el compilador en Go)
npm install --save-dev typescript@latest   # -> 7.0.2

# 7. Vitest, el test runner hermano de Vite
npm install --save-dev vitest jsdom

# 8. Se construyen index.html (en la raíz), vite.config.ts, tsconfig.json/
#    tsconfig.app.json/tsconfig.node.json, vite-env.d.ts, y se actualizan
#    los scripts de package.json (ver 3.14.4)

# 9. Instalar el stack de ESLint flat config — falla: typescript-eslint no
#    soporta TypeScript 7 todavía
npm install --save-dev eslint @eslint/js typescript-eslint \
  eslint-plugin-react-hooks eslint-plugin-react-refresh globals
# npm error peer typescript@">=4.8.4 <6.1.0" from typescript-eslint@8.70.0
# npm error Found: typescript@7.0.2

# 10. Se baja TypeScript a la última 5.x para poder instalar el linter
npm view typescript-eslint peerDependencies   # typescript: ">=4.8.4 <6.1.0"
npm view typescript@5 version                 # última 5.x: 5.9.3
npm install --save-dev typescript@5.9.3
npm install --save-dev eslint @eslint/js typescript-eslint \
  eslint-plugin-react-hooks eslint-plugin-react-refresh globals
# funciona

# 11. Se escribe eslint.config.js; hace falta "type": "module" en
#     package.json para que Node interprete su `import` como ESM

# 12. Verificación de tipos — limpia
npx tsc -b

# 13. Primer arranque de Vite — falla: JSX en ficheros .js
npm run dev
# [PARSE_ERROR] Unexpected JSX expression, src/App.js:12
# Help: JSX syntax is disabled and should be enabled via the parser options

# 14. Se identifican los .js con JSX real (grep descartando falsos
#     positivos como comentarios que mencionan <Provider>) y se renombran
grep -lE "<[A-Za-z]|</[A-Za-z]" $(find src -name "*.js")
git mv src/App.js src/App.jsx
git mv src/components/RecruiterDashboard.js src/components/RecruiterDashboard.jsx
git mv src/components/AddCandidateForm.js src/components/AddCandidateForm.jsx
git mv src/components/FileUploader.js src/components/FileUploader.jsx
git mv src/components/LanguageSwitcher.js src/components/LanguageSwitcher.jsx

# 15. Segundo arranque — limpio; verificación completa en el navegador
#     (dashboard, alta de candidato con validación ES/EN, listado de
#     posiciones con datos reales, tablero "Ver proceso")
npm run dev

# 16. Build de producción — funciona, genera dist/ (antes build/ con CRA)
npm run build
npx vite preview --port 4173   # sirve el build, 200 OK

# 17. El linter, ya con el stack completo instalado, encuentra 5 errores
#     reales (no relacionados con la migración en sí, preexistentes):
npx eslint .
# preserve-caught-error: throw new Error(...) dentro de un catch sin
# adjuntar la causa original -> se corrige añadiendo { cause: error } en
# candidateService.js (x2) y positionService.js (x3)

# 18. vitest sin tests configurados sale con código 1 (rompería CI); se
#     añade --passWithNoTests al script "test" de package.json
npx vitest run
# No test files found, exiting with code 1

# 19. A mitad de sesión, el usuario pregunta si TS6 también sería
#     compatible con el stack — se comprueba y se corrige (ver 3.14.1)
npm view typescript versions --json | grep '"6\.'   # 6.0.2, 6.0.3 estables
npm install --save-dev typescript@6.0.3
npx tsc -b   # sigue limpio

# 20. Verificación final completa
npx tsc -b && npx eslint . && npm run build && npm test
cd ../backend && npx jest && npx tsc --noEmit   # backend intacto
```

### 3.14.3 Paquetes: qué se quitó, qué se añadió, y las versiones finales

**Eliminado**: `react-scripts` (y con él, 1239 paquetes transitivos —
todo el toolchain de Babel/webpack de CRA), `@types/jest` (ya no hace
falta con Vitest, y podía chocar con los tipos globales de
`vitest/globals`).

| Paquete | Versión final | Por qué |
|---|---|---|
| `vite` | `8.3.0` | El bundler/dev server en sí. |
| `@vitejs/plugin-react` | `6.1.1` | Soporte de React (Fast Refresh, JSX) para Vite. |
| `typescript` | `6.0.3` | La versión estable más reciente compatible con `typescript-eslint` (ver 3.14.1) — ni la 7.0.2 "latest" (rompe el linter) ni quedarse en la 5.9.3 (había una 6.x estable más nueva). |
| `@types/node` | `22.20.3` | La `^16.18.97` heredada de CRA no cumplía el peer de Vite 8 (`^20.19 \|\| >=22.12`). |
| `vitest` | `5.0.1` | Test runner — sustituye a Jest (que además nunca llegó a configurarse: `npm test` apuntaba a un `jest.config.js` inexistente). |
| `jsdom` | `30.0.1` | Entorno DOM simulado para que Vitest pueda ejecutar tests de componentes. |
| `eslint` | `10.10.0` | ESLint 9+ con configuración plana (`eslint.config.js`), sustituye al `eslintConfig` de `package.json` que dependía de `eslint-config-react-app` (empaquetado por `react-scripts`, ya no disponible al quitarlo). |
| `@eslint/js` + `typescript-eslint` | `10.0.1` / `8.70.0` | Reglas recomendadas de JS y de TypeScript para la config plana. |
| `eslint-plugin-react-hooks` | `7.1.1` | Reglas de hooks de React (`rules-of-hooks`, `exhaustive-deps`). |
| `eslint-plugin-react-refresh` | `0.5.7` | Avisa si un fichero exporta algo que rompería el Fast Refresh de Vite. |
| `globals` | `17.12.0` | Define las globals del navegador (`window`, `document`...) para el linter. |

### 3.14.4 Cómo cambió el código, fichero a fichero

- **`frontend/public/index.html` → `frontend/index.html`** (movido a la
  raíz, no a `public/`): Vite lo trata como el punto de entrada real, no
  como una plantilla. Los 3 usos de `%PUBLIC_URL%/...` se convierten en
  rutas normales (`/favicon.ico`), porque Vite sirve el contenido de
  `public/` en la raíz automáticamente. Se añade
  `<script type="module" src="/src/index.tsx"></script>` (con CRA esta
  referencia era implícita, inyectada por `react-scripts`). De paso se
  corrige el `<title>` genérico "React App" heredado del boilerplate por
  "LTI - Talent Tracking System".
- **`frontend/vite.config.ts` (nuevo)**: plugin de React,
  `server.port: 3000` fijado explícitamente (el backend tiene
  `cors({ origin: 'http://localhost:3000' })` hardcodeado — así no hace
  falta tocar el backend, aunque el puerto por defecto de Vite sea 5173),
  y la config de Vitest (`environment: 'jsdom'`, `globals: true`).
- **`frontend/tsconfig.json`**: pasa de un único fichero con todas las
  opciones a **project references** (`{ "files": [], "references": [...]
  }`), el patrón que genera el propio scaffold oficial de Vite
  (`npm create vite@latest`) — separa la config de "código de la app"
  (`tsconfig.app.json`) de la de "config de Vite en sí"
  (`tsconfig.node.json`, para que `vite.config.ts` se compile con un
  target de Node, no de navegador). Cambios de fondo en
  `tsconfig.app.json`: `moduleResolution: "node"` → `"bundler"` (el modo
  recomendado cuando el bundler, no `tsc`, resuelve los módulos) y
  `target: "es5"` → `"ES2022"` (Vite/esbuild no necesitan bajar a ES5;
  los navegadores objetivo del `browserslist` ya son modernos).
- **`frontend/src/react-app-env.d.ts` → `frontend/src/vite-env.d.ts`**:
  `/// <reference types="react-scripts" />` → `/// <reference types="vite/client" />`.
- **`frontend/eslint.config.js` (nuevo)**: configuración plana de ESLint
  9, sustituye al campo `"eslintConfig": { "extends": ["react-app",
  "react-app/jest"] }` de `package.json` (ese formato de configuración ya
  ni siquiera lo lee ESLint 9 sin un plugin de compatibilidad).
- **`frontend/src/App.jsx`, `RecruiterDashboard.jsx`,
  `AddCandidateForm.jsx`, `FileUploader.jsx`, `LanguageSwitcher.jsx`**
  (renombrados de `.js`): el motor de transformación de Vite 8 (`oxc`,
  escrito en Rust) solo activa el parseo de JSX para ficheros `.jsx`/
  `.tsx` por extensión — a diferencia de Babel (usado por CRA), que lo
  detectaba dentro de cualquier `.js`. La solución correcta no es
  configurar una excepción para `.js` (posible, pero un parche), sino
  nombrar los ficheros según lo que contienen — la convención que ya
  seguían `Positions.tsx`/`PositionProcess.tsx` en este mismo proyecto.
- **`frontend/src/services/candidateService.js` y `positionService.js`**:
  el linter recién configurado (regla `preserve-caught-error`) señaló que
  los `throw new Error(mensaje)` dentro de un `catch (error)` perdían la
  causa original. Se corrige añadiendo el segundo argumento estándar de
  `Error` (`{ cause: error }`), sin cambiar el mensaje mostrado al
  usuario — un hallazgo real del linter, no parte "planeada" de la
  migración, corregido porque instalar un linter y no atender lo que
  encuentra habría dejado el repositorio en un estado incoherente.
- **`frontend/package.json`**: `"type": "module"` (necesario para que
  Node interprete el `import` de `eslint.config.js`/`vite.config.ts` como
  ESM); scripts `start`/`eject` → `dev`/`preview`; `build` pasa de
  `react-scripts build` a `tsc -b && vite build` (type-check explícito
  antes del build, algo que CRA hacía de forma menos visible vía
  `fork-ts-checker-webpack-plugin`); `test` pasa de
  `jest --config jest.config.js` (roto: el fichero no existía) a
  `vitest run --passWithNoTests` (no falla con cero tests, que es el
  estado real y honesto del proyecto ahora mismo) + un `test:watch`
  nuevo para desarrollo local.
- **`README.md`** (raíz, ES y EN) **y `frontend/README.md`**: los pasos
  "construye el frontend" + "inicia el frontend" (`npm run build` +
  `npm start`) se sustituyen por un único `npm run dev`. El
  `frontend/README.md` generado por CRA (boilerplate nunca personalizado,
  con enlaces a la documentación oficial de Create React App) se
  reemplaza por uno breve y específico de este proyecto.
- **`.gitignore`**: se añade `**/*.tsbuildinfo` (caché incremental de
  `tsc -b`, generada al compilar, que no debe versionarse — no existía
  antes porque CRA nunca usaba compilación incremental de `tsc` con
  project references).

### 3.14.5 Ventajas frente a Create React App

| Aspecto | Create React App | Vite |
|---|---|---|
| Estado del proyecto | Descontinuado desde 2025; `react-scripts` sin versión mayor desde 2022 | Activamente mantenido, es el estándar de facto actual para React sin meta-framework |
| Versión de TypeScript soportada | Como mucho TS4 (peer `^3.2.1 \|\| ^4`) | Sin opinión propia — la fija el proyecto; aquí TS6.0.3 |
| Arranque del dev server | Empaqueta toda la app con webpack antes de servir nada (lento a partir de cierto tamaño) | Sirve los módulos ES nativos del navegador sin empaquetar en dev (arranque en ~150ms en este proyecto, medido) |
| Motor de transformación | Babel (JS puro) | `oxc` (Rust) en dev / `esbuild`/`rolldown` en build — building notablemente más rápido |
| Testing integrado | `react-scripts test` (Jest) — aquí ni siquiera estaba configurado de verdad | Vitest, comparte config y motor con Vite; mucho más rápido que Jest |
| Configuración | Oculta (hay que `eject` para tocarla, "operación de un solo sentido") | `vite.config.ts` explícito, versionado, sin necesidad de "eyectar" nada |
| Linter | `eslint-config-react-app`, formato de config legado (`.eslintrc`) | `eslint.config.js`, la configuración plana estándar de ESLint 9+ |
| Salida de build | `build/` | `dist/` (y avisa de forma explícita de chunks grandes, cosa que CRA no hacía) |
| Coste de mantener actualizado | Cada bump de una dependencia moderna choca con peers de 2022 (ya pasó con `react-i18next` en 3.13) | Las dependencias del ecosistema actual (react-i18next, etc.) se llevan bien con Vite/TS moderno de fábrica |

La app en sí **se comporta exactamente igual** para quien la usa — mismo
puerto, mismas rutas, mismo idioma, misma validación. Lo que cambia es
que ahora se apoya en herramientas mantenidas activamente, en vez de en
un proyecto retirado que solo podía ir acumulando fricción con cada
dependencia nueva.

## 7. Verificación de la migración a Vite (sección 3.14)

```
npm uninstall react-scripts        → -1239 paquetes
npm install vite/@vitejs/plugin-react/typescript/vitest/jsdom/eslint...
                                    → 3 intentos fallidos documentados en
                                      3.14.2, resueltos uno a uno
npx tsc -b (frontend)               → sin errores, con TS 6.0.3
npx eslint . (frontend)             → 5 errores reales encontrados y
                                       corregidos (preserve-caught-error),
                                       luego limpio
npm run build (frontend)            → dist/ generado, build de 441ms
npx vite preview --port 4173        → sirve el build, 200 OK
npm test (frontend)                 → vitest, 0 tests, sale con código 0
                                       (--passWithNoTests)
npx jest / npx tsc --noEmit (backend) → 5 suites, 11 tests, sin cambios
                                       (rama solo de frontend)
Navegador (npm run dev)             → dashboard, /add-candidate (mismo
                                       caso del guión bajo, ES/EN), 
                                       /positions (datos reales de la
                                       API), /positions/:id (tablero
                                       "Ver proceso" con los candidatos
                                       del seed) — todo verificado sin
                                       regresiones tras la migración
```

## 3.15 Tests automáticos: las mismas pruebas de validación, ahora repetibles

A lo largo de toda la sesión, "probar" un arreglo significó siempre lo
mismo: lanzar el backend y el frontend, y reproducir el caso a mano con
`curl` o en el navegador — el apellido con guión bajo, la acumulación de
varios campos, el cambio de idioma, un id de posición no numérico... Esto
verificaba que el comportamiento era correcto en el momento, pero no deja
nada que vuelva a comprobarlo automáticamente si algo se rompe más
adelante. Esta rama convierte esos mismos casos en tests que se ejecutan
con `npm test` (o `npx jest` en el backend), sin depender de tener la
base de datos ni los servidores arrancados.

### 3.15.1 El recuento exacto: por qué 11→19 en el backend y 0→18 en el frontend

No son cifras redondeadas — cada test nuevo está contado (`grep -c
"it("` sobre cada fichero, verificado literalmente antes de escribir esta
sección).

**Backend: 11 → 19 (+8)**

| Fichero | Antes | Después | Qué se añadió |
|---|---|---|---|
| `candidateController.test.ts` | 1 | 5 (+4) | `addCandidateController`: alta con éxito (201); el caso del guión bajo (400, `errors: [{field, code, params}]`); acumulación de 3 campos a la vez; error no-validación (formato genérico, no `issues`) |
| `positionController.test.ts` | 2 | 6 (+4) | `getCandidatesByPosition` con id no numérico (400, sin llamar al servicio); `getInterviewFlowByPosition` con id numérico (200), id no numérico (400) y posición inexistente (404) |
| `validator.test.ts` | 5 | 5 | sin cambios (ya existía desde `candidate-validation-i18n-a11y-AGB`) |
| `candidateService.test.ts` | 1 | 1 | sin cambios |
| `positionService.test.ts` | 2 | 2 | sin cambios |

Los +8 son exactamente los huecos de cobertura identificados en 3.15.2 —
no tests genéricos añadidos por rellenar un número, sino los casos
concretos que antes solo se habían comprobado con `curl`.

**Frontend: 0 → 18** (no había ningún fichero `*.test.*` en todo
`frontend/src` antes de esta rama — `Vitest` estaba instalado y
configurado desde `vite-migration-AGB`, pero vacío)

| Fichero (nuevo) | Tests |
|---|---|
| `i18n/validationMessages.test.js` | 8 |
| `services/candidateService.test.js` | 6 |
| `components/AddCandidateForm.test.jsx` | 4 |
| **Total** | **18** |

### 3.15.2 Backend: rellenar los huecos reales de cobertura

Antes de esta rama, `candidateController.test.ts` solo cubría
`updateCandidateStageController`; **`addCandidateController` — el flujo
de alta de candidato, el más verificado a mano de toda la sesión — no
tenía ni un solo test.** De igual manera, `positionController.test.ts`
no cubría el caso `isNaN` de `getCandidatesByPosition`
(sí arreglado en código desde `backend-AGB`, pero nunca comprobado por un
test) ni `getInterviewFlowByPosition` en absoluto.

### 3.15.3 Hallazgo: aislamiento entre tests (mocks que no se limpiaban)

La primera versión de los tests nuevos de `positionController.test.ts`
fallaba así, literalmente:

```
expect(jest.fn()).not.toHaveBeenCalled()

Expected number of calls: 0
Received number of calls: 1
```

No porque el código probado estuviera mal: `jest.mock(...)` a nivel de
módulo conserva el historial de llamadas de un mock **entre distintos
`it()` del mismo fichero** si nadie lo limpia explícitamente. El test
anterior (con un `id` válido, que sí debía llamar al servicio) dejaba
registrada esa llamada, y el siguiente test (`id` no numérico, que **no**
debía llamarlo) heredaba ese recuento y fallaba pese a que el código
`if (isNaN(positionId)) return res.status(400)...` funcionaba
perfectamente. Se corrige con:

```ts
beforeEach(() => {
  jest.clearAllMocks();
});
```

en `positionController.test.ts` y, por coherencia y prevención,
también en `candidateController.test.ts`. Lección concreta: un test mal
aislado puede fallar — o, más peligroso todavía, **pasar** — por motivos
que no tienen nada que ver con lo que dice comprobar.

### 3.15.4 Hallazgo: `getByText` falla cuando el mensaje aparece duplicado a propósito

Al escribir `AddCandidateForm.test.jsx`, la primera versión usaba
`screen.getByText(mensaje)` y fallaba así:

```
TestingLibraryElementError: Found multiple elements with the text:
El apellido contiene un carácter no permitido: "_". Solo se admiten
letras y espacios.

Here are the matching elements: [...]
```

Esto no es un fallo del test ni del componente: es el comportamiento
**diseñado a propósito** en `candidate-validation-i18n-a11y-AGB` (sección
3.5) — el mismo mensaje aparece dos veces, pegado al campo
(`Form.Control.Feedback`, para quien ve la pantalla) y en el resumen
`role="alert"` al final (para que un lector de pantalla lo anuncie sin
que el foco tenga que moverse hasta el campo). `getByText` de
Testing Library está diseñado para **fallar** si hay más de una
coincidencia — es una salvaguarda para detectar selectores ambiguos, no
un bug de la librería. La solución correcta no es "hacer que solo
aparezca una vez" (eso rompería la accesibilidad que se buscaba
conseguir), sino usar la función pensada para este caso:

```js
expect(screen.getAllByText(expectedMessage)).toHaveLength(2);
```

`getAllByText` devuelve un array con todas las coincidencias en vez de
lanzar; afirmar `toHaveLength(2)` además deja constancia explícita de que
la duplicación es intencionada — si algún día solo apareciera una vez (o
tres), el test fallaría y alertaría de una regresión real en el diseño
de accesibilidad, no solo de un cambio de texto.

### 3.15.5 Hallazgo: `.setup()` no se eliminó — hubo que *adoptarlo*, actualizando la librería

Aquí conviene ser preciso porque es fácil describirlo al revés: **no se
quitó `.setup()` de los tests. Al contrario: `.setup()` es la API
*actual* de `@testing-library/user-event`, y hubo que actualizar la
librería para poder usarla**, porque la versión instalada era una
heredada de la plantilla por defecto de Create React App, nunca
actualizada desde entonces.

El primer intento de test ya usaba la API moderna, con la que se escribe
código nuevo hoy:

```js
const user = userEvent.setup();
await user.type(screen.getByLabelText('Apellido'), 'Garcia_');
```

Y falló así:

```
TypeError: default.setup is not a function
 ❯ src/components/AddCandidateForm.test.jsx:34:32
```

La causa: `package.json` tenía `"@testing-library/user-event": "^13.5.0"`
— la v13 no tiene el método `.setup()` en absoluto; su API era la más
antigua, de llamada directa y síncrona
(`userEvent.type(elemento, texto)`, sin sesión previa). `.setup()` se
introdujo en la v14 como el patrón recomendado (crea una "sesión" de
usuario que simula con más fidelidad la secuencia real de eventos de
puntero/teclado del navegador, en vez de disparar un único evento
sintético). Dos caminos posibles: reescribir el test contra la API vieja
(v13), o actualizar la librería para poder usar la API que ya se había
escrito por ser la actual. Se optó por lo segundo — coherente con el
criterio de toda la sesión ("lo último que sea compatible", ya aplicado
en 3.13/3.14 con `react-i18next` y `TypeScript`):

```bash
npm install @testing-library/react@16.3.3 @testing-library/user-event@14.6.7 @testing-library/jest-dom@7.0.1
```

Instalación limpia, sin conflictos de peer dependencies (a diferencia de
los tropiezos con TypeScript de 3.13/3.14, estas tres sí eran compatibles
con el resto del stack a la primera). Tras la actualización, el mismo
código de test (con `.setup()`) pasó a funcionar sin cambiarle una línea.

### 3.15.6 Hallazgo: las librerías de test estaban en `dependencies`, no en `devDependencies`

Al tocar `package.json` para el punto anterior, se observó que
`@testing-library/jest-dom`, `@testing-library/react` y
`@testing-library/user-event` llevaban desde el origen del proyecto
dentro de `"dependencies"` — el bloque de paquetes que se instalan
siempre, incluidos los despliegues de producción — en vez de
`"devDependencies"` (paquetes que solo hacen falta durante el desarrollo
y la ejecución de tests). Es el resultado por defecto de
`npx create-react-app`: CRA no distingue entre ambos bloques porque todo
pasa igualmente por su propio proceso de build, así que nunca hizo falta
corregirlo — pero fuera de CRA (con Vite, o con cualquier build estándar)
si alguien instalara el proyecto con `npm install --omit=dev` (habitual
en una imagen Docker de producción minimalista), estas tres librerías se
habrían instalado igualmente sin necesidad ninguna, solo por estar mal
clasificadas. Se corrige moviéndolas al bloque correcto:

```diff
   "dependencies": {
-    "@testing-library/jest-dom": "^7.0.1",
-    "@testing-library/react": "^16.3.3",
-    "@testing-library/user-event": "^14.6.7",
     "@types/react": "^18.3.1",
     ...
   },
   "devDependencies": {
+    "@testing-library/jest-dom": "^7.0.1",
+    "@testing-library/react": "^16.3.3",
+    "@testing-library/user-event": "^14.6.7",
     "@eslint/js": "^10.0.1",
     ...
```

### 3.15.7 Frontend: qué prueba cada fichero nuevo

- **`i18n/validationMessages.test.js`** (8 tests): el equivalente, en la
  capa de traducción, del `validator.test.ts` del backend — compone el
  mismo `{field: 'lastName', code: 'invalidCharacters', params: {char:
  '_'}}` y comprueba el texto final en español, en inglés (cambiando
  `i18n.changeLanguage`), la composición de etiquetas para campos de
  array (`educations[0].institution`) y la interpolación de `min`/`max`.
- **`services/candidateService.test.js`** (6 tests): mockeando `axios`,
  comprueba que los issues de validación se propagan sin aplanar, que
  **no** hay doble prefijo en errores genéricos (el bug real corregido en
  `vite-migration-AGB`, sección 3.14.4) y que un fallo de red sin
  `response` no lanza un `TypeError` (el bug real corregido en
  `frontend-AGB`, sección 3.2 de `prompts-AGB-frontend.md`) — dos tests
  que, de haber existido antes, habrían detectado esos dos bugs en el
  momento en que se introdujeron, no cuando se encontraron a mano.
- **`components/AddCandidateForm.test.jsx`** (4 tests): el test más
  directamente ligado a lo verificado a mano una y otra vez durante la
  sesión — renderiza el formulario real, rellena Nombre/Apellido/Email,
  envía, y comprueba (entre los hallazgos 3.15.4 y 3.15.5 de arriba) que
  el mensaje aparece por duplicado a propósito, que
  `aria-invalid`/`aria-describedby` quedan bien puestos, que cambiar el
  idioma re-traduce el error ya visible sin volver a llamar al servicio
  (`sendCandidateData` sigue con 1 sola llamada), que se acumulan varios
  campos a la vez, y que un envío válido limpia los errores y muestra el
  mensaje de éxito.

### 3.15.8 Lo que queda fuera, a propósito

Siguiendo el mismo criterio de toda la sesión (no fabricar cobertura que
nadie pidió), no se han escrito tests para el dashboard, el listado de
posiciones (sigue habiendo lógica mínima que probar más allá del mock del
propio `getPositions`) ni el tablero "Ver proceso" — el foco explícito de
la petición era "las mismas pruebas de validación que en las primeras
ramas", y eso es exactamente lo que cubren estos tests: alta de
candidato, códigos de error, y las comprobaciones de `id` en las rutas de
posiciones.

## 8. Verificación de los tests añadidos (sección 3.15)

```
Backend (npx jest)   → 5 suites, 19 tests (antes 11; +8 nuevos), verde
                        npx tsc --noEmit → sin errores
Frontend (npm test)  → 3 suites, 18 tests (antes 0), verde
                        npx tsc -b → sin errores
                        npx eslint . → sin errores
                        npm run build → mismo tamaño de bundle que antes
                        (2773 módulos, 651.80 kB) — los ficheros .test.*
                        no se cuelan en el build de producción
Aislamiento           → bug real de mocks sin limpiar entre tests
                        encontrado y corregido en positionController.test.ts
                        y candidateController.test.ts (beforeEach +
                        jest.clearAllMocks())
```
