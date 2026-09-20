import axios from 'axios';
import { API_BASE_URL } from '../config';

const getErrorMessage = (error, fallback) => {
    const details = error.response?.data?.message || error.response?.data?.error || error.message;
    return `${fallback}: ${details}`;
};

export const getPositions = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/position`);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Error al obtener las posiciones'), { cause: error });
    }
};

export const getCandidatesByPosition = async (positionId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/position/${positionId}/candidates`);
        return response.data;
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Error al obtener los candidatos de la posición'), { cause: error });
    }
};

export const getInterviewFlowByPosition = async (positionId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/position/${positionId}/interviewflow`);
        return response.data.interviewFlow;
    } catch (error) {
        throw new Error(getErrorMessage(error, 'Error al obtener el proceso de entrevista'), { cause: error });
    }
};
