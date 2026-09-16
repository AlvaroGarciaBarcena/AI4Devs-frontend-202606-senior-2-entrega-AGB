// Configuración de i18next. Se importa una sola vez, como efecto
// secundario, desde index.tsx antes de renderizar <App />: eso inicializa
// la instancia global de i18next, y a partir de ahí cualquier componente
// puede usar el hook useTranslation() sin necesidad de un <Provider>
// explícito envolviendo la app (es el patrón estándar de react-i18next).
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import es from './locales/es.json';
import en from './locales/en.json';

// Misma clave que usaba el selector de idioma "casero" (ver commits
// anteriores) para que una preferencia ya guardada por un usuario no se
// pierda al migrar a react-i18next.
const LOCALE_STORAGE_KEY = 'lti_error_locale';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            es: { translation: es },
            en: { translation: en },
        },
        fallbackLng: 'es',
        supportedLngs: ['es', 'en'],
        // 'languageOnly' hace que 'en-US' se resuelva como 'en', 'es-ES'
        // como 'es', etc. — sustituye el bucle manual sobre
        // navigator.languages que teníamos antes.
        load: 'languageOnly',
        detection: {
            // Una preferencia ya elegida por el usuario (guardada en
            // localStorage) tiene prioridad sobre el idioma del navegador;
            // si no hay ninguna guardada, se usa navigator.languages.
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: LOCALE_STORAGE_KEY,
        },
        interpolation: {
            escapeValue: false, // React ya escapa por defecto.
        },
    });

// Mantiene <html lang="..."> sincronizado con el idioma activo, para que
// los lectores de pantalla apliquen las reglas de pronunciación correctas
// tras un cambio de idioma (antes era un valor estático en index.html).
i18n.on('languageChanged', (lng) => {
    if (typeof document !== 'undefined') {
        document.documentElement.lang = lng;
    }
});

export default i18n;
