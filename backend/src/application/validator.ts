const NAME_REGEX = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(6|7|9)\d{8}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

//Length validations according to the database schema

// Cada issue es un código de validación (sin texto humano) + el campo al
// que pertenece + los parámetros necesarios para componer el mensaje
// (p. ej. el mínimo/máximo de caracteres). El frontend traduce el código a
// un mensaje legible en el idioma del usuario (ver frontend/src/i18n).
// Así el backend no decide en qué idioma se explica el error, y el mensaje
// puede ser específico ("el apellido no puede contener el carácter '_'")
// en vez de un "Invalid name" genérico que no dice ni el campo ni el motivo.
export type ValidationIssue = {
    field: string;
    code: 'required' | 'tooShort' | 'tooLong' | 'invalidCharacters' | 'invalidFormat' | 'invalid';
    params?: Record<string, string | number>;
};

export class ValidationError extends Error {
    issues: ValidationIssue[];

    constructor(issues: ValidationIssue[]) {
        super(issues.map(issue => `${issue.field}: ${issue.code}`).join('; '));
        this.name = 'ValidationError';
        this.issues = issues;
        // Con "target": "es5" en tsconfig.json, `extends Error` rompe la
        // cadena de prototipos y `error instanceof ValidationError` da
        // `false` en el catch de quien la lanza. Se restaura explícitamente.
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

const findInvalidCharacter = (value: string): string | null => {
    for (const char of value) {
        if (!/[a-zA-ZñÑáéíóúÁÉÍÓÚ ]/.test(char)) {
            return char;
        }
    }
    return null;
};

const validateName = (name: string, field: string, issues: ValidationIssue[]) => {
    if (!name) {
        issues.push({ field, code: 'required' });
        return;
    }
    if (name.length < 2) {
        issues.push({ field, code: 'tooShort', params: { min: 2 } });
        return;
    }
    if (name.length > 100) {
        issues.push({ field, code: 'tooLong', params: { max: 100 } });
        return;
    }
    if (!NAME_REGEX.test(name)) {
        const invalidChar = findInvalidCharacter(name);
        issues.push({ field, code: 'invalidCharacters', params: invalidChar ? { char: invalidChar } : {} });
    }
};

const validateEmail = (email: string, issues: ValidationIssue[]) => {
    if (!email) {
        issues.push({ field: 'email', code: 'required' });
        return;
    }
    if (!EMAIL_REGEX.test(email)) {
        issues.push({ field: 'email', code: 'invalidFormat' });
    }
};

const validatePhone = (phone: string, issues: ValidationIssue[]) => {
    if (phone && !PHONE_REGEX.test(phone)) {
        issues.push({ field: 'phone', code: 'invalidFormat' });
    }
};

const validateDate = (date: string, field: string, issues: ValidationIssue[]) => {
    if (!date) {
        issues.push({ field, code: 'required' });
        return;
    }
    if (!DATE_REGEX.test(date)) {
        issues.push({ field, code: 'invalidFormat' });
    }
};

const validateAddress = (address: string, issues: ValidationIssue[]) => {
    if (address && address.length > 100) {
        issues.push({ field: 'address', code: 'tooLong', params: { max: 100 } });
    }
};

const validateEducation = (education: any, index: number, issues: ValidationIssue[]) => {
    const prefix = `educations[${index}]`;

    if (!education.institution) {
        issues.push({ field: `${prefix}.institution`, code: 'required' });
    } else if (education.institution.length > 100) {
        issues.push({ field: `${prefix}.institution`, code: 'tooLong', params: { max: 100 } });
    }

    if (!education.title) {
        issues.push({ field: `${prefix}.title`, code: 'required' });
    } else if (education.title.length > 100) {
        issues.push({ field: `${prefix}.title`, code: 'tooLong', params: { max: 100 } });
    }

    validateDate(education.startDate, `${prefix}.startDate`, issues);

    if (education.endDate && !DATE_REGEX.test(education.endDate)) {
        issues.push({ field: `${prefix}.endDate`, code: 'invalidFormat' });
    }
};

const validateExperience = (experience: any, index: number, issues: ValidationIssue[]) => {
    const prefix = `workExperiences[${index}]`;

    if (!experience.company) {
        issues.push({ field: `${prefix}.company`, code: 'required' });
    } else if (experience.company.length > 100) {
        issues.push({ field: `${prefix}.company`, code: 'tooLong', params: { max: 100 } });
    }

    if (!experience.position) {
        issues.push({ field: `${prefix}.position`, code: 'required' });
    } else if (experience.position.length > 100) {
        issues.push({ field: `${prefix}.position`, code: 'tooLong', params: { max: 100 } });
    }

    if (experience.description && experience.description.length > 200) {
        issues.push({ field: `${prefix}.description`, code: 'tooLong', params: { max: 200 } });
    }

    validateDate(experience.startDate, `${prefix}.startDate`, issues);

    if (experience.endDate && !DATE_REGEX.test(experience.endDate)) {
        issues.push({ field: `${prefix}.endDate`, code: 'invalidFormat' });
    }
};

const validateCV = (cv: any, issues: ValidationIssue[]) => {
    if (typeof cv !== 'object' || !cv.filePath || typeof cv.filePath !== 'string' || !cv.fileType || typeof cv.fileType !== 'string') {
        issues.push({ field: 'cv', code: 'invalid' });
    }
};

export const validateCandidateData = (data: any) => {
    // NOTA: antes, si el payload incluía un `id`, se saltaba TODA la validación
    // (nombre, email, teléfono, fechas...). Como este validador solo se invoca
    // desde el alta de candidatos (POST /candidates), bastaba con enviar
    // cualquier `id` en el cuerpo de la petición para eludir por completo la
    // validación de entrada. Se valida siempre.
    const issues: ValidationIssue[] = [];

    validateName(data.firstName, 'firstName', issues);
    validateName(data.lastName, 'lastName', issues);
    validateEmail(data.email, issues);
    validatePhone(data.phone, issues);
    validateAddress(data.address, issues);

    if (data.educations) {
        data.educations.forEach((education: any, index: number) => validateEducation(education, index, issues));
    }

    if (data.workExperiences) {
        data.workExperiences.forEach((experience: any, index: number) => validateExperience(experience, index, issues));
    }

    if (data.cv && Object.keys(data.cv).length > 0) {
        validateCV(data.cv, issues);
    }

    if (issues.length > 0) {
        throw new ValidationError(issues);
    }
};
