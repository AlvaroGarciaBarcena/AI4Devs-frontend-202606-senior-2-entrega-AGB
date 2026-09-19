# Registro de prompts y arreglos — Integración completa + i18n + Vite + tests + seguridad + auth + code splitting + UX (rama `candidate-form-ux-fixes-AGB`)

Autor: garciabarcenaalvaro@gmail.com
Asistente: Claude Code (Sonnet 5)
Fecha: 2026-09-16 / 2026-09-17 / 2026-09-19

Rama base: `code-splitting-AGB` (commit `947bbc3`), que ya reunía todo lo
anterior (`backend-AGB` + `frontend-AGB` +
`candidate-validation-i18n-a11y-AGB` + `positions-proceso-AGB` + la
migración de i18n a `react-i18next` + la migración de Create React App a
Vite + tests automáticos + una auditoría de ciberseguridad exhaustiva +
la migración de `react-router-dom` a v7 + autenticación JWT en toda la
API + *code splitting* por ruta). Esta rama no fusiona nada nuevo —
corrige dos bugs de UX reportados por el usuario al usar el formulario
"Agregar Candidato" de verdad, no encontrados por ninguna auditoría.

> Nota: las secciones 1-13 de este documento son el historial heredado de
> `i18n-react-i18next-AGB`/`all-fixes-AGB` sin modificar — validación,
> i18n con `react-i18next`, accesibilidad. La sección 3.14 documenta la
> migración de CRA a Vite, la 3.15 la incorporación de tests automáticos,
> la 3.16 la traducción del selector de fichero nativo, la 3.17 la
> auditoría de ciberseguridad, la 3.18 la migración de `react-router-dom`
> a v7, la 3.19 la autenticación de las APIs, la 3.20 el *code splitting*
> del bundle, y la 3.21 dos bugs de UX en "Agregar Candidato". El
> histórico de `positions-proceso-AGB` sigue en
> [`prompts-AGB-positions.md`](./prompts-AGB-positions.md), y el de
> `backend-AGB`/`frontend-AGB` en
> [`prompts-AGB-backend.md`](./prompts-AGB-backend.md) /
> [`prompts-AGB-frontend.md`](./prompts-AGB-frontend.md).

## 0. Resumen ejecutivo: el camino completo, de un vistazo

Esta sesión generó **13 ramas** a partir de `main`, en varias oleadas.
Esta sección existe para poder entender el conjunto sin tener que leer
las más de 2700 líneas de detalle de más abajo — cada punto enlaza a la
sección donde está el porqué completo.

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
                └── tests-AGB (97c58a3 + d5a4328)
                    │  = tests automáticos (backend y frontend) que
                    │    codifican las verificaciones hechas a mano
                    │  + traducción del selector de fichero nativo
                    │    ("Browse…"/"No file selected")
                    │
                    └── security-audit-AGB (8b31eb5)
                        │  = auditoría de ciberseguridad exhaustiva:
                        │    20 vulnerabilidades de npm audit → 0 en
                        │    backend, helmet + rate limiting, filtro de
                        │    subida de ficheros endurecido, límite de
                        │    entradas por candidato. La ausencia total
                        │    de autenticación queda documentada como el
                        │    hallazgo más severo, sin corregir.
                        │
                        └── react-router-v7-AGB (0ab68a0)
                            │  = react-router-dom v6 → v7 (cierra las 2
                            │    vulnerabilidades moderadas que quedaban
                            │    abiertas) + fix de un bug de
                            │    configuración de Jest encontrado de
                            │    camino (dist/ con tests compilados
                            │    duplicando ejecuciones)
                            │
                            └── api-auth-AGB (73731bf)
                                │  = autenticación JWT en todas las rutas
                                │    del backend (antes abiertas por
                                │    completo) + login/logout real en el
                                │    frontend — cierra el hallazgo más
                                │    severo de security-audit-AGB
                                │
                                └── code-splitting-AGB (947bbc3)
                                    │  = React.lazy() + Suspense por ruta:
                                    │    de 1 fichero JS (674KB) a 10, con
                                    │    -52% en la carga en frío de /login
                                    │
                                    └── candidate-form-ux-fixes-AGB  ← RAMA ACTUAL
                                         = 2 bugs de UX en "Agregar
                                           Candidato": el error de un
                                           campo no se actualizaba al
                                           corregirlo, y el teléfono no
                                           decía por qué era inválido
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
| 12 | "¿Puedes conseguir que el botón del selector de fichero se traduzca ('Browse...'/'No file selected')?" | *(misma rama, `tests-AGB`)* | 3.16 |
| 13 | "¿Realizas ahora una auditoría de Ciberseguridad exhaustiva para verificar que no tenemos problemas en este ámbito?" | `security-audit-AGB` | 3.17 |
| 14 | "¿La razón de no migrar react-router-dom v7 era el linter, o no había impedimento y eso era solo para TS7?" → "Sí, porfa, en una rama nueva" | `react-router-v7-AGB` | 3.18 |
| 15 | "Documéntalo todo bien, incluyendo los porqués de TS7 y react-router-dom v7, y vamos después, en otra rama nueva, a incluir la autenticación de las APIs" | *(actualización de esta sección 0)* | 0 (este resumen) |
| 16 | Aclaración de alcance (backend+frontend vs. solo backend; empleados ya sembrados vs. registro público) → "Backend + login en el frontend" + "Los Employee ya sembrados" | `api-auth-AGB` | 3.19 |
| 17 | "¿Cómo generaste esas credenciales que me dijiste... y dónde se almacenan?" → "¿Haces una recopilación de los secretos del sistema... en un fichero unificado, tipo secrets.md?" | `api-auth-AGB` (mismo commit `73731bf`) | 3.19.12 |
| 18 | "¿Qué es el estado `<Suspense>`?" → "¿Creas porfa una nueva rama y aplicas el code splitting, que quiero ver la diferencia del código y cómo afecta a la experiencia de usuario el resultado final?" | `code-splitting-AGB` | 3.20 |
| 19 | "Después de un error de entrada en 'Agregar Candidato' no me recarga los valores corregidos. Tampoco da información de porqué el tfno tiene formato inválido a pesar de haber introducido sólo 9 números. ¿Lo mejoras, porfa?" | `candidate-form-ux-fixes-AGB` | 3.21 |
| 20 | "Acabo de lograr añadir un candidato con éxito, pero opino que deberían haberse borrado los valores tras ello, pero se mantienen. ¿Coincides?" | *(misma rama)* | 3.22 |

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

**`tests-AGB`** (detalle en 3.15-3.16):
1. Backend: nuevos tests para `addCandidateController` (alta con éxito, con el caso del guión bajo, con varios campos acumulados, y error no relacionado con validación) y para `getCandidatesByPosition`/`getInterviewFlowByPosition` (id no numérico, posición inexistente) — huecos reales de cobertura, no cubiertos hasta ahora pese a haberse verificado a mano muchas veces con `curl`.
2. Bug de aislamiento entre tests encontrado al escribirlos: sin `jest.clearAllMocks()` en un `beforeEach`, el recuento de llamadas de un mock se acumulaba entre `it()` distintos, dando falsos negativos.
3. Frontend: primeros tests del proyecto (antes, cero). `i18n/validationMessages.test.js` (composición de mensajes, español/inglés, campos de array), `services/candidateService.test.js` (propagación de issues, el arreglo del doble prefijo, fallo de red sin `TypeError`) y `components/AddCandidateForm.test.jsx` (el flujo completo del guión bajo en el navegador, ahora automatizado).
4. `@testing-library/react`/`user-event`/`jest-dom`, heredados de CRA en versiones antiguas (`user-event@13`, sin `.setup()`), actualizados a las versiones actuales; movidos de `dependencies` a `devDependencies` (nunca debieron ir a producción).
5. `FileUploader.jsx`: "Browse…"/"No file selected" son *chrome* nativo del navegador para `<input type="file">`, no texto de React — imposible de traducir con i18n. Input oculto con `.visually-hidden` (mantiene el foco por teclado) + botón propio ya traducido.

**`security-audit-AGB`** (detalle en 3.17):
1. Metodología: cada hallazgo verificado con una PoC real (`curl` con `multipart/form-data` fabricado a mano) o leyendo el código fuente de la dependencia en `node_modules/`, nunca solo "a ojo".
2. **Hallazgo principal, sin corregir**: ningún endpoint exige autenticación ni autorización — cualquiera puede leer/escribir PII de candidatos con solo un id numérico secuencial. Documentado como decisión de arquitectura para el propietario del proyecto, no como bug.
3. Subida de CVs: el filtro de tipo de archivo solo miraba el `Content-Type` que envía el cliente — PoC confirmó que aceptaba y guardaba un HTML con `<script>` bajo extensión `.pdf`.
4. Path traversal en el nombre de fichero: no explotable hoy (protegido por una versión concreta de `busboy`, no documentada como su contrato), pero el propio código nunca saneaba `file.originalname` — añadido `path.basename()` explícito como defensa en profundidad.
5. Dependencias vulnerables alcanzables en producción: `express` (ReDoS/DoS/XSS transitivos) y `react-router-dom` (open redirect) — `npm audit fix` dentro del rango semver ya declarado, sin `--force`: backend 20→0 vulnerabilidades, frontend 3 altas→0.
6. `swagger-jsdoc`/`swagger-ui-express`, declaradas pero nunca importadas, eliminadas (arrastraban una dependencia vulnerable de `validator`).
7. Añadidos `helmet` (cabeceras de seguridad) y `express-rate-limit` (300 peticiones/15 min); límite de 20 entradas en `educations`/`workExperiences`.
8. Descartado tras comprobarlo, no solo asumido: inyección SQL (Prisma parametriza todo, sin `$queryRaw`) y XSS en frontend (sin `dangerouslySetInnerHTML`/`innerHTML`/`eval`).

**`react-router-v7-AGB`** (detalle en 3.18):
1. Aclaración previa: el impedimento de TS7 (peer dependency de `typescript-eslint`) y la decisión de no migrar `react-router-dom` a v7 el día anterior (para no mezclar un salto de versión mayor con el alcance de una auditoría de seguridad) eran dos cosas sin relación — verificado con `npm view react-router-dom@7.18.4 peerDependencies` antes de responder: sin impedimento técnico real.
2. `react-router-dom` 6.23.1 → 7.18.4. Cero cambios de código: la app solo usa el subconjunto declarativo de la API (`BrowserRouter`/`Routes`/`Route`/`Link`/`useParams`), idéntico entre ambas versiones.
3. `npm audit` → 0 vulnerabilidades (cierra las 2 moderadas que quedaban de `security-audit-AGB`).
4. Hallazgo incidental: `npm run build` del backend compilaba también los `*.test.ts` a `dist/`, y Jest los recogía duplicados junto a los `src/*.test.ts` originales — 14 de 42 tests fallaban en falso tras cualquier build previo a `npx jest`. Corregido excluyendo los tests del `include` de `tsconfig.json`.

**`api-auth-AGB`** (detalle en 3.19):
1. Alcance acordado antes de escribir código: JWT + login real en el frontend (no solo backend), contra los `Employee` ya sembrados (sin registro público).
2. `Employee` gana un campo `password` (hash de bcrypt, nullable) vía migración de Prisma; `authService.ts` (backend) hace login con un único mensaje de error genérico para los cuatro motivos de rechazo posibles (evita enumerar correos dados de alta); `requireAuth` protege `/candidates`, `/upload` y `/position`; límite de intentos propio (10/15 min) solo para `/auth/login`.
3. Hallazgos incidentales: no existía ningún `.env` en el repo (había que crearlo) y, al hacerlo, se comprobó que `.env.example` usaba una interpolación de variables (`${DB_USER}`) que el `dotenv` del proyecto no soporta — corregido con valores ya resueltos; varios servidores de backend zombis de sesiones anteriores seguían corriendo (matados, uno solo arrancado limpio).
4. Frontend: interceptor global de axios (no una instancia `axios.create()` nueva, para no romper los tests existentes que mockean `axios` directamente) + `AuthContext`/`Login`/`RequireAuth`/`UserMenu`, con el mismo patrón de accesibilidad ya establecido en `AddCandidateForm`.
5. Hallazgo al testear: auto-mockear `authService.ts` entero también sustituye la clase `AuthError` por una versión simulada sin `.message` real — corregido acotando el mock a solo la función `login`.
6. +15 tests backend (21→36), +10 tests frontend (19→29); verificado de extremo a extremo en el navegador (login correcto/incorrecto, ambos empleados sembrados, cierre de sesión, redirección tras acceso directo a una ruta protegida sin sesión) y con `curl` para `/upload` (sin equivalente de UI, el navegador no puede pilotar el selector nativo de archivos).

**`code-splitting-AGB`** (detalle en 3.20):
1. Las 4 rutas protegidas de `App.jsx` pasan a `React.lazy()`, envueltas en un único `<Suspense>`; `Login` se queda con `import` estático a propósito (es lo primero que ve cualquiera sin sesión, y un parpadeo de carga ahí sería el peor sitio para ahorrar KB).
2. Medido, no solo descrito: de 1 fichero JS (674.25 kB) a 10, con la carga en frío de `/login` en 323.76 kB (4 ficheros) — un 52% menos — y el chunk más pesado de toda la app (`AddCandidateForm`, 345 kB, por `react-datepicker`) sin descargarse nunca si no se visita esa pantalla.
3. Verificado con tráfico de red real (no con los nombres de fichero): `vite preview` en el puerto 3000 (no el 4173 por defecto, para que el CORS del backend lo aceptase), confirmando con `read_network_requests` que cada chunk se pide exactamente la primera vez que su ruta se visita.
4. Hallazgo incidental durante la demo en directo: un JWT de dos días caducó a mitad de la verificación, y el interceptor de `apiClient.js` (3.19.8) cerró la sesión y redirigió a `/login` solo, exactamente como estaba diseñado — la primera vez que ese camino se observa en acción sin forzarlo.

**`candidate-form-ux-fixes-AGB`** (detalle en 3.21-3.22, rama actual):
1. Reproducido en el navegador antes de tocar nada; un primer intento salió engañoso por una condición de carrera del propio tooling (clic sobre una captura tomada mientras `/add-candidate` aún mostraba el `Suspense` de "Cargando página…") combinada con una entrada de red residual de una pestaña de larga duración — investigado hasta confirmar que no era un bug de la app, no asumido.
2. Bug A: `issues` (los errores por campo) solo se actualizaba en `handleSubmit`, nunca al cambiar un campo — corregir un valor no limpiaba su error hasta el siguiente envío. Arreglado con `clearFieldIssue(field)`, sin revalidar en el cliente (esa lógica se queda solo en `validator.ts`).
3. Bug B: un teléfono de 9 dígitos con el prefijo equivocado daba el código genérico `invalidFormat` ("no tiene un formato válido"), sin explicar la regla real. Nuevo código específico `invalidPhoneFormat`, con un mensaje que sí la explica, en los dos idiomas.
4. +3 tests backend (36→39), +3 tests frontend (29→32) — incluido uno que codifica exactamente el bug A reportado (corregir sin reenviar hace desaparecer el error). Verificado también en caliente contra el backend de desarrollo real (`curl`) y en el navegador de principio a fin.
5. Bug C, reportado por el usuario probando por su cuenta: el formulario no se vaciaba tras un alta con éxito. Dos causas: `candidate` nunca se reseteaba, y los 5 campos nunca habían tenido `value=` (no controlados de verdad, así que resetear el estado no habría bastado). Arreglado con `value={candidate.X}` en los 5 campos, reseteo a `EMPTY_CANDIDATE` tras el éxito, y una `key` en `FileUploader` para que también olvide el fichero ya subido. +1 test frontend (32→33).

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
  (3.7), los `throw new Error()` sin `cause` que encontró ESLint recién
  instalado (3.14.4), y el `dist/` de Jest duplicando tests tras un build
  (3.18.4) — todos se arreglaron in situ en vez de ignorarlos o abrirlos
  como tareas aparte.
- **Una decisión de arquitectura con varias formas razonables de
  implementarse se confirma antes de escribir código, no se asume.**
  "Añadir autenticación" podía ser solo backend (verificable con `curl`,
  dejando el frontend roto) o backend+frontend; podía admitir registro
  público o solo los empleados ya sembrados. Se preguntó explícitamente
  por los dos ejes (3.19.1) antes de tocar una sola línea — evita
  construir 2-3 veces más de lo necesario, o en la dirección equivocada,
  por dar algo por sentado en una decisión que no era técnica sino de
  producto.
- **Un bloqueo técnico se verifica por librería concreta, nunca se
  generaliza a otra por el número de versión.** TypeScript 7 sí bloqueaba
  la migración de herramientas en `vite-migration-AGB` (peer dependency
  real de `typescript-eslint`, 3.14.1); eso no significaba que
  "cualquier versión 7" fuera a bloquear algo — `react-router-dom` v7 no
  tenía ningún impedimento equivalente (3.18.1), y solo se dejó fuera de
  `security-audit-AGB` por alcance, no por compatibilidad. La respuesta
  se verificó con `npm view <paquete> peerDependencies` en ambos casos
  antes de decidir, no por analogía entre los dos "v7".

### 0.5 Dónde estamos ahora (estado de `candidate-form-ux-fixes-AGB`)

**Verificado y funcionando**, de extremo a extremo, en el navegador, por
línea de comandos y con tests automáticos:
- Backend: Express 4.22.3 + TypeScript + Prisma, con validación
  estructurada (incluido un límite de 20 entradas por
  `educations`/`workExperiences`, y un código específico
  `invalidPhoneFormat` que explica la regla del teléfono en vez del
  genérico `invalidFormat`), endpoint de listado de posiciones, `isNaN`
  en todos los `:id`, `helmet` + `express-rate-limit` (general y uno más
  estricto solo para `/auth/login`), subida de CVs con el nombre de
  fichero saneado, y **autenticación JWT exigida en `/candidates`,
  `/upload` y `/position`** contra los `Employee` ya sembrados (email +
  contraseña con hash de bcrypt). 8 suites / **39 tests** en verde
  (`npx jest`), `tsc --noEmit` limpio, **`npm audit` → 0
  vulnerabilidades**.
- Frontend: React + TypeScript sobre **Vite**, con **react-i18next**
  (español/inglés, detección automática + selector, persistido) en toda
  la interfaz — incluido ya el selector de fichero nativo del CV
  ("Browse…"/"No file selected", chrome del navegador sustituido por un
  botón propio) —, formulario de alta de candidato con mensajes de
  validación específicos por campo y accesibles (`aria-invalid`,
  `aria-describedby`, `role="alert"`) que además **se actualizan al
  instante al corregir un campo**, sin esperar a un nuevo envío, y **se
  vacía por completo tras un alta con éxito** (incluido el selector de
  CV, que se remonta para olvidar el fichero ya subido), listado de
  posiciones con datos reales de la API, el tablero "Ver proceso"
  agrupando candidatos por fase de entrevista, **`react-router-dom` v7**,
  un **flujo de login/logout real** (`/login` pública, el resto de rutas
  protegidas con `RequireAuth`, token adjunto automáticamente a toda
  petición vía un interceptor de axios), y **las 4 rutas protegidas
  cargadas bajo demanda** (`React.lazy` + `Suspense`): el build pasa de 1
  fichero JS (674.25 kB) a 10, con un 52% menos de JS en la carga en frío
  de `/login` (sección 3.20). 6 suites / **33 tests** en verde (`npm
  test`, Vitest), `tsc -b`/`eslint .`/`npm run build` limpios,
  **`npm audit` → 0 vulnerabilidades**.
- Nada de esto ha tocado la base de datos de forma permanente más allá de
  lo esperado: los candidatos de prueba creados durante las
  verificaciones manuales (y los ficheros subidos como PoC de la
  auditoría de seguridad y de esta rama) se borraron después de cada
  comprobación; la única escritura permanente es la contraseña de
  desarrollo asignada a los dos `Employee` ya sembrados (sección 3.19.5,
  necesaria para que el login sea probable); los tests automáticos no
  tocan la base de datos real en ningún caso (todo mockeado).

**Deuda conocida, documentada pero no resuelta** (todas mencionadas donde
se detectaron, ninguna oculta):
- El botón **"Editar"** de una posición está deshabilitado a propósito
  (`positions.editNotImplemented`) — nunca se pidió implementarlo.
- La cobertura de tests se centra en **validación** y, desde esta rama,
  **autenticación** (que es lo que se pidió en cada caso). Quedan sin
  test automático el dashboard, el listado/filtros de posiciones (mock de
  UI sin lógica que probar todavía) y el tablero "Ver proceso" — no se ha
  fabricado cobertura de esas partes por iniciativa propia.
- Los mensajes de error **no estructurados** (caída de red, backend
  caído, mensajes ya hechos que vienen directos de un `Error` de
  servicio) siguen sin traducirse — solo los errores de validación tienen
  el tratamiento de códigos que permite traducirlos (ver 3.11). Algunos de
  esos mensajes sin traducir devuelven `error.message` tal cual al
  cliente; se revisó caso por caso en 3.17.6 y se dejó así a propósito
  donde es necesario para la UX (p. ej. email duplicado), documentando el
  riesgo de fuga de información donde no lo es.
- No hay comprobación de contenido real (*magic bytes*) en los CVs
  subidos, solo de extensión/`Content-Type` (3.17.3.A) — requeriría una
  dependencia nueva no evaluada todavía.
- **Sin registro de empleados ni gestión de contraseñas** (cambiar la
  propia, recuperar una olvidada, expirar tokens antes de las 8h de
  vigencia) — a propósito, según el alcance acordado en 3.19.1: los
  `Employee` se dan de alta a mano, no hay flujo de autoservicio.
- El JWT no se puede revocar antes de que caduque (sin lista de
  revocación ni sesiones del lado del servidor) — limitación conocida de
  cualquier JWT sin estado; con una vigencia de 8h y sin la opción de
  invalidar tokens robados al momento, es una cesión consciente de
  seguridad a cambio de simplicidad, razonable para el alcance actual del
  proyecto pero a tener en cuenta si se maneja información más sensible.
- La contraseña de la base de datos de desarrollo, aunque ya no se lee
  del `schema.prisma` (arreglado en `backend-AGB`), sigue existiendo en
  el **historial** de git del commit inicial — no se ha purgado el
  historial por ser una operación destructiva que no se ha pedido.
- El *code splitting* es por ruta, no dentro de cada pantalla (p. ej.
  `react-datepicker` sigue cargando entero junto con el resto de
  `AddCandidateForm`, no de forma perezosa al pulsar "Añadir Educación")
  — a propósito, ver 3.20.5: con 5 pantallas, dividir por ruta ya cubre
  la mayor parte de la ganancia posible.

**Nada se ha subido a `origin`** en ningún momento de esta sesión — las
13 ramas son enteramente locales. Si se quiere consolidar, el camino
natural sería fusionar `candidate-form-ux-fixes-AGB` sobre `main` cuando
el usuario lo decida explícitamente.

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

## 3.16 `FileUploader`: traducir "Browse…" / "No file selected"

Prompt del usuario: *"Un detalle, ¿puedes conseguir que en la pantalla
add-candidate el botón de apertura del navegador de archivos se traduzca
'Browse...' y 'No file selected' al español cuando estamos en este
idioma?"*

### 3.16.1 Por qué no es un problema de i18n

Todo el resto de la aplicación ya estaba traducido desde
`i18n-react-i18next-AGB`. Este texto concreto es distinto: **"Browse…" y
"No file selected" no los pinta React**, los pinta el propio navegador
como parte del *chrome* nativo del elemento `<input type="file">` — cada
navegador los renderiza en el idioma de su configuración (sistema
operativo/navegador), no en el de la página, y no son accesibles ni desde
CSS (`content`, pseudo-elementos) ni desde JS (no existe ningún atributo
ni prop que los sobrescriba). Por eso ninguna clave de `es.json`/`en.json`
los estaba cubriendo: no hay clave posible que un `<input type="file">`
nativo vaya a leer.

### 3.16.2 El arreglo: ocultar el input, controlarlo con un botón propio

Patrón estándar (usado por Bootstrap y la mayoría de librerías de UI)
en [`FileUploader.jsx`](frontend/src/components/FileUploader.jsx):

1. El `<input type="file">` se mantiene en el DOM y en el orden de
   tabulación (accesible por teclado y lectores de pantalla), pero se
   oculta visualmente con la clase `visually-hidden` de Bootstrap —
   **no** `display: none`, que lo sacaría del árbol de accesibilidad y
   rompería la navegación por teclado.
2. Se le añade una `ref` (`inputRef`).
3. Un botón propio, ya traducido (`t('fileUploader.browse')`), dispara
   `inputRef.current?.click()` — el clic sintético sobre el input oculto
   abre el diálogo nativo de selección de archivo exactamente igual que
   si se hubiera clicado el input original.
4. El texto de estado ("Ningún archivo seleccionado" / nombre del
   archivo elegido) ya no lo pinta el navegador: se pinta con un `<p>`
   propio controlado por el estado `fileName`, así que se traduce como
   cualquier otro texto de la aplicación.

Claves nuevas en
[`es.json`](frontend/src/i18n/locales/es.json)/[`en.json`](frontend/src/i18n/locales/en.json)
(dentro de `fileUploader`): `browse` ("Seleccionar archivo" / "Browse…")
y `noFileSelected` ("Ningún archivo seleccionado" / "No file selected").
Las claves `ariaLabel`, `selectedFile`, `upload` y `success` ya existían.

### 3.16.3 Hallazgo: falsos positivos en consola por caché de dependencias de Vite

Al probar el botón nuevo en el navegador, la consola mostraba errores
("Invalid hook call", "Cannot read properties of null (reading
'useContext')") señalando a `LanguageSwitcher.jsx` y
`RecruiterDashboard.jsx` — componentes que este cambio no toca. La
sospecha inicial (copias duplicadas de React) se descartó con `npm ls
react react-dom`: una sola copia de `react@18.3.1` en todo el árbol de
dependencias, todo `deduped`.

La causa real: la pestaña del navegador llevaba horas abierta durante la
sesión, y en ese tiempo `npm install` se había ejecutado varias veces
(subidas de versión de `@testing-library/*` en la sección 3.15). Cada
`npm install` invalida la caché de pre-bundling de Vite
(`node_modules/.vite`), y el registro de red de la pestaña mostraba **dos
grupos distintos de hashes** `?v=...` para `react.js`/`react-dom_client.js`
en la misma cadena de peticiones — restos de la pestaña sirviendo módulos
de dos generaciones distintas de esa caché a la vez. Se confirmó
cerrando la pestaña por completo y abriendo una nueva contra el mismo
servidor (`preview_stop` no fue necesario; bastó `tabs_close` +
`preview_start` reutilizando el proceso): consola limpia, sin ningún
error, en español y en inglés. **No era un bug del código — era estado
obsoleto de una pestaña de depuración de larga duración**, la misma
categoría de falso positivo que ya había aparecido en el prompt 5 de la
sección 1 (Firefox con hot-reloads acumulados).

## 9. Verificación del arreglo de `FileUploader` (sección 3.16)

```
Visual (navegador, pestaña nueva)
  Español → "Seleccionar archivo" / "Subir Archivo" /
            "Ningún archivo seleccionado"                        OK
  English → "Browse…" / "Upload File" / "No file selected"       OK
  Consola → sin errores en ninguno de los dos idiomas             OK
  DOM     → input oculto: display:block, visibility:visible,
            1px×1px, tabIndex:0 (patrón .visually-hidden
            correcto, no display:none)                            OK

Frontend (npm test -- --run)  → 3 suites, 18 tests, verde (sin cambios:
                                  no se ha tocado ningún test)
                                 npx tsc -b       → sin errores
                                 npx eslint .     → sin errores
                                 npm run build    → 2773 módulos, verde
Backend  (npx jest)            → 5 suites, 19 tests, verde (no afectado,
                                  cambio es exclusivamente de frontend)
```

## 3.17 Auditoría de ciberseguridad exhaustiva (`security-audit-AGB`)

Prompt del usuario: *"¿Realizas ahora una auditoría de Ciberseguridad
exhaustiva para verificar que no tenemos problemas en este ámbito?"*

Rama nueva, creada desde `tests-AGB` (la rama más completa hasta ahora:
incluye el validador estructurado, i18n con react-i18next, la migración a
Vite y los tests automáticos).

### 3.17.1 Metodología

No se ha auditado "a ojo": cada hallazgo de esta sección está verificado
de una de estas dos formas, indicada explícitamente en cada uno:

1. **Con una prueba de concepto real** contra el backend arrancado
   (`curl` con peticiones `multipart/form-data` fabricadas a mano), en el
   mismo estilo que el resto de la sesión ha usado para verificar
   arreglos: no basta con leer el código y sospechar, hay que
   reproducirlo.
2. **Leyendo el código fuente de la dependencia** en
   `node_modules/` cuando la pregunta es "¿esta librería en concreto hace
   lo que yo creo que hace?" (p. ej. `multer`/`busboy`), en vez de asumir
   el comportamiento por el nombre del paquete.

Alcance cubierto: inyección (SQL/NoSQL), control de acceso, subida de
ficheros, cabeceras HTTP, gestión de dependencias (`npm audit` en ambos
paquetes), XSS en el frontend, gestión de secretos/`.env`, CORS, y manejo
de errores (fuga de información).

### 3.17.2 Hallazgo principal: no existe autenticación ni autorización

**Severidad: crítica. No corregido — es una decisión de producto, no un
bug.**

Ningún endpoint del backend (`POST /candidates`, `GET /candidates/:id`,
`PUT /candidates/:id`, `POST /upload`, `GET /position`,
`GET /position/:id/candidates`, `GET /position/:id/interviewflow`) exige
identidad ni comprueba permisos. Cualquiera que alcance el puerto 3010
puede leer y escribir datos personales de candidatos (nombre, email,
teléfono, dirección, ruta del CV) y cambiar la fase de entrevista de
cualquier candidatura, sin más que conocer un `id` numérico secuencial
(no hay que adivinar nada: `GET /candidates/1`, `/2`, `/3`... enumera
candidatos completos).

Esto no es un fallo puntual corregible con un parche: no hay ningún
concepto de usuario, sesión, rol o permiso en el código (el campo `role`
que existe en `prisma/schema.prisma` pertenece al modelo `Employee` y no
se usa en ninguna ruta ni middleware para autorizar nada). Añadirlo es un
cambio de arquitectura — quién puede hacer qué — que le corresponde
decidir al propietario del proyecto, no algo que este audit deba imponer
sin más. Se documenta aquí con el detalle necesario para que la decisión
se tome con la información completa; ver sección 3.17.6 para el resto de
opciones que sí se han quedado fuera por el mismo motivo.

### 3.17.3 Hallazgos confirmados con PoC, corregidos en esta rama

**A. Subida de ficheros: el tipo de archivo solo se comprobaba por un
dato que envía quien sube el fichero — severidad alta.**

`fileUploadService.ts` filtraba por `file.mimetype`, que es literalmente
la cabecera `Content-Type` de la parte del `multipart/form-data` —  la
pone quien hace la petición, no el servidor. PoC:

```bash
printf '<html><body><script>alert(document.domain)</script></body></html>' > evil.html
curl -X POST http://localhost:3010/upload \
  -F "file=@evil.html;filename=evil.pdf;type=application/pdf"
# → 200 OK, {"filePath":".../uploads/<ts>-evil.pdf","fileType":"application/pdf"}
```

El servidor aceptó y guardó en disco un fichero HTML con un `<script>`
dentro, bajo extensión `.pdf` y reportando `fileType: application/pdf` —
sin inspeccionar ni un solo byte del contenido real. Hoy no hay ninguna
ruta que sirva `uploads/` de vuelta al navegador (se comprobó con `grep
-rn "uploads"` sobre todo el repo: solo aparece en
`fileUploadService.ts`, que lo escribe, no lo sirve), así que no hay XSS
almacenado *hoy*; pero es el tipo de comprobación que falla en silencio
el día que alguien añada esa ruta, o que un antivirus/gestor de
documentos interno abra el fichero confiando en la extensión.
**No se ha añadido una comprobación de contenido (magic bytes) en esta
rama** — no había ninguna librería de ese tipo ya en el proyecto y
añadir una nueva dependencia solo para esto se ha dejado como
recomendación (sección 3.17.6) en vez de una decisión unilateral de qué
librería usar.

**B. Path traversal en el nombre de fichero: no explotable *hoy*, pero
por una libería de terceros, no por el código propio — corregido como
defensa en profundidad.**

`filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)`
usa `file.originalname` (controlado por quien sube el archivo) sin
sanear, y `multer`'s `DiskStorage` hace literalmente
`path.join(destination, filename)`
(`node_modules/multer/storage/disk.js:37`) — sin comprobar que el
resultado siga dentro de `destination`. Es el patrón exacto de CWE-22.

Se probó con dos PoC:

```bash
# 1) el propio "../" queda pegado al timestamp (10 dígitos + guión), así
#    que no es un segmento ".." puro y no escapa:
curl ... -F "file=@x.pdf;filename=../poc.pdf;type=application/pdf"
# → guardado como uploads/<ts>-..poc.pdf (sin escapar)

# 2) con un segmento intermedio para que el ".." sí quede puro:
curl ... -F "file=@x.pdf;filename=x/../../poc.pdf;type=application/pdf"
# → guardado como uploads/<ts>-poc.pdf — el nombre no escapó
```

En ambos casos el fichero se quedó dentro de `uploads/`. Inspeccionando
por qué (`node_modules/busboy/lib/utils.js`), la versión instalada de
`busboy` (1.6.0, dependencia transitiva de `multer`) ya normaliza el
nombre de fichero del `multipart/form-data` antes de que la aplicación
lo vea, y descarta los componentes de ruta. **Es decir: hoy no es
explotable, pero por una protección de una dependencia de tercer nivel
que el código de la aplicación desconoce por completo** — si algún día
se cambia de librería de subida de ficheros, o esa versión de `busboy`
deja de sanear (no está documentado como parte de su contrato público),
el `path.join` de `multer` volvería a ser alcanzable con un
`file.originalname` malicioso. Se ha añadido `path.basename()` explícito
en [`fileUploadService.ts`](backend/src/application/services/fileUploadService.ts)
para que la protección no dependa de un comportamiento no documentado de
una dependencia transitiva:

```ts
const safeOriginalName = path.basename(file.originalname);
cb(null, uniqueSuffix + '-' + safeOriginalName);
```

Verificado de nuevo tras el cambio con las mismas dos PoC: el
comportamiento es idéntico (el fichero se queda en `uploads/`), y una
subida normal (`filename=cv.pdf`) se sigue guardando y devolviendo
igual que antes — no hay regresión funcional.

**C. Dependencias con vulnerabilidades conocidas, alcanzables en
producción — severidad alta (backend) / moderada (frontend).**

`npm audit` antes de esta rama:

| Paquete | Dónde entra | Severidad | Alcanzable en producción |
|---|---|---|---|
| `path-to-regexp <=0.1.12` | `express@4.19.2` (dependencia directa) | alta (ReDoS) | Sí — enrutamiento de todas las peticiones |
| `qs <=6.15.3` | `express@4.19.2` → `body-parser` | moderada (DoS) | Sí — parseo de query string/body |
| `send <0.19.0` / `serve-static` | `express@4.19.2` | alta (XSS por plantilla) | Sí |
| `validator <=13.15.20` | `swagger-jsdoc` (nunca importado en el código, ver más abajo) | alta | No — dependencia muerta |
| `micromatch`/`minimatch`/`picomatch` | `jest`/`eslint` (herramientas de desarrollo) | alta/moderada | No — solo en `devDependencies`, nunca se despliegan |
| `@remix-run/router <=1.23.2` (frontend) | `react-router-dom@6.23.1` (dependencia directa, va al bundle del navegador) | alta (XSS por *open redirect*) | Sí |

Se trazó cada paquete con `npm ls <paquete>` (no asumido) para separar lo
que de verdad corre en el servidor/navegador de lo que solo vive en
herramientas de desarrollo — la tabla de arriba es el resultado de eso,
no de leer directamente la salida de `npm audit`.

Corregido con `npm audit fix` (sin `--force`, todo dentro del rango
`^semver` ya declarado en `package.json`, cero cambios de API):

```
backend  : npm audit fix → 20 vulnerabilidades → 0
           express 4.19.2 → 4.22.3 (arrastra path-to-regexp 0.1.13,
           qs 6.16.0, send 0.19.2 — todos ya fuera de rango vulnerable)
frontend : npm audit fix → 3 altas → 0 altas (2 moderadas nuevas, ver 3.17.6)
           react-router-dom 6.23.1 → 6.30.6
```

**D. Dependencias declaradas y nunca usadas — código muerto que
además arrastraba una dependencia vulnerable.**

`swagger-jsdoc` y `swagger-ui-express` estaban en `dependencies` del
backend desde el primer commit, pero no se importan en ningún fichero de
`src/` (comprobado con `grep -rn "swagger" .` sobre todo el repo, aparte
de `package.json`) — no hay ninguna ruta de documentación Swagger
montada en `index.ts`. Eliminadas junto con sus `@types/*`:

```bash
npm uninstall swagger-jsdoc swagger-ui-express @types/swagger-jsdoc @types/swagger-ui-express
```

Esto también elimina la única vía por la que la vulnerabilidad de
`validator` (fila de la tabla de arriba) llegaba al árbol de
dependencias.

**E. Sin cabeceras de seguridad ni límite de peticiones — severidad
moderada (superficie de ataque general, agravada por el hallazgo
3.17.2: no hay autenticación que frene un abuso automatizado).**

Añadido en [`index.ts`](backend/src/index.ts):

```ts
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));
```

Verificado en caliente contra el servidor de desarrollo ya arrancado
(`ts-node-dev --respawn` lo recargó solo al guardar el fichero):

```
curl -D - http://localhost:3010/
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
RateLimit-Limit: 300
RateLimit-Remaining: 298
RateLimit-Reset: 900
```

**F. Sin límite en el tamaño de los arrays `educations`/`workExperiences`
— severidad baja, agrava el impacto de E si alguien lo satura.**

`validateCandidateData` recorría `data.educations`/`data.workExperiences`
sin límite de longitud; `express.json()` limita el *tamaño en bytes* del
body (100kb por defecto) pero no el número de elementos de un array
dentro de él, y no había ningún otro punto del sistema que lo acotara.
Añadido un límite de 20 entradas en
[`validator.ts`](backend/src/application/validator.ts), con un código de
error nuevo (`tooManyEntries`) en vez de reutilizar `tooLong` (que dice
"caracteres", no "entradas" — habría sido un mensaje traducido pero
incorrecto):

```ts
const MAX_ARRAY_ENTRIES = 20;
if (data.educations.length > MAX_ARRAY_ENTRIES) {
    issues.push({ field: 'educations', code: 'tooManyEntries', params: { max: MAX_ARRAY_ENTRIES } });
}
```

Traducido en ambos idiomas
([`es.json`](frontend/src/i18n/locales/es.json)/[`en.json`](frontend/src/i18n/locales/en.json)):
*"Educación no puede tener más de 20 entradas."* / *"Education cannot
have more than 20 entries."* — reutilizando la etiqueta de sección ya
traducida (`validation.sections.educations`) en vez de duplicarla, dado
que este `issue.field` llega sin índice (`'educations'`, no
`'educations[3]...'`), un caso que
[`validationMessages.js`](frontend/src/i18n/validationMessages.js) no
contemplaba todavía.

### 3.17.4 Descartado tras comprobarlo: inyección SQL

Se revisó cómo construye sus consultas cada modelo de dominio
(`Candidate.ts`, `Education.ts`, `WorkExperience.ts`, `Application.ts`):
todas usan el *query builder* de Prisma (`prisma.candidate.create({...})`,
`.update({...})`, `.findUnique({...})`) — no hay una sola llamada a
`$queryRaw`/`$executeRaw`/`$queryRawUnsafe` en todo el backend
(`grep -rn "queryRaw\|executeRaw" src/` → sin resultados). Prisma
parametriza estas llamadas por construcción; no hay superficie de
inyección SQL en este código tal y como está escrito.

### 3.17.5 Descartado tras comprobarlo: XSS en el frontend

`grep -rn "dangerouslySetInnerHTML\|innerHTML\|eval(\|new Function("` sobre
todo `frontend/src` no encontró ningún resultado: React escapa por
defecto todo lo que se renderiza como texto, y el código no usa ninguno
de los escapes habituales a ese comportamiento. El único uso de
`localStorage` es el de `i18next-browser-languagedetector` para
recordar el idioma elegido (`es`/`en`) — no hay ningún dato personal ni
sensible ahí.

### 3.17.6 Dejado fuera, a propósito, para que lo decida el propietario del proyecto

- **Autenticación/autorización** (3.17.2): el cambio de arquitectura más
  grande posible en esta aplicación. No se ha implementado nada aquí.
- **`react-router-dom` a la v7**: quedan 2 vulnerabilidades moderadas
  (`GHSA-wrjc-x8rr-h8h6`, *open redirect* vía barra invertida en
  `<Link>`/`useNavigate`; `GHSA-337j-9hxr-rhxg`, solo aplica a
  *SSR hydration*, que esta app no usa — es una SPA servida por Vite,
  sin renderizado en servidor). La única corrección disponible es
  `react-router-dom@7.18.4`, un salto de versión mayor con cambios de
  API. Se revisó el uso real de navegación en el código
  (`grep -rn "useNavigate\|<Link\|navigate("`): las dos únicas
  apariciones (`RecruiterDashboard.jsx`) usan destinos fijos
  (`to="/add-candidate"`, `to="/positions"`), nunca un valor que venga
  del usuario o de la URL — así que el *open redirect* no es explotable
  con el código actual, aunque la dependencia en sí siga vulnerable.
  Migrar a v7 es una decisión deliberada, del mismo tipo que la
  migración de CRA a Vite documentada en la sección 3.14: se ha dejado
  fuera de esta rama para no mezclar un cambio de API mayor con una
  auditoría de seguridad.
- **Comprobación de contenido real (magic bytes) en la subida de CVs**
  (hallazgo A): requeriría añadir una dependencia nueva no evaluada
  todavía (p. ej. `file-type`).
- **Escaneo de malware/macros en PDF/DOCX subidos**: fuera del alcance
  de lo que resuelve código de aplicación; requeriría un servicio
  externo.
- **Mensajes de error que devuelven `error.message` tal cual** (p. ej.
  `positionController.ts`, ramas `catch` de `addCandidateController`):
  en algunos casos es intencionado y necesario para la UX (p. ej. *"The
  email already exists in the database"*, cubierto explícitamente por
  `candidateController.test.ts:79-89` — cambiarlo a un mensaje genérico
  rompería ese test y una funcionalidad real), y en otros casos
  (excepciones no controladas de Prisma/red) sí podría filtrar detalle
  interno. Distinguir un caso de otro con fiabilidad requiere introducir
  una jerarquía de errores "seguros de mostrar" vs. "internos" en toda la
  capa de controladores — un refactor más amplio que no se ha hecho aquí
  para no arriesgar una regresión de comportamiento a cambio de una
  fuga de información de severidad baja/moderada, no confirmada con
  ningún caso real hoy.

## 11. Verificación de la auditoría de ciberseguridad (sección 3.17)

```
Backend
  npm audit                    → 20 vulnerabilidades → 0
  npx tsc --noEmit              → sin errores
  npx tsc (build)                → sin errores
  npx jest                      → 5 suites, 21 tests (antes 19; +2 nuevos), verde
  Cabeceras (curl -D -)         → Strict-Transport-Security, X-Content-Type-Options,
                                   X-Frame-Options, RateLimit-* presentes
  PoC path traversal (repetida  → fichero se queda dentro de uploads/,
    tras el fix)                  igual que antes del fix (ya lo bloqueaba busboy;
                                   ahora también lo bloquea el propio código)
  Subida normal (regresión)     → sigue devolviendo 200 y la misma forma de
                                   respuesta ({filePath, fileType})

Frontend
  npm audit                    → 3 altas → 0 altas (2 moderadas no explotables
                                   con el código actual, ver 3.17.6)
  npx tsc -b                    → sin errores
  npx eslint .                  → sin errores
  npm test -- --run             → 3 suites, 19 tests (antes 18; +1 nuevo), verde
  npm run build                 → 2773 módulos, verde

Descartado sin cambios         → inyección SQL (Prisma parametriza todo),
                                   XSS en frontend (sin dangerouslySetInnerHTML/
                                   innerHTML/eval, sin datos sensibles en localStorage)
```

## 3.18 Migración de `react-router-dom` v6 → v7 (`react-router-v7-AGB`)

Prompt del usuario: primero una pregunta de aclaración — *"La razón de no
migrar a react-router-dom v7 era que el linter no la soportaba, ¿no? ¿O
no hay impedimento en el stack tecnológico aquí, y eso era sólo para
TS7?"* — y, tras la respuesta, *"Sí, porfa, en una rama nueva."*

### 3.18.1 Aclaración previa: dos decisiones distintas, sin relación entre sí

El usuario recordaba correctamente que hubo un impedimento técnico real
con una versión "7", pero lo atribuía a la librería equivocada:

- **TypeScript 7** (`vite-migration-AGB`, sección 3.14): impedimento
  **real**. `typescript@latest` resolvía a la 7.0.2 (el compilador
  nuevo, en Go), y `typescript-eslint@8.70.0` exige
  `typescript ">=4.8.4 <6.1.0"` como *peer dependency* — TS 7.0.2 queda
  fuera de ese rango y el linter dejaba de funcionar directamente. Por
  eso se aterrizó en TypeScript 6.0.3.
- **react-router-dom v7** (`security-audit-AGB`, sección 3.17.6): **sin
  impedimento técnico**. El motivo de no migrarlo el día anterior fue
  no mezclar un salto de versión mayor (con cambios de API) dentro del
  alcance de una auditoría de seguridad — el mismo criterio que separó
  la migración de CRA a Vite en su propia rama —, no una incompatibilidad
  real. Se comprobó explícitamente antes de responder:
  `npm view react-router-dom@7.18.4 peerDependencies` → solo exige
  `react >=18`/`react-dom >=18` (el proyecto ya usa React 18.3.1), y
  `npm view eslint-plugin-react-hooks@latest peerDependencies` → acepta
  hasta `eslint ^10.0.0` (el proyecto ya usa ESLint 10) sin conflicto.

### 3.18.2 Por qué el riesgo de la migración era bajo, verificado antes de tocar nada

Antes de instalar nada se revisó qué API de `react-router-dom` usa
realmente la aplicación (`grep -rln "react-router" src`): solo 4
ficheros, y solo estas importaciones —
[`App.jsx`](frontend/src/App.jsx): `BrowserRouter`, `Routes`, `Route`;
[`RecruiterDashboard.jsx`](frontend/src/components/RecruiterDashboard.jsx)/[`Positions.tsx`](frontend/src/components/Positions.tsx):
`Link`; [`PositionProcess.tsx`](frontend/src/components/PositionProcess.tsx):
`Link`, `useParams`. Es el modo "declarativo" más simple de la librería
(sin *data routers*, sin `loader`/`action`/`fetcher`, sin rutas con
comodín `*`) — exactamente el subconjunto de la API que v7 mantiene
sin cambios respecto a v6 para no romper a quien no usa las
funcionalidades nuevas. Node.js (`node --version` → v26.8.2) también
supera de sobra el mínimo de v7 (`engines.node: >=20.0.0`).

### 3.18.3 La migración en sí

```bash
npm install react-router-dom@^7.18.4
```

`package.json`: `"react-router-dom": "^6.23.1"` → `"^7.18.4"`. **Cero
cambios de código** — ni en `App.jsx` ni en ningún componente que use
`Link`/`useParams`: la API que usa la aplicación es idéntica en ambas
versiones.

### 3.18.4 Verificación

No solo build/tests: dado que es un cambio que toca el enrutado de toda
la aplicación, se verificó también navegando de verdad en el navegador
(pestaña nueva, caché de pre-bundling de Vite —
`node_modules/.vite` — borrada primero, misma precaución aprendida en la
sección 3.16.3 tras un salto de dependencia):

```
npx tsc -b            → sin errores
npx eslint .           → sin errores
npm test -- --run      → 3 suites, 19 tests, verde (sin cambios: no se ha
                          tocado ningún test, ninguno dependía de la
                          versión de react-router-dom)
npm run build          → 2777 módulos, verde
npm audit               → 0 vulnerabilidades (cierra las 2 moderadas que
                          quedaban abiertas desde la sección 3.17.3.C)

Navegador (consola limpia en todo momento):
  Dashboard → clic en "Ir a Posiciones" (<Link>)         → OK
  Posiciones → clic en "Ver proceso" (<Link> + useParams  → OK, position
              a "/positions/:id")                            id resuelto
  "← Volver a posiciones" (<Link> de vuelta)              → OK
  Enlace profundo directo a /add-candidate (BrowserRouter,
              sin pasar por la SPA)                        → OK
```

Con esto, `security-audit-AGB` queda completamente cerrada: de los dos
puntos que se dejaron explícitamente pendientes en la sección 3.17.6, la
autenticación sigue siendo una decisión de arquitectura del propietario
del proyecto (sin tocar), y la migración de `react-router-dom` está
hecha y verificada.

## 3.19 Autenticación de las APIs (`api-auth-AGB`)

Prompt del usuario: *"Documéntalo todo bien, incluyendo los porqués de
TS7 y react-router-dom v7 y vamos después, en otra rama nueva, a incluir
la autenticación de las APIs, porfa"*. Cierra el hallazgo más severo de
`security-audit-AGB` (sección 3.17.2): antes de esta rama, cualquiera que
alcanzara el puerto del backend podía leer y escribir datos de
candidatos sin identificarse.

### 3.19.1 Alcance acordado antes de tocar código

Dado que "añadir autenticación" es una decisión de arquitectura con
varias formas razonables de implementarse (y una elección equivocada
aquí se paga con mucho trabajo rehecho), se preguntó explícitamente por
dos ejes antes de escribir una sola línea:

1. **¿Solo backend, o también login en el frontend?** — se eligió
   **ambos**: JWT contra el modelo `Employee` ya existente + middleware
   protegiendo todas las rutas + una pantalla de login real en React.
   La alternativa (solo backend, verificable con `curl`) habría dejado
   el frontend actual completamente roto (401 en cada petición) hasta
   una rama futura — rompe la práctica de esta sesión de verificar
   siempre de extremo a extremo en el navegador.
2. **¿Quién puede iniciar sesión?** — se eligió **los `Employee` ya
   sembrados** por `prisma/seed.ts` (sin registro público): es una
   herramienta interna de reclutadores, no una aplicación con alta de
   usuarios propia, y un `POST /auth/register` sin restricciones
   añadiría superficie de ataque que no hace falta.

### 3.19.2 Backend: de dónde sale la identidad

El modelo `Employee` (`prisma/schema.prisma`) ya existía — con `email`
único y un campo `role` — pero nunca se había usado para nada de
autenticación, solo como dato asociado a entrevistas. Es el candidato
natural: el "Dashboard del Reclutador" es literalmente la herramienta de
estos empleados.

```prisma
model Employee {
  ...
  // Hash de bcrypt (nunca la contraseña en claro). Nullable: un Employee
  // sin contraseña sigue siendo válido para el resto de la app (p. ej.
  // como entrevistador), pero no puede iniciar sesión.
  password  String?  @db.VarChar(255)
  ...
}
```

Migración aplicada con `npx prisma migrate dev --name add_employee_password`
(`prisma/migrations/20260917055210_add_employee_password/migration.sql`:
`ALTER TABLE "Employee" ADD COLUMN "password" VARCHAR(255)`).
`Employee.ts` (dominio) gana `password` en el constructor/`save()` y un
`static findByEmail()` nuevo (no existía; hacía falta para el login).

### 3.19.3 Backend: `authService.ts`, `authMiddleware.ts`, `authController.ts`

- **`authService.ts`**: `login(email, password)` busca por email
  (`Employee.findByEmail`), y si el empleado no existe, está desactivado
  (`isActive: false`) o no tiene contraseña asignada, **o** la
  contraseña no coincide (`bcrypt.compare`), lanza siempre el mismo
  `AuthError('Email o contraseña incorrectos')` — un único mensaje
  genérico para los cuatro casos, a propósito: distinguirlos permitiría
  a quien ataca enumerar qué correos están dados de alta (probar
  `alice.johnson@lti.com` con cualquier contraseña y ver si el mensaje
  cambia). `AuthError` sigue el mismo patrón que `ValidationError`
  (`Object.setPrototypeOf`, ver 3.1) para que `instanceof` funcione bajo
  `target: es5`. `signToken`/`verifyToken` envuelven `jsonwebtoken`, con
  el payload mínimo (`sub`, `role`, `companyId` — nunca el hash de la
  contraseña) y expiración de 8h. `getJwtSecret()` lanza en el momento en
  que se necesita la clave si `JWT_SECRET` no está en el entorno, en vez
  de dejar que `jsonwebtoken` firme con `undefined` (que produciría
  tokens válidos para cualquiera que probara literalmente el string
  `"undefined"` como secreto).
- **`authMiddleware.ts`** (`requireAuth`): exige
  `Authorization: Bearer <token>`, adjunta el payload decodificado a
  `req.employee` (extensión de `Express.Request`, mismo patrón que ya
  existía para `req.prisma`). Sin cabecera, con esquema distinto de
  `Bearer`, o con un token inválido/caducado: siempre el mismo `401
  {"message": "Unauthorized"}` — el motivo real solo se registra en el
  log del servidor (`console.error`), nunca en la respuesta.
- **`authController.ts`** + **`authRoutes.ts`**: `POST /auth/login`,
  sin proteger con `requireAuth` (es la ruta que lo concede), pero con
  su propio límite de intentos (ver 3.19.4).

En `index.ts`, todo lo que antes estaba abierto pasa a exigir el
middleware:

```ts
app.use('/auth', loginLimiter, authRoutes);
app.use('/candidates', requireAuth, candidateRoutes);
app.post('/upload', requireAuth, uploadFile);
app.use('/position', requireAuth, positionRoutes);
```

### 3.19.4 Límite de intentos específico para el login

El límite general de 300 peticiones/15 min (sección 3.17.3.E) sigue
existiendo, pero sin ningún concepto de bloqueo de cuenta tras varios
intentos fallidos (no lo hay en el modelo `Employee`), un atacante con
un email conocido podría probar 300 contraseñas en 15 minutos contra
ese único endpoint. Se añadió un límite propio, más estricto, solo para
`/auth/login`:

```ts
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, ... });
app.use('/auth', loginLimiter, authRoutes);
```

### 3.19.5 Seed: contraseña de desarrollo para los dos empleados existentes

`prisma/seed.ts` no es idempotente (usa `create`, no `upsert`), y ya
había sido ejecutado antes en esta sesión — volver a lanzarlo entero
habría fallado por las restricciones `@unique` (email de `Company`,
`Candidate`, `Employee`) sobre filas que ya existían. En vez de resetear
la base de datos de desarrollo entera (`prisma migrate reset`, una
operación destructiva no pedida), se escribió un script de una sola vez
(`tmp-set-dev-passwords.ts`, ejecutado con `ts-node` y borrado
inmediatamente después) que solo actualiza la contraseña de
`alice.johnson@lti.com`/`bob.miller@lti.com` a
`bcrypt.hashSync('Changeme123!', 10)` — el mismo hash que
`prisma/seed.ts` ya genera para nuevas bases de datos (`DEV_PASSWORD_HASH`,
con un comentario explicando que es solo para desarrollo, sin endpoint de
registro que la use como valor por defecto real). Verificado con
`Updated 2 employee(s)`.

**Credenciales de desarrollo** (documentadas aquí, igual que
`DB_PASSWORD=changeme` ya lo estaba en `.env.example`):
`alice.johnson@lti.com` / `bob.miller@lti.com`, contraseña
`Changeme123!` para ambos.

### 3.19.6 Hallazgo incidental: no existía ningún `.env`, y el que hay que crear tenía una plantilla rota

Al intentar ejecutar la migración de Prisma, falló con
`Environment variable not found: DATABASE_URL` — no había ningún fichero
`.env` en todo el repositorio (`find / -iname ".env" -not -path
"*/node_modules/*"` → sin resultados), pese a que el backend llevaba toda
la sesión respondiendo peticiones reales contra la base de datos. Se
investigó por qué antes de asumir cualquier cosa: `process.env.FOO = x`
dentro de un proceso Node **no** se refleja en `/proc/<pid>/environ`
(ese fichero es una foto del entorno en el momento del `exec()`, no se
actualiza con mutaciones posteriores hechas desde dentro del propio
proceso) — así que inspeccionar el proceso del servidor en marcha por
esa vía no podía confirmar ni descartar nada; fue un callejón sin salida,
no una respuesta. Lo único verificable con certeza es que, ahora mismo,
no hay ningún `.env`, y hacía falta uno tanto para la migración como
para que el servidor (que se iba a reiniciar de todas formas al tocar
`index.ts`) siguiera arrancando.

Se creó `backend/.env` (gitignorado, nunca trackeado) con las
credenciales reales del contenedor de PostgreSQL en marcha
(`docker inspect ... --format '{{range .Config.Env}}...'`) y un
`JWT_SECRET` generado con `crypto.randomBytes(48).toString('hex')`. Al
escribirlo, y precisamente para evitar el mismo problema en quien lo
configure después, se comprobó algo que `.env.example` daba por sentado
sin verificar: **el paquete `dotenv` (sin `dotenv-expand`, no instalado)
no interpola `${DB_USER}` dentro del propio fichero**:

```bash
node -e "require('dotenv').config({ path: '.env.example' }); console.log(process.env.DATABASE_URL)"
# → postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}
#   (literal, sin resolver — no es el valor que nadie querría en producción)
```

Copiar `.env.example` tal cual a `.env` produce, para el propio proceso
Node (`index.ts`), un `DATABASE_URL` roto — aunque `npx prisma migrate
dev` funcione igualmente con ese mismo fichero, porque el CLI de Prisma
tiene su propia resolución de variables de entorno, independiente de
`dotenv`. Es un bug real y confuso: la migración funcionaría, y el
servidor no arrancaría con conexión a base de datos. Corregido en ambos
`.env.example` (raíz y `backend/`) escribiendo `DATABASE_URL` ya
resuelto, con un comentario explicando por qué.

### 3.19.7 Hallazgo incidental: varios servidores de backend zombis acumulados

Al probar el login por primera vez, `/auth/login` devolvía
`Cannot POST /auth/login` y `/position` seguía respondiendo 200 sin
token — el código nuevo no se había cargado. `lsof -i :3010` señalaba un
único proceso en escucha, pero `ps aux` reveló **cuatro instancias**
adicionales de `ts-node-dev --respawn` de sesiones anteriores del mismo
día, ninguna de ellas realmente sirviendo el puerto activo — arrancadas
en distintos momentos de esta larguísima sesión (una por cada vez que se
lanzó el servidor en segundo plano para verificar una rama distinta) y
nunca cerradas. Mismo síntoma que el ya documentado en la sección 3.16.3
(caché de Vite obsoleta en el frontend), pero en el backend: se
mataron las cinco (la que escuchaba y las cuatro zombis) y se arrancó una
única instancia limpia.

### 3.19.8 Frontend: por qué un interceptor global de axios, no una instancia propia

La forma "de manual" de adjuntar un token a todas las peticiones sería
una instancia propia (`const api = axios.create({ baseURL: ... })`) y
migrar `candidateService.js`/`positionService.js` a usarla. Se descartó
a propósito: los tests existentes (`candidateService.test.js`) hacen
`vi.mock('axios')` y manipulan `axios.post.mockResolvedValue(...)`
directamente sobre el módulo por defecto — una instancia nueva creada
con `axios.create()` sería, bajo ese mock, `undefined` (el mock
automático de Vitest no sabe qué debería devolver `create()`), y los 6
tests de ese fichero se habrían roto sin que el cambio tuviera nada que
ver con lo que esos tests verifican.

En su lugar, [`apiClient.js`](frontend/src/services/apiClient.js) registra
dos interceptores **sobre la instancia por defecto** de axios
(`axios.interceptors.request.use(...)`/`response.use(...)`), importado
una sola vez como efecto secundario al arrancar la app (`import
'./services/apiClient'` en `App.jsx`, mismo patrón que ya usaba `import
'./i18n/i18n'` en `index.tsx`). Resultado: `candidateService.js` y
`positionService.js` no cambian ni una línea, sus tests siguen pasando
sin tocarlos, y toda petición axios de la aplicación (las ya existentes
incluidas) gana la cabecera `Authorization` automáticamente.

- **Request**: si hay una sesión guardada (`getStoredAuth()`), añade
  `Authorization: Bearer <token>`.
- **Response**: un `401` con sesión guardada significa "el token ya no
  vale" (caducado, o el backend se reinició con otro `JWT_SECRET`) — se
  limpia la sesión y se fuerza `window.location.assign('/login')`. No es
  lo mismo que un intento de login fallido (ese lo maneja
  `authService.login` por separado, antes de que exista ningún token).

### 3.19.9 Frontend: `authService.js`, `AuthContext`, `Login`, `RequireAuth`, `UserMenu`

- **`services/authService.js`**: `login`/`logout`/`getStoredAuth`, guarda
  `{ token, employee }` en `localStorage` bajo la clave `lti_auth` (texto
  plano en el navegador — mismo mecanismo que ya usaba
  `i18next-browser-languagedetector` para el idioma, documentado aquí como
  decisión consciente, no accidental: esta es una SPA sin cookies de
  servidor, `localStorage` es lo estándar para JWT en ese contexto; el
  cambio frente a una cookie `httpOnly` sería resistencia a robo del token
  por XSS, y la sección 3.17.5 ya confirmó que no hay ningún
  `dangerouslySetInnerHTML`/`innerHTML`/`eval` en todo el frontend). Igual
  que `candidateService`/`uploadCV`: lanza solo el detalle del servidor,
  sin prefijo propio.
- **`context/AuthContext.jsx`**: `AuthProvider` + `useAuth()`. Arranca
  leyendo `getStoredAuth()` (si había sesión de una visita anterior, la
  app no muestra el login un instante de más). Único sitio de la sesión
  actual que reintroduce `React.Context` desde que `candidate-validation-
  i18n-a11y-AGB` lo sustituyó por `react-i18next` (sección 3.13) — no es
  una contradicción: aquella sustitución fue específicamente "no
  reinventar i18n cuando existe una librería estándar para ello"; para
  estado de sesión compartido entre componentes, `Context` es
  exactamente la herramienta idiomática de React, no algo casero que
  reimplemente lo que ya hace otra librería.
- **`components/Login.jsx`**: formulario con `email`/`password`,
  mismo patrón de accesibilidad que `AddCandidateForm` (`role="alert"
  aria-live="assertive"` para el error, `aria-invalid`). Al autenticar,
  vuelve a la ruta que se intentaba visitar antes de ser redirigido aquí
  (`location.state.from`, ver `RequireAuth`) en vez de ir siempre al
  dashboard.
- **`components/RequireAuth.jsx`**: envuelve cada ruta protegida;
  sin `employee` en el contexto, `<Navigate to="/login" state={{from:
  location}} replace />`.
- **`components/UserMenu.jsx`**: nombre del empleado + botón "Cerrar
  sesión", solo visible autenticado (`employee` nulo en `/login` →
  no renderiza nada).
- **`App.jsx`**: `<AuthProvider>` envolviendo todo; `/login` como única
  ruta pública; las cuatro rutas existentes (`/`, `/add-candidate`,
  `/positions`, `/positions/:id`) envueltas en `<RequireAuth>`.
- **i18n**: claves nuevas `login.*`/`userMenu.logout` en
  [`es.json`](frontend/src/i18n/locales/es.json)/[`en.json`](frontend/src/i18n/locales/en.json).

### 3.19.10 Hallazgo al escribir los tests: auto-mockear un módulo también sustituye sus clases de error

`authController.test.ts` empezó con `jest.mock('../../application/services/authService')`
(auto-mock completo, el mismo patrón que ya usan
`candidateController.test.ts`/`positionController.test.ts` sobre sus
respectivos servicios) y `new AuthError('Email o contraseña incorrectos')`
llegaba al test con `.message === ''`. Causa: `AuthError` vive en el
**mismo módulo** que se está auto-mockeando (`authService.ts`) — Jest
sustituye también la clase por una versión simulada que no ejecuta el
constructor real. Es la razón por la que `candidateController.test.ts`
nunca tropezó con esto: `ValidationError` vive en `validator.ts`, un
módulo *distinto* del que mockea (`candidateService.ts`), así que nunca
quedó auto-mockeada. Corregido acotando el mock a solo `login`:

```ts
jest.mock('../../application/services/authService', () => ({
    ...jest.requireActual('../../application/services/authService'),
    login: jest.fn(),
}));
```

### 3.19.11 Cobertura de tests añadida

**Backend (+15, 21→36)**: `authService.test.ts` (8 — login con éxito sin
filtrar el hash en la respuesta, mismo mensaje genérico para email
inexistente/contraseña incorrecta/empleado desactivado/sin contraseña,
`bcrypt.compare` ni se llega a invocar cuando ya se sabe que no puede
autenticarse, `signToken`/`verifyToken` van y vuelven, un token firmado
con otro secreto no verifica), `authMiddleware.test.ts` (4 — token válido
adjunta `req.employee` y llama a `next()`, sin cabecera/esquema
incorrecto/token inválido son siempre 401 sin llamar a `next()`),
`authController.test.ts` (3 — 200 con token+employee, 401 con el mensaje
de `AuthError`, 500 genérico — nunca el error crudo — para un fallo
inesperado).

**Frontend (+10, 19→29)**: `authService.test.js` (6 — guarda
sesión y devuelve el empleado, no guarda nada si falla, `logout` limpia,
`getStoredAuth` lee/no revienta con JSON corrupto), `RequireAuth.test.jsx`
(2 — redirige sin sesión guardada, renderiza el contenido protegido con
sesión guardada, sembrando `localStorage` directamente en vez de mockear
`authService`, para probar el camino real de `AuthProvider` de principio
a fin), `Login.test.jsx` (2 — envía las credenciales y navega a `/` al
autenticar, muestra el error accesible con el prefijo traducido y no
navega si falla).

### 3.19.12 Recopilación de secretos (`SECRETS.md`)

Ya con `api-auth-AGB` terminada y documentada, dos preguntas de
seguimiento en una sesión posterior: *"¿Cómo generaste esas
credenciales que me dijiste en el último mensaje y dónde se
almacenan?"* y, tras la respuesta, *"¿Haces una recopilación de los
secretos del sistema, como las credenciales de acceso a la BBDD que
metiste en la variable 'DATABASE_URL' y lo guardas en un fichero
unificado, tipo secrets.md o similar, o ya lo tenemos así?"*

No lo teníamos — los secretos reales vivían repartidos entre
`backend/.env` (no trackeado) y el literal `Changeme123!` de
`prisma/seed.ts` (sí trackeado, pero es una contraseña de desarrollo a
propósito, no un secreto de infraestructura). Antes de escribir el
fichero unificado que se pidió, se añadió `**/SECRETS.md` a
`.gitignore` — **y se commiteó esa regla primero** — precisamente
porque un fichero de ese nombre con valores reales es el tipo de cosa
que se termina subiendo a git por accidente; con la regla ya en su
sitio antes de que existiera contenido que proteger, se comprobó con
`git status`/`git check-ignore -v` que nunca podía aparecer como "para
confirmar".

`SECRETS.md` (raíz del repo, gitignorado, nunca en git) recopila:
credenciales de PostgreSQL (verificadas contra el contenedor Docker real
en marcha, no copiadas de memoria), `JWT_SECRET`, las credenciales de
login de desarrollo (`alice.johnson@lti.com`/`bob.miller@lti.com` +
`Changeme123!`, ver 3.19.5), y una nota de cómo rotar cada una. Es
contenido puramente local — no aparece en ningún commit de esta rama
más allá de la línea añadida a `.gitignore`.

## 12. Verificación de la autenticación de las APIs (sección 3.19)

```
Backend
  npx tsc --noEmit    → sin errores
  npx jest             → 8 suites, 36 tests (antes 21; +15 nuevos), verde
  npm run build        → sin errores, dist/ sin ficheros *.test.js

Frontend
  npx tsc -b           → sin errores
  npx eslint .          → sin errores (1 warning inocuo de react-refresh
                          en AuthContext.jsx por exportar el hook junto
                          al provider — patrón estándar, no afecta a HMR
                          de producción)
  npm test -- --run     → 6 suites, 29 tests (antes 19; +10 nuevos), verde
  npm run build         → 2783 módulos, verde

Navegador (pestaña nueva, consola limpia salvo los 401 esperados de las
pruebas deliberadas de credenciales incorrectas):
  Visita a "/" sin sesión              → redirige a /login
  Login con contraseña incorrecta       → alerta accesible (role="alert"):
                                           "Error al iniciar sesión: Email
                                           o contraseña incorrectos"
  Login con alice.johnson@lti.com /
    Changeme123!                        → dashboard, "Alice Johnson" +
                                           "Cerrar sesión" en la barra
  "Ir a Posiciones"                     → datos reales de la API con el
                                           token adjunto automáticamente
  "Cerrar sesión"                       → localStorage.getItem('lti_auth')
                                           → null; redirige a /login
  Navegación directa a /positions
    tras cerrar sesión                  → redirige a /login (RequireAuth)
  Login con bob.miller@lti.com /
    Changeme123! (segundo empleado)     → OK
  Alta de candidato completa (nombre/
    apellido/email/enviar), autenticado → "Candidato añadido con éxito"
                                           (POST /candidates con el token
                                           adjunto), candidato de prueba
                                           borrado tras verificar

curl (endpoint de subida de ficheros, sin equivalente de UI para
probarlo — la pestaña del navegador no puede pilotar el selector nativo
de archivos del sistema operativo):
  POST /upload sin token                → 401
  POST /upload con token válido          → 200, mismo formato de
                                           respuesta que antes de esta
                                           rama ({filePath, fileType}),
                                           fichero de prueba borrado tras
                                           verificar
```

Con esto, el hallazgo más severo de `security-audit-AGB` (sección
3.17.2, ausencia total de autenticación) queda cerrado: toda ruta de
negocio del backend exige un JWT válido, y el frontend tiene un flujo de
login/logout real y verificado de principio a fin.

## 3.20 *Code splitting* del bundle (`code-splitting-AGB`)

Prompt del usuario: tras una pregunta previa sobre qué es `<Suspense>`
(en el contexto de la deuda documentada en la sección 0.5, "chunk único
de ~670KB sin *code splitting*"), *"¿Creas porfa una nueva rama y
aplicas el code splitting, que quiero ver la diferencia del código y
cómo afecta a la experiencia de usuario el resultado final?"*

### 3.20.1 El cambio en sí

En [`App.jsx`](frontend/src/App.jsx), las 4 rutas protegidas pasan de
`import` estático a `React.lazy(() => import(...))`, envueltas en un
único `<Suspense>` alrededor de `<Routes>`:

```jsx
const RecruiterDashboard = lazy(() => import('./components/RecruiterDashboard'));
const AddCandidate = lazy(() => import('./components/AddCandidateForm'));
const Positions = lazy(() => import('./components/Positions'));
const PositionProcess = lazy(() => import('./components/PositionProcess'));
```

**`Login` se queda con `import` estático, a propósito**: es la primera
pantalla que ve cualquiera sin sesión (`RequireAuth` redirige ahí), y
ponerla detrás de un `Suspense` metería un parpadeo de carga justo en el
primer contacto con la app — el peor sitio para ahorrarse unos KB.

El `fallback` (`PageFallback`, un componente propio, no una librería) es
un `<div role="status" aria-live="polite">` con una clave de i18n nueva
(`common.loadingPage`: "Cargando página…" / "Loading page…") —
mismo patrón de accesibilidad que el mensaje de éxito de
`AddCandidateForm` (3.9-3.11): un lector de pantalla lo anuncia sin que
el foco tenga que moverse.

Ningún test existente importa `App.jsx` directamente (los tests de
`Login`/`RequireAuth`/`AddCandidateForm` renderizan esos componentes
sueltos, no a través del árbol de rutas), así que el cambio es invisible
para toda la suite: los 29 tests del frontend pasan sin tocar ni uno.

### 3.20.2 La diferencia medida, no solo el código

`npm run build` antes de esta rama generaba **un único fichero**:

```
dist/assets/index-DV68uIzp.js   674.25 kB │ gzip: 189.27 kB
```

Después de esta rama, el mismo build genera **10 ficheros**, cada ruta
(y `Alert`/`Container`, componentes de `react-bootstrap` que `Login`
usa directamente) en su propio chunk:

| Chunk | Tamaño | gzip | Cuándo se descarga |
|---|---|---|---|
| `index-*.js` (App, router, contexto de auth, i18n, Login) | 110.87 kB | 35.83 kB | Siempre, es el punto de entrada |
| `Alert-*.js` (agrupación de `react-bootstrap` que usa `Login`) | 195.07 kB | 65.89 kB | Siempre (dependencia directa de `Login`) |
| `Container-*.js` | 16.92 kB | 6.30 kB | Siempre |
| `rolldown-runtime-*.js` | 0.90 kB | 0.51 kB | Siempre |
| `RecruiterDashboard-*.js` | 1.18 kB | 0.49 kB | Al visitar `/` (autenticado) |
| `Row-*.js` | 0.51 kB | 0.37 kB | Junto con `RecruiterDashboard` |
| `Positions-*.js` | 2.76 kB | 1.05 kB | Al visitar `/positions` |
| `Spinner-*.js` | 0.41 kB | 0.31 kB | Junto con `Positions` |
| `positionService-*.js` | 0.64 kB | 0.32 kB | Junto con `Positions`/`PositionProcess` |
| `PositionProcess-*.js` | 2.62 kB | 1.17 kB | Al visitar `/positions/:id` |
| `AddCandidateForm-*.js` + su CSS | 344.93 kB + 21.25 kB | 82.38 kB + 2.95 kB | Al visitar `/add-candidate` |

**Lo que de verdad le llega al navegador la primera vez que alguien abre
la app** (sin sesión, aterriza en `/login`) son los cuatro primeros:
`110.87 + 195.07 + 16.92 + 0.90 = 323.76 kB` (`108.53 kB` con gzip) — un
**52% menos** que el único bundle de antes (674.25 kB), un **43% menos**
ya comprimido. Y quien nunca llega a abrir "Añadir Candidato" en toda su
sesión (p. ej. alguien que solo consulta el listado de posiciones) no
descarga jamás los 345 kB de `AddCandidateForm` — el chunk más pesado de
toda la aplicación, con diferencia, porque arrastra `react-datepicker`.

### 3.20.3 Verificación con tráfico de red real, no solo con el tamaño de los ficheros

El servidor de desarrollo de Vite (`npm run dev`) no *bundlea* ni
trocea igual que la build de producción — sirve módulos ES sueltos.
Para ver el comportamiento real había que servir el `dist/` generado por
`vite build`, con `vite preview`. Se lanzó en el puerto 3000 (no el 4173
por defecto: el backend solo permite CORS desde `http://localhost:3000`
— con el 4173 el login fallaba con "Network Error", un error de CORS
esperado por el puerto equivocado, no un bug de esta rama), y se
inspeccionaron las peticiones de red reales con cada navegación:

```
Visita en frío a "/" (sin sesión → /login)
  → index, rolldown-runtime, Container, Alert   (4 peticiones, 323.76 kB)
  → NINGUNA de RecruiterDashboard/Positions/PositionProcess/AddCandidateForm

Tras iniciar sesión y aterrizar en "/" (dashboard)
  → RecruiterDashboard-*.js + Row-*.js          (nuevas, no estaban antes)

Clic en "Ir a Posiciones"
  → Positions-*.js + Spinner-*.js + positionService-*.js   (nuevas)

Navegación directa a "/add-candidate"
  → AddCandidateForm-*.js + su CSS               (nuevas, 345 kB — el
                                                    chunk más pesado de
                                                    toda la app, solo se
                                                    paga si se visita
                                                    esta pantalla)
```

Cada chunk se pidió **exactamente** la primera vez que la ruta
correspondiente se visitó, nunca antes — confirmado con
`read_network_requests`, no asumido a partir de los nombres de fichero.

### 3.20.4 Hallazgo incidental durante la demo: un token de dos días caducó en directo

A mitad de la demostración, la sesión que ya estaba guardada en
`localStorage` desde una verificación de la rama `api-auth-AGB` (18 de
septiembre) caducó (JWT con 8h de vigencia, sección 3.19.3) al hacer la
primera petición real a la API tras cargarse de forma optimista — el
interceptor de respuesta de `apiClient.js` (sección 3.19.8) hizo
exactamente lo que estaba diseñado para hacer: limpió la sesión y
redirigió a `/login` sola, sin intervención. No es un bug de esta rama;
es la primera vez, de forma no forzada, que se observa ese camino en
acción.

### 3.20.5 Qué no se ha hecho, y por qué

No se ha dividido nada dentro de `AddCandidateForm` (p. ej. cargar
`react-datepicker` de forma perezosa solo al pulsar "Añadir Educación").
El *code splitting* por ruta ya captura la gran mayoría de la ganancia
posible en esta aplicación (5 pantallas, cada una con su propio punto de
entrada natural en el router) — trocear más finamente dentro de una
única pantalla añadiría complejidad (más `Suspense` anidados, más
posibilidad de parpadeos de carga dentro de un mismo formulario) a
cambio de un ahorro mucho menor, y no se pidió.

## 13. Verificación del *code splitting* (sección 3.20)

```
npx tsc -b            → sin errores
npx eslint .           → sin errores (mismo warning inocuo preexistente
                          en AuthContext.jsx)
npm test -- --run      → 6 suites, 29 tests, verde (sin cambios: ningún
                          test importa App.jsx)
npm run build          → 2783 módulos, 10 ficheros JS en vez de 1
                          (tabla completa en 3.20.2)

Verificación con tráfico de red real (vite preview, puerto 3000):
  Carga en frío de /login          → 4 peticiones JS, 323.76 kB
                                      (antes: 674.25 kB, un único fichero)
  Dashboard tras login             → RecruiterDashboard-*.js nuevo
  Clic en "Ir a Posiciones"        → Positions-*.js + positionService-*.js
                                      nuevos
  Navegación a /add-candidate      → AddCandidateForm-*.js (345 kB) nuevo
  Consola                          → limpia salvo el 401 esperado del
                                      token de dos días caducado (3.20.4)
```

## 3.21 Dos bugs de UX en "Agregar Candidato" (`candidate-form-ux-fixes-AGB`)

Prompt del usuario: *"Después de un error de entrada en 'Agregar
Candidato' no me recarga los valores corregidos. Tampoco da información
de porqué el tfno tiene formato inválido a pesar de haber introducido
sólo 9 números. ¿Lo mejoras, porfa?"*

### 3.21.1 Metodología: reproducir antes de arreglar

Ninguno de los dos se "arregló" a partir de leer el código y suponer —
ambos se reprodujeron primero en el navegador, con un intento fallido de
por medio que merece registrarse porque explica un patrón a tener en
cuenta con el propio tooling de esta sesión: el primer intento de
reproducir el fallo del teléfono dio un resultado desconcertante (todos
los campos en blanco tras enviar, y un `POST /candidates → 201 Created`
en el registro de red) que no encajaba con nada del código. Investigando
antes de concluir que era un bug de la app, se confirmó que era una
condición de carrera del propio `computer` del navegador: la primera
captura de pantalla se tomó mientras la ruta `/add-candidate` (cargada
de forma perezosa desde `code-splitting-AGB`, sección 3.20) aún mostraba
el `Suspense` de "Cargando página…"; para cuando el clic se ejecutó, el
formulario real ya había sustituido ese `fallback` en el DOM, y la
herramienta rechazó el clic por coordenadas ("this tab has loaded a
different site or document") — el texto tecleado a continuación no
llegó a ningún campo, y el `201 Created` del registro de red resultó ser
una entrada residual de una verificación anterior en la misma pestaña
(el mismo patrón de pestaña de larga duración con estado acumulado ya
documentado en 3.16.3 y 3.20.4). Se cerró la pestaña, se abrió una
nueva, y se esperó a que la captura de pantalla reflejara el formulario
real antes de hacer clic — con eso, la reproducción fue limpia y
repetible.

### 3.21.2 Bug A: el error de un campo no se actualizaba al corregirlo

**Causa**: `issues` (el array de `{field, code, params}` que alimenta
`getFieldError`) solo se actualizaba dentro de `handleSubmit` — nunca al
cambiar un campo. Los `onChange` de `firstName`/`lastName`/`email`/
`phone`/`address` llamaban a `setCandidate(...)` en línea, sin tocar
`issues` en absoluto. Resultado: tras un envío fallido, corregir el
valor de un campo actualizaba `candidate` (el dato que se enviaría en el
próximo intento) pero dejaba el borde rojo, el icono y el mensaje de
error exactamente como estaban, mostrando información sobre un valor que
ya no existía, hasta el siguiente clic en "Enviar". El usuario lo
describió con precisión ("no me recarga los valores corregidos"): la UI
no reflejaba la corrección, aunque el dato sí se hubiera corregido por
debajo.

**Arreglo**, en
[`AddCandidateForm.jsx`](frontend/src/components/AddCandidateForm.jsx):
una función `clearFieldIssue(field)` que quita del array `issues`
cualquier entrada de ese campo, invocada desde un `handleFieldChange`
nuevo (que sustituye los 5 `onChange` en línea) y también desde
`handleInputChange`/`handleDateChange` (los campos dentro de
`educations`/`workExperiences`, con la misma clase de bug aunque no
fuera el caso reportado — mismo arreglo, por consistencia). **No
revalida en el cliente** — eso seguiría viviendo solo en
`validator.ts`, según la arquitectura ya establecida (3.1) — simplemente
deja de mostrar un error que ya no corresponde al valor actual, hasta
que el siguiente envío confirme (o no) que la corrección es válida de
verdad.

### 3.21.3 Bug B: el teléfono decía "formato inválido" sin decir cuál

**Causa**: `validatePhone` en `validator.ts` usa
`PHONE_REGEX = /^(6|7|9)\d{8}$/` — 9 dígitos, pero el primero tiene que
ser 6, 7 o 9 (prefijos de móvil/fijo español). Un teléfono de 9 dígitos
que empiece por otra cifra (el caso exacto que describió el usuario) la
incumple, pero el código de error que se lanzaba era el genérico
`invalidFormat` — el mismo que comparten el email y las fechas, con un
mensaje que solo dice "El teléfono no tiene un formato válido." sin
explicar la regla real (ni la longitud ni el prefijo esperado).

**Arreglo**: nuevo código específico `invalidPhoneFormat` (añadido a la
unión de tipos de `ValidationIssue`), usado solo por `validatePhone`, con
su propio mensaje en
[`es.json`](frontend/src/i18n/locales/es.json)/[`en.json`](frontend/src/i18n/locales/en.json):
*"El teléfono debe tener 9 dígitos y empezar por 6, 7 o 9."* / *"The
phone number must have 9 digits and start with 6, 7, or 9."* — mismo
patrón que ya usa `invalidCharacters` (código específico con un mensaje
que explica la regla, no solo que falló) en vez de forzarlo dentro del
`invalidFormat` genérico, que habría exigido diferenciar el mensaje por
`field` además de por `code`, algo que la arquitectura actual de
`translateValidationIssue` no contempla.

### 3.21.4 Cobertura de tests añadida

**Backend (+3, 36→39)**: en `validator.test.ts` — un teléfono de 9
dígitos con el prefijo equivocado da `invalidPhoneFormat` (no el
genérico `invalidFormat`, que no tenía ningún test de teléfono hasta
ahora); teléfonos válidos empezando por 6/7/9 no lanzan; un teléfono
vacío tampoco (es opcional).

**Frontend (+3, 29→32)**: en `validationMessages.test.js` — el mensaje
de `invalidPhoneFormat` explica la regla real, en español y en inglés.
En `AddCandidateForm.test.jsx` — el test que codifica exactamente el bug
reportado: se envía con un teléfono inválido, aparece el mensaje
específico duplicado (como el resto de errores, 3.15.4), se corrige el
campo **sin volver a pulsar "Enviar"**, y el mensaje desaparece de
inmediato — con `sendCandidateData` seguía habiéndose llamado una sola
vez, confirmando que la desaparición es por la corrección, no por un
reenvío.

## 14. Verificación de los arreglos de "Agregar Candidato" (sección 3.21)

```
Backend
  npx tsc --noEmit    → sin errores
  npx jest             → 8 suites, 39 tests (antes 36; +3 nuevos), verde
  npm run build        → sin errores, dist/ sin ficheros *.test.js
  curl (POST /candidates, autenticado, teléfono "123456789")
                        → {"errors":[{"field":"phone","code":"invalidPhoneFormat"}]}
                          (confirmado contra el servidor de desarrollo real,
                          no solo con el test)

Frontend
  npx tsc -b           → sin errores
  npx eslint .          → sin errores (mismo warning inocuo preexistente)
  npm test -- --run     → 6 suites, 32 tests (antes 29; +3 nuevos), verde
  npm run build         → 10 ficheros JS, chunking intacto (sección 3.20)

Navegador (reproducido y verificado tras cerrar la pestaña obsoleta,
sección 3.21.1):
  Envío con teléfono "123456789"   → "El teléfono debe tener 9 dígitos
                                      y empezar por 6, 7 o 9." (antes:
                                      "no tiene un formato válido.")
  Corregir a "612345678" sin
    reenviar                        → el borde rojo, el icono y el
                                       mensaje desaparecen al instante
                                       (antes: seguían ahí hasta el
                                       siguiente envío)
  Enviar tras la corrección         → "Candidato añadido con éxito"
                                       (candidato de prueba borrado tras
                                       verificar)
```

## 3.22 El formulario no se vaciaba tras un alta con éxito

Prompt del usuario, mientras probaba por su cuenta: *"Acabo de lograr
añadir un candidato con éxito, pero opino que deberían haberse borrado
los valores tras ello, pero se mantienen. ¿Coincides?"*

### 3.22.1 Confirmado, con dos causas distintas

`handleSubmit` nunca reseteaba `candidate` tras un envío con éxito
(`setSuccessMessage`/`setError('')`/`setIssues([])`, pero nada que
tocara los datos del formulario) — igual que el bug de 3.21.2, pero en
el camino de éxito en vez del de error. Al investigarlo salió una
segunda causa, más sutil: `firstName`/`lastName`/`email`/`phone`/
`address` nunca habían tenido `value={candidate.X}` — eran técnicamente
*no controlados* desde el punto de vista de React (el `onChange` sí
actualizaba el estado, pero nada leía ese estado de vuelta hacia el
`<input>`). Aunque se hubiera reseteado `candidate` sin más, los
`<input>` seguirían mostrando en pantalla lo último que el navegador
tenía escrito — React no toca el DOM de un campo sin `value` al
volver a renderizar.

### 3.22.2 Arreglo

En
[`AddCandidateForm.jsx`](frontend/src/components/AddCandidateForm.jsx):

1. Los 5 campos ganan `value={candidate.X}` — pasan a ser controlados
   de verdad, no solo en apariencia.
2. `EMPTY_CANDIDATE` (el objeto inicial, ahora fuera del componente para
   poder reutilizarlo) se asigna a `candidate` en el camino de éxito de
   `handleSubmit`.
3. `FileUploader` guarda su propio estado interno (fichero elegido,
   nombre mostrado, resultado de la subida — ver 3.16), que no depende
   de ningún prop del padre; vaciar `candidate.cv` no le hace olvidar lo
   que ya mostraba. Se le añade una `key` que cambia en cada alta con
   éxito (`fileUploaderKey`), forzando a React a desmontarlo y montar una
   instancia nueva y limpia en vez de reutilizar la que ya tenía estado.

`educations`/`workExperiences` no necesitaron ningún cambio aparte:
al vaciarse el array en `candidate`, las filas (y sus `DatePicker`) 
desaparecen del todo porque se generan con `.map()` sobre ese mismo
array — no queda ningún estado residual que limpiar.

### 3.22.3 Un par de falsas alarmas durante la verificación, descartadas antes de concluir nada

- Un aviso nuevo de React ("A component is changing an uncontrolled
  input to be controlled") apareció en la pestaña donde se había editado
  el fichero en caliente — Vite recarga el componente por HMR sin
  recargar la página, y la instancia que ya estaba montada (de antes del
  cambio, sin `value`) se comparaba contra la nueva (con `value`).
  Confirmado como ruido de HMR, no un bug real: en una pestaña nueva, con
  el componente montado de una sola vez, la consola sale limpia.
- Dos veces durante la propia verificación, una captura tomada justo
  después de escribir en un campo (o de enviar el formulario) mostró
  los campos vacíos o el mensaje de éxito ausente, sugiriendo que el
  texto o el envío no habían "llegado". Ambas veces, una segunda captura
  inmediatamente después mostró el estado real y correcto — la propia
  herramienta de captura iba un paso por detrás del pintado del
  navegador, no la aplicación fallando. Se verificó con el registro de
  red (`POST /candidates → 201 Created`) antes de dar nada por bueno o
  por malo.

## 15. Verificación del reseteo del formulario (sección 3.22)

```
Frontend
  npx tsc -b           → sin errores
  npx eslint .          → sin errores (mismo warning inocuo preexistente)
  npm test -- --run     → 6 suites, 33 tests (antes 32; +1 nuevo), verde
  npm run build         → 10 ficheros JS, chunking intacto (sección 3.20)

Navegador (pestaña nueva, verificado dos veces para descartar las falsas
alarmas de 3.22.3):
  Rellenar Nombre/Apellido/Email/Teléfono → Enviar
    → "Candidato añadido con éxito", los 5 campos vacíos al instante,
      "Ningún archivo seleccionado" en el selector de CV
    → confirmado con el registro de red real (POST /candidates → 201)
      y no solo con la captura de pantalla
  (candidatos de prueba borrados de la base de datos tras cada
  comprobación)
```
