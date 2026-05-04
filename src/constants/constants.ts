export const MAX_IMAGES = 5;

export const MAX_UPLOAD_IMAGE_BYTES = 1024 * 1024; // 1 MB

export const IMAGE_PICKER_OPTIONS = {
  maxWidth: 1280,
  maxHeight: 1280,
};

export const CAMERA_CAPTURE_QUALITY = 0.45;

export const ADMIN_DEFAULT_PAGE = 1;
export const ADMIN_DEFAULT_LIMIT = 10;

export const REQUEST_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REJECTED: 'REJECTED',
} as const;

export const USER_ROLE = {
  CLIENT: 1,
  CONTRACTOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
} as const;

export const REQUEST_STATUS_OPTIONS = Object.values(REQUEST_STATUS);