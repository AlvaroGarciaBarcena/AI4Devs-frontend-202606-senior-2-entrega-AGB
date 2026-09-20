import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { sendCandidateData, uploadCV, getCandidateById, updateCandidateData, updateCandidateStage } from './candidateService';
// No hardcodear 'http://localhost:3010' en las aserciones de abajo: si
// quien corre los tests tiene VITE_API_URL definida en su frontend/.env
// (p. ej. para probar el acceso desde la red local), API_BASE_URL vale
// otra cosa de verdad, y una URL fija aquí haría fallar el test sin que
// hubiera ningún bug real -- justo lo que pasó la primera vez que se
// corrió esta suite con esa variable puesta (sección 3.48 de
// prompts-AGB.md).
import { API_BASE_URL } from '../config';

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

    // Forma real de un error de red de axios (con `request`, sin
    // `response`, ver apiErrors.js) -- se marca para que AddCandidateForm
    // pueda dar un mensaje traducido en vez del "Network Error" interno.
    it('tags the thrown error as isNetworkError when the backend never responds', async () => {
        axios.post.mockRejectedValue({ request: {}, message: 'Network Error' });

        await expect(sendCandidateData({})).rejects.toMatchObject({ isNetworkError: true });
    });

    it('does not tag a real validation rejection as a network error', async () => {
        axios.post.mockRejectedValue({
            request: {},
            response: { data: { message: 'Validation failed', errors: [{ field: 'email', code: 'invalidFormat' }] } },
        });

        const error = await sendCandidateData({}).catch((e) => e);
        expect(error.isNetworkError).toBeUndefined();
    });
});

describe('getCandidateById', () => {
    it('returns the candidate on success', async () => {
        axios.get.mockResolvedValue({ data: { id: 1, firstName: 'Ana' } });

        const result = await getCandidateById(1);

        expect(axios.get).toHaveBeenCalledWith(`${API_BASE_URL}/candidates/1`);
        expect(result).toEqual({ id: 1, firstName: 'Ana' });
    });

    it('tags the thrown error as isNetworkError when the backend never responds', async () => {
        axios.get.mockRejectedValue({ request: {}, message: 'Network Error' });

        await expect(getCandidateById(1)).rejects.toMatchObject({ isNetworkError: true });
    });
});

describe('updateCandidateData', () => {
    it('PATCHes to /candidates/:id and returns the updated candidate', async () => {
        axios.patch.mockResolvedValue({ data: { message: 'Candidate updated successfully', data: { id: 1 } } });

        const result = await updateCandidateData(1, { firstName: 'Ana' });

        expect(axios.patch).toHaveBeenCalledWith(`${API_BASE_URL}/candidates/1`, { firstName: 'Ana' });
        expect(result).toEqual({ message: 'Candidate updated successfully', data: { id: 1 } });
    });

    // Mismo formato de error estructurado que sendCandidateData -- lo
    // devuelve el mismo validador del backend para ambas rutas.
    it('propagates structured validation issues, same as sendCandidateData', async () => {
        axios.patch.mockRejectedValue({
            response: {
                data: {
                    message: 'Validation failed',
                    errors: [{ field: 'email', code: 'invalidFormat' }],
                },
            },
        });

        await expect(updateCandidateData(1, {})).rejects.toMatchObject({
            message: 'Validation failed',
            issues: [{ field: 'email', code: 'invalidFormat' }],
        });
    });
});

describe('updateCandidateStage', () => {
    it('PUTs the target application and interview step to /candidates/:id', async () => {
        axios.put.mockResolvedValue({ data: { message: 'Candidate stage updated successfully', data: { id: 1 } } });

        const result = await updateCandidateStage(1, 7, 2);

        expect(axios.put).toHaveBeenCalledWith(`${API_BASE_URL}/candidates/1`, { applicationId: 7, currentInterviewStep: 2 });
        expect(result).toEqual({ message: 'Candidate stage updated successfully', data: { id: 1 } });
    });

    it('tags the thrown error as isNetworkError when the backend never responds', async () => {
        axios.put.mockRejectedValue({ request: {}, message: 'Network Error' });

        await expect(updateCandidateStage(1, 7, 2)).rejects.toMatchObject({ isNetworkError: true });
    });

    it('throws only the server detail on a real rejection (e.g. application not found)', async () => {
        axios.put.mockRejectedValue({ response: { data: { error: 'Application not found' } } });

        await expect(updateCandidateStage(1, 7, 2)).rejects.toThrow('Application not found');
    });

    // Pedido por el usuario: al mover una ficha, poder dar la puntuación
    // de la fase que se abandona -- opcional (ver el test anterior, que
    // no la manda), pero cuando se manda debe llegar al backend.
    it('includes the score in the request when one is given', async () => {
        axios.put.mockResolvedValue({ data: { message: 'ok', data: { id: 1 } } });

        await updateCandidateStage(1, 7, 2, 5);

        expect(axios.put).toHaveBeenCalledWith(`${API_BASE_URL}/candidates/1`, { applicationId: 7, currentInterviewStep: 2, score: 5 });
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
