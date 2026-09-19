## MODIFIED Requirements

### Requirement: Idioma de la página anunciado correctamente
_Rama: `candidate-validation-i18n-a11y-AGB` (commit `f120a08`)_

El sistema SHALL mantener el atributo de idioma de la página (`lang`) sincronizado con el idioma activo de la interfaz en todo momento (WCAG 2.1, criterio 3.1.1).

#### Scenario: Cambio de idioma
- **GIVEN** la interfaz está mostrando cualquiera de los dos idiomas soportados
- **WHEN** el usuario cambia el idioma activo de la interfaz
- **THEN** el atributo de idioma de la página se actualiza al nuevo idioma sin recargar

### Requirement: Errores y éxito anunciados a lectores de pantalla
_Rama: `candidate-validation-i18n-a11y-AGB` (commit `f120a08`)_

El sistema SHALL anunciar los mensajes de error de validación de forma asertiva y el mensaje de éxito de forma no intrusiva, sin exigir que el foco se mueva hasta ellos (WCAG 2.1, criterio 4.1.3).

#### Scenario: Error de validación tras un envío fallido
- **GIVEN** el formulario de alta de candidato contiene datos que no pasarán la validación
- **WHEN** un envío del formulario falla por validación
- **THEN** el resumen de errores se anuncia de inmediato a un lector de pantalla como una alerta

#### Scenario: Alta con éxito
- **GIVEN** el formulario de alta de candidato contiene datos válidos, incluida una posición elegida
- **WHEN** un alta de candidato se completa con éxito
- **THEN** el mensaje de éxito se anuncia de forma no intrusiva, sin interrumpir lo que el lector de pantalla estuviera leyendo

### Requirement: Campos inválidos identificados programáticamente
_Rama: `candidate-validation-i18n-a11y-AGB` (commit `f120a08`)_

El sistema SHALL marcar cada campo con un error de validación como inválido de forma programática y SHALL asociarlo con el texto de su mensaje de error concreto (WCAG 2.1, criterios 3.3.1 y 1.3.1).

#### Scenario: Campo con error
- **GIVEN** un envío del formulario ha fallado la validación de al menos un campo
- **WHEN** un campo del formulario tiene un error de validación
- **THEN** ese campo queda marcado como inválido y referencia el elemento que contiene su mensaje de error específico

### Requirement: Selector de idioma con estado accesible
_Rama: `candidate-validation-i18n-a11y-AGB` (commit `86df0ff`)_

El sistema SHALL comunicar a tecnología de asistencia cuál de las opciones del selector de idioma está activa en cada momento (WCAG 2.1, criterio 4.1.2).

#### Scenario: Consultar el idioma activo con un lector de pantalla
- **GIVEN** el selector de idioma está visible con uno de los dos idiomas activo
- **WHEN** un lector de pantalla recorre el selector de idioma
- **THEN** anuncia cuál de las dos opciones está actualmente seleccionada
