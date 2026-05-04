import axiosService from './axios';
import {TransactionDto, UserCreditsResponse, UserRequestDto, UserRoleResponse, Announcement} from '../types/api';

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

export async function createAnnouncement(
  token: string,
  payload: {title: string; body: string; active: boolean},
): Promise<Announcement> {
  const {data} = await axiosService.post<Announcement>('/api/admin/announcements', payload);
  return data;
}

export async function updateAnnouncement(
  token: string,
  id: number,
  payload: {title: string; body: string; active: boolean},
): Promise<Announcement> {
  const {data} = await axiosService.put<Announcement>(`/api/admin/announcements/${id}`, payload);
  return data;
}

export async function deleteAnnouncement(token: string, id: number): Promise<void> {
  await axiosService.delete(`/api/admin/announcements/${id}`);
}

export async function searchAdminRequests(
  payload: {
    keyword?: string;
    status?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'ASC' | 'DESC';
  },
): Promise<PaginatedResponse<UserRequestDto>> {
  const {data} = await axiosService.post<PaginatedResponse<UserRequestDto>>(
    '/api/admin/requests/search',
    payload
  );
  return data;
}

export async function updateAdminRequest(
  token: string,
  requestId: number,
  payload: {status?: string; resultInfo?: string},
): Promise<UserRequestDto> {
  const {data} = await axiosService.patch<UserRequestDto>(
    `/api/admin/requests/${requestId}`,
    payload,
  );
  return data;
}

export async function searchAdminTransactions(
  token: string,
  payload: {
    keyword?: string;
    userId?: number;
    status?: string;
    transactionType?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'ASC' | 'DESC';
  },
): Promise<PaginatedResponse<TransactionDto>> {
  const {data} = await axiosService.post<PaginatedResponse<TransactionDto>>(
    '/api/admin/transactions/search',
    payload,
  );
  return data;
}

export async function searchAdminCredits(
  payload: {
    keyword?: string;
    userId?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'ASC' | 'DESC';
  },
): Promise<PaginatedResponse<UserCreditsResponse>> {
  const {data} = await axiosService.post<PaginatedResponse<UserCreditsResponse>>(
    '/api/admin/credits/search',
    payload,
  );
  return data;
}

export async function adjustAdminCredits(
  payload: {
    userId: number;
    tokenDelta?: number;
    superTokenDelta?: number;
    balanceDelta?: string;
    referenceCode?: string;
    description?: string;
  },
): Promise<UserCreditsResponse> {
  const {data} = await axiosService.post<UserCreditsResponse>('/api/admin/credits/adjust', payload);
  return data;
}

export async function searchSuperAdminUsers(
  token: string,
  payload: {
    keyword?: string;
    roleId?: number;
    isBlocked?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: 'ASC' | 'DESC';
  },
): Promise<PaginatedResponse<UserRoleResponse>> {
  const {data} = await axiosService.post<PaginatedResponse<UserRoleResponse>>(
    '/api/superadmin/users/search',
    payload,
  );
  return data;
}

export async function adjustSuperAdminUserRole(
  token: string,
  userId: number,
  payload: {
    userId?: number;
    roleId?: number;
    isBlocked?: boolean;
  },
): Promise<boolean> {
  const {data} = await axiosService.patch<boolean>(`/api/superadmin/users/${userId}`, payload);
  return data;
}

