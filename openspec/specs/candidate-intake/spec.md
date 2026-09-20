# candidate-intake Specification

## Purpose
Permite a un reclutador dar de alta un candidato nuevo — datos de contacto, CV, historial académico y laboral — y vincularlo desde el primer momento a la posición a la que se presenta.
## Requirements
### Requirement: Alta de candidato con datos básicos
_Rama: `backend-AGB` (commit `24f86fd`) / `frontend-AGB` (commit `d92752d`)_

El sistema SHALL permitir crear un candidato con nombre, apellidos y email como datos mínimos, a través de `POST /candidates`.

#### Scenario: Alta con éxito
- **GIVEN** el reclutador está en el formulario de alta de candidato
- **WHEN** envía nombre, apellidos, email y una posición válidos
- **THEN** el sistema crea el candidato y responde 201 con sus datos

#### Scenario: Email duplicado
- **GIVEN** ya existe un candidato con un email concreto
- **WHEN** se intenta dar de alta a otro candidato con ese mismo email
- **THEN** el sistema rechaza el alta con un mensaje que indica que el email ya existe, sin crear un registro duplicado

### Requirement: Historial académico opcional
_Rama: `frontend-AGB` (commit `d92752d`) — corregido en `playwright-bdd-AGB` (commit `a7042cb`)_

Nota: `frontend-AGB` construyó la interfaz, pero nadie llegó a enviar
un alta con una educación real hasta preparar el escenario E2E
correspondiente en `playwright-bdd-AGB`: el formulario se rompía al
pulsar "Añadir Educación" (interop de `react-datepicker` con Vite) y,
arreglado eso, guardar la entrada colgaba la petición para siempre en
un bucle infinito real (alias de array mutado durante su propia
iteración en `Candidate.ts`, ver prompts-AGB.md sección 3.28.4). Este
requisito no fue cierto hasta ese commit.

El sistema SHALL permitir añadir cero o más entradas de educación (institución, título, fecha de inicio, fecha de fin opcional) a un candidato en la misma alta.

#### Scenario: Añadir una entrada de educación
- **GIVEN** el reclutador está en el formulario de alta de candidato
- **WHEN** pulsa "Añadir Educación" y rellena institución, título y fecha de inicio
- **THEN** esa entrada se guarda asociada al candidato tras el envío

#### Scenario: Quitar una entrada antes de enviar
- **GIVEN** el formulario tiene una entrada de educación ya añadida
- **WHEN** el reclutador pulsa "Eliminar" sobre esa entrada
- **THEN** esa entrada desaparece del formulario y no se envía con el alta

### Requirement: Experiencia laboral opcional
_Rama: `frontend-AGB` (commit `d92752d`) — corregido en `playwright-bdd-AGB` (commit `a7042cb`)_

Nota: mismo hallazgo que "Historial académico opcional" justo arriba —
ambos comparten el mismo componente de formulario y el mismo bucle
infinito real en `Candidate.ts`.

El sistema SHALL permitir añadir cero o más entradas de experiencia laboral (empresa, puesto, descripción opcional, fecha de inicio, fecha de fin opcional) a un candidato en la misma alta.

#### Scenario: Añadir una entrada de experiencia
- **GIVEN** el reclutador está en el formulario de alta de candidato
- **WHEN** pulsa "Añadir Experiencia Laboral" y rellena empresa, puesto y fecha de inicio
- **THEN** esa entrada se guarda asociada al candidato tras el envío

### Requirement: Elegir posición es opcional; si se elige, debe ser válida
_Rama: `position-selector-AGB` (commit `096120b`); revisado en `unassigned-candidates-AGB`_

El sistema SHALL permitir indicar, mediante un desplegable con las posiciones reales existentes (no texto libre), la posición a la que se presenta un candidato al darlo de alta, pero SHALL NOT exigirlo: un alta sin posición elegida SHALL guardarse igualmente, sin ninguna candidatura (`Application`) asociada (ver la capacidad `hiring-pipeline` para cómo se listan estos candidatos sin asignar). Cuando SÍ se elige una posición, el sistema SHALL crear automáticamente la candidatura en la primera fase del proceso de entrevistas de esa posición, y SHALL rechazar el alta si la posición elegida no existe o no tiene ningún proceso de entrevistas configurado.

_Nota: hasta esta revisión, el sistema exigía elegir una posición y rechazaba el alta si no se elegía ninguna. Se relaja a petición del usuario, que dio de alta candidatos antes de que este campo existiera y esperaba poder seguir haciéndolo — un candidato sin candidatura es un estado válido ("sin asignar"), no un error._

#### Scenario: Alta con posición válida
- **GIVEN** existe al menos una posición con su flujo de entrevistas configurado
- **WHEN** el reclutador elige esa posición en el desplegable y completa el resto del formulario
- **THEN** el candidato se crea y aparece en la primera fase del tablero "Ver proceso" de esa posición

#### Scenario: Alta sin elegir posición
- **GIVEN** el reclutador ha rellenado el resto del formulario pero no ha elegido ninguna posición
- **WHEN** lo envía
- **THEN** el candidato se crea con éxito, sin ninguna candidatura asociada

#### Scenario: Posición elegida sin flujo de entrevistas configurado
- **GIVEN** la posición elegida existe pero su flujo de entrevistas no tiene ninguna fase
- **WHEN** se envía el alta con esa posición
- **THEN** el sistema la rechaza con un mensaje que indica que esa posición no tiene un proceso de entrevistas configurado, distinto del mensaje que se da cuando la posición no existe, y el candidato no queda guardado

### Requirement: El error de un campo se limpia al corregirlo
_Rama: `candidate-form-ux-fixes-AGB` (commit `9e425e0`)_

El sistema SHALL dejar de mostrar el error de un campo en cuanto su valor cambia, sin esperar a un nuevo intento de envío del formulario.

#### Scenario: Corregir un campo tras un envío fallido
- **GIVEN** un envío fallido ha marcado un campo como inválido
- **WHEN** el usuario modifica su valor sin volver a pulsar "Enviar"
- **THEN** el mensaje de error y el marcado visual de ese campo desaparecen de inmediato

### Requirement: El formulario se vacía tras un alta con éxito
_Rama: `candidate-form-ux-fixes-AGB` (commit `700fc68`)_

El sistema SHALL restablecer todos los campos del formulario, incluido el selector de CV, a su estado inicial vacío inmediatamente después de un alta de candidato con éxito.

#### Scenario: Alta consecutiva de dos candidatos
- **GIVEN** un reclutador acaba de completar un alta de candidato con éxito
- **WHEN** empieza a rellenar los datos de un segundo candidato
- **THEN** ningún campo (incluido el fichero de CV ya subido) conserva los valores del candidato anterior

### Requirement: Enlace de vuelta al dashboard
_Rama: `back-to-dashboard-links-AGB`_

El sistema SHALL ofrecer, en la pantalla de alta de candidato, un enlace que navegue de vuelta al dashboard del reclutador.

#### Scenario: Volver al dashboard desde el alta de candidato
- **GIVEN** el reclutador está en la pantalla de alta de candidato
- **WHEN** pulsa el enlace de vuelta al dashboard
- **THEN** el sistema navega al dashboard del reclutador

