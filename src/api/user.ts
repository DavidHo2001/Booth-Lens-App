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
  const {data} = await axiosService.get<MeResponse>('/api/v1/user/me', {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  return data;
}

export async function getMyRequests(token: string): Promise<UserRequestDto[]> {
  const {data} = await axiosService.get<UserRequestDto[]>('/api/v1/user/requests', {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  return data;
}

export async function getRequestFiles(
  token: string,
  referenceCode: string,
): Promise<FileRecordDto[]> {
  const {data} = await axiosService.get<FileRecordDto[]>(
    `/api/v1/user/requests/${referenceCode}/files`,
    {
      headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    },
  );
  return data;
}

export async function getFileDownloadUrl(
  token: string,
  fileRecordId: number,
): Promise<{downloadUrl: string}> {
  const {data} = await axiosService.get<{downloadUrl: string}>(
    `/api/v1/user/files/${fileRecordId}/download`,
    {
      headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    },
  );
  return data;
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

  const {data} = await axiosService.post<CommonRequestResponse>(
    '/api/v1/user/requests',
    formData,
    {
      headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    },
  );
  return data;
}

export async function getMyTransactions(token: string): Promise<TransactionDto[]> {
  const {data} = await axiosService.get<TransactionDto[]>('/api/v1/user/transactions', {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  return data;
}

export async function getMyCredits(token: string): Promise<UserCreditsResponse> {
  const {data} = await axiosService.get<UserCreditsResponse>('/api/v1/user/credits', {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  return data;
}

export async function fetchProfile(token: string): Promise<ProfileResponse> {
  const {data} = await axiosService.get<ProfileResponse>('/api/profile/fetchProfile', {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
  return data;
}

export async function updateProfile(
  token: string,
  payload: Partial<ProfileResponse> & {
    oldPassword?: string;
    password?: string;
    confirmPassword?: string;
  },
): Promise<void> {
  await axiosService.patch('/api/profile/update', payload, {
    headers: token ? {Authorization: `Bearer ${token}`} : undefined,
  });
}

