## Purpose

Exige que quien usa la aplicación se identifique antes de acceder a datos de candidatos o posiciones, cerrando el acceso que antes era completamente abierto.

## ADDED Requirements

### Requirement: Inicio de sesión con email y contraseña
_Rama: `api-auth-AGB` (commit `bb94850`)_

El sistema SHALL permitir iniciar sesión con el email y la contraseña de un empleado dado de alta, devolviendo un token de sesión válido durante 8 horas si las credenciales son correctas.

#### Scenario: Credenciales correctas
- **WHEN** un empleado envía su email y su contraseña correcta
- **THEN** el sistema responde con un token de sesión y los datos del empleado, sin incluir el hash de la contraseña

#### Scenario: Credenciales incorrectas, empleado inexistente o desactivado
- **WHEN** el email no corresponde a ningún empleado, o la contraseña es incorrecta, o el empleado está desactivado, o no tiene contraseña asignada
- **THEN** el sistema responde con el mismo mensaje genérico en los cuatro casos, sin indicar cuál de ellos ha ocurrido

### Requirement: Las rutas de negocio exigen sesión iniciada
_Rama: `api-auth-AGB` (commit `bb94850`)_

El sistema SHALL exigir un token de sesión válido para acceder a los candidatos, las posiciones y la subida de ficheros, rechazando cualquier petición sin token o con un token inválido o caducado.

#### Scenario: Petición sin token
- **WHEN** se solicita cualquier dato de candidatos o posiciones sin incluir un token de sesión
- **THEN** el sistema rechaza la petición sin revelar más información

#### Scenario: Token caducado
- **WHEN** se usa un token de sesión de más de 8 horas de antigüedad
- **THEN** el sistema lo rechaza igual que si no se hubiera enviado ningún token

### Requirement: Límite de intentos de inicio de sesión
_Rama: `api-auth-AGB` (commit `bb94850`)_

El sistema SHALL limitar el número de intentos de inicio de sesión aceptados desde un mismo origen en una ventana de 15 minutos, de forma más estricta que el límite general de peticiones del resto de la API.

#### Scenario: Muchos intentos seguidos
- **WHEN** se realizan más intentos de inicio de sesión de los permitidos desde el mismo origen en 15 minutos
- **THEN** el sistema rechaza los intentos adicionales hasta que la ventana se reinicie

### Requirement: Cierre de sesión y expiración manejados en el cliente
_Rama: `api-auth-AGB` (commit `bb94850`)_

El sistema SHALL cerrar la sesión localmente y redirigir a la pantalla de inicio de sesión tanto cuando el usuario pulsa "Cerrar sesión" como cuando cualquier petición recibe un rechazo por token inválido o caducado.

#### Scenario: Cierre de sesión manual
- **WHEN** un usuario autenticado pulsa "Cerrar sesión"
- **THEN** el sistema borra la sesión guardada y muestra la pantalla de inicio de sesión

#### Scenario: Sesión caducada durante el uso
- **WHEN** una petición realizada con una sesión ya caducada recibe un rechazo del servidor
- **THEN** el sistema borra la sesión guardada y redirige a la pantalla de inicio de sesión, sin intervención del usuario
