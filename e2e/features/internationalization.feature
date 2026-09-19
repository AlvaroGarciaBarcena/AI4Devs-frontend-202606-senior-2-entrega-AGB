# Fuente: openspec/specs/internationalization/spec.md (rama candidate-validation-i18n-a11y-AGB)
Feature: Internacionalización de la interfaz

  # Requirement: Detección automática del idioma
  Scenario: Navegador con varios idiomas configurados
    Given el navegador tiene configurada una lista de idiomas en la que el español no es el primero pero sí aparece en la lista
    When se carga la aplicación por primera vez, sin ninguna elección de idioma guardada
    Then el sistema detecta español como idioma inicial

  # Requirement: Selector de idioma explícito
  Scenario: Cambio manual de idioma
    Given la interfaz está mostrando español
    When el usuario pulsa el botón "English" del selector
    Then toda la interfaz cambia a inglés de inmediato, y ese idioma se mantiene en visitas posteriores

  # Requirement: Toda la interfaz está traducida, no solo los mensajes de validación
  Scenario: Cambio de idioma con un formulario a medio rellenar
    Given un formulario con datos ya escritos por el usuario
    When el usuario cambia el idioma activo
    Then las etiquetas y botones cambian de idioma sin que se pierdan los datos ya introducidos

  # Requirement: Los mensajes de error ya visibles se retraducen sin reenviar
  Scenario: Cambiar de idioma con un error visible
    Given un envío fallido muestra un mensaje de error en español
    When el usuario cambia el idioma a inglés sin corregir nada
    Then el mismo mensaje de error se muestra en inglés, sin que el formulario se haya reenviado
