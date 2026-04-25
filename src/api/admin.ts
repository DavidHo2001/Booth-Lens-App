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
  const {data} = await axiosService.get<Announcement[]>('/api/admin/announcements', {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  return data;
}

export async function searchAdminRequests(
  token: string,
  payload: {keyword?: string; status?: string; page?: number; limit?: number},
): Promise<PaginatedResponse<UserRequestDto>> {
  const {data} = await axiosService.post<PaginatedResponse<UserRequestDto>>(
    '/api/admin/requests/search',
    payload,
    {
      headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    },
  );
  return data;
}

export async function searchAdminTransactions(
  token: string,
  payload: {keyword?: string; page?: number; limit?: number},
): Promise<PaginatedResponse<TransactionDto>> {
  const {data} = await axiosService.post<PaginatedResponse<TransactionDto>>(
    '/api/admin/transactions/search',
    payload,
    {
      headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    },
  );
  return data;
}

export async function searchAdminCredits(
  token: string,
  payload: {keyword?: string; page?: number; limit?: number},
): Promise<PaginatedResponse<UserCreditsResponse>> {
  const {data} = await axiosService.post<PaginatedResponse<UserCreditsResponse>>(
    '/api/admin/credits/search',
    payload,
    {
      headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    },
  );
  return data;
}

