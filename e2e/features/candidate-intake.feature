# Fuente: openspec/specs/candidate-intake/spec.md
Feature: Alta de candidatos

  # Requirement: Alta de candidato con datos básicos (rama backend-AGB/frontend-AGB)
  Scenario: Alta con éxito
    Given el reclutador está en el formulario de alta de candidato
    When envía nombre, apellidos, email y una posición válidos
    Then el sistema crea el candidato y muestra el mensaje de éxito

  # Requirement: Alta de candidato con datos básicos (rama backend-AGB/frontend-AGB)
  Scenario: Email duplicado
    Given ya existe un candidato con un email concreto
    When se intenta dar de alta a otro candidato con ese mismo email
    Then el sistema rechaza el alta con un mensaje que indica que el email ya existe

  # Requirement: Historial académico opcional (rama frontend-AGB)
  Scenario: Añadir una entrada de educación
    Given el reclutador está en el formulario de alta de candidato
    When pulsa "Añadir Educación" y rellena institución, título y fecha de inicio, y completa el resto del alta
    Then esa entrada se guarda asociada al candidato tras el envío

  # Requirement: Historial académico opcional (rama frontend-AGB)
  Scenario: Quitar una entrada antes de enviar
    Given el formulario tiene una entrada de educación ya añadida
    When el reclutador pulsa "Eliminar" sobre esa entrada
    Then esa entrada desaparece del formulario y no se envía con el alta

  # Requirement: Experiencia laboral opcional (rama frontend-AGB)
  Scenario: Añadir una entrada de experiencia
    Given el reclutador está en el formulario de alta de candidato
    When pulsa "Añadir Experiencia Laboral" y rellena empresa, puesto y fecha de inicio, y completa el resto del alta
    Then esa entrada de experiencia se guarda asociada al candidato tras el envío

  # Requirement: Elegir posición es opcional; si se elige, debe ser válida (rama position-selector-AGB)
  Scenario: Alta con posición válida
    Given existe al menos una posición con su flujo de entrevistas configurado
    When el reclutador elige esa posición en el desplegable y completa el resto del formulario
    Then el candidato se crea y aparece en la primera fase del tablero "Ver proceso" de esa posición

  # Requirement: Elegir posición es opcional; si se elige, debe ser válida (rama unassigned-candidates-AGB)
  Scenario: Alta sin elegir posición
    Given el reclutador ha rellenado el resto del formulario pero no ha elegido ninguna posición
    When lo envía
    Then el candidato se crea con éxito, sin ninguna candidatura asociada

  # Requirement: Elegir posición es opcional; si se elige, debe ser válida (rama position-selector-AGB)
  Scenario: Posición elegida sin flujo de entrevistas configurado
    Given la posición elegida existe pero su flujo de entrevistas no tiene ninguna fase
    When se envía el alta con esa posición
    Then el sistema la rechaza con un mensaje que indica que esa posición no tiene un proceso de entrevistas configurado

  # Requirement: El error de un campo se limpia al corregirlo (rama candidate-form-ux-fixes-AGB)
  Scenario: Corregir un campo tras un envío fallido
    Given un envío fallido ha marcado un campo como inválido
    When el usuario modifica su valor sin volver a pulsar "Enviar"
    Then el mensaje de error y el marcado visual de ese campo desaparecen de inmediato

  # Requirement: El formulario se vacía tras un alta con éxito (rama candidate-form-ux-fixes-AGB)
  Scenario: Alta consecutiva de dos candidatos
    Given un reclutador acaba de completar un alta de candidato con éxito
    When empieza a rellenar los datos de un segundo candidato
    Then ningún campo conserva los valores del candidato anterior
