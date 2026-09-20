# candidate-editing Specification

## Purpose
Permite corregir o completar los datos de un candidato ya existente -- personales, historial profesional, y opcionalmente asignarle una posición si todavía no tenía ninguna -- reutilizando el mismo formulario que el alta, en vez de una pantalla de edición aparte.

## Requirements

### Requirement: Editar los datos de un candidato existente
_Rama: `edit-candidate-AGB`_

El sistema SHALL permitir editar los datos personales (nombre, apellido, email, teléfono, dirección) y el historial profesional (educación, experiencia laboral) de un candidato ya existente, reutilizando el formulario de alta de candidatos prellenado con sus datos actuales.

#### Scenario: Editar los datos personales de un candidato
- **GIVEN** un candidato existente
- **WHEN** un reclutador accede a su edición, cambia su teléfono y guarda
- **THEN** el cambio se guarda y se refleja al volver a cargar sus datos

### Requirement: Una posición ya asignada no se puede cambiar desde la edición
_Rama: `edit-candidate-AGB`_

El sistema SHALL permitir asignar una posición a un candidato que todavía no tiene ninguna candidatura, creando su candidatura en la primera fase del flujo de entrevistas de esa posición. El sistema SHALL bloquear el campo de posición, con una nota explicando el motivo, cuando el candidato ya tiene una candidatura asignada.

#### Scenario: Asignar una posición a un candidato sin asignar
- **GIVEN** un candidato sin candidatura, y una posición con su flujo de entrevistas configurado
- **WHEN** un reclutador edita ese candidato y le asigna esa posición
- **THEN** el candidato aparece en la primera fase del tablero de esa posición, y deja de aparecer en el listado de candidatos sin asignar

#### Scenario: El campo de posición está bloqueado para un candidato ya asignado
- **GIVEN** un candidato con una candidatura ya asignada
- **WHEN** un reclutador accede a su edición
- **THEN** el desplegable de posición aparece deshabilitado, con una nota explicando que no se puede cambiar desde ahí
