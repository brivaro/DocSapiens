import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        let errorMessage = 'Ocurrió un error inesperado.';

        if (error.response && error.response.data && error.response.data.detail) {
            errorMessage = error.response.data.detail;
        }
        else if (error.request) {
            errorMessage = 'No se pudo conectar con el servidor. ¿Está funcionando?';
        } 
        else {
            errorMessage = error.message;
        }

        return Promise.reject(error);
    }
);

export default apiClient;