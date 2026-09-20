#!/usr/bin/env sh
# Hook 2/2 (ver .husky/pre-commit): busca invocaciones de "npm" resueltas
# por PATH en vez de una ruta fija -- exactamente el hallazgo real de
# SonarCloud (typescript:S4036, "Make sure the PATH variable only contains
# fixed, unwriteable directories") que bajó el quality gate del PR #22 a C
# (ver prompts-AGB.md, sección 3.59). Lanzar 'npm' a secas deja que el
# sistema operativo lo busque en cada directorio de PATH; un directorio
# escribible ahí podría colar un binario falso antes que el real.
set -eu

files=$(git diff --cached --name-only --diff-filter=ACM -- '*.ts' '*.tsx' '*.js' '*.jsx' || true)
if [ -z "$files" ]; then
    exit 0
fi

# shellcheck disable=SC2086
matches=$(grep -nE "(execFileSync|spawnSync|spawn|exec)\(['\"]npm['\"]" $files 2>/dev/null || true)
if [ -n "$matches" ]; then
    echo "✗ 'npm' se está lanzando a secas (resuelto por PATH), no con una ruta fija:"
    echo "$matches"
    echo
    echo "Usa runNpm() de e2e/steps/support/npmChildProcess.ts (process.env.npm_execpath + process.execPath) en vez de invocar 'npm' directamente."
    exit 1
fi

exit 0
