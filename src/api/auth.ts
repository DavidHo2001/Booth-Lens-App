import axiosService from './axios';
import {LoginResponse} from '../types/api';

export type LoginPayload = {
  email: string;
  password: string;
  keepLoggedIn?: boolean;
};

export type RegistrationPayload = {
  username: string;
  email: string;
  phone: string;
  password: string;
  verificationCode: string;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const {data} = await axiosService.post<LoginResponse>('/api/auth/login', payload);
  return data;
}

export async function sendVerificationCode(email: string): Promise<boolean> {
  const {data} = await axiosService.post<boolean>(
    '/api/userRegistration/send-verification-code',
    email,
    {
      headers: {
        'Content-Type': 'text/plain',
      },
    },
  );
  return data;
}

export async function register(payload: RegistrationPayload): Promise<boolean> {
  const {data} = await axiosService.post<boolean>('/api/userRegistration', payload);
  return data;
}

export async function logout(token: string | null): Promise<void> {
  try {
    await axiosService.post(
      '/api/auth/logout',
      {},
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    );
  } catch {
    // Backend logout is best-effort only for now.
  }
}

