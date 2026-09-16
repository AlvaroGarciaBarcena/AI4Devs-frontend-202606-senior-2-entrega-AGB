# Registro de prompts y arreglos — Integración completa (rama `all-fixes-AGB`)

Autor: garciabarcenaalvaro@gmail.com
Asistente: Claude Code (Sonnet 5)
Fecha: 2026-09-16

Rama base: fusión de `candidate-validation-i18n-a11y-AGB` (commit `eea6e5a`
— que a su vez ya era fusión de `backend-AGB` y `frontend-AGB`) y
`positions-proceso-AGB` (commit `cd86b57`, partiendo de `main`
directamente). Esta rama reúne el trabajo de las cuatro ramas de arreglos/
funcionalidades en una sola.

> Nota sobre la fusión: las secciones 1-11 de este documento (más abajo)
> son el historial heredado de `candidate-validation-i18n-a11y-AGB` sin
> modificar — describen mensajes de validación, i18n y a11y. La sección 12
> documenta específicamente la fusión con `positions-proceso-AGB` (el
> "Ver proceso" con datos reales) y los ajustes necesarios para
> integrarlo con el i18n ya existente. El histórico completo de
> `positions-proceso-AGB` se conserva en
> [`prompts-AGB-positions.md`](./prompts-AGB-positions.md) (igual que
> `backend-AGB`/`frontend-AGB` ya se conservaban en
> [`prompts-AGB-backend.md`](./prompts-AGB-backend.md) /
> [`prompts-AGB-frontend.md`](./prompts-AGB-frontend.md) desde la fusión
> anterior).

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
    → Prompt que originó esta rama (`all-fixes-AGB`) y la sección 12 de
    este documento.

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
