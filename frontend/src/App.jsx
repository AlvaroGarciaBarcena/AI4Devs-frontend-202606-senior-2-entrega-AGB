import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './services/apiClient';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import LanguageSwitcher from './components/LanguageSwitcher';
import Login from './components/Login';
import RequireAuth from './components/RequireAuth';
import UserMenu from './components/UserMenu';
import NavigationLoadingIndicator from './components/NavigationLoadingIndicator';
import { AuthProvider } from './context/AuthContext';
import { getStoredAuth } from './services/authService';
import { useTranslation } from 'react-i18next';

// Layout persistente: cabecera + indicador de navegación + <Outlet/> para
// la ruta activa. Con createBrowserRouter, esto es lo que hace de "shell"
// de la app en vez del <div> suelto que envolvía <Routes> antes.
const RootLayout = () => {
    const { t } = useTranslation();
    return (
        <>
            <div className="d-flex justify-content-end align-items-center gap-3 p-2">
                <UserMenu />
                <LanguageSwitcher />
            </div>
            <NavigationLoadingIndicator label={t('common.loadingPage')} />
            <Outlet />
        </>
    );
};

// Las 4 rutas protegidas se cargan bajo demanda con `lazy` a nivel de
// ruta (no React.lazy() + <Suspense> a mano): así el router sabe de
// verdad cuándo una navegación sigue esperando el código de la pantalla
// destino, y useNavigation().state (NavigationLoadingIndicator) refleja
// ese tiempo de espera real -- con React.lazy()/<Suspense> a mano, las
// navegaciones por <Link> se trataban como una transición de React que
// mantenía la pantalla anterior montada sin ninguna señal de carga
// (hallazgo real, ver prompts-AGB.md sección 3.30.4).
//
// El propio `lazy` del router se invoca durante el emparejamiento de la
// ruta, ANTES de que <RequireAuth/> (que solo actúa al renderizar) tenga
// ocasión de redirigir -- sin este chequeo síncrono de localStorage
// primero, cualquier visita sin sesión a una ruta protegida descargaría
// igualmente su código, justo lo contrario de lo que exige "Carga
// diferida de las pantallas protegidas" (hallazgo real, encontrado al
// migrar: el propio escenario E2E que lo comprueba dejó de pasar hasta
// añadir este chequeo).
const lazyProtectedRoute = (importComponent) => async () => {
    if (!getStoredAuth()) {
        return { element: <RequireAuth /> };
    }
    const { default: Component } = await importComponent();
    return { element: <RequireAuth><Component /></RequireAuth> };
};

// Login se mantiene con import estático a propósito: es la primera
// pantalla que ve todo el mundo sin sesión, y una carga diferida ahí
// metería una espera en el primer contacto con la app, justo donde
// menos conviene.
const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            { path: '/login', element: <Login /> },
            { path: '/', lazy: lazyProtectedRoute(() => import('./components/RecruiterDashboard')) },
            { path: '/add-candidate', lazy: lazyProtectedRoute(() => import('./components/AddCandidateForm')) },
            { path: '/positions', lazy: lazyProtectedRoute(() => import('./components/Positions')) },
            { path: '/positions/:id', lazy: lazyProtectedRoute(() => import('./components/PositionProcess')) },
        ],
    },
]);

const App = () => (
    <AuthProvider>
        <RouterProvider router={router} />
    </AuthProvider>
);

export default App;
