## MODIFIED Requirements

### Requirement: Inicio de sesión con email y contraseña
_Rama: `api-auth-AGB` (commit `bb94850`)_

El sistema SHALL permitir iniciar sesión con el email y la contraseña de un empleado dado de alta, devolviendo un token de sesión válido durante 8 horas si las credenciales son correctas.

#### Scenario: Credenciales correctas
- **GIVEN** existe un empleado activo con una contraseña asignada
- **WHEN** ese empleado envía su email y su contraseña correcta
- **THEN** el sistema responde con un token de sesión y los datos del empleado, sin incluir el hash de la contraseña

#### Scenario: Credenciales incorrectas, empleado inexistente o desactivado
- **GIVEN** el email enviado no corresponde a una cuenta válida y activa con contraseña asignada, o la contraseña enviada es incorrecta
- **WHEN** se intenta iniciar sesión con esos datos
- **THEN** el sistema responde con el mismo mensaje genérico en los cuatro casos, sin indicar cuál de ellos ha ocurrido

### Requirement: Las rutas de negocio exigen sesión iniciada
_Rama: `api-auth-AGB` (commit `bb94850`)_

El sistema SHALL exigir un token de sesión válido para acceder a los candidatos, las posiciones y la subida de ficheros, rechazando cualquier petición sin token o con un token inválido o caducado.

#### Scenario: Petición sin token
- **GIVEN** no se envía ningún token de sesión
- **WHEN** se solicita cualquier dato de candidatos o posiciones
- **THEN** el sistema rechaza la petición sin revelar más información

#### Scenario: Token caducado
- **GIVEN** existe un token de sesión emitido hace más de 8 horas
- **WHEN** se usa ese token en una petición
- **THEN** el sistema lo rechaza igual que si no se hubiera enviado ningún token

### Requirement: Límite de intentos de inicio de sesión
_Rama: `api-auth-AGB` (commit `bb94850`)_

El sistema SHALL limitar el número de intentos de inicio de sesión aceptados desde un mismo origen en una ventana de 15 minutos, de forma más estricta que el límite general de peticiones del resto de la API.

#### Scenario: Muchos intentos seguidos
- **GIVEN** un mismo origen ya ha agotado el número de intentos de login permitidos en los últimos 15 minutos
- **WHEN** ese origen realiza un intento adicional de inicio de sesión
- **THEN** el sistema rechaza el intento hasta que la ventana se reinicie

### Requirement: Cierre de sesión y expiración manejados en el cliente
_Rama: `api-auth-AGB` (commit `bb94850`)_

El sistema SHALL cerrar la sesión localmente y redirigir a la pantalla de inicio de sesión tanto cuando el usuario pulsa "Cerrar sesión" como cuando cualquier petición recibe un rechazo por token inválido o caducado.

#### Scenario: Cierre de sesión manual
- **GIVEN** un usuario tiene una sesión iniciada y visible en la interfaz
- **WHEN** pulsa "Cerrar sesión"
- **THEN** el sistema borra la sesión guardada y muestra la pantalla de inicio de sesión

#### Scenario: Sesión caducada durante el uso
- **GIVEN** el cliente tiene guardada una sesión cuyo token ya no es válido en el servidor
- **WHEN** una petición realizada con esa sesión recibe un rechazo del servidor
- **THEN** el sistema borra la sesión guardada y redirige a la pantalla de inicio de sesión, sin intervención del usuario
