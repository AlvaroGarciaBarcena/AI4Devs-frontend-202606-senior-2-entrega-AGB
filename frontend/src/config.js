// Base URL de la API del backend. Configurable por variable de entorno
// (VITE_API_URL) -- antes estaba escrita a fuego como
// 'http://localhost:3010' en cada servicio por separado (positionService.js,
// candidateService.js, authService.js), lo que rompía el acceso desde
// cualquier equipo que no fuera el propio servidor: un navegador en OTRA
// máquina interpreta "localhost:3010" como SU PROPIO localhost, no el del
// servidor, así que cada llamada a la API fallaba por conexión rechazada
// aunque la página en sí cargara bien.
//
// Vite solo expone a `import.meta.env` las variables con el prefijo
// VITE_ (cualquier otra queda fuera del bundle a propósito, por seguridad
// -- ver https://vite.dev/guide/env-and-mode.html). El valor por defecto
// mantiene el comportamiento de siempre para desarrollo local sin tocar
// nada.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3010';
