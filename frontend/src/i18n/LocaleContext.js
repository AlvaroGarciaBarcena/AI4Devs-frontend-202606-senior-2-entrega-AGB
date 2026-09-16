import React, { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, getLocale, setStoredLocale } from './locale';
import { translate } from './translations';

// Valor por defecto con forma concreta (no `null`): así TypeScript infiere
// un tipo utilizable para `t`/`locale`/`setLocale` en los componentes
// .tsx que consumen este contexto (con `createContext(null)`, el tipo
// inferido de `t` acababa siendo `never` tras el chequeo de nulidad).
const defaultContextValue = {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    t: (key) => key,
};

const LocaleContext = createContext(defaultContextValue);

// Provee el idioma activo a toda la app (envuelve las rutas en App.js) y
// la función `t()` para traducir textos estáticos. El mismo `locale` se
// usa también para traducir los mensajes de validación del backend (ver
// validationMessages.js), así que solo hay un selector, no uno por
// formulario.
export const LocaleProvider = ({ children }) => {
    const [locale, setLocaleState] = useState(getLocale());

    const setLocale = (newLocale) => {
        setLocaleState(newLocale);
        setStoredLocale(newLocale);
    };

    const value = useMemo(() => ({
        locale,
        setLocale,
        t: (key, params) => translate(key, locale, params),
    }), [locale]);

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = () => useContext(LocaleContext);
