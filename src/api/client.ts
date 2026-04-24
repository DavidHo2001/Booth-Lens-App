import {API_BASE_URL} from '../config/env';
import {ApiResponse} from '../types/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  token?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
  isFormData?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {...(options.headers ?? {})};

  if (!options.isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: options.body
      ? options.isFormData
        ? (options.body as any)
        : JSON.stringify(options.body)
      : undefined,
  });

  const text = await response.text();
  let parsed: ApiResponse<T> | null = null;
  try {
    parsed = text ? (JSON.parse(text) as ApiResponse<T>) : null;
  } catch {
    throw new Error(`Invalid server response (${response.status})`);
  }

  if (!response.ok || !parsed?.success) {
    const message = parsed?.message ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return parsed.data;
}

