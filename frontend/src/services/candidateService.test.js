import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { sendCandidateData, uploadCV } from './candidateService';

vi.mock('axios');

beforeEach(() => {
    vi.clearAllMocks();
});

describe('sendCandidateData', () => {
    it('returns the created candidate on success', async () => {
        axios.post.mockResolvedValue({ data: { id: 1, firstName: 'Ana' } });

        const result = await sendCandidateData({ firstName: 'Ana' });

        expect(result).toEqual({ id: 1, firstName: 'Ana' });
    });

    // Reproduce el caso real: el backend devuelve { message, errors: [...] }
    // para un fallo de validación (p. ej. el apellido con guión bajo); el
    // servicio debe propagar los issues sin traducir, no un string plano.
    it('propagates the structured validation issues without translating them', async () => {
        axios.post.mockRejectedValue({
            response: {
                data: {
                    message: 'Validation failed',
                    errors: [{ field: 'lastName', code: 'invalidCharacters', params: { char: '_' } }],
                },
            },
        });

        await expect(sendCandidateData({ lastName: 'Garcia_' })).rejects.toMatchObject({
            message: 'Validation failed',
            issues: [{ field: 'lastName', code: 'invalidCharacters', params: { char: '_' } }],
        });
    });

    // Bug real detectado y corregido durante la migración a Vite (sección
    // 3.14.4): el prefijo traducido lo añade quien muestra el error
    // (AddCandidateForm), así que el servicio debe lanzar solo el detalle,
    // sin ningún prefijo propio — si no, el mensaje mostrado quedaría
    // duplicado ("Error adding candidate: Error al enviar...: detalle").
    it('throws only the detail, without any prefix of its own, for non-validation errors', async () => {
        axios.post.mockRejectedValue({
            response: { data: { error: 'The email already exists in the database' } },
        });

        await expect(sendCandidateData({})).rejects.toThrow('The email already exists in the database');
    });

    // Antes de un arreglo temprano de esta sesión (frontend-AGB), acceder a
    // error.response.data sin comprobar que error.response existiera
    // lanzaba un TypeError que tapaba el error real en caídas de red.
    it('does not throw a raw TypeError when the server never responds (network failure)', async () => {
        axios.post.mockRejectedValue(new Error('Network Error'));

        await expect(sendCandidateData({})).rejects.toThrow('Network Error');
    });
});

describe('uploadCV', () => {
    it('returns the uploaded file data on success', async () => {
        axios.post.mockResolvedValue({ data: { filePath: '/uploads/cv.pdf', fileType: 'application/pdf' } });

        const result = await uploadCV(new File(['contenido'], 'cv.pdf'));

        expect(result).toEqual({ filePath: '/uploads/cv.pdf', fileType: 'application/pdf' });
    });

    it('throws only the server detail, without a prefix, on failure', async () => {
        axios.post.mockRejectedValue({
            response: { data: { error: 'Invalid file type, only PDF and DOCX are allowed!' } },
        });

        await expect(uploadCV(new File(['x'], 'cv.exe'))).rejects.toThrow('Invalid file type, only PDF and DOCX are allowed!');
    });
});
