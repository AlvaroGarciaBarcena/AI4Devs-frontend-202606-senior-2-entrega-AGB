## MODIFIED Requirements

### Requirement: Carga diferida de las pantallas protegidas
_Rama: `code-splitting-AGB` (commit `947bbc3`)_

El sistema SHALL descargar el código de cada pantalla protegida por sesión (panel del reclutador, alta de candidato, listado de posiciones, proceso de selección) solo la primera vez que se visita, no como parte de la carga inicial de la aplicación.

#### Scenario: Primera visita sin sesión iniciada
- **GIVEN** alguien sin sesión iniciada
- **WHEN** visita la aplicación por primera vez
- **THEN** el código de las pantallas protegidas no se descarga hasta que esa persona inicia sesión y visita cada una

#### Scenario: Visitar una pantalla no descarga las demás
- **GIVEN** un usuario autenticado que nunca ha visitado la pantalla de alta de candidato en esa sesión
- **WHEN** visita el listado de posiciones
- **THEN** el código de la pantalla de alta de candidato no llega a descargarse en esa sesión

### Requirement: Indicación visible mientras carga una pantalla
_Rama: `code-splitting-AGB` (commit `947bbc3`)_

El sistema SHALL mostrar una indicación de carga, anunciada a tecnología de asistencia, mientras el código de una pantalla protegida se está descargando.

#### Scenario: Navegar a una pantalla todavía no descargada
- **GIVEN** un usuario autenticado está en una pantalla cuyo código ya se descargó
- **WHEN** navega por primera vez a otra pantalla protegida cuyo código aún no se ha descargado
- **THEN** ve una indicación de carga hasta que la pantalla está lista para mostrarse
