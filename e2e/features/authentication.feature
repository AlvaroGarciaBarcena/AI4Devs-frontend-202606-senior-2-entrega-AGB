# Fuente: openspec/specs/authentication/spec.md
# Requirement: Inicio de sesión con email y contraseña (rama api-auth-AGB, commit bb94850)
Feature: Autenticación

  Scenario: Credenciales correctas
    Given existe un empleado activo con una contraseña asignada
    When ese empleado inicia sesión con su email y su contraseña correcta
    Then el sistema le deja entrar y muestra su nombre en la aplicación
