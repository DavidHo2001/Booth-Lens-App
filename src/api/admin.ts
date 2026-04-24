import axiosService from './axios';
import {TransactionDto, UserCreditsResponse, UserRequestDto} from '../types/api';

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export type Announcement = {
  id: number;
  title: string;
  body: string;
  active: boolean;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
};

//I edited this for your reference (my coding style).
export async function getAnnouncements(token: string): Promise<Announcement[]> {
  const response = await axiosService.get('/api/admin/announcements', {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (response.status !== 200) {
    throw new Error('Failed to get announcements');
  }
  return response.data;
}

export async function searchAdminRequests(
  token: string,
  payload: {keyword?: string; status?: string; page?: number; limit?: number},
): Promise<PaginatedResponse<UserRequestDto>> {
  const response = await axiosService.post('/api/admin/requests/search', payload, {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (response.status !== 200) {
    throw new Error('Failed to search admin requests');
  }
  return response.data;
}

export async function searchAdminTransactions(
  token: string,
  payload: {keyword?: string; page?: number; limit?: number},
): Promise<PaginatedResponse<TransactionDto>> {
  const response = await axiosService.post('/api/admin/transactions/search', payload, {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (response.status !== 200) {
    throw new Error('Failed to search admin transactions');
  }
  return response.data;
}

export async function searchAdminCredits(
  token: string,
  payload: {keyword?: string; page?: number; limit?: number},
): Promise<PaginatedResponse<UserCreditsResponse>> {
  const response = await axiosService.post('/api/admin/credits/search', payload, {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (response.status !== 200) {
    throw new Error('Failed to search admin credits');
  }
  return response.data;
}

