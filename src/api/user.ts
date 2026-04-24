import axiosService from './axios';
import {
  CommonRequestResponse,
  CommonRequestType,
  FileRecordDto,
  MeResponse,
  ProfileResponse,
  TransactionDto,
  UserCreditsResponse,
  UserRequestDto,
} from '../types/api';

export async function getMe(token: string): Promise<MeResponse> {
  const response = await axiosService.get('/api/v1/user/me', {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (response.status !== 200) {
    throw new Error('Failed to fetch me data');
  }
  return response.data;
}

export async function getMyRequests(token: string): Promise<UserRequestDto[]> {
  const response = await axiosService.get('/api/v1/user/requests', {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (response.status !== 200) {
    throw new Error('Failed to fetch requests');
  }
  return response.data;
}

export async function getRequestFiles(
  token: string,
  referenceCode: string,
): Promise<FileRecordDto[]> {
  const response = await axiosService.get(
    `/api/v1/user/requests/${referenceCode}/files`,
    {
      headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    },
  );
  if (response.status !== 200) {
    throw new Error('Failed to fetch request files');
  }
  return response.data;
}

export async function getFileDownloadUrl(
  token: string,
  fileRecordId: number,
): Promise<{downloadUrl: string}> {
  const response = await axiosService.get(
    `/api/v1/user/files/${fileRecordId}/download`,
    {
      headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    },
  );
  if (response.status !== 200) {
    throw new Error('Failed to generate download URL');
  }
  return response.data;
}

export async function createCommonRequest(
  token: string,
  payload: {
    requestType: CommonRequestType;
    requestInfo: string;
    sourceReferenceCode?: string;
    files?: Array<{
      uri: string;
      type: string;
      name: string;
    }>;
  },
): Promise<CommonRequestResponse> {
  const formData = new FormData();
  formData.append('requestType', payload.requestType);
  formData.append('requestInfo', payload.requestInfo);
  if (payload.sourceReferenceCode) {
    formData.append('sourceReferenceCode', payload.sourceReferenceCode);
  }
  payload.files?.forEach(file => {
    formData.append('files', file as unknown as Blob);
  });

  const response = await axiosService.post('/api/v1/user/requests', formData, {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (response.status !== 200) {
    throw new Error('Failed to create request');
  }
  return response.data;
}

export async function getMyTransactions(token: string): Promise<TransactionDto[]> {
  const response = await axiosService.get('/api/v1/user/transactions', {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (response.status !== 200) {
    throw new Error('Failed to fetch transactions');
  }
  return response.data;
}

export async function getMyCredits(token: string): Promise<UserCreditsResponse> {
  const response = await axiosService.get('/api/v1/user/credits', {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (response.status !== 200) {
    throw new Error('Failed to fetch credits');
  }
  return response.data;
}

export async function fetchProfile(token: string): Promise<ProfileResponse> {
  const response = await axiosService.get('/api/profile/fetchProfile', {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (response.status !== 200) {
    throw new Error('Failed to fetch profile');
  }
  return response.data;
}

export async function updateProfile(
  token: string,
  payload: Partial<ProfileResponse> & {
    oldPassword?: string;
    password?: string;
    confirmPassword?: string;
  },
): Promise<void> {
  const response = await axiosService.patch('/api/profile/update', payload, {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  if (response.status !== 200) {
    throw new Error('Failed to update profile');
  }
}

