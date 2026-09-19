## 1. Esquema

- [x] 1.1 Forkear `spec-driven` → `spec-driven-bdd` (`openspec schema fork`)
- [x] 1.2 Añadir `GIVEN` a la plantilla de escenario del esquema forkeado
- [x] 1.3 Actualizar la instrucción del artefacto `specs` para exigir GIVEN/WHEN/THEN, no solo WHEN/THEN
- [x] 1.4 Establecer `spec-driven-bdd` como esquema por defecto en `openspec/config.yaml`
- [x] 1.5 Validar el esquema forkeado (`openspec schema validate spec-driven-bdd`)

## 2. Retrofit de escenarios

- [x] 2.1 Contar los escenarios reales de cada spec (`grep -c "^#### Scenario:"`), no asumir un número
- [x] 2.2 Escribir el delta `MODIFIED Requirements` de las 11 specs, con el bloque completo de cada requisito y un `GIVEN` añadido a cada escenario
- [x] 2.3 Verificar, fichero a fichero, que el número de `GIVEN` coincide exactamente con el número de escenarios (56/56)

## 3. Cierre

- [x] 3.1 Ejecutar `openspec validate --strict` sobre el change y corregir cualquier aviso
- [x] 3.2 Archivar el change (`openspec archive add-given-to-scenarios`)
- [x] 3.3 Confirmar con `openspec validate --specs --strict` que las 11 specs siguen validando en limpio (11/11) y que los 56 escenarios tienen GIVEN (verificado con grep, no solo con la validación del esquema)
- [x] 3.4 Documentar en `prompts-AGB.md` el fork del esquema y el retrofit
