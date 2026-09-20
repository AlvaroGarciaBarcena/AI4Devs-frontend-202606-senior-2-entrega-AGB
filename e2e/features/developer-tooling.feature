# Fuente: openspec/specs/developer-tooling/spec.md
Feature: Construcción, tests y dependencias de la herramienta de desarrollo

  # Requirement: Construcción del frontend con Vite (rama vite-migration-AGB)
  Scenario: Build de producción
    Given el código fuente del frontend en su estado actual
    When se ejecuta "npm run build"
    Then el build se completa sin errores, usando Vite, sin ninguna dependencia de react-scripts

  # Requirement: Construcción del frontend con Vite (rama vite-migration-AGB)
  Scenario: Arranque del entorno de desarrollo
    Given el código fuente del frontend en su estado actual
    When se ejecuta "npm run dev"
    Then el servidor de desarrollo arranca sobre Vite en menos de un segundo

  # Requirement: Cobertura de tests automáticos, sin falsos resultados (rama tests-AGB/react-router-v7-AGB)
  Scenario: Ejecutar la suite completa
    Given ni la base de datos ni ningún servidor de la aplicación están arrancados
    When se ejecuta "npx jest" en el backend y "npm test" en el frontend
    Then todos los tests se ejecutan y terminan en verde

  # Requirement: Cobertura de tests automáticos, sin falsos resultados (rama tests-AGB/react-router-v7-AGB)
  Scenario: Ejecutar los tests después de un build
    Given se acaba de ejecutar "npm run build" en el backend
    When a continuación se ejecuta "npx jest"
    Then el resultado de los tests es el mismo que sin haber ejecutado el build antes

  # Requirement: Dependencia de enrutado sin vulnerabilidades conocidas (rama react-router-v7-AGB)
  Scenario: Auditoría de dependencias del frontend
    Given las dependencias del frontend en su versión actual
    When se ejecuta una auditoría de vulnerabilidades sobre las dependencias del frontend
    Then no se reporta ninguna vulnerabilidad de react-router-dom ni de sus dependencias
