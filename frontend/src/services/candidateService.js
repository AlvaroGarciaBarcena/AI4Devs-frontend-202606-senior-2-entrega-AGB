import axios from 'axios';

export const uploadCV = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post('http://localhost:3010/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data; // Devuelve la ruta del archivo y el tipo
    } catch (error) {
        const details = error.response?.data?.error || error.message;
        throw new Error(`Error al subir el archivo: ${details}`);
    }
};

export const sendCandidateData = async (candidateData) => {
    try {
        const response = await axios.post('http://localhost:3010/candidates', candidateData);
        return response.data;
    } catch (error) {
        const responseData = error.response?.data;

        // Errores de validación: el backend devuelve { message, errors: [{ field, code, params }] }
        // en vez de un texto ya redactado, para que se puedan traducir y
        // asociar a cada campo del formulario (ver i18n/validationMessages.js).
        if (Array.isArray(responseData?.errors)) {
            const validationError = new Error(responseData.message || 'Validation failed');
            validationError.issues = responseData.errors;
            throw validationError;
        }

        const details = responseData?.error || error.message;
        throw new Error(`Error al enviar datos del candidato: ${details}`);
    }
};
