## Why

El esquema `spec-driven` de fábrica que se usó al adoptar OpenSpec (`adopt-openspec-baseline`, `add-developer-tooling-capability`) solo exige WHEN/THEN en cada escenario. El usuario señaló que, para un desarrollo que ha sido BDD de principio a fin, el `GIVEN` (el estado de partida) no es opcional — sin él, un escenario dice qué dispara el comportamiento y qué se espera, pero no desde qué contexto, que es justo lo que hace falta para escribir el `Given` de un `.feature` de Gherkin sin tener que inventarlo.

Se forkeó el esquema (`spec-driven` → `spec-driven-bdd`, ahora el esquema por defecto del proyecto) para que `GIVEN` sea parte de la plantilla, no una convención añadida a mano. Este change retrofita los 56 escenarios ya existentes (contados con `grep -c "^#### Scenario:"` sobre las 11 specs, no de memoria), escritos con el esquema antiguo, para que cumplan el nuevo formato.

## What Changes

- Las 11 specs existentes reciben un `GIVEN` en cada uno de sus 56 escenarios.
- Ningún requisito cambia de comportamiento — el `GIVEN` describe el contexto que ya estaba implícito en cada escenario (y verificado al escribirlo), no añade ninguna regla nueva.
- No se toca la línea de trazabilidad (`_Rama: ..._`) de ningún requisito.

## Capabilities

### New Capabilities
(ninguna)

### Modified Capabilities
- `accessibility`: añade GIVEN a sus 5 escenarios
- `authentication`: añade GIVEN a sus 7 escenarios
- `candidate-intake`: añade GIVEN a sus 10 escenarios
- `candidate-validation`: añade GIVEN a sus 8 escenarios
- `developer-tooling`: añade GIVEN a sus 5 escenarios
- `file-upload`: añade GIVEN a sus 5 escenarios
- `frontend-performance`: añade GIVEN a sus 3 escenarios
- `hiring-pipeline`: añade GIVEN a sus 3 escenarios
- `internationalization`: añade GIVEN a sus 4 escenarios
- `position-catalog`: añade GIVEN a sus 2 escenarios
- `security-hardening`: añade GIVEN a sus 4 escenarios

## Impact

- Solo ficheros bajo `openspec/`; ningún fichero de la aplicación se toca.
- Deja las 11 specs en el formato que este proyecto usará de aquí en adelante (esquema `spec-driven-bdd`, ya configurado como el esquema por defecto en `openspec/config.yaml`), y en el formato de partida más directo para escribir `.feature` de `playwright-bdd` si se retoma esa conversación.
