import axios, {AxiosError, InternalAxiosRequestConfig} from 'axios';
import {API_BASE_URL} from '../config/env';
import {getToken} from '../storage/tokenStorage';

type BackendApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

const axiosService = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

axiosService.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  async error => Promise.reject(error),
);

axiosService.interceptors.response.use(
  response => {
    const payload = response.data as BackendApiResponse<unknown>;
    if (
      payload &&
      typeof payload === 'object' &&
      Object.prototype.hasOwnProperty.call(payload, 'success')
    ) {
      if (!payload.success) {
        throw new Error(payload.message ?? 'Request failed');
      }
      response.data = payload.data;
    }
    return response;
  },
  async (error: AxiosError<{message?: string}>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network request failed';
    return Promise.reject(new Error(message));
  },
);

export default axiosService;

