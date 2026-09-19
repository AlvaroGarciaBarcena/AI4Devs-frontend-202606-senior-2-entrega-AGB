# Fuente: openspec/specs/authentication/spec.md (rama api-auth-AGB, commit bb94850)
Feature: Autenticación

  # Requirement: Inicio de sesión con email y contraseña
  Scenario: Credenciales correctas
    Given existe un empleado activo con una contraseña asignada
    When ese empleado inicia sesión con su email y su contraseña correcta
    Then el sistema le deja entrar y muestra su nombre en la aplicación

  # Requirement: Inicio de sesión con email y contraseña
  Scenario: Credenciales incorrectas
    Given existe un empleado activo con una contraseña asignada
    When ese empleado intenta iniciar sesión con su email y una contraseña incorrecta
    Then el sistema muestra el mismo mensaje genérico de error, sin decir qué fue exactamente lo incorrecto

  # Requirement: Las rutas de negocio exigen sesión iniciada
  Scenario: Petición sin token
    Given no se envía ningún token de sesión
    When se solicita el listado de posiciones a la API
    Then el sistema rechaza la petición con un 401, sin revelar más información

  # Requirement: Las rutas de negocio exigen sesión iniciada
  Scenario: Token caducado
    Given existe un token de sesión emitido hace más de 8 horas
    When se usa ese token para solicitar el listado de posiciones a la API
    Then el sistema lo rechaza igual que si no se hubiera enviado ningún token

  # Requirement: Límite de intentos de inicio de sesión
  Scenario: Muchos intentos seguidos
    Given un mismo origen ya ha agotado el número de intentos de login permitidos en los últimos 15 minutos
    When ese origen realiza un intento adicional de inicio de sesión
    Then el sistema rechaza el intento con un código de límite de peticiones alcanzado

  # Requirement: Cierre de sesión y expiración manejados en el cliente
  Scenario: Cierre de sesión manual
    Given un usuario tiene una sesión iniciada y visible en la interfaz
    When pulsa "Cerrar sesión"
    Then el sistema borra la sesión guardada y muestra la pantalla de inicio de sesión

  # Requirement: Cierre de sesión y expiración manejados en el cliente
  Scenario: Sesión caducada durante el uso
    Given el cliente tiene guardada una sesión cuyo token ya no es válido en el servidor
    When esa persona navega a una pantalla que hace una petición a la API
    Then el sistema borra la sesión guardada y redirige a la pantalla de inicio de sesión, sin intervención del usuario
