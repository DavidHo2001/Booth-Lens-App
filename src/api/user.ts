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
  Announcement,
} from '../types/api';

export async function getMe(): Promise<MeResponse> {
  const {data} = await axiosService.get<MeResponse>('/api/v1/user/me');
  return data;
}

export async function getMyRequests(): Promise<UserRequestDto[]> {
  const {data} = await axiosService.get<UserRequestDto[]>('/api/v1/user/requests');
  return data;
}

export async function getRequestFiles(referenceCode: string): Promise<FileRecordDto[]> {
  const {data} = await axiosService.get<FileRecordDto[]>(`/api/v1/user/requests/${referenceCode}/files`);
  return data;
}

export async function getFileDownloadUrl(fileRecordId: number): Promise<{downloadUrl: string}> {
  const {data} = await axiosService.get<{downloadUrl: string}>(
    `/api/v1/user/files/${fileRecordId}/download`,
  );
  return data;
}

export async function createCommonRequest(
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
  );
  return data;
}

export async function getMyTransactions(): Promise<TransactionDto[]> {
  const {data} = await axiosService.get<TransactionDto[]>('/api/v1/user/transactions');
  return data;
}

export async function getMyCredits(): Promise<UserCreditsResponse> {
  const {data} = await axiosService.get<UserCreditsResponse>('/api/v1/user/credits');
  return data;
}

export async function fetchProfile(): Promise<ProfileResponse> {
  const {data} = await axiosService.get<ProfileResponse>('/api/profile/fetchProfile');
  return data;
}

export async function updateProfile(
  payload: Partial<ProfileResponse> & {
    oldPassword?: string;
    password?: string;
    confirmPassword?: string;
  },
): Promise<void> {
  await axiosService.patch('/api/profile/update', payload);
}


export async function getAnnouncements() {
  const {data} = await axiosService.get<Announcement[]>('/api/v1/user/announcements');
  return data;
}
