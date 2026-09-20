import axios from 'axios';
import { API_BASE_URL } from '../config';

const STORAGE_KEY = 'lti_auth';

export const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
        return response.data.employee;
    } catch (error) {
        // Igual que candidateService/uploadCV: solo el detalle que manda el
        // backend, sin prefijo propio — el prefijo traducido lo añade quien
        // muestre el error (Login.jsx).
        throw new Error(error.response?.data?.message || error.message, { cause: error });
    }
};

export const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const getStoredAuth = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        // Un valor corrupto en localStorage (editado a mano, versión previa
        // con otra forma) no debe tumbar la app entera al arrancar.
        return null;
    }
};
