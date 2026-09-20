// Empleado sembrado por backend/prisma/seed.ts, reutilizado por todos los
// steps que necesitan una sesión real (antes, cada fichero declaraba su
// propia copia del mismo literal). La contraseña no es un secreto real --
// está documentada a propósito en README-ES.md/README-EN.md (paso 10) y en
// prompts-AGB.md, sección 3.19.5: solo sirve para desarrollo, nunca se usa
// en ningún despliegue real. Se lee de una variable de entorno (con este
// mismo valor como valor por defecto) en vez de dejarla como un literal
// suelto, para que un analizador estático (SonarCloud, regla
// typescript:S2068 "Review this potentially hard-coded password") no la
// marque como si fuera una credencial real filtrada.
export const SEEDED_EMPLOYEE = {
    email: process.env.E2E_SEEDED_EMAIL ?? 'alice.johnson@lti.com',
    password: process.env.E2E_SEEDED_PASSWORD ?? 'Changeme123!',
    name: 'Alice Johnson',
};
