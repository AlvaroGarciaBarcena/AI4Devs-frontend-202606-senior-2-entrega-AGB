// Traduce los códigos de validación que devuelve el backend
// (backend/src/application/validator.ts) a un mensaje legible en el idioma
// activo de i18next. El backend nunca decide el idioma ni redacta el texto
// final: solo dice qué campo falló, con qué código y con qué parámetros
// (`{ field, code, params }`), y aquí se compone la frase con las cadenas
// de locales/{es,en}.json (namespace "validation").
//
// i18next mantiene un idioma "actual" global (i18n.language), así que
// estas funciones no necesitan recibir el locale explícitamente como antes
// — usan la instancia de i18next directamente, igual que fuera de
// componentes React se usaría i18n.t(...) en vez del hook useTranslation().
import i18n from './i18n';

const ARRAY_FIELD_REGEX = /^(educations|workExperiences)\[(\d+)\]\.(\w+)$/;

const getFieldLabel = (field) => {
    const match = field.match(ARRAY_FIELD_REGEX);
    if (match) {
        const [, section, index, subfield] = match;
        return i18n.t('validation.arrayFieldLabel', {
            section: i18n.t(`validation.sections.${section}`),
            position: Number(index) + 1,
            subfield: i18n.t(`validation.subfields.${subfield}`),
        });
    }
    // 'educations'/'workExperiences' a secas (sin índice) llegan cuando el
    // propio array supera el límite de entradas (código 'tooManyEntries'),
    // no un campo dentro de una entrada concreta — reutiliza la misma
    // etiqueta de sección que en el caso anterior.
    if (field === 'educations' || field === 'workExperiences') {
        return i18n.t(`validation.sections.${field}`);
    }
    return i18n.t(`validation.fields.${field}`, { defaultValue: field });
};

// issue: { field: string, code: string, params?: object }
export const translateValidationIssue = (issue) => {
    const field = getFieldLabel(issue.field);
    const params = issue.params || {};

    if (issue.code === 'invalidCharacters' && !params.char) {
        return i18n.t('validation.messages.invalidCharactersGeneric', { field });
    }

    return i18n.t(`validation.messages.${issue.code}`, { field, ...params, defaultValue: `${field}: ${issue.code}` });
};

export const translateValidationIssues = (issues) =>
    issues.map((issue) => ({ ...issue, message: translateValidationIssue(issue) }));
