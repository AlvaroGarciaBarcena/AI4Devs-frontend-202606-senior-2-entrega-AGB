import { CorsOptions } from 'cors';

// Antes, CORS estaba fijado a un único origen hardcodeado
// (http://localhost:3000) directamente en index.ts -- funcionaba para
// desarrollo local, pero bloqueaba cualquier otro origen (p. ej. acceder
// desde otro equipo de la red local por su IP) sin tocar código. Se
// extrae a un fichero propio, separado del bootstrap de Express, para
// poder probar el parseo y la comparación de orígenes sin levantar la
// app entera.
export const parseAllowedOrigins = (envValue: string | undefined): string[] =>
    (envValue ?? 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

export const buildCorsOptions = (envValue: string | undefined): CorsOptions => {
    const allowedOrigins = parseAllowedOrigins(envValue);

    return {
        // Sin cabecera Origin (curl, Postman, peticiones same-origin) se
        // deja pasar -- es el mismo comportamiento que tenía `cors()` sin
        // ninguna whitelist configurada, y las peticiones del propio
        // navegador siempre mandan Origin, así que esto no relaja nada
        // para tráfico real de un navegador.
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    };
};
