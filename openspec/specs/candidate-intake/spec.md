# candidate-intake Specification

## Purpose
Permite a un reclutador dar de alta un candidato nuevo — datos de contacto, CV, historial académico y laboral — y vincularlo desde el primer momento a la posición a la que se presenta.
## Requirements
### Requirement: Alta de candidato con datos básicos
_Rama: `backend-AGB` (commit `24f86fd`) / `frontend-AGB` (commit `d92752d`)_

El sistema SHALL permitir crear un candidato con nombre, apellidos y email como datos mínimos, a través de `POST /candidates`.

#### Scenario: Alta con éxito
- **WHEN** un reclutador envía nombre, apellidos, email y una posición válidos
- **THEN** el sistema crea el candidato y responde 201 con sus datos

#### Scenario: Email duplicado
- **WHEN** el email ya pertenece a otro candidato existente
- **THEN** el sistema rechaza el alta con un mensaje que indica que el email ya existe, sin crear un registro duplicado

### Requirement: Historial académico opcional
_Rama: `frontend-AGB` (commit `d92752d`)_

El sistema SHALL permitir añadir cero o más entradas de educación (institución, título, fecha de inicio, fecha de fin opcional) a un candidato en la misma alta.

#### Scenario: Añadir una entrada de educación
- **WHEN** el reclutador pulsa "Añadir Educación" y rellena institución, título y fecha de inicio
- **THEN** esa entrada se guarda asociada al candidato tras el envío

#### Scenario: Quitar una entrada antes de enviar
- **WHEN** el reclutador pulsa "Eliminar" sobre una entrada de educación ya añadida al formulario
- **THEN** esa entrada desaparece del formulario y no se envía con el alta

### Requirement: Experiencia laboral opcional
_Rama: `frontend-AGB` (commit `d92752d`)_

El sistema SHALL permitir añadir cero o más entradas de experiencia laboral (empresa, puesto, descripción opcional, fecha de inicio, fecha de fin opcional) a un candidato en la misma alta.

#### Scenario: Añadir una entrada de experiencia
- **WHEN** el reclutador pulsa "Añadir Experiencia Laboral" y rellena empresa, puesto y fecha de inicio
- **THEN** esa entrada se guarda asociada al candidato tras el envío

### Requirement: Candidatura vinculada a una posición
_Rama: `position-selector-AGB` (commit `096120b`)_

El sistema SHALL exigir que toda alta de candidato indique la posición a la que se presenta, mediante un desplegable con las posiciones reales existentes (no texto libre), y SHALL crear automáticamente la candidatura (`Application`) en la primera fase del proceso de entrevistas de esa posición.

#### Scenario: Alta con posición válida
- **WHEN** el reclutador elige una posición existente en el desplegable y completa el resto del formulario
- **THEN** el candidato se crea y aparece en la primera fase del tablero "Ver proceso" de esa posición

#### Scenario: Posición sin elegir
- **WHEN** el reclutador intenta enviar el formulario sin seleccionar ninguna posición
- **THEN** el sistema rechaza el alta señalando el campo de posición como obligatorio

#### Scenario: Posición elegida sin flujo de entrevistas configurado
- **WHEN** la posición elegida existe pero su flujo de entrevistas no tiene ninguna fase
- **THEN** el sistema rechaza el alta con un mensaje que indica que esa posición no tiene un proceso de entrevistas configurado, distinto del mensaje que se da cuando la posición no existe

### Requirement: El error de un campo se limpia al corregirlo
_Rama: `candidate-form-ux-fixes-AGB` (commit `9e425e0`)_

El sistema SHALL dejar de mostrar el error de un campo en cuanto su valor cambia, sin esperar a un nuevo intento de envío del formulario.

#### Scenario: Corregir un campo tras un envío fallido
- **WHEN** un envío fallido marca un campo como inválido y el usuario modifica su valor sin volver a pulsar "Enviar"
- **THEN** el mensaje de error y el marcado visual de ese campo desaparecen de inmediato

### Requirement: El formulario se vacía tras un alta con éxito
_Rama: `candidate-form-ux-fixes-AGB` (commit `700fc68`)_

El sistema SHALL restablecer todos los campos del formulario, incluido el selector de CV, a su estado inicial vacío inmediatamente después de un alta de candidato con éxito.

#### Scenario: Alta consecutiva de dos candidatos
- **WHEN** un reclutador completa un alta con éxito y a continuación empieza a rellenar los datos de un segundo candidato
- **THEN** ningún campo (incluido el fichero de CV ya subido) conserva los valores del candidato anterior

