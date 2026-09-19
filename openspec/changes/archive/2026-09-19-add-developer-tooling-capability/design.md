## Context

`adopt-openspec-baseline` (archivado) excluyó `vite-migration-AGB`, `react-router-v7-AGB` y `tests-AGB` de las specs, razonando que un requisito de OpenSpec debe ser comportamiento observable (`WHEN`/`THEN` desde la perspectiva de quien usa el sistema), y estos tres cambios no alteran ese comportamiento — alteran cómo se construye y se verifica el sistema. El usuario respondió: *"Pero el cambio de cómo está construido el sistema es un cambio real. Opino que ha de estar documentado también"*.

## Goals / Non-Goals

**Goals:**
- Documentar como requisitos reales, no como una nota al margen, los tres cambios excluidos.
- Mantener el formato `### Requirement:` / `#### Scenario:` de OpenSpec, sin inventar una sección nueva fuera del esquema.

**Non-Goals:**
- No forzar estos requisitos a una narrativa de "un usuario hace X" que no les corresponde — se verifican ejecutando un comando, no con una interacción de interfaz, y el `Purpose` de la spec lo dice explícitamente.

## Decisions

**La objeción original no estaba equivocada, estaba incompleta.** Es cierto que estos tres cambios no tienen un `WHEN` protagonizado por un usuario — pero un requisito de OpenSpec no exige que el actor sea un usuario final. Puede ser "quien ejecuta el build" o "quien ejecuta la suite de tests". Con esa relectura, los tres encajan sin forzar el esquema: `WHEN se ejecuta `npm run build`` es un escenario tan válido como `WHEN un reclutador pulsa "Enviar"`.

**Una sola capacidad, `developer-tooling`, no tres.** Igual que `security-hardening` agrupa varios hallazgos de una misma auditoría (ver `adopt-openspec-baseline`, `design.md`), estos tres cambios comparten naturaleza — decisiones sobre cómo se construye y se verifica el sistema, no una función que alguien use — y ninguno es lo bastante grande por sí solo para justificar su propia spec.

**`react-router-v7-AGB` entra aquí, no (solo) en `security-hardening`.** Cierra una vulnerabilidad real (motivo de seguridad), pero lo que cambió fue una decisión de qué versión de una dependencia mantener — la misma naturaleza que la versión de TypeScript o la herramienta de build. `security-hardening` ya tiene su propio requisito sobre dependencias sin vulnerabilidades conocidas (con la auditoría de `security-audit-AGB` como origen); añadir aquí el caso concreto de `react-router-dom` evita duplicar ese requisito con una segunda versión casi idéntica.

## Risks / Trade-offs

- **[Riesgo] La distinción entre "capacidad de comportamiento" y "capacidad de construcción" puede no ser obvia para quien lea las specs por primera vez.** → Mitigación: el `## Purpose` de `developer-tooling` explica explícitamente por qué sus escenarios se verifican con comandos, no con acciones de usuario.

## Open Questions

Ninguna.
