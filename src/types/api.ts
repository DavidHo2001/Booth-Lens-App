export type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T;
};

export type LoginResponse = {
  token: string;
  email: string;
  userId: number;
  username: string;
  role: number;
};

export type UserRequestDto = {
  id: number;
  userId: number;
  referenceCode: string;
  requestInfo: string;
  status: string;
  resultInfo?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserCreditsResponse = {
  userId: number;
  balance: string;
  token: number;
  superToken: number;
};

export type UserRoleResponse = {
  id: number;
  username: string;
  role: string;
  roleId: number;
  isBlocked: boolean;
};

export type ProfileResponse = {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  birth_date?: string;
  sex?: string;
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
};

export type MeResponse = {
  requestDto: UserRequestDto[];
  creditsResponse: UserCreditsResponse;
  roleResponse: UserRoleResponse;
  profileResponse: ProfileResponse;
};

export type TransactionDto = {
  id: number;
  userId: number;
  transactionType: string;
  amount: string;
  tokenAmount: number;
  superTokenAmount: number;
  referenceCode?: string;
  description?: string;
  status: string;
  createdAt: string;
};

export type FileRecordDto = {
  id: number;
  referenceCode: string;
  fileName: string;
  fileType: string;
  createdAt: string;
};

export type CommonRequestType = 'CONTRACTOR' | 'SUPPORT';

export type CommonRequestResponse = {
  requestReferenceCode: string;
  requestType: CommonRequestType;
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
