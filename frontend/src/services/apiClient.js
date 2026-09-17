import axios from 'axios';
import { getStoredAuth, logout } from './authService';

// Interceptores globales sobre la instancia por defecto de axios, en vez
// de una instancia propia (`axios.create()`): candidateService.js y
// positionService.js siguen llamando a `axios.get/post` tal cual, y sus
// tests (`vi.mock('axios')`) siguen funcionando sin cambios — un
// `axios.create()` habría necesitado mockearse aparte.
//
// Efecto secundario a propósito: importar este módulo una sola vez, al
// arrancar la app (ver index.tsx), es lo que registra los interceptores.

axios.interceptors.request.use((config) => {
    const auth = getStoredAuth();
    if (auth?.token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Un 401 aquí significa "el token que teníamos ya no vale" (caducado,
        // o el backend se reinició con otro JWT_SECRET) — no que este login
        // concreto tuviera credenciales incorrectas (eso lo maneja
        // authService.login por separado, antes de que exista ningún token).
        // Se limpia la sesión y se fuerza una recarga a /login en vez de
        // dejar a la app mostrando datos obsoletos con peticiones que ya no
        // van a funcionar.
        if (error.response?.status === 401 && getStoredAuth()) {
            logout();
            window.location.assign('/login');
        }
        return Promise.reject(error);
    },
);
