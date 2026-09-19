## Purpose

Reúne los controles transversales que protegen la API frente a abuso automatizado y a las clases de vulnerabilidad más comunes, encontrados y corregidos en una auditoría de seguridad exhaustiva.

## ADDED Requirements

### Requirement: Cabeceras de seguridad estándar
_Rama: `security-audit-AGB` (commit `8b31eb5`)_

El sistema SHALL enviar cabeceras HTTP de seguridad estándar (protección contra MIME-sniffing, política de contenido, entre otras) en todas las respuestas de la API.

#### Scenario: Cualquier respuesta de la API
- **WHEN** se realiza cualquier petición a la API
- **THEN** la respuesta incluye las cabeceras de seguridad estándar, con independencia de si la petición tiene éxito o falla

### Requirement: Límite general de peticiones por origen
_Rama: `security-audit-AGB` (commit `8b31eb5`)_

El sistema SHALL limitar el número de peticiones aceptadas desde un mismo origen en una ventana de 15 minutos, para todas las rutas de la API.

#### Scenario: Volumen de peticiones dentro de lo normal
- **WHEN** un mismo origen realiza un uso normal de la API dentro del límite configurado
- **THEN** ninguna de sus peticiones se ve afectada por el límite

### Requirement: Contenido subido validado más allá de la extensión declarada
_Rama: `security-audit-AGB` (commit `8b31eb5`)_

El sistema SHALL tratar como no confiable el tipo de contenido que declara quien sube un fichero, sin asumir que el contenido real coincide con la extensión o el tipo MIME declarados.

#### Scenario: Fichero cuyo contenido no coincide con lo declarado
- **WHEN** el contenido real de un fichero subido no coincide con el tipo que declara
- **THEN** el sistema no lo trata como si el contenido fuera de confianza solo por la extensión o el tipo declarado

### Requirement: Dependencias sin vulnerabilidades conocidas alcanzables en producción
_Rama: `security-audit-AGB` (commit `8b31eb5`)_

El sistema SHALL mantener sus dependencias de producción (backend y frontend) libres de vulnerabilidades conocidas alcanzables en tiempo de ejecución, verificado con una auditoría de dependencias.

#### Scenario: Auditoría de dependencias
- **WHEN** se ejecuta una auditoría de vulnerabilidades sobre las dependencias del backend y del frontend
- **THEN** no se reporta ninguna vulnerabilidad en las dependencias que se despliegan a producción
