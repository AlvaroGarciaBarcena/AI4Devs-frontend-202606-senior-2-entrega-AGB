# Fuente: openspec/specs/file-upload/spec.md
Feature: Subida del CV en el alta de candidato

  # Requirement: Tipos de fichero aceptados (rama frontend-AGB)
  Scenario: Subida de un tipo no permitido
    Given un fichero que no declara ser PDF ni DOCX
    When se intenta subirlo como CV
    Then el sistema rechaza la subida con un mensaje indicando que solo se admiten esos dos tipos

  # Requirement: Límite de tamaño (rama frontend-AGB)
  Scenario: Fichero demasiado grande
    Given un fichero de CV que supera los 10 MB
    When se intenta subirlo
    Then el sistema rechaza la subida

  # Requirement: El nombre de fichero guardado nunca sale del directorio de subidas (rama security-audit-AGB)
  Scenario: Nombre de fichero con componentes de ruta
    Given un fichero cuyo nombre original contiene segmentos como "../"
    When se sube ese fichero con ese nombre
    Then se guarda igualmente dentro del directorio de subidas, con un nombre que no contiene esos segmentos

  # Requirement: El selector de fichero se muestra en el idioma activo (rama tests-AGB)
  Scenario: Interfaz en español
    Given el idioma activo de la interfaz es español
    When se muestra el selector de fichero del CV
    Then el botón de selección de fichero y el texto de estado se muestran en español

  # Requirement: El selector de fichero se muestra en el idioma activo (rama tests-AGB)
  Scenario: Interfaz en inglés
    Given el idioma activo de la interfaz es inglés
    When se muestra el selector de fichero del CV
    Then el botón de selección de fichero y el texto de estado se muestran en inglés
