import { useEffect, useState, type DependencyList } from 'react';

// Hook genérico, sin nada específico de esta app: solo depende de React.
// Pensado para copiarse tal cual a cualquier otro proyecto que necesite el
// patrón "cargar algo al montar (o cuando cambien unas dependencias),
// exponiendo loading/error/data" -- el mismo código, repetido casi línea
// por línea, vivía en Positions.tsx y PositionProcess.tsx antes de esto.
//
// Dos cosas que el código original NO tenía y que un hook pensado para
// reutilizarse sí necesita:
// - Una función de fetch que se relanza si `deps` cambia mientras la
//   anterior seguía en marcha puede hacer que la respuesta VIEJA llegue
//   después que la nueva y pise su resultado -- la bandera `cancelled`
//   evita justo eso (condición de carrera clásica de fetch-en-efecto).
// - `enabled`, para el caso de PositionProcess (que solo debía buscar
//   datos si `id` existe) sin tener que llamar al hook condicionalmente
//   (rompería las reglas de los Hooks de React).
export type UseAsyncDataOptions = {
    // Mensaje a usar si el error no es una instancia de Error con su
    // propio `.message` (p. ej. algo no estándar lanzado por el fetch).
    fallbackErrorMessage?: string;
    // Mensaje a usar cuando el error trae `isNetworkError: true` (una
    // convención opcional, no específica de este hook: cualquier función
    // de fetch puede marcar así un error para el que no hubo respuesta
    // del servidor en absoluto -- backend caído, red cortada, CORS...).
    // Sin esto, se mostraría igualmente `err.message`, que para un fallo
    // de red suele ser un texto interno del cliente HTTP (p. ej. "Network
    // Error" en axios, siempre en inglés y sin decir nada accionable).
    networkErrorMessage?: string;
    // Si es `false`, no se ejecuta el fetch y `loading` queda en `false`
    // -- para dependencias que todavía no están listas (un `id` de ruta
    // que puede no haber llegado aún, por ejemplo).
    enabled?: boolean;
};

export type UseAsyncDataResult<T> = {
    data: T | null;
    loading: boolean;
    error: string;
};

export function useAsyncData<T>(
    fetchFn: () => Promise<T>,
    deps: DependencyList,
    options: UseAsyncDataOptions = {},
): UseAsyncDataResult<T> {
    const { fallbackErrorMessage = '', networkErrorMessage, enabled = true } = options;
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return undefined;
        }

        let cancelled = false;
        setLoading(true);
        setError('');

        fetchFn()
            .then((result) => {
                if (!cancelled) setData(result);
            })
            .catch((err) => {
                if (cancelled) return;
                if (networkErrorMessage && err?.isNetworkError) {
                    setError(networkErrorMessage);
                } else {
                    setError(err instanceof Error ? err.message : fallbackErrorMessage);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return { data, loading, error };
}
