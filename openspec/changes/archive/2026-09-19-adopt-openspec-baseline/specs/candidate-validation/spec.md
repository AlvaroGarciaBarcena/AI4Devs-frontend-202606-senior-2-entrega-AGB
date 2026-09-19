## Purpose

Define las reglas que debe cumplir cada campo de un candidato y la arquitectura de errores que permite mostrar un motivo específico y traducible en vez de un mensaje genérico.

## ADDED Requirements

### Requirement: Errores de validación estructurados, no texto plano
_Rama: `candidate-validation-i18n-a11y-AGB` (commit `f120a08`)_

El sistema SHALL reportar cada fallo de validación como un código estructurado (`{field, code, params}`) en vez de un mensaje ya redactado, y SHALL acumular todos los fallos de una petición en vez de detenerse en el primero.

#### Scenario: Varios campos inválidos a la vez
- **WHEN** un alta de candidato falla en nombre, apellidos y email simultáneamente
- **THEN** la respuesta incluye un issue por cada uno de los tres campos, no solo el primero

#### Scenario: El backend nunca redacta el mensaje final
- **WHEN** el backend rechaza un campo
- **THEN** la respuesta contiene el código del motivo (p. ej. `required`, `invalidFormat`) y el campo afectado, sin ningún texto ya traducido a un idioma concreto

### Requirement: Reglas de formato de nombre y apellidos
_Rama: `backend-AGB` (commit `24f86fd`)_

El sistema SHALL exigir que nombre y apellidos tengan entre 2 y 100 caracteres y contengan solo letras (incluidas tildes y la ñ) y espacios.

#### Scenario: Carácter no permitido
- **WHEN** el apellido contiene un carácter que no es letra ni espacio (p. ej. un guión bajo)
- **THEN** el sistema reporta qué carácter concreto no está permitido, no un mensaje genérico de formato inválido

### Requirement: Formato de email
_Rama: `backend-AGB` (commit `24f86fd`)_

El sistema SHALL exigir que el email tenga un formato válido (usuario@dominio) y SHALL ser obligatorio.

#### Scenario: Email sin arroba
- **WHEN** el email no contiene una arroba y un dominio válidos
- **THEN** el sistema rechaza el alta con el código de formato inválido para ese campo

### Requirement: Formato de teléfono, con motivo explícito
_Rama: `candidate-form-ux-fixes-AGB` (commit `9e425e0`)_

El teléfono es opcional; si se proporciona, el sistema SHALL exigir exactamente 9 dígitos que empiecen por 6, 7 o 9, y SHALL reportarlo con un código específico que permita explicar la regla, distinto del código genérico de formato inválido que comparten otros campos.

#### Scenario: Teléfono con prefijo incorrecto
- **WHEN** el teléfono tiene 9 dígitos pero no empieza por 6, 7 ni 9
- **THEN** el sistema lo rechaza con el código específico de formato de teléfono, no el genérico

#### Scenario: Teléfono vacío
- **WHEN** el campo de teléfono se deja vacío
- **THEN** el sistema no lo reporta como error, porque es opcional

### Requirement: Límite de entradas por candidato
_Rama: `security-audit-AGB` (commit `8b31eb5`)_

El sistema SHALL rechazar un alta cuyos arrays de educación o experiencia laboral superen las 20 entradas, sin validar ni procesar las entradas individuales cuando se supera el límite.

#### Scenario: Más de 20 educaciones en una sola petición
- **WHEN** una petición de alta incluye 21 entradas de educación
- **THEN** el sistema la rechaza señalando que se ha superado el número máximo de entradas, sin evaluar cada entrada por separado

### Requirement: Longitud máxima de dirección
_Rama: `backend-AGB` (commit `24f86fd`)_

La dirección es opcional; si se proporciona, el sistema SHALL rechazarla si supera los 100 caracteres.

#### Scenario: Dirección demasiado larga
- **WHEN** la dirección proporcionada supera los 100 caracteres
- **THEN** el sistema la rechaza indicando el límite máximo permitido
