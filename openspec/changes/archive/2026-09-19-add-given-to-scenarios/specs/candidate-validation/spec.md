## MODIFIED Requirements

### Requirement: Errores de validación estructurados, no texto plano
_Rama: `candidate-validation-i18n-a11y-AGB` (commit `f120a08`)_

El sistema SHALL reportar cada fallo de validación como un código estructurado (`{field, code, params}`) en vez de un mensaje ya redactado, y SHALL acumular todos los fallos de una petición en vez de detenerse en el primero.

#### Scenario: Varios campos inválidos a la vez
- **GIVEN** un alta de candidato con nombre, apellidos y email inválidos a la vez
- **WHEN** se envía esa alta
- **THEN** la respuesta incluye un issue por cada uno de los tres campos, no solo el primero

#### Scenario: El backend nunca redacta el mensaje final
- **GIVEN** un campo del alta no cumple su regla de validación
- **WHEN** el backend lo rechaza
- **THEN** la respuesta contiene el código del motivo (p. ej. `required`, `invalidFormat`) y el campo afectado, sin ningún texto ya traducido a un idioma concreto

### Requirement: Reglas de formato de nombre y apellidos
_Rama: `backend-AGB` (commit `24f86fd`)_

El sistema SHALL exigir que nombre y apellidos tengan entre 2 y 100 caracteres y contengan solo letras (incluidas tildes y la ñ) y espacios.

#### Scenario: Carácter no permitido
- **GIVEN** un alta de candidato cuyo apellido contiene un carácter que no es letra ni espacio (p. ej. un guión bajo)
- **WHEN** se envía esa alta
- **THEN** el sistema reporta qué carácter concreto no está permitido, no un mensaje genérico de formato inválido

### Requirement: Formato de email
_Rama: `backend-AGB` (commit `24f86fd`)_

El sistema SHALL exigir que el email tenga un formato válido (usuario@dominio) y SHALL ser obligatorio.

#### Scenario: Email sin arroba
- **GIVEN** un alta de candidato cuyo email no contiene una arroba y un dominio válidos
- **WHEN** se envía esa alta
- **THEN** el sistema la rechaza con el código de formato inválido para ese campo

### Requirement: Formato de teléfono, con motivo explícito
_Rama: `candidate-form-ux-fixes-AGB` (commit `9e425e0`)_

El teléfono es opcional; si se proporciona, el sistema SHALL exigir exactamente 9 dígitos que empiecen por 6, 7 o 9, y SHALL reportarlo con un código específico que permita explicar la regla, distinto del código genérico de formato inválido que comparten otros campos.

#### Scenario: Teléfono con prefijo incorrecto
- **GIVEN** un alta de candidato cuyo teléfono tiene 9 dígitos pero no empieza por 6, 7 ni 9
- **WHEN** se envía esa alta
- **THEN** el sistema lo rechaza con el código específico de formato de teléfono, no el genérico

#### Scenario: Teléfono vacío
- **GIVEN** un alta de candidato en la que el campo de teléfono se deja vacío
- **WHEN** se envía esa alta
- **THEN** el sistema no lo reporta como error, porque es opcional

### Requirement: Límite de entradas por candidato
_Rama: `security-audit-AGB` (commit `8b31eb5`)_

El sistema SHALL rechazar un alta cuyos arrays de educación o experiencia laboral superen las 20 entradas, sin validar ni procesar las entradas individuales cuando se supera el límite.

#### Scenario: Más de 20 educaciones en una sola petición
- **GIVEN** una petición de alta que incluye 21 entradas de educación
- **WHEN** se envía esa petición
- **THEN** el sistema la rechaza señalando que se ha superado el número máximo de entradas, sin evaluar cada entrada por separado

### Requirement: Longitud máxima de dirección
_Rama: `backend-AGB` (commit `24f86fd`)_

La dirección es opcional; si se proporciona, el sistema SHALL rechazarla si supera los 100 caracteres.

#### Scenario: Dirección demasiado larga
- **GIVEN** un alta de candidato cuya dirección supera los 100 caracteres
- **WHEN** se envía esa alta
- **THEN** el sistema la rechaza indicando el límite máximo permitido
