# Fuente: openspec/specs/position-catalog/spec.md (rama positions-proceso-AGB, commit cd86b57)
Feature: Catálogo de posiciones

  # Requirement: Listado de posiciones con datos reales
  Scenario: Carga del listado
    Given existen posiciones reales en la base de datos
    When un reclutador autenticado visita la pantalla de posiciones
    Then ve el título, la empresa, la ubicación, el estado y la fecha límite de una posición existente

  # Requirement: Cada posición ofrece acceso a su proceso de selección
  Scenario: Navegar al proceso de una posición
    Given el reclutador está en la pantalla de posiciones
    When pulsa "Ver proceso" sobre una posición
    Then el sistema navega al tablero de esa posición concreta
