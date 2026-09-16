// Traduce los códigos de validación que devuelve el backend
// (backend/src/application/validator.ts) a un mensaje legible en el idioma
// del usuario. El backend nunca decide el idioma ni redacta el texto final:
// solo dice qué campo falló, con qué código y con qué parámetros
// (`{ field, code, params }`), y aquí se compone la frase.

export const SUPPORTED_LOCALES = ['es', 'en'];
const DEFAULT_LOCALE = 'es';
const LOCALE_STORAGE_KEY = 'lti_error_locale';

// El resto de la aplicación no tiene i18n (todo el texto estático está
// fijo en español), así que basarse solo en navigator.language producía
// una mezcla rara: formulario en español, errores en inglés si el
// navegador del usuario estaba en inglés (aunque técnicamente detectado
// bien). Por eso hay un selector explícito en el formulario
// (AddCandidateForm.js) que tiene prioridad sobre el navegador y se
// recuerda entre sesiones.
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

const detectBrowserLocale = () => {
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

export const getLocale = () => getStoredLocale() || detectBrowserLocale();

const SIMPLE_FIELD_LABELS = {
    es: {
        firstName: 'El nombre',
        lastName: 'El apellido',
        email: 'El email',
        phone: 'El teléfono',
        address: 'La dirección',
        cv: 'El CV',
    },
    en: {
        firstName: 'The first name',
        lastName: 'The last name',
        email: 'The email',
        phone: 'The phone number',
        address: 'The address',
        cv: 'The CV',
    },
};

const SECTION_LABELS = {
    es: { educations: 'Educación', workExperiences: 'Experiencia laboral' },
    en: { educations: 'Education', workExperiences: 'Work experience' },
};

const SUBFIELD_LABELS = {
    es: {
        institution: 'la institución',
        title: 'el título',
        startDate: 'la fecha de inicio',
        endDate: 'la fecha de fin',
        company: 'la empresa',
        position: 'el puesto',
        description: 'la descripción',
    },
    en: {
        institution: 'the institution',
        title: 'the title',
        startDate: 'the start date',
        endDate: 'the end date',
        company: 'the company',
        position: 'the position',
        description: 'the description',
    },
};

const ARRAY_FIELD_REGEX = /^(educations|workExperiences)\[(\d+)\]\.(\w+)$/;

const getFieldLabel = (field, locale) => {
    const match = field.match(ARRAY_FIELD_REGEX);
    if (match) {
        const [, section, index, subfield] = match;
        const sectionLabel = (SECTION_LABELS[locale] || SECTION_LABELS[DEFAULT_LOCALE])[section] || section;
        const subfieldLabel = (SUBFIELD_LABELS[locale] || SUBFIELD_LABELS[DEFAULT_LOCALE])[subfield] || subfield;
        const position = Number(index) + 1;
        return `${sectionLabel} #${position} (${subfieldLabel})`;
    }
    const labels = SIMPLE_FIELD_LABELS[locale] || SIMPLE_FIELD_LABELS[DEFAULT_LOCALE];
    return labels[field] || field;
};

const MESSAGE_TEMPLATES = {
    es: {
        required: (field) => `${field} es obligatorio.`,
        tooShort: (field, params) => `${field} debe tener al menos ${params.min} caracteres.`,
        tooLong: (field, params) => `${field} no puede superar los ${params.max} caracteres.`,
        invalidCharacters: (field, params) => params.char
            ? `${field} contiene un carácter no permitido: "${params.char}". Solo se admiten letras y espacios.`
            : `${field} contiene caracteres no permitidos. Solo se admiten letras y espacios.`,
        invalidFormat: (field) => `${field} no tiene un formato válido.`,
        invalid: (field) => `${field} no es válido.`,
    },
    en: {
        required: (field) => `${field} is required.`,
        tooShort: (field, params) => `${field} must be at least ${params.min} characters long.`,
        tooLong: (field, params) => `${field} cannot exceed ${params.max} characters.`,
        invalidCharacters: (field, params) => params.char
            ? `${field} contains a character that is not allowed: "${params.char}". Only letters and spaces are allowed.`
            : `${field} contains characters that are not allowed. Only letters and spaces are allowed.`,
        invalidFormat: (field) => `${field} has an invalid format.`,
        invalid: (field) => `${field} is not valid.`,
    },
};

// issue: { field: string, code: string, params?: object }
export const translateValidationIssue = (issue, locale = getLocale()) => {
    const fieldLabel = getFieldLabel(issue.field, locale);
    const templates = MESSAGE_TEMPLATES[locale] || MESSAGE_TEMPLATES[DEFAULT_LOCALE];
    const template = templates[issue.code];
    if (!template) {
        return `${fieldLabel}: ${issue.code}`;
    }
    return template(fieldLabel, issue.params || {});
};

export const translateValidationIssues = (issues, locale = getLocale()) =>
    issues.map((issue) => ({ ...issue, message: translateValidationIssue(issue, locale) }));
