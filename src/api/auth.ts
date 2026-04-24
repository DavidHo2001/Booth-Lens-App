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
  const response = await axiosService.post('/api/auth/login', payload);
  if (response.status !== 200) {
    throw new Error('Failed to login');
  }
  return response.data;
}

export async function sendVerificationCode(email: string): Promise<void> {
  const response = await axiosService.post(
    '/api/userRegistration/send-verification-code',
    email,
  );
  if (response.status !== 200) {
    throw new Error('Failed to send verification code');
  }
}

export async function register(payload: RegistrationPayload): Promise<boolean> {
  const response = await axiosService.post('/api/userRegistration', payload);
  if (response.status !== 200) {
    throw new Error('Failed to register');
  }
  return response.data;
}

export async function logout(token: string | null): Promise<void> {
  try {
    const response = await axiosService.post(
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
    if (response.status !== 200) {
      throw new Error('Failed to logout');
    }
  } catch {
    // Backend logout is best-effort only for now.
  }
}

