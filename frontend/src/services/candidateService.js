import axios from 'axios';
import { API_BASE_URL } from '../config';

export const uploadCV = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data; // Devuelve la ruta del archivo y el tipo
    } catch (error) {
        // Se lanza solo el detalle, sin prefijo: quien muestra el error
        // (FileUploader.js) sabe en qué idioma traducirlo. El detalle en sí
        // (mensaje del servidor o de red) no está traducido — ver el límite
        // de alcance explicado en AddCandidateForm.js/candidateService.js.
        throw new Error(error.response?.data?.error || error.message, { cause: error });
    }
};

export const getUnassignedCandidates = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/candidates/unassigned`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || error.message, { cause: error });
    }
};

export const sendCandidateData = async (candidateData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/candidates`, candidateData);
        return response.data;
    } catch (error) {
        throw buildCandidateSubmitError(error);
    }
};

export const getCandidateById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/candidates/${id}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || error.message, { cause: error });
    }
};

export const updateCandidateData = async (id, candidateData) => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/candidates/${id}`, candidateData);
        return response.data;
    } catch (error) {
        throw buildCandidateSubmitError(error);
    }
};

// Compartido entre alta y edición: el backend devuelve la misma forma de
// error (validación por campo, o un mensaje de negocio suelto) para
// POST /candidates y PATCH /candidates/:id.
const buildCandidateSubmitError = (error) => {
    const responseData = error.response?.data;

    // Errores de validación: el backend devuelve { message, errors: [{ field, code, params }] }
    // en vez de un texto ya redactado, para que se puedan traducir y
    // asociar a cada campo del formulario (ver i18n/validationMessages.js).
    if (Array.isArray(responseData?.errors)) {
        const validationError = new Error(responseData.message || 'Validation failed');
        validationError.issues = responseData.errors;
        return validationError;
    }

    // Igual que en uploadCV: solo el detalle, sin prefijo. El prefijo
    // traducido lo añade AddCandidateForm.js con t('addCandidate.genericErrorPrefix').
    return new Error(responseData?.error || error.message, { cause: error });
};
