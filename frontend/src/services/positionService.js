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
