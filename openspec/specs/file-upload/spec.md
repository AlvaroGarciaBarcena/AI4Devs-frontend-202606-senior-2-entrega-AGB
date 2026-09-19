# file-upload Specification

## Purpose
Permite adjuntar el CV de un candidato como parte de su alta, guardándolo en el servidor de forma segura y con la selección de fichero traducida al idioma activo de la interfaz.
## Requirements
### Requirement: Tipos de fichero aceptados
_Rama: `frontend-AGB` (commit `d92752d`)_

El sistema SHALL aceptar únicamente ficheros PDF o DOCX como CV, rechazando cualquier otro tipo declarado.

#### Scenario: Subida de un tipo no permitido
- **WHEN** se intenta subir un fichero que no declara ser PDF ni DOCX
- **THEN** el sistema rechaza la subida con un mensaje indicando que solo se admiten esos dos tipos

### Requirement: Límite de tamaño
_Rama: `frontend-AGB` (commit `d92752d`)_

El sistema SHALL rechazar cualquier fichero de CV que supere los 10 MB.

#### Scenario: Fichero demasiado grande
- **WHEN** el fichero subido supera los 10 MB
- **THEN** el sistema rechaza la subida

### Requirement: El nombre de fichero guardado nunca sale del directorio de subidas
_Rama: `security-audit-AGB` (commit `8b31eb5`)_

El sistema SHALL derivar el nombre final del fichero guardado únicamente del nombre base del fichero original (sin componentes de ruta), de forma que ninguna subida pueda escribir fuera del directorio de subidas, con independencia de lo que contenga el nombre original.

#### Scenario: Nombre de fichero con componentes de ruta
- **WHEN** el nombre original del fichero subido contiene segmentos como `../`
- **THEN** el fichero se guarda igualmente dentro del directorio de subidas, con un nombre que no contiene esos segmentos

### Requirement: El selector de fichero se muestra en el idioma activo
_Rama: `tests-AGB` (commit `d5a4328`)_

El sistema SHALL mostrar el texto del botón de selección de fichero y el estado ("ningún archivo seleccionado" / nombre del fichero elegido) en el idioma activo de la interfaz, sin depender del idioma del sistema operativo o navegador de quien lo usa.

#### Scenario: Interfaz en español
- **WHEN** el idioma activo de la interfaz es español
- **THEN** el botón de selección de fichero y el texto de estado se muestran en español, no en el idioma del navegador

#### Scenario: Interfaz en inglés
- **WHEN** el idioma activo de la interfaz es inglés
- **THEN** el botón de selección de fichero y el texto de estado se muestran en inglés

