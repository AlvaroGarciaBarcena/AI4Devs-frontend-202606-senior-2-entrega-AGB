// Lógica de idioma compartida por toda la app: qué idiomas se soportan,
// cómo se detecta el del navegador y cómo se recuerda una elección
// explícita del usuario. No contiene textos: eso vive en translations.js
// (textos estáticos de la interfaz) y validationMessages.js (mensajes de
// validación del backend, con su propia lógica de composición de frases).

export const SUPPORTED_LOCALES = ['es', 'en'];
export const DEFAULT_LOCALE = 'es';
const LOCALE_STORAGE_KEY = 'lti_error_locale';

export const getStoredLocale = () => {
    try {
        if (typeof localStorage === 'undefined') return null;
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
        return SUPPORTED_LOCALES.includes(stored) ? stored : null;
    } catch {
        // localStorage puede no estar disponible (modo privado, política de
        // cookies, etc.); en ese caso simplemente no se recuerda la elección.
        return null;
    }
};

export const setStoredLocale = (locale) => {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        }
    } catch {
        // Igual que arriba: si no se puede persistir, no es un error fatal.
    }
};

export const detectBrowserLocale = () => {
    // navigator.language solo da el idioma principal. Si ese no es ni
    // español ni inglés (p. ej. un navegador configurado en catalán,
    // euskera o gallego, algo común en España), navigator.languages trae
    // la lista completa de idiomas preferidos en orden, y puede que el
    // segundo o tercero sí sea uno de los soportados. Se recorre esa lista
    // antes de rendirse al idioma por defecto.
    const candidates = (typeof navigator !== 'undefined' && navigator.languages && navigator.languages.length > 0)
        ? navigator.languages
        : [(typeof navigator !== 'undefined' && navigator.language) || DEFAULT_LOCALE];

    for (const lang of candidates) {
        const short = lang.slice(0, 2).toLowerCase();
        if (SUPPORTED_LOCALES.includes(short)) {
            return short;
        }
    }
    return DEFAULT_LOCALE;
};

// La detección automática del navegador es siempre el valor inicial; una
// preferencia guardada (el usuario ya usó el selector alguna vez) tiene
// prioridad sobre ella, pero nunca al revés.
export const getLocale = () => getStoredLocale() || detectBrowserLocale();
