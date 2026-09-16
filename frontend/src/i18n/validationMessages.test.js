import { describe, it, expect, beforeEach } from 'vitest';
import { translateValidationIssue, translateValidationIssues } from './validationMessages';
import i18n from './i18n';

// Estos tests codifican, como pruebas automáticas repetibles, los mismos
// casos que se verificaron a mano en el navegador a lo largo de la sesión
// (rama candidate-validation-i18n-a11y-AGB): el apellido con un guión bajo,
// en español y en inglés, y la composición de etiquetas para los campos de
// educación/experiencia.

beforeEach(async () => {
    await i18n.changeLanguage('es');
});

describe('translateValidationIssue', () => {
    it('reports that a field is required, in Spanish', () => {
        const message = translateValidationIssue({ field: 'firstName', code: 'required' });
        expect(message).toBe('El nombre es obligatorio.');
    });

    // El caso concreto reportado por el usuario y reproducido a mano varias
    // veces durante la sesión.
    it('reports the offending character when the last name contains an underscore', () => {
        const message = translateValidationIssue({
            field: 'lastName',
            code: 'invalidCharacters',
            params: { char: '_' },
        });
        expect(message).toBe('El apellido contiene un carácter no permitido: "_". Solo se admiten letras y espacios.');
    });

    it('falls back to a generic message when no offending character is given', () => {
        const message = translateValidationIssue({ field: 'lastName', code: 'invalidCharacters', params: {} });
        expect(message).toBe('El apellido contiene caracteres no permitidos. Solo se admiten letras y espacios.');
    });

    it('translates the same issue into English when the active language changes', async () => {
        await i18n.changeLanguage('en');
        const message = translateValidationIssue({
            field: 'lastName',
            code: 'invalidCharacters',
            params: { char: '_' },
        });
        expect(message).toBe('The last name contains a character that is not allowed: "_". Only letters and spaces are allowed.');
    });

    it('composes a label for array fields (educations/workExperiences)', () => {
        const message = translateValidationIssue({ field: 'educations[0].institution', code: 'required' });
        expect(message).toBe('Educación #1 (la institución) es obligatorio.');
    });

    it('interpolates min/max in length-related messages', () => {
        expect(translateValidationIssue({ field: 'address', code: 'tooLong', params: { max: 100 } }))
            .toBe('La dirección no puede superar los 100 caracteres.');
    });
});

describe('translateValidationIssues', () => {
    it('translates every issue and keeps field/code/params, adding "message"', () => {
        const issues = [
            { field: 'firstName', code: 'required' },
            { field: 'email', code: 'invalidFormat' },
        ];

        expect(translateValidationIssues(issues)).toEqual([
            { field: 'firstName', code: 'required', message: 'El nombre es obligatorio.' },
            { field: 'email', code: 'invalidFormat', message: 'El email no tiene un formato válido.' },
        ]);
    });

    // Mismo caso que el backend acumula (ver validator.test.ts): varios
    // campos a la vez, no solo el primero.
    it('does not stop at the first issue', () => {
        const issues = [
            { field: 'firstName', code: 'required' },
            { field: 'lastName', code: 'required' },
            { field: 'email', code: 'invalidFormat' },
        ];

        expect(translateValidationIssues(issues).map((i) => i.field)).toEqual(['firstName', 'lastName', 'email']);
    });
});
