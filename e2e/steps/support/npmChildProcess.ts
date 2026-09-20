import { execFileSync } from 'node:child_process';

// npm_config_allow_scripts queda en el entorno de esta sesión desde que se
// aprobaron los scripts de instalación de @fission-ai/openspec (ver
// prompts-AGB.md, adopción de OpenSpec) -- heredarlo aquí rompe cualquier
// `npm` lanzado como proceso hijo con un EALLOWSCRIPTS ajeno al propio
// comando. Se quita solo para estos procesos hijos, sin tocar el entorno
// real de la sesión ni ningún .npmrc.
const npmEnvWithoutAllowScripts = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== 'npm_config_allow_scripts'),
);

// SonarCloud (regla typescript:S4036 "Make sure the PATH variable only
// contains fixed, unwriteable directories") no permite lanzar `npm` a
// secas: el sistema operativo lo resuelve buscando en cada directorio de
// PATH, y un directorio escribible ahí podría colar un binario falso antes
// que el real. `npm_execpath` lo pone el propio npm (siempre que este
// proceso se lance vía `npm run ...`, que es como documenta el README) con
// la ruta absoluta a su propio npm-cli.js -- se ejecuta con el mismo
// binario de node ya en marcha (`process.execPath`, también una ruta
// absoluta), así que no hace falta resolver ningún ejecutable por PATH.
const resolveNpmCommand = (): { command: string; baseArgs: string[] } => {
    const npmExecPath = process.env.npm_execpath;
    if (!npmExecPath) {
        throw new Error(
            'npm_execpath no está definido -- estos steps E2E deben lanzarse vía "npm run test:e2e" (ver README-ES.md), no directamente.',
        );
    }
    return { command: process.execPath, baseArgs: [npmExecPath] };
};

// Usado por developer-tooling.steps.ts (jest --json, npm run build) y
// security-hardening.steps.ts (npm audit --json) -- antes cada uno
// reimplementaba su propio `execFileSync('npm', ...)`.
export const runNpm = (args: string[], cwd: string): string => {
    const { command, baseArgs } = resolveNpmCommand();
    return execFileSync(command, [...baseArgs, ...args], {
        cwd,
        encoding: 'utf-8',
        env: npmEnvWithoutAllowScripts,
        maxBuffer: 1024 * 1024 * 20,
    });
};
