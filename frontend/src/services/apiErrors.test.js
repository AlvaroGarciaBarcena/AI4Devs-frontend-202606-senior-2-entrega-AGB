import { describe, it, expect } from 'vitest';
import { isNetworkError, tagNetworkError } from './apiErrors';

describe('isNetworkError', () => {
    it('is true when the request was sent but no response ever came back', () => {
        expect(isNetworkError({ request: {} })).toBe(true);
    });

    it('is false when the server did respond, even with an error status', () => {
        expect(isNetworkError({ request: {}, response: { status: 400 } })).toBe(false);
    });

    it('is false when neither request nor response exist (e.g. a plain JS error)', () => {
        expect(isNetworkError({})).toBe(false);
    });
});

describe('tagNetworkError', () => {
    it('adds isNetworkError: true when the original error had no response', () => {
        const built = tagNetworkError(new Error('Network Error'), { request: {} });
        expect(built.isNetworkError).toBe(true);
    });

    it('does not add isNetworkError when the original error had a response', () => {
        const built = tagNetworkError(new Error('Bad Request'), { request: {}, response: { status: 400 } });
        expect(built.isNetworkError).toBeUndefined();
    });

    it('returns the same error instance it was given, unchanged otherwise', () => {
        const original = new Error('some message');
        const built = tagNetworkError(original, { request: {} });
        expect(built).toBe(original);
        expect(built.message).toBe('some message');
    });
});
