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
});
