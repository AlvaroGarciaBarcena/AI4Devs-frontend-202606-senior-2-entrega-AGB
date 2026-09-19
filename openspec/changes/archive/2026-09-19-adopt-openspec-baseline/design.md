## Context

`prompts-AGB.md` documenta 14 ramas git creadas en esta sesión, cada una con su propia sección narrativa (prompts, hallazgos, verificación). Es la fuente de verdad para el "por qué" y el "cómo se descubrió" de cada cambio. `openspec/specs/` parte vacío — no había ninguna adopción previa de OpenSpec en este repo.

## Goals / Non-Goals

**Goals:**
- Una foto estructurada, navegable con `openspec spec show <capacidad>`, de qué hace el sistema hoy.
- Cada requisito trazable a la rama (y commit) que lo implementó, sin tener que leer `prompts-AGB.md` entero.

**Non-Goals:**
- No sustituir `prompts-AGB.md` — sigue siendo la referencia para el "por qué" y los hallazgos de cada arreglo; OpenSpec es el "qué hace el sistema ahora".
- No modificar código de la aplicación.
- No forzar una capacidad por cada una de las 14 ramas — varias ramas tocan la misma capacidad en momentos distintos (p. ej. `internationalization` recibe requisitos de tres ramas separadas), y varias ramas no introducen ninguna capacidad propia.

## Decisions

**Specs por capacidad, no por rama.** Las ramas siguieron el hilo cronológico de la conversación (p. ej. "corrige estos dos bugs de UX" mezcla comportamientos de capacidades distintas en una sola rama), no las fronteras reales del sistema. Agrupar por capacidad da una spec por área coherente (`candidate-intake`, `authentication`...) en vez de 14 ficheros que no se corresponden con cómo alguien preguntaría "¿qué hace la autenticación?". Decidido explícitamente con el usuario antes de escribir nada.

**Trazabilidad a nivel de requisito, no solo de spec.** Una capacidad como `internationalization` recibió requisitos de `candidate-validation-i18n-a11y-AGB` (detección automática + primeros mensajes traducidos), `i18n-react-i18next-AGB` (migración a la librería estándar) y `tests-AGB` (traducción del selector de fichero nativo). Poner la rama solo a nivel de spec habría ocultado que un único requisito puede haberse introducido en una rama y refinado en otra. Cada `### Requirement:` lleva su propia línea `_Rama: ..._` inmediatamente debajo del nombre.

**Formato de la línea de trazabilidad.** OpenSpec no tiene un campo dedicado para metadatos por requisito. Se usa una línea en cursiva justo debajo del título del requisito, con el nombre de rama entre backticks y el hash corto de commit entre paréntesis: `_Rama: \`nombre-rama\` (commit \`hash\`)_`. Es texto plano dentro del cuerpo del requisito — no rompe el parser de OpenSpec (que solo busca las cabeceras `### Requirement:`/`#### Scenario:`), y es legible tanto en `openspec spec show` como abriendo el fichero directamente.

**Sin capacidad propia para cambios de solo herramientas.** `vite-migration-AGB`, `react-router-v7-AGB` y `tests-AGB` no cambian qué hace el sistema desde la perspectiva de quien lo usa — cambian cómo está construido o cómo se verifica. Inventar una capacidad para ellas (p. ej. "build-tooling") habría producido requisitos sin ningún escenario WHEN/THEN real de comportamiento observable, solo para rellenar una entrada. Quedan documentadas en el proposal (`Impact`) y siguen teniendo su detalle completo en `prompts-AGB.md`; `code-splitting-AGB` sí genera una capacidad (`frontend-performance`) porque su resultado — qué JS se descarga y cuándo — es un comportamiento observable y verificable, no solo una decisión interna de construcción.

**Una única capacidad "seguridad", no una por hallazgo.** `security-audit-AGB` encontró y corrigió varios hallazgos de naturaleza distinta (cabeceras, límite de peticiones, saneamiento de subida, límite de tamaño de array). Se agrupan en una sola spec (`security-hardening`) porque, a diferencia de `candidate-intake` o `authentication`, ninguno de ellos es una capacidad que alguien fuera a buscar por separado — son controles transversales, no una función que el sistema ofrezca.

## Risks / Trade-offs

- **[Riesgo] Las specs pueden quedar desactualizadas si el código cambia sin actualizar OpenSpec.** → Mitigación: a partir de esta rama, un cambio de comportamiento real debería pasar por `openspec change` (propuesta → specs → implementación → archivo), no solo por una rama documentada en `prompts-AGB.md`. Se deja como recomendación explícita en el resumen final, no como algo forzado por esta rama.
- **[Riesgo] Duplicar información entre `prompts-AGB.md` y las specs puede divergir.** → Mitigación: las specs no repiten el detalle narrativo (comandos, hallazgos de camino, capturas) — solo el comportamiento final (`SHALL`) y su rama de origen. El detalle completo de cada arreglo se queda solo en `prompts-AGB.md`, evitando mantener dos copias del mismo contenido.

## Open Questions

Ninguna — el alcance (specs por capacidad, granularidad, formato de trazabilidad) se acordó explícitamente con el usuario antes de escribir este change.
