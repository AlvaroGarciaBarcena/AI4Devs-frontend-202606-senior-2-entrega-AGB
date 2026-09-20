import { parseAllowedOrigins, buildCorsOptions } from './corsOptions';

describe('parseAllowedOrigins', () => {
    it('defaults to http://localhost:3000 when no env value is set', () => {
        expect(parseAllowedOrigins(undefined)).toEqual(['http://localhost:3000']);
    });

    it('splits a comma-separated list and trims whitespace', () => {
        expect(parseAllowedOrigins('http://localhost:3000, http://192.168.1.50:3000 ')).toEqual([
            'http://localhost:3000',
            'http://192.168.1.50:3000',
        ]);
    });

    it('drops empty entries (e.g. a trailing comma)', () => {
        expect(parseAllowedOrigins('http://localhost:3000,')).toEqual(['http://localhost:3000']);
    });
});

// buildCorsOptions().origin tiene la firma de cors(): (origin, callback).
// Se invoca a mano en cada test, como haría el propio middleware `cors`,
// en vez de levantar una app de Express entera solo para esto.
describe('buildCorsOptions', () => {
    const invokeOrigin = (envValue: string | undefined, requestOrigin: string | undefined) =>
        new Promise<{ err: Error | null; allowed?: boolean }>((resolve) => {
            const options = buildCorsOptions(envValue);
            (options.origin as Function)(requestOrigin, (err: Error | null, allowed?: boolean) => {
                resolve({ err, allowed });
            });
        });

    it('allows a request with no Origin header (curl, same-origin)', async () => {
        const { err, allowed } = await invokeOrigin(undefined, undefined);
        expect(err).toBeNull();
        expect(allowed).toBe(true);
    });

    it('allows the default origin when CORS_ORIGINS is not set', async () => {
        const { err, allowed } = await invokeOrigin(undefined, 'http://localhost:3000');
        expect(err).toBeNull();
        expect(allowed).toBe(true);
    });

    // Caso real que motivó esto: acceder desde otro equipo de la red
    // local por su IP, sin dejar de poder seguir usando localhost.
    it('allows an additional configured origin without dropping the default one', async () => {
        const envValue = 'http://localhost:3000,http://192.168.1.50:3000';

        const lan = await invokeOrigin(envValue, 'http://192.168.1.50:3000');
        expect(lan.err).toBeNull();
        expect(lan.allowed).toBe(true);

        const local = await invokeOrigin(envValue, 'http://localhost:3000');
        expect(local.err).toBeNull();
        expect(local.allowed).toBe(true);
    });

    it('rejects an origin that is not in the allowed list', async () => {
        const { err, allowed } = await invokeOrigin(undefined, 'http://evil.example.com');
        expect(err).toBeInstanceOf(Error);
        expect(allowed).toBeUndefined();
    });

    it('sets credentials: true so the auth cookie/token flow keeps working', () => {
        expect(buildCorsOptions(undefined).credentials).toBe(true);
    });
});
