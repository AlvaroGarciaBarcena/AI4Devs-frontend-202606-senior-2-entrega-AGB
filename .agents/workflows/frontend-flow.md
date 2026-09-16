---
description: Flujo estructurado de desarrollo frontend (Diseño & SDD -> TDD Rojo -> Implementación Verde -> Storybook -> Chromatic -> PR y Cierre)
---

# Workflow: Ciclo de Desarrollo Frontend Riguroso

Este workflow ejecuta de forma secuencial y auditable el ciclo completo de entrega frontend para cualquier nueva funcionalidad o modificación en el proyecto.

---

## Parámetros Iniciales

Antes de comenzar, identifica o solicita al usuario los siguientes datos:
1. **Nombre del cambio / feature**: `<nombre-del-cambio>` (en formato kebab-case, ej: `buscar-candidatos`, `filtros-avanzados`).
2. **Rama de trabajo y base**: Rama actual de desarrollo y rama base de comparación (ej: `main`, `kanban-solved`).
3. **Referencias de diseño**: Enlace a frames de Figma o descripción de pantallas requeridas.

---

## Paso 1: Diseño y SDD (Spec-Driven Development)

> **Objetivo**: Establecer los criterios observables y los contratos de componentes antes de escribir código de producción.

1. **Lectura de Skills Requeridas**:
   - Leer `.agents/skills/lti-atomic-design/SKILL.md`.
   - Leer `.agents/skills/openspec-propose/SKILL.md`.

2. **Inspección de Diseño y Casos Límite**:
   - Contrastar los frames de diseño (desktop y 375px móvil).
   - Definir la matriz completa de estados: `Ready/Idle`, `Active/Match`, `Empty/NoResults`, `Saving/Loading`, `Error/Rollback`.
   - Formular criterios de aceptación observables con identificadores formales (ej. `REQ-01` a `REQ-xx` o `BS-01` a `BS-xx`), usando redacción con **SHALL** y escenarios **WHEN / THEN**.
   - Definir explícitamente lo que queda **fuera de alcance**.

3. **Modelado con Atomic Design**:
   - **Átomos**: Reutilizar primitivas existentes (ej. Bootstrap). Sin wrappers superfluos.
   - **Moléculas**: Componentes controlados puros (reciben props, emiten eventos, gestionan accesibilidad y foco). **Prohibido acoplar HTTP o DnD/infraestructura**.
   - **Organismo / Página**: Dueño del estado canónico, persistencia, identidad y derivación de listas.

4. **Creación y Validación de la Especificación OpenSpec**:
   - Crear o actualizar la carpeta `openspec/changes/<nombre-del-cambio>/` con:
     - `proposal.md`: Justificación y alcance.
     - `design.md`: Contratos de props y asignación de responsabilidades.
     - `specs.md`: Requisitos formales y escenarios.
     - `tasks.md`: Plan de tareas numeradas por fase con checkboxes.
   - Validar con el linter de OpenSpec:
     ```sh
     npm run openspec -- validate <nombre-del-cambio> --strict
     ```
   - **Checkpoint 01/02**: Registrar commit base y checkpoint de planificación sin código de implementación. Pausar para alineación con el usuario.

---

## Paso 2: TDD Rojo (Red Phase)

> **Objetivo**: Escribir pruebas que fallen de manera limpia demostrando la necesidad de la nueva característica.

1. **Lectura de Skills Requeridas**:
   - Leer `.agents/skills/openspec-apply-change/SKILL.md`.

2. **Creación de Pruebas Unitarias / Integración**:
   - Traducir cada criterio observable de la spec a pruebas automatizadas en Jest / Testing Library (ej: en `src/components/...test.tsx`).
   - Cubrir: renderizado de estados, normalización de datos (diacríticos, mayúsculas), gestión de foco accesible al limpiar/interactuar, traslación de identidades inmutables (IDs, no índices filtrados), bloqueo de interfaz y rollback ante error.

3. **Verificación de Fallo Limpio y No-Regresión**:
   - Ejecutar la suite de pruebas del componente/área:
     ```sh
     npm run test:session
     ```
   - **REGLA CRÍTICA**: Los fallos deben deberse exclusivamente a lógica ausente (aserciones no cumplidas). **NUNCA** por errores de importación, sintaxis o tipado roto. Si es necesario, declara tipos o interfaces vacías mínimas.
   - Verificar que el 100% de las pruebas preexistentes continúen pasando.
   - **Checkpoint 03**: Registrar salida de pruebas fallidas y guardar checkpoint de TDD Rojo.

---

## Paso 3: Implementación Verde (Green Phase)

> **Objetivo**: Implementar el componente y su integración cumpliendo todos los tests y estándares de calidad.

1. **Lectura de Skills Requeridas**:
   - Leer `.agents/skills/lti-atomic-design/SKILL.md`.
   - Leer `.agents/skills/atomic-design-integration/SKILL.md`.

2. **Construcción de la Molécula Controlada**:
   - Implementar el componente visual con contratos limpios.
   - Añadir soporte accesible (`aria-label`, foco programático, estados `disabled`).
   - Pasar pruebas de la molécula de forma aislada.

3. **Integración en el Organismo / Página**:
   - Derivar estado en cliente sin emitir peticiones GET redundantes.
   - Mantener identidades inmutables al operar sobre listas filtradas o reducidas.
   - Implementar guard de bloqueo durante guardado y snapshot para rollback atómico.
   - Ajustar diseño responsive a desktop y móvil 375px (sin scroll horizontal involuntario ni solapamientos).

4. **Tríada de Calidad**:
   - Ejecutar y verificar:
     ```sh
     npm run test:session
     npm run typecheck
     npm run lint:session
     ```
   - **Checkpoint 04**: Registrar evidencia de pruebas, tipos y linter aprobados; guardar checkpoint verde.

---

## Paso 4: Storybook e Integración

> **Objetivo**: Documentar estados visuales de forma aislada y validar flujos interactivos completos.

1. **Lectura de Skills Requeridas**:
   - Leer `.agents/skills/storybook/SKILL.md`.
   - Leer `.agents/skills/storybook-component-documentation/SKILL.md`.

2. **Stories Aisladas de la Molécula**:
   - Crear `*.stories.tsx` con la matriz de estados: `Ready`, `Active/Match`, `Empty/NoResults`, `Saving/Loading`, `Error`.
   - Documentar props con JSDoc y autodocs sin alterar dependencias en `package.json`.

3. **Stories Integradas e Interactivas**:
   - Crear stories integradas a nivel de contenedor simulando flujos reales.
   - Ejecutar pruebas de interacción de navegador con Playwright:
     ```sh
     npm run test:stories
     ```
   - Validar compilación limpia:
     ```sh
     npm run storybook:build
     ```

4. **Verificación contra App Real**:
   - Levantar servicios locales (`npm run backend:start`, `npm run frontend:start`).
   - Ejecutar smoke test e2e (`npm run test:app`).
   - Comprobar visualmente a 375px móvil.
   - **Checkpoint 05**: Registrar matriz Criterio ↔ Story ↔ Test y guardar checkpoint Storybook.

---

## Paso 5: Chromatic (Regresión Visual)

> **Objetivo**: Publicar snapshots y auditar visualmente cualquier diferencia contra el diseño.

1. **Lectura de Skills Requeridas**:
   - Leer `.agents/skills/chromatic-viewports/SKILL.md`.
   - Leer `.agents/skills/chromatic-troubleshoot-diff/SKILL.md`.

2. **Publicación Controlada**:
   - Configurar viewports de referencia (Desktop y Móvil 375px).
   - Publicar en Chromatic utilizando credenciales seguras de entorno:
     ```sh
     npx chromatic --exit-zero-on-changes
     ```
   - Registrar URL del build, commit sha, número de stories y snapshots.

3. **Auditoría Visual Humana**:
   - **REGLA FUNDAMENTAL**: La finalización exitosa del comando CLI (`--exit-zero-on-changes`) **NO** equivale a aceptación visual.
   - Acceder a la URL de Chromatic del commit actual.
   - Comparar diffs contra los frames de Figma.
   - Documentar aceptación explícita o incidencias detectadas. No autoaceptar baselines sin revisión humana.
   - **Checkpoint 06**: Registrar enlaces y estado real de revisión (mantener tarea abierta si falta aprobación).

---

## Paso 6: PR y Cierre

> **Objetivo**: Auditar diff, documentar trazabilidad y sincronizar/archivar tras aprobación humana completa.

1. **Auditoría de Diff**:
   - Ejecutar `git diff <rama-base>...HEAD`.
   - Comprobar que no hay archivos de backend modificados sin autorización, ni dependencias espurias, ni tokens o guiones privados.

2. **Apertura de Pull Request**:
   - Crear o actualizar el PR del incremento.
   - Incluir la **Tabla de Trazabilidad**:
     | Criterio Observable | Test Unitario | Story en Storybook | Snapshot Chromatic | Estado |
     | :--- | :--- | :--- | :--- | :--- |
     | `REQ-01` | `test:session` | `*.stories.tsx` | Build URL | Aprobado |
   - **Checkpoint 07**: Guardar checkpoint del PR.

3. **Sincronización y Archivado de la Especificación**:
   - **Condición de entrada**: Solo ejecutar tras la aceptación funcional y visual humana completa.
   - Leer `.agents/skills/openspec-sync-specs/SKILL.md` y `.agents/skills/openspec-archive-change/SKILL.md`.
   - Ejecutar sincronización:
     ```sh
     npm run openspec -- sync <nombre-del-cambio>
     ```
   - Archivar cambio:
     ```sh
     npm run openspec -- archive <nombre-del-cambio>
     ```
