import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// API_BASE_URL se calcula una sola vez, al cargar el módulo -- para
// probar los dos valores hace falta resetear el registro de módulos y
// volver a importar en cada caso, no solo cambiar la variable de entorno.
describe('config', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('defaults to http://localhost:3010 when VITE_API_URL is not set', async () => {
        vi.stubEnv('VITE_API_URL', '');
        const { API_BASE_URL } = await import('./config');
        expect(API_BASE_URL).toBe('http://localhost:3010');
    });

    // Caso real que motivó esto: acceder desde otro equipo de la red
    // local -- sin esta variable, el navegador de esa máquina interpreta
    // "localhost:3010" como su propio localhost, no el del servidor.
    it('uses VITE_API_URL when set, e.g. for LAN access', async () => {
        vi.stubEnv('VITE_API_URL', 'http://192.168.1.50:3010');
        const { API_BASE_URL } = await import('./config');
        expect(API_BASE_URL).toBe('http://192.168.1.50:3010');
    });
});
