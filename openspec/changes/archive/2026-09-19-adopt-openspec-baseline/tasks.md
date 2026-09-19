## 1. Preparación

- [x] 1.1 Inicializar OpenSpec en el repo (`openspec init`, esquema `spec-driven`)
- [x] 1.2 Revisar las 14 ramas y `prompts-AGB.md` para extraer qué capacidades introduce o modifica cada una
- [x] 1.3 Verificar contra el código real (no solo la narrativa de `prompts-AGB.md`) el comportamiento exacto de cada requisito antes de escribirlo — incluido descartar como requisito el buscador/filtro de posiciones, confirmado no funcional

## 2. Specs por capacidad

- [x] 2.1 `candidate-intake` — alta de candidato, educación/experiencia, vínculo con posición, comportamiento del formulario
- [x] 2.2 `candidate-validation` — reglas de cada campo y arquitectura de errores estructurados
- [x] 2.3 `file-upload` — tipos/tamaño de CV, saneamiento de nombre de fichero, traducción del selector
- [x] 2.4 `position-catalog` — listado de posiciones con datos reales
- [x] 2.5 `hiring-pipeline` — tablero "Ver proceso" por fases
- [x] 2.6 `authentication` — login, protección de rutas, límite de intentos, cierre de sesión
- [x] 2.7 `internationalization` — detección automática, selector explícito, retraducción en caliente
- [x] 2.8 `accessibility` — técnicas WCAG 2.1 aplicadas
- [x] 2.9 `security-hardening` — cabeceras, límites de peticiones, validación de subidas, dependencias
- [x] 2.10 `frontend-performance` — carga diferida por ruta

## 3. Trazabilidad

- [x] 3.1 Añadir una línea `_Rama: ..._` con el commit correcto bajo cada uno de los requisitos de las 10 specs
- [x] 3.2 Verificar cada hash de commit citado contra `git log` real (no de memoria) antes de darlo por bueno

## 4. Cierre

- [x] 4.1 Ejecutar `openspec validate --strict` sobre el change completo y corregir cualquier aviso
- [x] 4.2 Archivar el change (`openspec archive adopt-openspec-baseline`) para generar `openspec/specs/`
- [x] 4.3 Confirmar con `openspec spec list` y `openspec spec show <capacidad>` que las 10 specs quedaron creadas correctamente (`openspec validate --specs --strict` → 10/10)
- [x] 4.4 Añadir una nota breve en `prompts-AGB.md` señalando que, a partir de esta rama, `openspec/specs/` es la referencia de "qué hace el sistema hoy"
