# Fuente: openspec/specs/security-hardening/spec.md (rama security-audit-AGB, commit 8b31eb5)
Feature: Seguridad transversal de la API

  # Requirement: Cabeceras de seguridad estándar
  Scenario: Cualquier respuesta de la API
    Given la API está en marcha
    When se realiza una petición que tiene éxito y otra que falla
    Then ambas respuestas incluyen las cabeceras de seguridad estándar

  # Requirement: Límite general de peticiones por origen
  Scenario: Volumen de peticiones dentro de lo normal
    Given un origen no ha superado el límite de peticiones configurado en los últimos 15 minutos
    When ese origen realiza un uso normal de la API
    Then ninguna de sus peticiones se ve afectada por el límite

  # Requirement: Contenido subido validado más allá de la extensión declarada
  Scenario: Fichero cuyo contenido no coincide con lo declarado
    Given un fichero cuyo contenido real no coincide con el tipo que declara al subirlo
    When se sube ese fichero
    Then el sistema lo rechaza en vez de tratarlo como de confianza solo por la extensión o el tipo declarado

  # Requirement: Dependencias sin vulnerabilidades conocidas alcanzables en producción
  Scenario: Auditoría de dependencias
    Given las dependencias de producción del backend y del frontend en su versión actual
    When se ejecuta una auditoría de vulnerabilidades sobre ellas
    Then no se reporta ninguna vulnerabilidad en las dependencias que se despliegan a producción
