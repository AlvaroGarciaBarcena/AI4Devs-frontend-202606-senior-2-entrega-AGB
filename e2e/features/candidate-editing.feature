# Fuente: openspec/specs/candidate-editing/spec.md (rama edit-candidate-AGB)
Feature: Edición de candidatos

  # Requirement: Editar los datos de un candidato existente
  Scenario: Editar los datos personales de un candidato
    Given un candidato existente
    When un reclutador accede a su edición, cambia su teléfono y guarda
    Then el cambio se guarda y se refleja al volver a cargar sus datos

  # Requirement: Una posición ya asignada no se puede cambiar desde la edición
  Scenario: Asignar una posición a un candidato sin asignar
    Given un candidato sin candidatura, y una posición con su flujo de entrevistas configurado
    When un reclutador edita ese candidato y le asigna esa posición
    Then el candidato aparece en la primera fase del tablero de esa posición, y deja de aparecer en el listado de candidatos sin asignar

  # Requirement: Una posición ya asignada no se puede cambiar desde la edición
  Scenario: El campo de posición está bloqueado para un candidato ya asignado
    Given un candidato con una candidatura ya asignada
    When un reclutador accede a su edición
    Then el desplegable de posición aparece deshabilitado, con una nota explicando que no se puede cambiar desde ahí
