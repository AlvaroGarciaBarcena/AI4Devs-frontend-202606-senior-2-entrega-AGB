## MODIFIED Requirements

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
