# frontend-performance Specification

## Purpose
Reduce la cantidad de código JavaScript que se descarga antes de que alguien pueda usar la aplicación, cargando cada pantalla solo cuando se visita.
## Requirements
### Requirement: Carga diferida de las pantallas protegidas
_Rama: `code-splitting-AGB` (commit `947bbc3`)_

El sistema SHALL descargar el código de cada pantalla protegida por sesión (panel del reclutador, alta de candidato, listado de posiciones, proceso de selección) solo la primera vez que se visita, no como parte de la carga inicial de la aplicación.

#### Scenario: Primera visita sin sesión iniciada
- **WHEN** alguien sin sesión iniciada visita la aplicación por primera vez
- **THEN** el código de las pantallas protegidas no se descarga hasta que esa persona inicia sesión y visita cada una

#### Scenario: Visitar una pantalla no descarga las demás
- **WHEN** un usuario autenticado visita el listado de posiciones sin visitar nunca la pantalla de alta de candidato
- **THEN** el código de la pantalla de alta de candidato no llega a descargarse en esa sesión

### Requirement: Indicación visible mientras carga una pantalla
_Rama: `code-splitting-AGB` (commit `947bbc3`)_

El sistema SHALL mostrar una indicación de carga, anunciada a tecnología de asistencia, mientras el código de una pantalla protegida se está descargando.

#### Scenario: Navegar a una pantalla todavía no descargada
- **WHEN** un usuario autenticado navega por primera vez a una pantalla cuyo código aún no se ha descargado
- **THEN** ve una indicación de carga hasta que la pantalla está lista para mostrarse

