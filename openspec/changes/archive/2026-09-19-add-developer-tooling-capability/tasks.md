## 1. Spec

- [x] 1.1 Escribir la spec delta `developer-tooling` con los 3 requisitos (Vite/TypeScript, tests automáticos, react-router-dom sin vulnerabilidades)
- [x] 1.2 Verificar cada hash de commit citado contra `git log` real
- [x] 1.3 Escribir `design.md` explicando por qué se revisa la exclusión original, no solo qué cambia

## 2. Cierre

- [x] 2.1 Ejecutar `openspec validate --strict` sobre el change y corregir cualquier aviso
- [x] 2.2 Archivar el change (`openspec archive add-developer-tooling-capability`)
- [x] 2.3 Confirmar con `openspec validate --specs --strict` que las 11 specs (las 10 anteriores + `developer-tooling`) siguen validando en limpio (11/11)
- [x] 2.4 Documentar en `prompts-AGB.md` la corrección del usuario y por qué cambia el criterio
