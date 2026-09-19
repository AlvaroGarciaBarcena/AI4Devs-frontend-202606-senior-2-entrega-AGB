import { validateCandidateData, ValidationError } from './validator';

const baseCandidate = {
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana.garcia@example.com',
};

const getValidationError = (data: any): ValidationError => {
    try {
        validateCandidateData(data);
    } catch (error) {
        if (error instanceof ValidationError) return error;
        throw error;
    }
    throw new Error('expected validateCandidateData to throw a ValidationError');
};

describe('validateCandidateData', () => {
    it('does not throw for a valid candidate', () => {
        expect(() => validateCandidateData(baseCandidate)).not.toThrow();
    });

    it('reports the missing field when firstName is empty', () => {
        const error = getValidationError({ ...baseCandidate, firstName: '' });
        expect(error.issues).toContainEqual({ field: 'firstName', code: 'required' });
    });

    it('reports the offending character when lastName contains an underscore', () => {
        const error = getValidationError({ ...baseCandidate, lastName: 'Garcia_' });
        expect(error.issues).toContainEqual({ field: 'lastName', code: 'invalidCharacters', params: { char: '_' } });
    });

    it('accumulates every failing field instead of stopping at the first one', () => {
        const error = getValidationError({ firstName: '', lastName: '', email: 'not-an-email' });
        expect(error.issues.map(issue => issue.field)).toEqual(['firstName', 'lastName', 'email']);
    });

    it('reports an invalid email format', () => {
        const error = getValidationError({ ...baseCandidate, email: 'not-an-email' });
        expect(error.issues).toContainEqual({ field: 'email', code: 'invalidFormat' });
    });

    it('rejects more than 20 educations instead of validating an unbounded array', () => {
        const educations = Array.from({ length: 21 }, () => ({
            institution: 'MIT',
            title: 'BSc',
            startDate: '2020-01-01',
        }));
        const error = getValidationError({ ...baseCandidate, educations });
        expect(error.issues).toContainEqual({ field: 'educations', code: 'tooManyEntries', params: { max: 20 } });
        // Con el límite superado, no se valida (ni se procesa) cada entrada individual.
        expect(error.issues.some(issue => issue.field.startsWith('educations['))).toBe(false);
    });

    it('accepts exactly 20 educations (the boundary is inclusive)', () => {
        const educations = Array.from({ length: 20 }, () => ({
            institution: 'MIT',
            title: 'BSc',
            startDate: '2020-01-01',
        }));
        expect(() => validateCandidateData({ ...baseCandidate, educations })).not.toThrow();
    });

    // Caso reportado por el usuario: un teléfono de 9 dígitos que no
    // empieza por 6, 7 o 9 (aquí, un móvil español real) daba
    // 'invalidFormat', el mismo código genérico que email/fechas — sin
    // decir qué esperaba el validador. Código específico para poder
    // explicarlo (ver frontend/src/i18n/locales/{es,en}.json).
    it('reports a specific code (not the generic invalidFormat) for a 9-digit phone with the wrong prefix', () => {
        const error = getValidationError({ ...baseCandidate, phone: '123456789' });
        expect(error.issues).toContainEqual({ field: 'phone', code: 'invalidPhoneFormat' });
    });

    it('accepts a phone that starts with 6, 7 or 9 and has 9 digits', () => {
        expect(() => validateCandidateData({ ...baseCandidate, phone: '612345678' })).not.toThrow();
        expect(() => validateCandidateData({ ...baseCandidate, phone: '712345678' })).not.toThrow();
        expect(() => validateCandidateData({ ...baseCandidate, phone: '912345678' })).not.toThrow();
    });

    it('accepts an empty phone (it is optional)', () => {
        expect(() => validateCandidateData({ ...baseCandidate, phone: '' })).not.toThrow();
    });
});
