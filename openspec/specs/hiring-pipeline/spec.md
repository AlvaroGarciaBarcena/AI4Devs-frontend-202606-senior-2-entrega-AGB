# hiring-pipeline Specification

## Purpose
Muestra, para una posición concreta, en qué fase del proceso de entrevistas está cada candidato que se presenta a ella.
## Requirements
### Requirement: Candidatos agrupados por fase de entrevista
_Rama: `positions-proceso-AGB` (commit `cd86b57`)_

El sistema SHALL mostrar, para una posición dada, sus candidatos agrupados en columnas por la fase de entrevista en la que se encuentra cada uno, con el nombre completo del candidato y la puntuación media de sus entrevistas ya realizadas.

#### Scenario: Posición con candidatos en distintas fases
- **WHEN** una posición tiene candidatos en más de una fase de su proceso
- **THEN** el tablero los agrupa en una columna por fase, mostrando el nombre y la puntuación media de cada uno

#### Scenario: Fase sin candidatos
- **WHEN** una fase del proceso de una posición no tiene ningún candidato todavía
- **THEN** esa columna se muestra vacía con una indicación de que no hay candidatos en esa fase, en vez de ocultarse

### Requirement: Una candidatura nueva aparece en la primera fase
_Rama: `position-selector-AGB` (commit `096120b`)_

El sistema SHALL mostrar en la columna de la primera fase del proceso a todo candidato dado de alta con esa posición elegida, sin necesidad de ninguna acción manual adicional.

#### Scenario: Alta de candidato reflejada en el tablero
- **WHEN** se da de alta un candidato eligiendo una posición concreta
- **THEN** ese candidato aparece de inmediato en la primera columna del tablero de esa posición, con puntuación media de 0 al no tener entrevistas todavía

