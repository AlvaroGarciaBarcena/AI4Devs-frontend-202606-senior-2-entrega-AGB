## MODIFIED Requirements

### Requirement: Tipos de fichero aceptados
_Rama: `frontend-AGB` (commit `d92752d`)_

El sistema SHALL aceptar únicamente ficheros PDF o DOCX como CV, rechazando cualquier otro tipo declarado.

#### Scenario: Subida de un tipo no permitido
- **GIVEN** un fichero que no declara ser PDF ni DOCX
- **WHEN** se intenta subirlo como CV
- **THEN** el sistema rechaza la subida con un mensaje indicando que solo se admiten esos dos tipos

### Requirement: Límite de tamaño
_Rama: `frontend-AGB` (commit `d92752d`)_

El sistema SHALL rechazar cualquier fichero de CV que supere los 10 MB.

#### Scenario: Fichero demasiado grande
- **GIVEN** un fichero de CV que supera los 10 MB
- **WHEN** se intenta subirlo
- **THEN** el sistema rechaza la subida

### Requirement: El nombre de fichero guardado nunca sale del directorio de subidas
_Rama: `security-audit-AGB` (commit `8b31eb5`)_

El sistema SHALL derivar el nombre final del fichero guardado únicamente del nombre base del fichero original (sin componentes de ruta), de forma que ninguna subida pueda escribir fuera del directorio de subidas, con independencia de lo que contenga el nombre original.

#### Scenario: Nombre de fichero con componentes de ruta
- **GIVEN** un fichero cuyo nombre original contiene segmentos como `../`
- **WHEN** se sube ese fichero
- **THEN** se guarda igualmente dentro del directorio de subidas, con un nombre que no contiene esos segmentos

### Requirement: El selector de fichero se muestra en el idioma activo
_Rama: `tests-AGB` (commit `d5a4328`)_

El sistema SHALL mostrar el texto del botón de selección de fichero y el estado ("ningún archivo seleccionado" / nombre del fichero elegido) en el idioma activo de la interfaz, sin depender del idioma del sistema operativo o navegador de quien lo usa.

#### Scenario: Interfaz en español
- **GIVEN** el idioma activo de la interfaz es español
- **WHEN** se muestra el selector de fichero del CV
- **THEN** el botón de selección de fichero y el texto de estado se muestran en español, no en el idioma del navegador

#### Scenario: Interfaz en inglés
- **GIVEN** el idioma activo de la interfaz es inglés
- **WHEN** se muestra el selector de fichero del CV
- **THEN** el botón de selección de fichero y el texto de estado se muestran en inglés
