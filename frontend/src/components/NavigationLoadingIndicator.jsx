import React, { useEffect, useState } from 'react';
import { useNavigation } from 'react-router-dom';

// Componente genérico, sin nada específico de esta app: solo depende de
// react-router-dom (>=6.4, con createBrowserRouter/RouterProvider) y de
// react. Pensado para copiarse tal cual a cualquier otro proyecto que
// use React Router en modo "data router".
//
// Por qué existe: con createBrowserRouter, useNavigation().state pasa a
// "loading" en cuanto empieza una navegación y no vuelve a "idle" hasta
// que la ruta nueva (incluida su carga diferida con `lazy` en la propia
// definición de la ruta, no React.lazy() + <Suspense> a mano) está lista
// para mostrarse — justo la señal que hacía falta para saber, de verdad,
// cuándo mostrar algo mientras se carga una pantalla.
//
// `delayMs` evita el parpadeo en navegaciones que ya están en caché o
// son casi instantáneas: la barra no aparece a menos que la carga siga
// en marcha pasado ese tiempo (patrón habitual de "no muestres una
// espera por algo que ya ha terminado").
const NavigationLoadingIndicator = ({
    label = 'Loading…',
    color = '#0d6efd',
    height = 3,
    delayMs = 150,
}) => {
    const navigation = useNavigation();
    const isNavigating = navigation.state !== 'idle';
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!isNavigating) {
            setVisible(false);
            return undefined;
        }
        const timer = setTimeout(() => setVisible(true), delayMs);
        return () => clearTimeout(timer);
    }, [isNavigating, delayMs]);

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height,
                backgroundColor: color,
                transform: visible ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'left',
                transition: visible ? 'transform 0.3s ease-out' : 'none',
                zIndex: 2000,
                pointerEvents: 'none',
            }}
        >
            {/* Técnica "sr-only" clásica en línea, sin depender de ningún
                framework CSS: el texto solo existe para lectores de pantalla,
                nunca se ve. Solo se rellena mientras isNavigating es cierto,
                para que aria-live anuncie el cambio una vez, no en bucle. */}
            <span
                style={{
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0,
                }}
            >
                {isNavigating ? label : ''}
            </span>
        </div>
    );
};

export default NavigationLoadingIndicator;
