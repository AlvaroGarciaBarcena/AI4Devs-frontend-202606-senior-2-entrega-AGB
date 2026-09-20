import axios from 'axios';
import { API_BASE_URL } from '../config';
import { tagNetworkError } from './apiErrors';

const getErrorMessage = (error, fallback) => {
    const details = error.response?.data?.message || error.response?.data?.error || error.message;
    return `${fallback}: ${details}`;
};

const throwServiceError = (error, fallback) => {
    throw tagNetworkError(new Error(getErrorMessage(error, fallback), { cause: error }), error);
};

export const getPositions = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/position`);
        return response.data;
    } catch (error) {
        throwServiceError(error, 'Error al obtener las posiciones');
    }
};

export const getCandidatesByPosition = async (positionId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/position/${positionId}/candidates`);
        return response.data;
    } catch (error) {
        throwServiceError(error, 'Error al obtener los candidatos de la posición');
    }
};

export const getInterviewFlowByPosition = async (positionId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/position/${positionId}/interviewflow`);
        return response.data.interviewFlow;
    } catch (error) {
        throwServiceError(error, 'Error al obtener el proceso de entrevista');
    }
};

// A diferencia de las demás funciones de este fichero, no usa
// `throwServiceError` -- ese helper antepone un prefijo fijo en español al
// mensaje (`getErrorMessage`), sin pasar por i18n. Aquí el detalle se lanza
// en crudo (mismo patrón que candidateService.js) para que quien lo muestre
// (PositionProcess.tsx) pueda anteponer un prefijo ya traducido, en el
// idioma activo, en vez de uno fijo en español.
export const addInterviewStep = async (positionId, name) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/position/${positionId}/interviewflow/steps`, { name });
        return response.data;
    } catch (error) {
        throw tagNetworkError(new Error(error.response?.data?.error || error.message, { cause: error }), error);
    }
};
