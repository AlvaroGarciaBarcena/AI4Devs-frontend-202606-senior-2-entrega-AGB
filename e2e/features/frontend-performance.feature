# Fuente: openspec/specs/frontend-performance/spec.md (rama code-splitting-AGB, commit 947bbc3)
Feature: Carga diferida de las pantallas protegidas

  # Requirement: Carga diferida de las pantallas protegidas
  Scenario: Primera visita sin sesión iniciada
    Given alguien sin sesión iniciada
    When visita la aplicación por primera vez
    Then el código de las pantallas protegidas no se descarga

  # Requirement: Carga diferida de las pantallas protegidas
  Scenario: Visitar una pantalla no descarga las demás
    Given un usuario autenticado que nunca ha visitado la pantalla de alta de candidato en esa sesión
    When visita el listado de posiciones
    Then el código de la pantalla de alta de candidato no llega a descargarse en esa sesión

  # Requirement: Indicación visible mientras carga una pantalla
  #
  # HALLAZGO SIN CORREGIR (ver e2e/steps/frontend-performance.steps.ts):
  # probado de verdad retrasando el chunk de AddCandidateForm.jsx 800ms,
  # el <Suspense fallback> nunca llega a mostrarse durante una navegación
  # real por <Link> -- la pantalla anterior se queda en pantalla, inmóvil,
  # hasta que el contenido nuevo está listo, sin ninguna señal intermedia.
  # Requiere una decisión de arquitectura (no una corrección de una línea),
  # documentada en prompts-AGB.md para que el usuario decida el enfoque.
  Scenario: Navegar a una pantalla todavía no descargada
    Given un usuario autenticado está en una pantalla cuyo código ya se descargó
    When navega por primera vez a otra pantalla protegida cuyo código aún no se ha descargado
    Then ve una indicación de carga hasta que la pantalla está lista para mostrarse
