# Fuente: openspec/specs/accessibility/spec.md (rama candidate-validation-i18n-a11y-AGB, commit f120a08/86df0ff)
Feature: Accesibilidad del formulario de alta y del selector de idioma

  # Requirement: Idioma de la página anunciado correctamente
  Scenario: Cambio de idioma
    Given la interfaz está mostrando cualquiera de los dos idiomas soportados
    When el usuario cambia el idioma activo de la interfaz
    Then el atributo de idioma de la página se actualiza al nuevo idioma sin recargar

  # Requirement: Errores y éxito anunciados a lectores de pantalla
  Scenario: Error de validación tras un envío fallido
    Given el formulario de alta de candidato contiene datos que no pasarán la validación
    When un envío del formulario falla por validación
    Then el resumen de errores se anuncia de inmediato a un lector de pantalla como una alerta

  # Requirement: Errores y éxito anunciados a lectores de pantalla
  Scenario: Alta con éxito
    Given el formulario de alta de candidato contiene datos válidos, incluida una posición elegida
    When un alta de candidato se completa con éxito
    Then el mensaje de éxito se anuncia de forma no intrusiva

  # Requirement: Campos inválidos identificados programáticamente
  Scenario: Campo con error
    Given un envío del formulario ha fallado la validación de al menos un campo
    When un campo del formulario tiene un error de validación
    Then ese campo queda marcado como inválido y referencia el elemento que contiene su mensaje de error específico

  # Requirement: Selector de idioma con estado accesible
  Scenario: Consultar el idioma activo con un lector de pantalla
    Given el selector de idioma está visible con uno de los dos idiomas activo
    When un lector de pantalla recorre el selector de idioma
    Then anuncia cuál de las dos opciones está actualmente seleccionada
