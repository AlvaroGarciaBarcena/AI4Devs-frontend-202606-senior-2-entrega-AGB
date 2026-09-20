# Fuente: openspec/specs/hiring-pipeline/spec.md (rama positions-proceso-AGB, commit cd86b57)
Feature: Tablero de proceso de selección

  # Requirement: Candidatos agrupados por fase de entrevista
  Scenario: Posición con candidatos en distintas fases
    Given una posición tiene candidatos en más de una fase de su proceso
    When un reclutador visita el tablero "Ver proceso" de esa posición
    Then el tablero los agrupa en una columna por fase, mostrando el nombre y la puntuación media de cada uno

  # Requirement: Candidatos agrupados por fase de entrevista
  Scenario: Fase sin candidatos
    Given una fase del proceso de una posición no tiene ningún candidato todavía
    When un reclutador visita el tablero "Ver proceso" de esa posición
    Then esa columna se muestra vacía con una indicación de que no hay candidatos en esa fase

  # Requirement: Una candidatura nueva aparece en la primera fase
  Scenario: Alta de candidato reflejada en el tablero
    Given una posición con su flujo de entrevistas configurado
    When se da de alta un candidato eligiendo esa posición
    Then ese candidato aparece de inmediato en la primera columna del tablero de esa posición, con puntuación media de 0

  # Requirement: Listado de candidatos sin asignar
  Scenario: Ver los candidatos sin asignar
    Given existen candidatos dados de alta sin elegir posición
    When un reclutador visita el listado de candidatos sin asignar
    Then ve a cada uno de ellos con su nombre completo, email y fecha de alta, el más reciente primero

  # Requirement: Listado de candidatos sin asignar
  Scenario: Ningún candidato sin asignar
    Given no existe ningún candidato sin candidatura
    When un reclutador visita el listado de candidatos sin asignar
    Then ve una indicación de que no hay ninguno
