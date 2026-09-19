## Why

En `adopt-openspec-baseline` se decidió no crear una capacidad de spec para `vite-migration-AGB`, `react-router-v7-AGB` y `tests-AGB`, con el argumento de que no cambian *qué* hace el sistema, solo *cómo* está construido. El usuario lo corrigió: cómo está construido el sistema es un cambio real y debe quedar documentado igual que cualquier otra capacidad, no relegado a una mención de paso en el `proposal.md` de otro change.

La objeción original seguía siendo parcialmente válida — estos cambios no tienen escenarios de "un usuario hace X, el sistema responde Y" — pero eso solo significa que sus requisitos se verifican de otra forma (ejecutando un build, una suite de tests, una auditoría de dependencias), no que no sean requisitos. Este change añade la capacidad que faltaba.

## What Changes

- Nueva capacidad `developer-tooling`: herramienta de construcción del frontend, versión de TypeScript sostenida por esa herramienta, cobertura de tests automáticos (y su fiabilidad), y la dependencia de enrutado mantenida libre de vulnerabilidades conocidas.
- Sus escenarios se verifican ejecutando un comando (`npm run build`, `npx jest`, `npm audit`), no mediante una acción de un usuario final — se indica explícitamente en el `## Purpose` de la spec para que quede claro por qué el formato difiere del resto de capacidades.

## Capabilities

### New Capabilities
- `developer-tooling`: la herramienta de construcción del frontend, la versión de TypeScript que sostiene, la cobertura y fiabilidad de los tests automáticos, y la vigencia de las dependencias de enrutado frente a vulnerabilidades conocidas.

### Modified Capabilities
(ninguna)

## Impact

- Solo ficheros bajo `openspec/`; ningún fichero de la aplicación se toca.
- Corrige un hueco señalado explícitamente por el usuario en `adopt-openspec-baseline` (sección 3.24 de `prompts-AGB.md`).
