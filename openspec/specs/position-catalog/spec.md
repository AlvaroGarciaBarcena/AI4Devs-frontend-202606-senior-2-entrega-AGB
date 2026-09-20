# position-catalog Specification

## Purpose
Muestra a los reclutadores el listado de posiciones de la empresa, con sus datos reales, para poder navegar al proceso de selección de cada una.
## Requirements
### Requirement: Listado de posiciones con datos reales
_Rama: `positions-proceso-AGB` (commit `cd86b57`)_

El sistema SHALL mostrar el listado de posiciones existentes con su título, empresa, ubicación, estado y fecha límite de aplicación, obtenidos de la base de datos real, no de datos de ejemplo fijos en el código.

#### Scenario: Carga del listado
- **GIVEN** existen posiciones reales en la base de datos
- **WHEN** un reclutador autenticado visita la pantalla de posiciones
- **THEN** ve el título, la empresa, la ubicación, el estado y la fecha límite de cada posición existente

### Requirement: Cada posición ofrece acceso a su proceso de selección
_Rama: `positions-proceso-AGB` (commit `cd86b57`)_

El sistema SHALL ofrecer, para cada posición listada, un enlace a su tablero de proceso de selección.

#### Scenario: Navegar al proceso de una posición
- **GIVEN** el reclutador está en la pantalla de posiciones
- **WHEN** pulsa "Ver proceso" sobre una posición
- **THEN** el sistema navega al tablero de esa posición concreta

### Requirement: Filtrar el listado por título, fecha límite y estado
_Rama: `positions-filter-AGB`_

El sistema SHALL permitir filtrar el listado de posiciones por título (subcadena, sin distinguir mayúsculas), por fecha límite (posiciones cuya fecha límite sea esa fecha o anterior) y por estado (coincidencia exacta), combinando los tres filtros a la vez. Cuando existen posiciones pero ninguna cumple los filtros activos, el sistema SHALL mostrar una indicación de que ninguna coincide, distinta de la indicación de que no hay posiciones en absoluto.

#### Scenario: Filtrar por título
- **GIVEN** existen varias posiciones con títulos distintos
- **WHEN** el reclutador escribe una parte del título de una de ellas en el buscador
- **THEN** solo se muestran las posiciones cuyo título contiene ese texto

#### Scenario: Ningún resultado para los filtros activos
- **GIVEN** existen posiciones, pero ninguna cumple el filtro de estado elegido
- **WHEN** el reclutador aplica ese filtro
- **THEN** el sistema indica que ninguna posición coincide con los filtros, no que no hay posiciones

