## MODIFIED Requirements

### Requirement: Construcción del frontend con Vite
_Rama: `vite-migration-AGB` (commit `6b25e95`)_

El frontend SHALL construirse con Vite, sobre la versión más reciente de TypeScript compatible con su cadena de *linting* (`typescript-eslint`), en vez de Create React App.

#### Scenario: Build de producción
- **GIVEN** el código fuente del frontend en su estado actual
- **WHEN** se ejecuta `npm run build`
- **THEN** el build se completa sin errores, usando Vite como herramienta de construcción, sin ninguna dependencia de `react-scripts`

#### Scenario: Arranque del entorno de desarrollo
- **GIVEN** el código fuente del frontend en su estado actual
- **WHEN** se ejecuta `npm run dev`
- **THEN** el servidor de desarrollo arranca sobre Vite en menos de un segundo

### Requirement: Cobertura de tests automáticos, sin falsos resultados
_Rama: `tests-AGB` (commit `33eb8e7`) / `react-router-v7-AGB` (commit `64b4d19`)_

El backend y el frontend SHALL tener una suite de tests automáticos que cubra la validación de candidatos, la autenticación y los servicios principales, ejecutable sin necesidad de una base de datos ni de servidores en marcha, y el proceso de build SHALL mantener los ficheros de test fuera del código compilado para que no se dupliquen ni distorsionen el resultado de la suite.

#### Scenario: Ejecutar la suite completa
- **GIVEN** ni la base de datos ni ningún servidor de la aplicación están arrancados
- **WHEN** se ejecuta `npx jest` en el backend o `npm test` en el frontend
- **THEN** todos los tests se ejecutan y terminan en verde

#### Scenario: Ejecutar los tests después de un build
- **GIVEN** se acaba de ejecutar `npm run build` en el backend
- **WHEN** a continuación se ejecuta `npx jest`
- **THEN** el resultado de los tests es el mismo que sin haber ejecutado el build antes, porque los ficheros de test no se compilan a `dist/`

### Requirement: Dependencia de enrutado sin vulnerabilidades conocidas
_Rama: `react-router-v7-AGB` (commit `cbf7c3a`)_

El frontend SHALL mantener `react-router-dom` en una versión sin vulnerabilidades conocidas alcanzables con el uso real que la aplicación hace de la librería.

#### Scenario: Auditoría de dependencias del frontend
- **GIVEN** las dependencias del frontend en su versión actual
- **WHEN** se ejecuta una auditoría de vulnerabilidades sobre ellas
- **THEN** no se reporta ninguna vulnerabilidad de `react-router-dom` ni de sus dependencias
